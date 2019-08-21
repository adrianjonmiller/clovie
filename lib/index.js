const bs = require("browser-sync").create();
const chokidar = require('chokidar');
const path = require('path');

const bundler = require('./bundler');
const getAssets = require('./getAssets');
const getData = require('./getData');
const getStyles = require('./getStyles');
const getViews = require('./getViews');
const render = require('./render');
const write = require('./write');
const clean = require('./clean');
const defaultConfig = require('./default.config');

module.exports = class {
  constructor (config) {
    this.config = Object.assign(defaultConfig, config);
    this.config.stylesDir = path.resolve(path.dirname(this.config.styles));
    this.config.scriptsDir = path.resolve(path.dirname(this.config.scripts));
    this.errorCb = null
  }

  async build () {
    clean(this.config.outputDir)

    try {
      this.data = this.config.data && Object.keys(this.config.data).length ? await getData(this.config.data) : {};
      this.views = getViews(this.config.views, this.config.models, this.data);
      this.rendered = render (this.views, this.config.compiler);
      this.scripts = await bundler(this.config.scripts);
      this.styles  = getStyles(this.config.styles);
      this.assets = getAssets(this.config.assets);
      this.cache = write(Object.assign(this.rendered, this.scripts, this.styles, this.assets), this.config.outputDir);

      return new Promise (resolve => {
        resolve();
      })
    } catch (err) {
      this.errorCb(err)
    }
  }

  watch () {
    try {
      bs.init({
        watch: true,
        server: this.config.outputDir
      });

      let options = {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
      };

      chokidar.watch(this.config.views, options).on('all', () => {
        process.nextTick(() => {
          console.log('Recompile Templates');
          this.views = getViews(this.config.views, this.config.models, this.data);
          this.rendered = render (this.views, this.config.compiler);
          this.cache = write(this.rendered, this.config.outputDir, Object.keys(this.rendered), this.cache);
          console.log('Templates Done');
        })
      });

      chokidar.watch(this.config.scriptsDir, options).on('all', () => {
        process.nextTick(async () => {
          console.log('Recompile Scripts');
          this.scripts = await bundler(this.config.scripts);
          this.cache = write(this.scripts, this.config.outputDir, Object.keys(this.scripts), this.cache);
          console.log('Scripts Done');
        })
      });

      chokidar.watch(this.config.stylesDir, options).on('all', () => {
        process.nextTick(() => {
          console.log('Updates styles');
          this.styles = getStyles(this.config.styles);
          this.cache = write(this.styles, this.config.outputDir, Object.keys(this.styles), this.cache);
          console.log('Styles Done');
        });
      });

      chokidar.watch(this.config.assets, options).on('all', () => {
        process.nextTick(() => {
          console.log('Updating assets');
          this.assets = getAssets(this.config.assets);
          this.cache = write(this.assets, this.config.outputDir, Object.keys(this.assets), this.cache);
          console.log('Assets updated');
        });
      });
    } catch (err) {
      this.error(err)
    }
  }

  error(cb) {
    this.errorCb = cb
  }
}

