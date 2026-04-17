import path from 'path';

/**
 * Resolves route config arrays that may contain plain objects or functions.
 * Functions are called and their return values (single object or array)
 * are flattened into the result. If a factory has a _name property,
 * it is prepended to each route's path.
 *
 * @param {Array} routes - Mixed array of route config objects and functions
 * @param {Function} useContext - Context resolver for factory functions
 * @returns {Array} Flat array of route config objects
 */
export function resolveRoutes(routes, useContext) {
  if (!routes) return [];

  const resolved = [];
  for (const item of routes) {
    if (typeof item === 'function') {
      const prefix = item._name ? `/${item._name}` : '';
      const result = item(useContext);
      const items = Array.isArray(result) ? result : result ? [result] : [];
      for (const route of items) {
        resolved.push(prefix && route.path
          ? { ...route, path: path.posix.join(prefix, route.path) }
          : route
        );
      }
    } else {
      resolved.push(item);
    }
  }
  return resolved;
}


/**
 * Scans the views directory and produces engine-server route definitions.
 * Each template file becomes a GET route whose handler renders the template.
 *
 *   views/index.html     → GET /
 *   views/about.html     → GET /about
 *   views/blog/post.html → GET /blog/post
 *
 * @param {object} opts - Clovie config opts
 * @param {object} services - Injected services { file, liveReload }
 * @returns {Array} Array of engine-server route objects ({ method, path, handler })
 */
export function viewsToRoutes(opts, services) {
  if (!opts.views) return [];

  const filePaths = services.file.getFilePaths(opts.views);
  if (!filePaths.length) return [];

  return filePaths.map(filePath => ({
    method: 'GET',
    path: filePathToRoutePath(filePath, opts.views),
    handler: createTemplateHandler(filePath, opts, services),
    meta: { source: 'views', template: filePath },
  }));
}

/**
 * Wraps an array of Clovie page configs ({ path, template, data }) into
 * engine-server route objects ({ method, path, handler }).
 *
 * @param {Array} pages - Clovie page/route configs
 * @param {object} opts - Clovie config opts
 * @param {object} services - Injected services { file, liveReload }
 * @returns {Array} Engine-server route objects
 */
export function pagesToRoutes(pages, opts, services) {
  if (!pages || !pages.length) return [];

  return pages.map(page => ({
    method: page.method || 'GET',
    path: page.path,
    handler: createTemplateHandler(
      page.template,
      opts,
      services,
      page.data ? (ctx) => page.data(ctx) : null,
    ),
    meta: page.meta || { source: 'routes', template: page.template },
  }));
}

/**
 * Creates a route handler that renders a template and returns HTML.
 * Shared by both views-to-routes and explicit page route definitions.
 *
 * @param {string} templatePath - Path to the template file
 * @param {object} opts - Clovie config opts (renderEngine, data, mode)
 * @param {object} services - { file, liveReload }
 * @param {Function|null} dataFn - Optional per-request data function (ctx) => data
 */
export function createTemplateHandler(templatePath, opts, services, dataFn) {
  return async (ctx) => {
    const template = services.file.read(templatePath);
    if (!template) {
      return ctx.respond.text('Not Found', 404);
    }

    const globalData = opts.data || {};
    const routeData = dataFn ? await dataFn(ctx) : {};
    const mergedData = { ...globalData, ...routeData };

    let html = await opts.renderEngine.render(template, mergedData);

    if (services.liveReload && opts.mode === 'development') {
      html = await services.liveReload.injectLiveReloadScript(html, opts);
    }

    return ctx.respond.html(html);
  };
}

/**
 * Converts a template file path to a URL route path.
 *   views/index.html       → /
 *   views/about.html       → /about
 *   views/blog/post.njk    → /blog/post
 *   views/blog/index.html  → /blog
 */
function filePathToRoutePath(filePath, viewsDir) {
  const absoluteViewsDir = toAbsolutePath(viewsDir);
  const absoluteFilePath = toAbsolutePath(filePath);
  const relativePath = path.relative(absoluteViewsDir, absoluteFilePath);
  const withoutExt = relativePath.replace(path.extname(relativePath), '');

  if (withoutExt === 'index') return '/';

  const segments = withoutExt.split(path.sep);
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  return '/' + segments.join('/');
}

function toAbsolutePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
}
