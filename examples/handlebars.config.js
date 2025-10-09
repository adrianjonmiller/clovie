import Handlebars from 'handlebars';

export default {
  // Handlebars template engine configuration
  type: 'static',
  
  data: {
    site: {
      title: 'Handlebars Blog Example',
      description: 'A blog built with Clovie and Handlebars templating',
      author: 'Your Name'
    },
    posts: [
      {
        id: 1,
        title: 'Getting Started with Handlebars',
        slug: 'getting-started-handlebars',
        excerpt: 'Learn how to use Handlebars with Clovie for powerful templating',
        content: 'Handlebars provides a powerful templating system...',
        date: '2024-01-15',
        author: 'John Doe',
        tags: ['handlebars', 'tutorial', 'templating']
      },
      {
        id: 2,
        title: 'Advanced Handlebars Features',
        slug: 'advanced-handlebars',
        excerpt: 'Explore helpers, partials, and advanced templating patterns',
        content: 'Handlebars offers many advanced features...',
        date: '2024-01-20',
        author: 'Jane Smith',
        tags: ['handlebars', 'advanced', 'helpers']
      }
    ]
  },
  
  // Configure Handlebars render engine
  renderEngine: (template, data) => {
    // Register custom helpers
    Handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });
    
    Handlebars.registerHelper('truncate', (text, length) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    });
    
    Handlebars.registerHelper('join', (array, separator) => {
      return array.join(separator || ', ');
    });
    
    // Compile and render template
    const compiled = Handlebars.compile(template);
    return compiled(data);
  },
  
  // Dynamic routes for blog posts
  routes: [
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post.html',
      repeat: (data) => data.posts,
      data: (globalData, post) => ({
        ...globalData,
        post,
        title: `${post.title} - ${globalData.site.title}`,
        relatedPosts: globalData.posts
          .filter(p => p.id !== post.id && 
                  p.tags.some(tag => post.tags.includes(tag)))
          .slice(0, 3)
      })
    }
  ]
};

/* 
Example Handlebars templates:

// views/index.html
<h1>{{site.title}}</h1>
<p>{{site.description}}</p>

{{#each posts}}
  <article>
    <h2><a href="/posts/{{slug}}">{{title}}</a></h2>
    <p class="meta">By {{author}} on {{formatDate date}}</p>
    <p>{{excerpt}}</p>
    <p class="tags">Tags: {{join tags}}</p>
  </article>
{{/each}}

// views/post.html
<article>
  <h1>{{post.title}}</h1>
  <p class="meta">
    By {{post.author}} on {{formatDate post.date}}
  </p>
  <div class="content">
    {{post.content}}
  </div>
  <p class="tags">
    Tags: {{join post.tags}}
  </p>
</article>

{{#if relatedPosts}}
  <section class="related">
    <h3>Related Posts</h3>
    {{#each relatedPosts}}
      <a href="/posts/{{slug}}">{{title}}</a>
    {{/each}}
  </section>
{{/if}}

// partials/header.html
<header>
  <h1><a href="/">{{site.title}}</a></h1>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
*/