import { Server as SocketIOServer } from 'socket.io';
import { ServiceProvider } from '@brickworks/engine';

export class LiveReload extends ServiceProvider {
  static manifest = {
    name: 'Clovie LiveReload',
    namespace: 'liveReload',
    version: '1.0.0',
  };

  #io;

  async initialize(useContext) {
    try {
      const [server, clovieConfig] = useContext('server', 'clovieConfig');
      console.log('🔌 LiveReload initializing...');
      
      // Wait for server to be ready
      clovieConfig.onReady(async (config) => {
        if (config.mode === 'development') {
          await this.#setupSocketIO(server);
        }
      });
    } catch (error) {
      console.error('Error initializing LiveReload:', {cause: error});
    }
  }

  getter () {
    return {
      io: () => this.#io,
    }
  }

  actions() {
    return {
      notifyReload: () => this.#io.emit('reload'),
      injectLiveReloadScript: async (renderedContent, config) => {
        const lastBodyIndex = renderedContent.lastIndexOf('</body>');
        if (lastBodyIndex !== -1) {
          const scriptConfig = { 
            mode: config.mode || 'development', 
            port: config.port || 3000 
          };
          
          try {
            // Import live reload script dynamically
            const { liveReloadScript } = await import('./utils/liveReloadScript.js');
            
            renderedContent = renderedContent.substring(0, lastBodyIndex) + 
                            liveReloadScript(scriptConfig) + '\n' + 
                            renderedContent.substring(lastBodyIndex);
          } catch (err) {
            console.warn('⚠️  Could not load live reload script:', err.message);
          }
        }
        return renderedContent;
      }
    }
  }

  async #setupSocketIO(server) {
    try {
      // Wait a bit for server to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!server?.httpServer) {
        console.warn('⚠️  Server HTTP server not ready yet, retrying...');
        setTimeout(() => this.#setupSocketIO(server), 500);
        return;
      }

      console.log('🔌 Setting up Socket.IO...');
      
      // Configure Socket.IO with proper CORS and options
      this.#io = new SocketIOServer(server.httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true
      });

      this.#io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);
        
        socket.on('disconnect', (reason) => {
          console.log('🔌 Client disconnected:', socket.id, reason);
        });

        socket.on('error', (error) => {
          console.error('🔌 Socket error:', error);
        });
      });

      console.log('✅ Socket.IO server ready');
    } catch (error) {
      console.error('Error setting up Socket.IO:', error);
    }
  }
}