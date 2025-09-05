import type from 'type-detect';

const render = async (views, compiler, fileNames = Object.keys(views), isDevMode = false, accumulator = {}) => {
  if (!fileNames || fileNames.length === 0) return accumulator;
  
  // Live reload script to inject in development mode
  const liveReloadScript = `
  <!-- Live Reload Script (Development Mode Only) -->
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
  
  for (const fileName of fileNames) {
    const view = views[fileName];
    if (!view || !view.template) continue;
    
    const res = compiler(view.template, {...view.data, fileName, fileNames});
    let renderedContent = type(res) === 'Promise' ? await res : res;
    
    // Inject live reload script before the last </body> tag if in development mode
    if (isDevMode && renderedContent.includes('</body>')) {
      const lastBodyIndex = renderedContent.lastIndexOf('</body>');
      if (lastBodyIndex !== -1) {
        renderedContent = renderedContent.substring(0, lastBodyIndex) + 
                         liveReloadScript + '\n' + 
                         renderedContent.substring(lastBodyIndex);
      }
    }
    
    accumulator[fileName] = renderedContent;
  }
  
  return accumulator;
}

export default render;