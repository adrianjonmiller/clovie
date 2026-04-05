import { definitionType } from '@jucie.io/engine';

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

function isFactory(value) {
  return typeof value === 'function' && definitionType(value) !== undefined;
}

function wrapRaw(factoryFn, data) {
  return factoryFn(() => data);
}
