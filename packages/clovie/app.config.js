export default {
  scripts: './scripts/main.js',
  styles: './styles/main.scss',
  views: './views',
  assets: './assets',
  outputDir: './dist',
  data: {
    title: 'Test Site'
  },
  compiler: (template, data) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
  }
};
