import { definitionType } from '@jucie.io/engine';
import { pagesToRoutes } from './viewsToRoutes.js';

/**
 * Normalizes a config value into an array of engine-server factory definitions.
 *
 * Handles four input shapes:
 *  - Raw data (plain array or object) → wrapped in factoryFn
 *  - Single factory (created via createDefinition) → returned as-is
 *  - Array of factories → returned as-is
 *  - Intermixed (raw items + factories in the same array) → raw items
 *    are batched and wrapped, factories are preserved
 *
 * @param {*} value - The config value (routes, middleware, hooks, api, etc.)
 * @param {Function} factoryFn - The define* factory to wrap raw data with
 * @returns {Array} Array of factory definitions ready for server.use()
 */
export function normalizeToFactories(value, factoryFn) {
  if (!value) return [];

  if (isFactory(value)) return [value];

  if (!Array.isArray(value)) return [wrapRaw(factoryFn, value)];

  const raw = [];
  const factories = [];

  for (const item of value) {
    if (isFactory(item)) {
      if (raw.length) {
        factories.push(wrapRaw(factoryFn, [...raw]));
        raw.length = 0;
      }
      factories.push(item);
    } else {
      raw.push(item);
    }
  }

  if (raw.length) {
    factories.push(wrapRaw(factoryFn, raw));
  }

  return factories;
}

export function isFactory(value) {
  return typeof value === 'function' && definitionType(value) !== undefined;
}

/**
 * Like normalizeToFactories, but raw route config objects are converted
 * to engine-server route objects via pagesToRoutes before wrapping.
 * Factory definitions pass through as-is.
 *
 * @param {*} value - The routes config value (raw configs, factories, or intermixed)
 * @param {Function} factoryFn - The define* factory to wrap converted routes with
 * @param {object} opts - Clovie config opts (passed to pagesToRoutes)
 * @param {object} services - Injected services { file, liveReload }
 * @returns {Array} Array of factory definitions ready for server.use()
 */
export function normalizeRoutesToFactories(value, factoryFn, opts, services) {
  if (!value) return [];
  if (isFactory(value)) return [value];
  if (!Array.isArray(value)) return [wrapRaw(factoryFn, pagesToRoutes([value], opts, services))];

  const raw = [];
  const factories = [];

  for (const item of value) {
    if (isFactory(item)) {
      if (raw.length) {
        factories.push(wrapRaw(factoryFn, pagesToRoutes([...raw], opts, services)));
        raw.length = 0;
      }
      factories.push(item);
    } else {
      raw.push(item);
    }
  }

  if (raw.length) {
    factories.push(wrapRaw(factoryFn, pagesToRoutes(raw, opts, services)));
  }

  return factories;
}

function wrapRaw(factoryFn, data) {
  return factoryFn(() => data);
}
