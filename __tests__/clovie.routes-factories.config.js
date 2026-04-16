import { defineRoutes } from '../lib/factories/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const factoryRoute = defineRoutes(() => [
  {
    method: 'GET',
    path: '/from-route-factory',
    handler: (ctx) => ctx.respond.json({ source: 'route-factory' }),
  },
]);

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
  data: { title: 'Test Page' },
  routes: [
    {
      path: '/test-page',
      template: path.join(__dirname, 'routes/test-page.html'),
      data: () => ({ title: 'Test Page' }),
    },
    factoryRoute,
    {
      path: '/another-page',
      template: path.join(__dirname, 'routes/test-page.html'),
      data: () => ({ title: 'Another Page' }),
    },
  ],
};
