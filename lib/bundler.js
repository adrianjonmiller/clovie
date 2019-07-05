const Bundler = require("parcel-bundler");
const path = require("path");

const options = {
  watch: false, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  cacheDir: ".cache", // The directory cache gets put in, defaults to .cache
  contentHash: false, // Disable content hash from being included on the filename
  minify: false, // Minify files, enabled if process.env.NODE_ENV === 'production'
  scopeHoist: false, // Turn on experimental scope hoisting/tree shaking flag, for smaller production bundles
  target: "browser", // Browser/node/electron, defaults to browser
  logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  hmrHostname: "", // A hostname for hot module reload, default to ''
  detailedReport: false // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
};

module.exports = async function(file) {
  let pathObj = path.parse(file);
  bundler = new Bundler(file, options);
  bundle = await bundler.bundle();

  return { [`${pathObj.name}.js`]: bundle };
};
