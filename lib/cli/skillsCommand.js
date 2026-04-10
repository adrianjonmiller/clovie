import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the published clovie package (parent of lib/). */
export function getCloviePackageRoot() {
  return path.resolve(__dirname, '..', '..');
}

export function getBundledSkillPath() {
  return path.join(getCloviePackageRoot(), '.cursor', 'skills', 'clovie.mdc');
}

/**
 * @param {string[]} args Arguments after `clovie skills`
 */
export async function runSkillsCommand(args) {
  const skillPath = getBundledSkillPath();

  if (args.includes('--help') || args.includes('-h')) {
    printSkillsUsage(skillPath);
    return;
  }

  if (args[0] === 'path' || args.includes('--path')) {
    console.log(skillPath);
    return;
  }

  if (args[0] === 'show' || args.includes('--show')) {
    if (!existsSync(skillPath)) {
      console.error(`Bundled skill file not found at:\n  ${skillPath}`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(readFileSync(skillPath, 'utf8'));
    return;
  }

  printSkillsUsage(skillPath);
}

function printSkillsUsage(skillPath) {
  console.log('Clovie — bundled Cursor skill for AI agents');
  console.log('');
  console.log('Bundled skill file:');
  console.log(`  ${skillPath}`);
  console.log('');
  console.log('Commands:');
  console.log('  clovie skills              Show this help and the skill path');
  console.log('  clovie skills path         Print only the absolute path (for scripts)');
  console.log('  clovie skills show         Print the full skill file to stdout');
  console.log('');
  console.log('Best practice for agents: copy or symlink the file into your project under');
  console.log('  .cursor/skills/  so Cursor loads it automatically, or paste `clovie skills show`.');
}
