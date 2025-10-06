import { Server as SocketIOServer } from 'socket.io';
import { ServiceProvider } from '@brickworks/engine';
import { queueMacrotask } from './utils/tasks.js';

export class LiveReload extends ServiceProvider {
  static manifest = {
    name: 'Clovie LiveReload',
    namespace: 'liveReload',
    version: '1.0.0',
  };

  #io;
  #reloading = false;

  getter () {
    return {
      io: () => this.#io,
    }
  }

  actions() {
    return {
      initializeServer: async (server) => {
        const log = this.useContext('log');
        if (this.config?.mode === 'development') {
          await this.#setupSocketIO(server, log);
        }
      },
      notifyReload: () => {
        if (this.#reloading) return;
        this.#reloading = true;
        
        queueMacrotask(() => {
          this.#reloading = false;
          this.#io.emit('reload')
        });
      },
      injectLiveReloadScript: async (renderedContent, config) => {
        const lastBodyIndex = renderedContent.lastIndexOf('</body>');
        if (lastBodyIndex !== -1) {
          const scriptConfig = { 
            mode: config.mode || 'development', 
            port: config.port || 3000 
          };
          
          try {
            // Import live reload script dynamically            
            renderedContent = renderedContent.substring(0, lastBodyIndex) + 
                            this.#liveReloadScript(scriptConfig) + '\n' + 
                            renderedContent.substring(lastBodyIndex);
          } catch (err) {
            console.warn('⚠️  Could not load live reload script:', err.message);
          }
        }
        return renderedContent;
      }
    }
  }

  async #setupSocketIO(server, log) {
    try {
      // Wait a bit for server to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));

      log.debug('Setting up Socket.IO...');
      
      // Configure Socket.IO with proper CORS and options
      this.#io = new SocketIOServer(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true
      });

      this.#io.on('connection', (socket) => {
        log.debug(`Client connected: ${socket.id}`);
        
        socket.on('disconnect', (reason) => {
          log.debug(`Client disconnected: ${socket.id} - ${reason}`);
        });
        
        socket.on('error', (error) => {
          log.error('Socket error:', error);
        });
      });

      log.info('Socket.IO server ready');
    } catch (error) {
      log.error('Error setting up Socket.IO:', error);
    }
  }

  #liveReloadScript = (config) => `<!-- Live Reload Script (Development Mode Only) -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
  (function() {
    const config = ${JSON.stringify(config)};
    
    console.log('Initializing live reload with config:', config);
    
    // Configure Socket.IO client with proper options
    const socket = io({
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true
    });
    
    socket.on('reload', () => {
      console.log('Live reload triggered');
      window.location.reload();
    });
    
    socket.on('connect', () => {
      console.log('Connected to live reload server');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from live reload server:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      console.log('Retrying connection in 3 seconds...');
      setTimeout(() => {
        socket.connect();
      }, 3000);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Add connection timeout
    setTimeout(() => {
      if (!socket.connected) {
        console.warn('Live reload connection timeout - server may not be running');
      }
    }, 5000);
  })();
</script>`;
}