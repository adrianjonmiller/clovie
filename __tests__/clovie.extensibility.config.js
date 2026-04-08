import { ServiceProvider } from '@jucie.io/engine';

export class TestService extends ServiceProvider {
  static manifest = {
    name: 'Test Service',
    namespace: 'testService',
    version: '1.0.0',
  };

  actions() {
    return {
      ping: () => 'pong',
    };
  }
}

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
  services: [TestService],
  setup(engine) {
    globalThis.__test_setup_called = true;
    globalThis.__test_setup_engine = engine;
  },
  beforeListen(useContext, opts) {
    globalThis.__test_before_listen_called = true;
    globalThis.__test_before_listen_context = useContext;
    globalThis.__test_before_listen_opts = opts;
  },
  afterListen(useContext, opts, httpServer) {
    globalThis.__test_after_listen_called = true;
    globalThis.__test_after_listen_context = useContext;
    globalThis.__test_http_server = httpServer;
  },
};
