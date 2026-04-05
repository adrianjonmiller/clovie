import { defineRoutes } from '../lib/factories/routes.js';
import { defineHooks } from '../lib/factories/hooks.js';

const factoryApis = defineRoutes('api', (useContext, opts) => [
  {
    method: 'GET',
    path: '/from-factory',
    handler: (ctx) => ctx.respond.json({ source: 'factory' }),
  },
]);

const extraApis = defineRoutes('api', (useContext, opts) => [
  {
    method: 'GET',
    path: '/from-extra-factory',
    handler: (ctx) => ctx.respond.json({ source: 'extra-factory' }),
  },
]);

globalThis.__test_hooks_factory_called = false;

const hooksFactory = defineHooks('testHooks', (useContext, opts) => {
  globalThis.__test_hooks_factory_called = true;
  return {
    onRequest: (ctx) => {
      globalThis.__test_hook_on_request_fired = true;
    },
  };
});

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
  api: [
    {
      method: 'GET',
      path: '/api/raw',
      handler: (ctx) => ctx.respond.json({ source: 'raw' }),
    },
    factoryApis,
    extraApis,
  ],
  hooks: hooksFactory,
};
