export default {
  views: null,
  scripts: null,
  styles: null,
  assets: null,
  partials: null,
  outputDir: './dist',
  type: 'server',
  mode: 'production',
  port: 0,
  watch: false,
  data: {},
  middleware: [
    (req, res, next) => {
      res.setHeader('X-Middleware-First', 'applied');
      globalThis.__test_middleware_order.push('first');
      next();
    },
    (req, res, next) => {
      res.setHeader('X-Middleware-Second', 'applied');
      globalThis.__test_middleware_order.push('second');
      next();
    },
  ],
  api: [
    {
      method: 'GET',
      path: '/api/ping',
      handler: async (context) => {
        return context.respond.json({ ok: true });
      },
      params: [],
    },
  ],
};
