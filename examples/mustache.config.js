import mustache from 'mustache';

export default {
  // Mustache template engine configuration
  type: 'static',
  
  data: {
    site: {
      title: 'Mustache Blog',
      description: 'A minimalist blog built with Clovie and Mustache',
      author: 'Blog Author',
      year: new Date().getFullYear()
    },
    posts: [
      {
        id: 1,
        title: 'Why Choose Mustache Templates?',
        slug: 'why-mustache-templates',
        excerpt: 'Discover the simplicity and power of logic-less templates',
        content: 'Mustache templates are logic-less, which means...',
        author: 'John Doe',
        date: '2024-01-10',
        published: true,
        tags: ['mustache', 'templates', 'web-development'],
        readTime: 5
      },
      {
        id: 2,
        title: 'Building Fast Static Sites',
        slug: 'building-fast-static-sites',
        excerpt: 'Learn how to create lightning-fast static websites',
        content: 'Static sites offer incredible performance...',
        author: 'Jane Smith',
        date: '2024-01-15',
        published: true,
        tags: ['static-sites', 'performance', 'jamstack'],
        readTime: 8
      },
      {
        id: 3,
        title: 'Future of Web Development',
        slug: 'future-web-development',
        excerpt: 'Exploring upcoming trends in web development',
        content: 'The web development landscape is evolving...',
        author: 'Bob Wilson',
        date: '2024-01-20',
        published: false,  // Draft post
        tags: ['future', 'trends', 'web-development'],
        readTime: 12
      }
    ]
  },
  
  // Configure Mustache rendering
  renderEngine: (template, data) => {
    // Mustache is logic-less, so we pre-process data to include computed values
    const processedData = {
      ...data,
      
      // Add computed properties for templates
      publishedPosts: data.posts ? data.posts.filter(p => p.published) : [],
      
      // Helper functions (pre-computed values since Mustache is logic-less)
      formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
      
      // Process posts with additional computed properties
      postsWithMeta: data.posts ? data.posts
        .filter(p => p.published)
        .map(post => ({
          ...post,
          formattedDate: new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          shortExcerpt: post.excerpt.length > 100 
            ? post.excerpt.substring(0, 100) + '...' 
            : post.excerpt,
          isLongRead: post.readTime > 7,
          tagsList: post.tags.join(', ')
        })) : []
    };
    
    return mustache.render(template, processedData);
  },
  
  // Dynamic routes for blog posts
  routes: [
    {
      name: 'Blog Posts',
      path: '/posts/:slug',
      template: 'post.html',
      repeat: (data) => data.posts.filter(p => p.published),
      data: (globalData, post) => {
        // Pre-compute all template data since Mustache is logic-less
        const relatedPosts = globalData.posts
          .filter(p => p.published && p.id !== post.id)
          .filter(p => p.tags.some(tag => post.tags.includes(tag)))
          .slice(0, 3)
          .map(p => ({
            ...p,
            formattedDate: new Date(p.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          }));
          
        return {
          ...globalData,
          post: {
            ...post,
            formattedDate: new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            tagsList: post.tags.join(', '),
            hasRelated: relatedPosts.length > 0
          },
          relatedPosts,
          title: `${post.title} - ${globalData.site.title}`,
          description: post.excerpt
        };
      }
    }
  ]
};

/*
Example Mustache templates:

// views/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{site.title}}</title>
  <meta name="description" content="{{site.description}}">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1><a href="/">{{site.title}}</a></h1>
      <p>{{site.description}}</p>
    </div>
  </header>

  <main class="content">
    <section class="posts">
      <div class="container">
        <h2>Latest Posts</h2>
        
        {{#postsWithMeta}}
          <article class="post-card">
            <header>
              <h3><a href="/posts/{{slug}}">{{title}}</a></h3>
              <div class="meta">
                <span class="author">By {{author}}</span>
                <span class="date">{{formattedDate}}</span>
                <span class="read-time">{{readTime}} min read</span>
                {{#isLongRead}}
                  <span class="badge">Long Read</span>
                {{/isLongRead}}
              </div>
            </header>
            
            <div class="excerpt">
              <p>{{shortExcerpt}}</p>
            </div>
            
            <footer class="post-footer">
              <div class="tags">
                <span class="tags-label">Tags:</span>
                <span class="tags-list">{{tagsList}}</span>
              </div>
              <a href="/posts/{{slug}}" class="read-more">Read More</a>
            </footer>
          </article>
        {{/postsWithMeta}}
        
        {{^postsWithMeta}}
          <p>No posts available yet.</p>
        {{/postsWithMeta}}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; {{site.year}} {{site.author}}. Built with Clovie and Mustache.</p>
    </div>
  </footer>
</body>
</html>

// views/post.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1><a href="/">{{site.title}}</a></h1>
      <nav>
        <a href="/">← Back to Posts</a>
      </nav>
    </div>
  </header>

  <main class="content">
    <article class="post">
      <div class="container">
        <header class="post-header">
          <h1>{{post.title}}</h1>
          <div class="post-meta">
            <span class="author">By {{post.author}}</span>
            <span class="date">{{post.formattedDate}}</span>
            <span class="read-time">{{post.readTime}} min read</span>
          </div>
          <div class="tags">
            <span class="tags-label">Tags:</span>
            <span class="tags-list">{{post.tagsList}}</span>
          </div>
        </header>

        <div class="post-content">
          <p>{{post.content}}</p>
        </div>

        {{#post.hasRelated}}
          <section class="related-posts">
            <h3>Related Posts</h3>
            <div class="related-grid">
              {{#relatedPosts}}
                <article class="related-card">
                  <h4><a href="/posts/{{slug}}">{{title}}</a></h4>
                  <p class="meta">{{formattedDate}} • {{readTime}} min</p>
                </article>
              {{/relatedPosts}}
            </div>
          </section>
        {{/post.hasRelated}}
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; {{site.year}} {{site.author}}. Built with Clovie and Mustache.</p>
    </div>
  </footer>
</body>
</html>

Note: Mustache is "logic-less" - no if/else, loops are handled with arrays,
and all computed values must be pre-processed in the renderEngine function.
This makes templates very clean but requires more data preparation.
*/