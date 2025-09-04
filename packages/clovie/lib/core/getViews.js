import fs from 'fs';
import path from 'path';

export default function (src, models = {}, data) {
  try {
    if (!src || !fs.existsSync(src)) {
      console.warn(`Views directory does not exist: ${src}`);
      return {};
    }
    
    let fileNames = getFileNames(src);
    let templates = fileNames ? getTemplates(fileNames, src) : null;
    let pages = templates ? getPages(templates, data) : {};
    
    // Process models if any exist
    if (Object.keys(models).length > 0) {
      return processModels(templates, data, models, pages);
    }
    
    return pages;
  } catch (err) {
    console.error(`Error processing views from ${src}:`, err);
    return {};
  }
}

function getFileNames (PATH, files = fs.readdirSync(PATH, { withFileTypes: true }), accumulator = [], depth = 0) {
  // Prevent infinite recursion and stack overflow
  const MAX_DEPTH = 50;
  if (depth > MAX_DEPTH) {
    console.warn(`Maximum directory depth exceeded at: ${PATH}`);
    return accumulator;
  }

  if (!files || files.length === 0) return accumulator;
  
  let value = files.shift();
  if (!value) return accumulator;

  try {
    if (value && !value.name.startsWith('.')) {
      let name = path.join(PATH, value.name);
      let res = value.isDirectory() ? getFileNames(name, [], [], depth + 1) : name;
    
      if (Array.isArray(res)) {
        accumulator = accumulator.concat(res)
      } else {
        accumulator.push(res)
      }
    }
  } catch (err) {
    console.error(`Error processing file/directory: ${PATH}/${value?.name}:`, err);
  }

  return files.length ? getFileNames(PATH, files, accumulator, depth) : accumulator;
}

function getTemplates (files, src, accumulator = {}) {
  if (!files || files.length === 0) return accumulator;
  
  let file = files.shift();
  if (!file) return accumulator;
  
  try {
    let key = file.substring(path.join(src).length);
    accumulator[key] = fs.readFileSync(file).toString('utf8');
  } catch (err) {
    console.error(`Error reading template file: ${file}:`, err);
  }
  
  return files.length ? getTemplates(files, src, accumulator) : accumulator;
}

function getPages (templates, data, keys = Object.keys(templates), accumulator = {}) {
  if (!keys || keys.length === 0) return accumulator;
  
  let key = keys.shift();
  if (!key) return accumulator;
  
  try {
    if (!path.parse(key).name.startsWith('_')) {
      let template = templates[key];
      accumulator[key] = {
        template,
        data
      };
    }
  } catch (err) {
    console.error(`Error processing page: ${key}:`, err);
  }
  
  return keys.length ? getPages(templates, data, keys, accumulator) : accumulator;
}

function processModels(templates, data, models, existingPages = {}) {
  const results = { ...existingPages };
  
  for (const [modelName, config] of Object.entries(models)) {
    try {
      // Get the data array for this model
      const dataKey = config.ref || modelName;
      const items = data[dataKey];
      
      if (!items) {
        console.warn(`⚠️  No data found for model '${modelName}'. Expected '${dataKey}' in your data.`);
        continue;
      }
      
      if (!Array.isArray(items)) {
        console.error(`❌ Data for model '${modelName}' must be an array, got: ${typeof items}`);
        continue;
      }
      
      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const page = processModelItem(item, i, config, templates, data);
        
        if (page) {
          results[page.filename] = page;
        }
      }
      
      console.log(`✅ Generated ${items.length} pages for model '${modelName}'`);
      
    } catch (err) {
      console.error(`❌ Error processing model '${modelName}':`, err);
    }
  }
  
  return results;
}

function processModelItem(item, index, config, templates, globalData) {
  try {
    // Get template
    const templateName = config.template;
    if (!templateName) {
      console.error(`❌ Model missing 'template' property`);
      return null;
    }
    
    const templatePath = path.normalize(`/${templateName}`);
    const template = templates[templatePath];
    
    if (!template) {
      console.error(`❌ Template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
      return null;
    }
    
    // Transform data if function provided
    let processedData = item;
    if (typeof config.transform === 'function') {
      try {
        processedData = config.transform(item, index);
      } catch (err) {
        console.error(`❌ Error in transform function for item ${index}:`, err);
        processedData = item;
      }
    }
    
    // Generate filename
    let filename = `${index}.html`;
    if (typeof config.output === 'function') {
      try {
        filename = config.output(item, index);
      } catch (err) {
        console.error(`❌ Error in output function for item ${index}:`, err);
        filename = `${index}.html`;
      }
    } else if (typeof config.output === 'string') {
      // Simple string template replacement
      filename = config.output
        .replace('{index}', index)
        .replace('{slug}', item.slug || item.id || index)
        .replace('{title}', item.title || item.name || index);
    }
    
    // Ensure .html extension
    if (!filename.endsWith('.html')) {
      filename += '.html';
    }
    
    return {
      template,
      data: {
        local: processedData,
        ...globalData,
        index,
        isFirst: index === 0,
        isLast: index === (globalData[config.ref || 'items']?.length - 1)
      },
      filename
    };
    
  } catch (err) {
    console.error(`❌ Error processing model item ${index}:`, err);
    return null;
  }
}