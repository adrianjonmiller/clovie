import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Display a pretty server ready message with clickable URL
 * @param {object} options - Server options
 * @param {number} options.port - Server port
 * @param {string} options.host - Server host
 * @param {string} options.mode - Server mode (development/production)
 * @param {object} logger - Logger instance
 */
export async function displayServerReady({ port, host, mode }, logger) {
  const protocol = mode === 'development' ? 'http' : 'https';
  const url = `${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
  
  // Create a nice banner
  const banner = [
    '',
    chalk.bold.blue('╔══════════════════════════════════════════════════════════════╗'),
    chalk.bold.blue('║') + chalk.bold.white('                    🚀 Clovie Server Ready! 🚀                    ') + chalk.bold.blue('║'),
    chalk.bold.blue('╠══════════════════════════════════════════════════════════════╣'),
    chalk.bold.blue('║') + chalk.white(`  Mode:     ${chalk.green(mode.toUpperCase())}                                    `) + chalk.bold.blue('║'),
    chalk.bold.blue('║') + chalk.white(`  URL:      ${chalk.cyan.underline(url)}                    `) + chalk.bold.blue('║'),
    chalk.bold.blue('║') + chalk.white(`  Host:     ${chalk.yellow(host)}:${chalk.yellow(port)}                                    `) + chalk.bold.blue('║'),
    chalk.bold.blue('╚══════════════════════════════════════════════════════════════╝'),
    ''
  ];

  // Display the banner
  banner.forEach(line => logger.info(line));

  // Try to open browser automatically in development mode
  if (mode === 'development') {
    try {
      await openBrowser(url);
      logger.info(chalk.green('🌐 Browser opened automatically'));
    } catch (error) {
      logger.debug('Could not open browser automatically:', error.message);
    }
  }

  // Display helpful commands
  const commands = [
    '',
    chalk.gray('💡 Quick Commands:'),
    chalk.gray(`   • Press ${chalk.yellow('Ctrl+C')} to stop the server`),
    chalk.gray(`   • Visit ${chalk.cyan(url)} to view your site`),
    chalk.gray(`   • Check the console for live reload updates`),
    ''
  ];

  commands.forEach(line => logger.info(line));
}

/**
 * Open browser with the given URL
 * @param {string} url - URL to open
 */
async function openBrowser(url) {
  const platform = process.platform;
  let command;

  switch (platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "${url}"`;
      break;
    default: // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`Failed to open browser: ${error.message}`);
  }
}