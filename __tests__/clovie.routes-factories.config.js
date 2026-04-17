import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    () => [
      {
        path: '/from-factory',
        template: path.join(__dirname, 'routes/test-page.html'),
        data: () => ({ title: 'Factory Page' }),
      },
    ],
    {
      path: '/another-page',
      template: path.join(__dirname, 'routes/test-page.html'),
      data: () => ({ title: 'Another Page' }),
    },
  ],
};
