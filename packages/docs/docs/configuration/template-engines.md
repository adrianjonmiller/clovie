---
sidebar_position: 4
title: Template engines
description: Configure Handlebars, Nunjucks, Pug, or a custom render function via the renderEngine option.
---

# Template Engines

## Built-in Support

Clovie supports popular template engines out of the box:

```javascript
// Handlebars
import Handlebars from 'handlebars';
export default {
  renderEngine: (template, data) => {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
};

// Nunjucks
import nunjucks from 'nunjucks';
export default {
  renderEngine: (template, data) => {
    return nunjucks.renderString(template, data);
  }
};

// Pug
import pug from 'pug';
export default {
  renderEngine: (template, data) => {
    return pug.render(template, { ...data, pretty: true });
  }
};
```

## Custom Template Engine

```javascript
export default {
  renderEngine: (template, data) => {
    // Simple variable replacement
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
};
```

## String-based Engine Selection

```javascript
export default {
  renderEngine: 'handlebars', // Auto-configures Handlebars
  // Also supports: 'nunjucks', 'pug', 'mustache', 'eta'
};
```
