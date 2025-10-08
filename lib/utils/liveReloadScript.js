export const liveReloadScript = (opts) => `<!-- Live Reload Script (Development Mode Only) -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
  (function() {
    const opts = ${JSON.stringify(opts)};
    
    console.log('🔌 Initializing live reload with opts:', opts);
    
    // Configure Socket.IO client with proper options
    const socket = io({
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true
    });
    
    socket.on('reload', () => {
      console.log('🔄 Live reload triggered');
      window.location.reload();
    });
    
    socket.on('connect', () => {
      console.log('🔌 Connected to live reload server');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from live reload server:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      console.log('🔌 Retrying connection in 3 seconds...');
      setTimeout(() => {
        socket.connect();
      }, 3000);
    });
    
    socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });
    
    // Add connection timeout
    setTimeout(() => {
      if (!socket.connected) {
        console.warn('⚠️  Live reload connection timeout - server may not be running');
      }
    }, 5000);
  })();
</script>`;