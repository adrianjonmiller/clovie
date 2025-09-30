export const liveReloadScript = () => `<!-- Live Reload Script (Development Mode Only) -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
  (function() {
    const socket = io();
    
    socket.on('reload', () => {
      console.log('🔄 Live reload triggered');
      window.location.reload();
    });
    
    socket.on('connect', () => {
      console.log('🔌 Connected to live reload server');
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from live reload server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });
  })();
</script>`;