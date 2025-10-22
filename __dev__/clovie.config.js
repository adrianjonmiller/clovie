import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  // Project structure
  views: path.join(__dirname, 'views'),
  scripts: path.join(__dirname, 'scripts'), 
  styles: path.join(__dirname, 'styles'),
  assets: path.join(__dirname, 'assets'),
  partials: path.join(__dirname, 'partials'),
  outputDir: path.join(__dirname, 'dist'),
  
  // Data
  data: {
    site: {
      title: 'My Dev Site',
      description: 'Testing Clovie in development',
      author: 'Developer'
    },
    posts: [
      { title: 'Post 1', body: 'Post 1 body', slug: 'post-1' },
      { title: 'Post 2', body: 'Post 2 body', slug: 'post-2' },
    ]
  },

  dbPath: path.join(__dirname, 'db'),
  walPath: path.join(__dirname, 'db'),
  
  // Development settings
  watch: true,
  port: 3000,
  mode: 'development',
  type: 'server',
  hooks: {
    preHandler: (ctx, route) => {
      if (!route.meta.auth) {
        return;
      }
      const token = ctx.req.headers['authorization']?.split(' ')[1];
      if (!token) {
        return ctx.respond.redirect('/login', 302);
      }
    }
  },
  routes: [
    {
      path: '/posts',
      template: path.join(__dirname, './routes/posts.html'), // Use existing template
      data: async (ctx, database) => {
        const posts = database.collection('posts').get();
        console.log('posts', posts);
        return {
          posts: posts
        }
      },
    },{
      path: '/posts/:slug',
      template: path.join(__dirname, './routes/post.html'), // Use existing template
      repeat: (data) => {
        return data.posts
      },
      data: (data, post, key) => {
        return {
          slug: post.slug,
          title: post.title,
          body: post.body
        }
      }, 
      meta: {
        auth: true
      }
    }
  ],
  api: [
    {
      method: 'GET',
      path: '/api/test',
      handler: async (context) => {
        return context.respond.json({
          name: 'Clovie',
          version: '1.0.0',
        });
      },
      params: []
    },{
      method: 'POST',
      path: '/api/post/create',
      handler: async (context, database) => {
        const posts = database.collection('posts');
        const id = posts.add({
          title: 'This is a post',
          body: 'Here is my post'
        })
        return context.respond.json({id});
      },
      params: []
    }
  ]
};
