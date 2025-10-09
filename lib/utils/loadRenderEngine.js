// lib/templating/compilerLoader.js
const REQUIRED_KEYS = ['render', 'register'];


export const loadRenderEngine = async (name, opts = {}) => {
  switch (name) {
    // -------------------------------
    // Handlebars
    // -------------------------------
    case 'handlebars': {
      const { default: Handlebars } = await import('handlebars');
      return {
        render: (template, data) => Handlebars.compile(template)(data),
        register: (partialName, template) => {
          Handlebars.registerPartial(partialName, template);
        },
        engine: Handlebars
      };
    }

    // -------------------------------
    // Nunjucks (with in-memory loader)
    // -------------------------------
    case 'nunjucks': {
      // ESM-friendly import; some bundles export default, some not
      const mod = await import('nunjucks');
      const Nunjucks = mod.default ?? mod;
      const { Environment, FileSystemLoader, Loader } = Nunjucks;

      // Minimal in-memory loader so you can "register partials/macros"
      class MemoryLoader extends Loader {
        constructor() { super(); this.map = new Map(); }
        getSource(name) {
          if (!this.map.has(name)) return null;
          const src = this.map.get(name);
          return { src, path: name, noCache: false };
        }
        set(name, src) {
          this.map.set(name, src);
          this.emit('update', name); // enables live reload if watch=true
        }
      }

      const {
        views = 'views',
        autoescape = true,
        watch = false,
        noCache = false,
        throwOnUndefined = false,
        filters = {},   // { upper: s=>String(s).toUpperCase() }
        globals = {}    // { siteTitle: 'My Site' }
      } = opts;

      const mem = new MemoryLoader();
      const fsLoader = new FileSystemLoader(views, { watch, noCache });
      const env = new Environment([mem, fsLoader], {
        autoescape, throwOnUndefined, noCache
      });

      // register user filters/globals
      for (const [k, fn] of Object.entries(filters)) env.addFilter(k, fn);
      for (const [k, v] of Object.entries(globals)) env.addGlobal(k, v);

      const render = (template, data = {}) =>
        new Promise((res, rej) => env.renderString(template, data, null, (e, out) => e ? rej(e) : res(out)));

      return {
        render,
        register: (partialName, template) => mem.set(partialName, template), // later: {% include "name" %}
        engine: env
      };
    }

    // -------------------------------
    // Pug
    // -------------------------------
    case 'pug': {
      const mod = await import('pug');
      const Pug = mod.default ?? mod;

      const { views = process.cwd(), pugOptions = {} } = opts;

      return {
        // Render a string
        render: (template, data = {}) => {
          const fn = Pug.compile(template, {
            basedir: views,
            // filename helps Pug resolve relative includes if your template has them
            filename: pugOptions.filename,
            ...pugOptions
          });
          return fn(data);
        },
        // Pug has no partial registry. Encourage file-based include/extends.
        register: () => {
          throw new Error('Pug does not support registerPartial. Use `include`/`extends` with files.');
        },
        engine: Pug
      };
    }

    // -------------------------------
    // Optional: Eta (nice explicit EJS-like)
    // -------------------------------
    case 'eta': {
      const { Eta } = await import('eta');
      return {
        render: (template, data = {}) => Eta.render(template, data),
        register: (name, template) => {
          const compiled = Eta.compile(template);
          Eta.templates.define(name, compiled);
        },
        engine: Eta
      };
    }

    default:
      throw new Error(`Unknown template engine: ${name}`);
  }
};

export function validateRenderEngine(engine, fromConfig) {
  for (const key of REQUIRED_KEYS) {
    if (typeof engine[key] !== 'function') {
      const label = typeof fromConfig === 'string' ? `'${fromConfig}'` : 'custom engine';
      throw new Error(
        `renderEngine ${label} is missing required function '${key}()'`
      );
    }
  }
  // render() must be a function; renderFile/register can be absent (we’ll shim)
  if (typeof engine.render !== 'function') {
    throw new Error('renderEngine.render must be a function');
  }
}