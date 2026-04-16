import path from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

const SCRIPT_SRC_RE = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
const EXTERNAL_RE = /^(https?:\/\/|\/\/|data:)/i;

function addSource(src, scriptsDir, seen, entryPoints) {
  if (EXTERNAL_RE.test(src)) return;
  const sourcePath = path.resolve(scriptsDir, src);
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

/**
 * Extract local script source paths from rendered HTML and raw source files.
 * Scans rendered output, plus raw views/partials/route templates for a
 * shotgun approach that catches every possible script reference.
 *
 * @param {object}   opts
 * @param {string[]} opts.htmlStrings   - Rendered HTML content from views/routes
 * @param {string}   opts.scriptsDir    - Absolute path to scripts source directory
 * @param {string}   [opts.viewsDir]    - Absolute path to views directory
 * @param {string}   [opts.partialsDir] - Absolute path to partials directory
 * @param {object[]} [opts.routes]      - Route config objects with .template paths
 * @returns {string[]} Deduped absolute paths to source script files
 */
export function extractScriptSources({ htmlStrings = [], scriptsDir, viewsDir, partialsDir, routes = [] }) {
  const seen = new Set();
  const entryPoints = [];

  for (const html of htmlStrings) {
    extractFromString(html, scriptsDir, seen, entryPoints);
  }

  const sourceDirs = [viewsDir, partialsDir].filter(Boolean);
  for (const dir of sourceDirs) {
    for (const filePath of readFilesRecursively(dir)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        extractFromString(content, scriptsDir, seen, entryPoints);
      } catch { /* skip unreadable files */ }
    }
  }

  for (const route of routes) {
    if (route?.template && existsSync(route.template)) {
      try {
        const content = readFileSync(route.template, 'utf-8');
        extractFromString(content, scriptsDir, seen, entryPoints);
      } catch { /* skip unreadable files */ }
    }
  }

  return entryPoints;
}
