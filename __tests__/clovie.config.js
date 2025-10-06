export default {
  views: './views',
  scripts: './scripts',
  styles: './styles',
  assets: './assets',
  partials: './partials',
  outputDir: './dist',
  port: 3000,
  type: 'static',
  mode: 'production', // Explicitly set to production for tests
  watch: false,
  data: {},
  register: () => {}, // Add empty register function to avoid errors
  compiler: (template, data) => template // Add simple compiler function
};