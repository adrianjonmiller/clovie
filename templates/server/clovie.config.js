export default {
  // 🌐 Server application mode - uses Node.js HTTP server by default
  type: 'server',
  port: 3000,
  
  // 🎨 Template engine (Nunjucks is default)
  renderEngine: 'nunjucks',  // or 'handlebars', 'pug', 'eta'
  
  // Application data and configuration
  data: {
    app: {
      name: '{{projectName}}',
      description: 'Full-stack web application built with Clovie',
      version: '1.0.0'
    },
    nav: [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
      { title: 'API Demo', url: '/#api-demo' }
    ]
  },
  
  // 🛣️ API endpoints (RESTful JSON APIs)
  api: [
    {
      path: '/api/status',
      method: 'GET',
      handler: async (ctx) => {
        return ctx.respond.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0'
        });
      }
    }
  ],

  // 📄 Server-rendered routes (dynamic pages with SSR)
  routes: [
    {
      name: 'Home',
      path: '/',
      template: './views/index.html',
      data: async (context) => {
        return {
          title: '{{projectName}}'
        };
      }
    }
  ],

  // 🚀 Advanced features:
  
  // Use Express adapter for middleware
  // adapter: 'express',
  // middleware: [
  //   express.json(),
  //   express.urlencoded({ extended: true })
  // ],
  
  // Server lifecycle hooks
  // hooks: {
  //   onRequest: async (ctx) => {
  //     console.log(ctx.req.method, ctx.req.url);
  //   },
  //   preHandler: async (ctx) => {
  //     // Auth logic, etc.
  //   },
  //   onError: async (ctx, error) => {
  //     console.error('Error:', error);
  //   }
  // },
};
