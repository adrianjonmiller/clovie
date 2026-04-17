import path from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

const SCRIPT_SRC_RE = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
const EXTERNAL_RE = /^(https?:\/\/|\/\/|data:)/i;

function addSource(src, scriptsDir, seen, entryPoints) {
  if (EXTERNAL_RE.test(src)) return;

  const cleaned = src.replace(/^\/+/, '');
  const sourcePath = path.resolve(scriptsDir, cleaned);

  if (seen.has(sourcePath)) return;
  seen.add(sourcePath);

  if (existsSync(sourcePath)) {
    entryPoints.push(sourcePath);
  }
}

function extractFromString(html, scriptsDir, seen, entryPoints) {
  if (!html) return;
  let match;
  SCRIPT_SRC_RE.lastIndex = 0;
  while ((match = SCRIPT_SRC_RE.exec(html)) !== null) {
    addSource(match[1].trim(), scriptsDir, seen, entryPoints);
  }
}

function readFilesRecursively(dir) {
  const results = [];
  if (!dir || !existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readFilesRecursively(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const TEMPLATE_EXTS = new Set(['.html', '.njk', '.hbs', '.pug', '.eta', '.mustache']);

function isTemplateFile(filePath) {
  return TEMPLATE_EXTS.has(path.extname(filePath).toLowerCase());
}

/**
 * Collect template file paths from resolved route config objects.
 */
function collectRouteTemplates(routes) {
  if (!routes) return [];
  const templates = [];
  for (const route of Array.isArray(routes) ? routes : [routes]) {
    if (route?.template) templates.push(route.template);
  }
  return templates;
}

/**
 * Extract local script source paths from rendered HTML and raw source files.
 * Uses a shotgun approach: scans rendered output, raw views, partials,
 * explicit route templates, and any additional template directories.
 *
 * @param {object}   opts
 * @param {string[]} opts.htmlStrings    - Rendered HTML content from views/routes
 * @param {string}   opts.scriptsDir     - Absolute path to scripts source directory
 * @param {string}   [opts.viewsDir]     - Absolute path to views directory
 * @param {string}   [opts.partialsDir]  - Absolute path to partials directory
 * @param {object[]} [opts.routes]       - Route config objects with .template paths
 * @param {string[]} [opts.templateDirs] - Additional directories to scan for templates
 * @returns {string[]} Deduped absolute paths to source script files
 */
export function extractScriptSources({
  htmlStrings = [],
  scriptsDir,
  viewsDir,
  partialsDir,
  routes = [],
  templateDirs = [],
}) {
  const seen = new Set();
  const entryPoints = [];

  for (const html of htmlStrings) {
    extractFromString(html, scriptsDir, seen, entryPoints);
  }

  const scanDirs = [viewsDir, partialsDir, ...templateDirs].filter(Boolean);
  for (const dir of scanDirs) {
    for (const filePath of readFilesRecursively(dir)) {
      if (!isTemplateFile(filePath)) continue;
      try {
        const content = readFileSync(filePath, 'utf-8');
        extractFromString(content, scriptsDir, seen, entryPoints);
      } catch { /* skip unreadable files */ }
    }
  }

  for (const templatePath of collectRouteTemplates(routes)) {
    const resolved = path.resolve(templatePath);
    if (!existsSync(resolved)) continue;
    try {
      const content = readFileSync(resolved, 'utf-8');
      extractFromString(content, scriptsDir, seen, entryPoints);
    } catch { /* skip unreadable files */ }
  }

  return entryPoints;
}
