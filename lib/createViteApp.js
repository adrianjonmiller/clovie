export async function createViteApp(opts = {}, config = {}) {
  const [server, log] = this.useContext('server', 'log');
  if (!server) {
    throw new Error('Server service is required to mount Vite apps');
  }

  const root = config.root ?? opts.root ?? process.cwd();
  const mountPath = (config.mountPath ?? '/vite').replace(/\/$/, '');
  const indexFile = config.indexFile ?? 'index.html';
  const base = config.base ?? `${mountPath}/`;
  const configFile = config.configFile ?? opts.configFile ?? false;

  const { createServer } = await import('vite');

  const vite = await createServer({
    ...config,
    root,
    base,
    configFile,
    server: {
      middlewareMode: true,
      ...(config.server ?? {})
    }
  });

  const handOffToVite = async (ctx) => {
    await new Promise((resolve, reject) => {
      vite.middlewares(ctx.req.raw.req, ctx.res, (err) => (err ? reject(err) : resolve()));
    });
    return ctx.respond.handled();
  };

  server.add('GET', mountPath, async (ctx) => {
    const rawUrl = ctx.req.raw.req.originalUrl ?? ctx.req.raw.req.url ?? ctx.req.url;
    const template = await fs.readFile(path.join(root, indexFile), 'utf-8');
    const html = await vite.transformIndexHtml(rawUrl, template);
    return ctx.respond.html(html);
  });

  server.add('GET', `${mountPath}/*`, handOffToVite);
  server.add('HEAD', `${mountPath}/*`, handOffToVite);

  this.#handlers.set(mountPath, { cleanup: () => vite.close() });
  log?.debug?.(`Vite dev server mounted at ${mountPath}`);
}