import pug from 'pug';

export default {
  // Pug template engine configuration
  type: 'static',
  
  data: {
    site: {
      title: 'Pug Documentation Site',
      description: 'Clean documentation built with Clovie and Pug',
      version: '1.0.0',
      repository: 'https://github.com/yourorg/docs'
    },
    navigation: [
      { title: 'Home', url: '/', active: true },
      { title: 'Getting Started', url: '/getting-started' },
      { title: 'API Reference', url: '/api' },
      { title: 'Examples', url: '/examples' }
    ],
    docs: [
      {
        id: 1,
        title: 'Installation',
        slug: 'installation',
        category: 'getting-started',
        order: 1,
        content: 'Learn how to install and set up the project...',
        sections: [
          { title: 'Prerequisites', anchor: 'prerequisites' },
          { title: 'Package Installation', anchor: 'package-installation' },
          { title: 'Configuration', anchor: 'configuration' }
        ]
      },
      {
        id: 2,
        title: 'Quick Start Guide',
        slug: 'quick-start',
        category: 'getting-started',
        order: 2,
        content: 'Get up and running in minutes...',
        sections: [
          { title: 'Basic Setup', anchor: 'basic-setup' },
          { title: 'First Example', anchor: 'first-example' }
        ]
      },
      {
        id: 3,
        title: 'API Methods',
        slug: 'api-methods',
        category: 'api',
        order: 1,
        content: 'Complete API reference...',
        sections: [
          { title: 'Authentication', anchor: 'authentication' },
          { title: 'Core Methods', anchor: 'core-methods' },
          { title: 'Error Handling', anchor: 'error-handling' }
        ]
      }
    ],
    categories: [
      { slug: 'getting-started', title: 'Getting Started', order: 1 },
      { slug: 'api', title: 'API Reference', order: 2 },
      { slug: 'examples', title: 'Examples', order: 3 }
    ]
  },
  
  // Configure Pug rendering
  renderEngine: (template, data) => {
    return pug.render(template, {
      ...data,
      pretty: true,  // Pretty-print HTML in development
      cache: process.env.NODE_ENV === 'production',
      
      // Custom Pug functions
      formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
      
      generateTableOfContents: (sections) => {
        return sections.map(section => ({
          ...section,
          url: `#${section.anchor}`
        }));
      },
      
      sortByOrder: (items) => {
        return items.sort((a, b) => a.order - b.order);
      }
    });
  },
  
  // Dynamic documentation routes
  routes: [
    // Individual documentation pages
    {
      name: 'Documentation Pages',
      path: '/docs/:slug',
      template: 'doc.pug',
      repeat: (data) => data.docs,
      data: (globalData, doc) => ({
        ...globalData,
        doc,
        title: `${doc.title} - ${globalData.site.title}`,
        breadcrumbs: [
          { title: 'Home', url: '/' },
          { title: 'Documentation', url: '/docs' },
          { title: doc.title }
        ],
        categoryDocs: globalData.docs
          .filter(d => d.category === doc.category)
          .sort((a, b) => a.order - b.order)
      })
    },
    
    // Category overview pages
    {
      name: 'Category Pages',
      path: '/category/:category',
      template: 'category.pug',
      repeat: (data) => data.categories,
      data: (globalData, category) => {
        const categoryDocs = globalData.docs
          .filter(d => d.category === category.slug)
          .sort((a, b) => a.order - b.order);
          
        return {
          ...globalData,
          category,
          docs: categoryDocs,
          title: `${category.title} - ${globalData.site.title}`
        };
      }
    }
  ]
};

/*
Example Pug templates:

// views/index.pug
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1.0")
    title= site.title
    meta(name="description", content=site.description)
    link(rel="stylesheet", href="/styles/main.css")
  
  body
    header.site-header
      .container
        h1.site-title
          a(href="/")= site.title
        nav.main-nav
          each item in navigation
            a(href=item.url, class=item.active ? 'active' : '')= item.title
    
    main.content
      section.hero
        .container
          h1= site.title
          p.lead= site.description
          p.version Version #{site.version}
          
          .quick-links
            a.btn.btn-primary(href="/docs/installation") Get Started
            a.btn.btn-secondary(href=site.repository) View on GitHub
      
      section.categories
        .container
          h2 Documentation
          .category-grid
            each category in categories
              .category-card
                h3
                  a(href=`/category/${category.slug}`)= category.title
                p= `Learn about ${category.title.toLowerCase()}`

// views/doc.pug
extends layout.pug

block content
  .doc-page
    aside.sidebar
      .category-nav
        h3= categoryDocs[0] ? categories.find(c => c.slug === categoryDocs[0].category).title : 'Documentation'
        ul.doc-list
          each docItem in categoryDocs
            li(class=docItem.slug === doc.slug ? 'active' : '')
              a(href=`/docs/${docItem.slug}`)= docItem.title
    
    article.doc-content
      header.doc-header
        nav.breadcrumbs
          each crumb, index in breadcrumbs
            if index < breadcrumbs.length - 1
              a(href=crumb.url)= crumb.title
              span.separator /
            else
              span= crumb.title
        
        h1= doc.title
        
        if doc.sections && doc.sections.length > 0
          .table-of-contents
            h3 Table of Contents
            ul
              each section in doc.sections
                li
                  a(href=`#${section.anchor}`)= section.title
      
      .doc-body
        != doc.content

// views/layout.pug
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1.0")
    title= title || site.title
    meta(name="description", content=site.description)
    link(rel="stylesheet", href="/styles/main.css")
  
  body
    header.site-header
      .container
        h1.site-title
          a(href="/")= site.title
        nav.main-nav
          each item in navigation
            a(href=item.url)= item.title
    
    main.content
      block content
    
    footer.site-footer
      .container
        p &copy; #{new Date().getFullYear()} #{site.title}
        p Built with Clovie and Pug
*/