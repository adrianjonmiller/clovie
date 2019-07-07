const bs = require("browser-sync").create();
const watch = require('node-watch');

const bundler = require('./bundler');
const getData = require('./getData');
const getStyles = require('./getStyles');
const getTemplates = require('./getTemplates');
const getViews = require('./getViews');
const render = require('./render');
const write = require('./write');
const clean = require('./clean');
const defaultConfig = require('./default.config');

module.exports = class {
  constructor (config) {
    this.config = Object.assign(defaultConfig, config);
    console.log(this.config)
    this.errorCb = null
  }

  async build () {
    clean(this.config.outputDir)

    try {
      this.data = this.config.data && Object.keys(this.config.data).length ? await getData(this.config.data) : {};
      this.views = getViews(this.config.views, this.config.models, this.data);
      this.rendered = render (this.views, this.config.compiler);
      this.scripts = bundler(this.config.scripts);
      this.styles  = getStyles(this.config.styles);
      this.cache = write(Object.assign(this.rendered, this.scripts, this.styles), this.config.outputDir);

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
    
      watch(this.config.views, { recursive: true }, () => {
        process.nextTick(() => {
          console.log('recompile templates');
          this.views = getViews(this.config.views, this.config.models, this.data);
          this.rendered = render (this.views, this.config.compiler);
          this.cache = write(this.rendered, this.config.outputDir, Object.keys(this.rendered), this.cache);
          console.log('Templates Done');
        })
        
      });
    
      watch(this.config.scripts, { recursive: true }, () => {
        process.nextTick(() => {
          console.log('recompile scripts');
          this.scripts = bundler(this.config.scripts);
          this.cache = write(this.scripts, this.config.outputDir, Object.keys(this.scripts), this.cache);
          console.log('Scripts Done');
        })
      });
    
      watch(this.config.styles, { recursive: true }, () => {
        process.nextTick(() => {
          console.log('Updates styles');
          this.styles = getStyles(this.config.styles);
          this.cache = write(this.styles, this.config.outputDir, Object.keys(this.styles), this.cache);
          console.log('Styles Done');
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

