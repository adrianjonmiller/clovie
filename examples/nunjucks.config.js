import nunjucks from 'nunjucks';

export default {
  // Nunjucks template engine configuration
  type: 'static',
  
  data: {
    site: {
      title: 'Nunjucks Portfolio',
      description: 'A portfolio site built with Clovie and Nunjucks',
      author: 'Designer Name',
      social: {
        twitter: '@designer',
        github: 'github.com/designer'
      }
    },
    projects: [
      {
        id: 1,
        title: 'Modern Web App',
        slug: 'modern-web-app',
        description: 'A responsive web application built with modern technologies',
        image: '/assets/images/project1.jpg',
        technologies: ['React', 'Node.js', 'MongoDB'],
        category: 'web',
        featured: true,
        year: 2024
      },
      {
        id: 2,
        title: 'Mobile App Design',
        slug: 'mobile-app-design',
        description: 'UI/UX design for a social media mobile application',
        image: '/assets/images/project2.jpg',
        technologies: ['Figma', 'Sketch', 'Principle'],
        category: 'design',
        featured: true,
        year: 2023
      }
    ],
    categories: ['web', 'design', 'mobile']
  },
  
  // Configure Nunjucks environment
  renderEngine: (template, data) => {
    // Create Nunjucks environment
    const env = nunjucks.configure({ autoescape: true });
    
    // Add custom filters
    env.addFilter('formatYear', (date) => {
      return new Date(date).getFullYear();
    });
    
    env.addFilter('uppercase', (str) => {
      return str.toUpperCase();
    });
    
    env.addFilter('slug', (str) => {
      return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    
    env.addFilter('featured', (projects) => {
      return projects.filter(p => p.featured);
    });
    
    env.addFilter('byCategory', (projects, category) => {
      return projects.filter(p => p.category === category);
    });
    
    // Render template
    return env.renderString(template, data);
  },
  
  // Dynamic routes
  routes: [
    // Individual project pages
    {
      name: 'Project Pages',
      path: '/projects/:slug',
      template: 'project.html',
      repeat: (data) => data.projects,
      data: (globalData, project) => ({
        ...globalData,
        project,
        title: `${project.title} - ${globalData.site.title}`,
        relatedProjects: globalData.projects
          .filter(p => p.id !== project.id && p.category === project.category)
          .slice(0, 2)
      })
    },
    
    // Category pages
    {
      name: 'Category Pages',
      path: '/category/:category',
      template: 'category.html',
      repeat: (data) => data.categories,
      data: (globalData, category) => ({
        ...globalData,
        category,
        projects: globalData.projects.filter(p => p.category === category),
        title: `${category | title} Projects - ${globalData.site.title}`
      })
    }
  ]
};

/*
Example Nunjucks templates:

// views/index.html
<section class="hero">
  <h1>{{ site.title }}</h1>
  <p>{{ site.description }}</p>
</section>

<section class="featured-projects">
  <h2>Featured Work</h2>
  <div class="project-grid">
    {% for project in projects | featured %}
      <article class="project-card">
        <img src="{{ project.image }}" alt="{{ project.title }}">
        <h3><a href="/projects/{{ project.slug }}">{{ project.title }}</a></h3>
        <p>{{ project.description }}</p>
        <div class="meta">
          <span class="category">{{ project.category | uppercase }}</span>
          <span class="year">{{ project.year }}</span>
        </div>
      </article>
    {% endfor %}
  </div>
</section>

// views/project.html
<article class="project-detail">
  <header>
    <h1>{{ project.title }}</h1>
    <div class="meta">
      <span class="category">{{ project.category | uppercase }}</span>
      <span class="year">{{ project.year }}</span>
    </div>
  </header>
  
  <img src="{{ project.image }}" alt="{{ project.title }}" class="hero-image">
  
  <div class="content">
    <p>{{ project.description }}</p>
    
    <h3>Technologies Used</h3>
    <ul class="tech-list">
      {% for tech in project.technologies %}
        <li>{{ tech }}</li>
      {% endfor %}
    </ul>
  </div>
  
  {% if relatedProjects.length > 0 %}
    <section class="related-projects">
      <h3>Related Projects</h3>
      <div class="project-grid">
        {% for related in relatedProjects %}
          <a href="/projects/{{ related.slug }}" class="project-card">
            <img src="{{ related.image }}" alt="{{ related.title }}">
            <h4>{{ related.title }}</h4>
          </a>
        {% endfor %}
      </div>
    </section>
  {% endif %}
</article>

// views/category.html
<section class="category-page">
  <header>
    <h1>{{ category | title }} Projects</h1>
    <p>Browse all {{ category }} projects in my portfolio.</p>
  </header>
  
  <div class="project-grid">
    {% for project in projects %}
      <article class="project-card">
        <img src="{{ project.image }}" alt="{{ project.title }}">
        <h3><a href="/projects/{{ project.slug }}">{{ project.title }}</a></h3>
        <p>{{ project.description }}</p>
        <div class="technologies">
          {% for tech in project.technologies %}
            <span class="tech-tag">{{ tech }}</span>
          {% endfor %}
        </div>
      </article>
    {% endfor %}
  </div>
</section>
*/