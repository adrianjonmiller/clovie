import { ServiceProvider } from '@brickworks/engine';
import { createReactor } from '@brickworks/engine/state';
import { progressSink, metricsSink, prettySink } from '@brickworks/engine/logger';
import path from 'path';
import { spawn } from 'child_process';
import { Cache } from './Cache.js';
import { File } from './File.js';
import { createProgressTracker } from './utils/progress.js';

export class Apps extends ServiceProvider {
  static manifest = {
    name: 'Clovie Apps',
    namespace: 'apps',
    version: '1.0.0',
    log: {
      sinks: [progressSink, metricsSink, prettySink]
    },
    dependencies: [Cache, File]
  };

  #progressTracker = null;
  #buildProcesses = new Map();
  #buildResults = new Map();

  actions(useContext) {
    const [file, log] = useContext('file', 'log');
    
    // Initialize progress tracker if not already done
    if (!this.#progressTracker) {
      this.#progressTracker = createProgressTracker(log);
    }
    
    return {
      build: async (opts) => {
        if (!opts.apps || opts.apps.length === 0) {
          log.debug('No apps to build');
          return [];
        }

        const progressId = this.#progressTracker.createProgressBar('Building Apps', opts.apps.length, 'apps');
        const promises = [];

        for (let i = 0; i < opts.apps.length; i++) {
          const app = opts.apps[i];
          promises.push(
            this.#buildApp(app, opts).then(() => {
              this.#progressTracker.updateProgress(progressId, i + 1, { 
                current: app.name || app.source 
              });
            })
          );
        }

        await Promise.all(promises);
        this.#progressTracker.completeProgress(progressId, `✅ Built ${opts.apps.length} apps`);
        
        return promises;
      },

      buildApp: (app, opts) => this.#buildApp(app, opts),
      stopApp: (appName) => this.#stopApp(appName),
      getBuildResult: (appName) => this.#getBuildResult(appName),
      isBuilding: (appName) => this.#isBuilding(appName),
    };
  }

  async #buildApp(app, opts) {
    const [file, log] = useContext('file', 'log');
    
    try {
      log.info(`Building app: ${app.name || app.source}`);
      
      // Determine build tool and configuration
      const buildTool = app.buildTool || this.#detectBuildTool(app);
      const configPath = app.config || this.#findConfigFile(app.source, buildTool);
      
      if (!configPath) {
        log.warn(`No configuration found for app: ${app.name || app.source}`);
        return;
      }

      // Build the app using the appropriate tool
      const result = await this.#executeBuild(app, buildTool, configPath, opts);
      
      // Store build result
      this.#buildResults.set(app.name || app.source, {
        success: result.success,
        outputPath: app.outputPath || '/',
        buildTime: result.buildTime,
        files: result.files || [],
        errors: result.errors || []
      });

      if (result.success) {
        log.info(`✅ App built successfully: ${app.name || app.source}`);
      } else {
        log.error(`❌ App build failed: ${app.name || app.source}`);
        if (result.errors.length > 0) {
          result.errors.forEach(error => log.error(`  ${error}`));
        }
      }

      return result;
    } catch (error) {
      log.error(`Error building app ${app.name || app.source}:`, error.message);
      return { success: false, errors: [error.message] };
    }
  }

  #detectBuildTool(app) {
    const sourcePath = path.resolve(process.cwd(), app.source);
    
    // Check for package.json to determine build tool
    const packageJsonPath = path.join(sourcePath, 'package.json');
    if (file.exists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(file.read(packageJsonPath));
        const scripts = packageJson.scripts || {};
        
        // Check for common build tool scripts
        if (scripts.build && scripts.build.includes('vite')) return 'vite';
        if (scripts.build && scripts.build.includes('webpack')) return 'webpack';
        if (scripts.build && scripts.build.includes('rollup')) return 'rollup';
        if (scripts.dev && scripts.dev.includes('vite')) return 'vite';
        if (scripts.dev && scripts.dev.includes('webpack')) return 'webpack';
      } catch (err) {
        // Fallback to file detection
      }
    }

    // Check for config files
    if (file.exists(path.join(sourcePath, 'vite.config.js')) || 
        file.exists(path.join(sourcePath, 'vite.config.ts'))) {
      return 'vite';
    }
    if (file.exists(path.join(sourcePath, 'webpack.config.js')) || 
        file.exists(path.join(sourcePath, 'webpack.config.ts'))) {
      return 'webpack';
    }
    if (file.exists(path.join(sourcePath, 'rollup.config.js')) || 
        file.exists(path.join(sourcePath, 'rollup.config.ts'))) {
      return 'rollup';
    }

    return 'vite'; // Default fallback
  }

  #findConfigFile(sourcePath, buildTool) {
    const source = path.resolve(process.cwd(), sourcePath);
    const configExtensions = ['js', 'ts', 'mjs', 'cjs'];
    
    for (const ext of configExtensions) {
      const configPath = path.join(source, `${buildTool}.config.${ext}`);
      if (file.exists(configPath)) {
        return configPath;
      }
    }
    
    return null;
  }

  async #executeBuild(app, buildTool, configPath, opts) {
    const [log] = useContext('log');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const sourcePath = path.resolve(process.cwd(), app.source);
      const isDev = opts.mode === 'development';
      
      // Determine build command based on tool
      let command, args;
      
      switch (buildTool) {
        case 'vite':
          command = 'npx';
          args = ['vite', 'build'];
          if (isDev && app.buildOptions?.watch) {
            args = ['vite', 'build', '--watch'];
          }
          break;
          
        case 'webpack':
          command = 'npx';
          args = ['webpack'];
          if (isDev && app.buildOptions?.watch) {
            args = ['webpack', '--watch'];
          }
          break;
          
        case 'rollup':
          command = 'npx';
          args = ['rollup', '-c'];
          if (isDev && app.buildOptions?.watch) {
            args = ['rollup', '-c', '--watch'];
          }
          break;
          
        default:
          log.warn(`Unknown build tool: ${buildTool}`);
          resolve({ success: false, errors: [`Unknown build tool: ${buildTool}`] });
          return;
      }

      // Add config file if specified
      if (configPath) {
        args.push('--config', configPath);
      }

      log.debug(`Executing: ${command} ${args.join(' ')} in ${sourcePath}`);

      const buildProcess = spawn(command, args, {
        cwd: sourcePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      // Store process for potential cleanup
      this.#buildProcesses.set(app.name || app.source, buildProcess);

      let stdout = '';
      let stderr = '';
      let hasErrors = false;

      buildProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        log.debug(`[${app.name || app.source}] ${data.toString().trim()}`);
      });

      buildProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        const errorText = data.toString().trim();
        if (errorText.includes('error') || errorText.includes('Error')) {
          hasErrors = true;
        }
        log.debug(`[${app.name || app.source}] ${errorText}`);
      });

      buildProcess.on('close', (code) => {
        const buildTime = Date.now() - startTime;
        const success = code === 0 && !hasErrors;
        
        // Remove from active processes
        this.#buildProcesses.delete(app.name || app.source);
        
        resolve({
          success,
          buildTime,
          exitCode: code,
          stdout,
          stderr,
          errors: hasErrors ? [stderr] : []
        });
      });

      buildProcess.on('error', (error) => {
        const buildTime = Date.now() - startTime;
        this.#buildProcesses.delete(app.name || app.source);
        
        resolve({
          success: false,
          buildTime,
          errors: [error.message]
        });
      });

      // For watch mode, don't wait for process to close
      if (isDev && app.buildOptions?.watch) {
        setTimeout(() => {
          resolve({
            success: true,
            buildTime: Date.now() - startTime,
            watching: true
          });
        }, 2000); // Give it 2 seconds to start up
      }
    });
  }

  #stopApp(appName) {
    const process = this.#buildProcesses.get(appName);
    if (process) {
      process.kill();
      this.#buildProcesses.delete(appName);
      return true;
    }
    return false;
  }

  #getBuildResult(appName) {
    return this.#buildResults.get(appName) || null;
  }

  #isBuilding(appName) {
    return this.#buildProcesses.has(appName);
  }

  async cleanup() {
    // Kill all running build processes
    for (const [appName, process] of this.#buildProcesses) {
      process.kill();
    }
    this.#buildProcesses.clear();
  }
}
