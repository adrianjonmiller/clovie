import { SingleBar, Presets } from 'cli-progress';
import chalk from 'chalk';

export class ProgressTracker {
  constructor(logger) {
    this.logger = logger;
    this.bars = new Map();
    this.activeBars = new Set();
  }

  /**
   * Create a progress bar for a compilation task
   * @param {string} taskName - Name of the task (e.g., "Compiling Assets")
   * @param {number} total - Total number of items to process
   * @param {string} itemType - Type of items being processed (e.g., "files")
   * @returns {string} - Progress bar ID
   */
  createProgressBar(taskName, total, itemType = 'items') {
    const id = `${taskName}-${Date.now()}`;
    
    const bar = new SingleBar({
      format: `${chalk.cyan(taskName)} |{bar}| {percentage}% | {value}/{total} ${itemType} | {duration_formatted}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true,
      stopOnComplete: true,
    }, Presets.shades_classic);

    this.bars.set(id, bar);
    this.activeBars.add(id);
    
    bar.start(total, 0);
    return id;
  }

  /**
   * Update a progress bar
   * @param {string} id - Progress bar ID
   * @param {number} value - Current progress value
   * @param {object} payload - Additional data to display
   */
  updateProgress(id, value, payload = {}) {
    const bar = this.bars.get(id);
    if (bar) {
      bar.update(value, payload);
    }
  }

  /**
   * Complete a progress bar
   * @param {string} id - Progress bar ID
   * @param {string} message - Completion message
   */
  completeProgress(id, message = '') {
    const bar = this.bars.get(id);
    if (bar) {
      bar.stop();
      this.bars.delete(id);
      this.activeBars.delete(id);
      
      if (message) {
        this.logger.info(message);
      }
    }
  }

  /**
   * Remove a progress bar without completion message
   * @param {string} id - Progress bar ID
   */
  removeProgress(id) {
    const bar = this.bars.get(id);
    if (bar) {
      bar.stop();
      this.bars.delete(id);
      this.activeBars.delete(id);
    }
  }

  /**
   * Clear all progress bars
   */
  clearAll() {
    this.bars.forEach((bar, id) => {
      bar.stop();
    });
    this.bars.clear();
    this.activeBars.clear();
  }

  /**
   * Get the number of active progress bars
   * @returns {number}
   */
  getActiveCount() {
    return this.activeBars.size;
  }
}

/**
 * Create a progress tracker instance
 * @param {object} logger - Logger instance
 * @returns {ProgressTracker}
 */
export function createProgressTracker(logger) {
  return new ProgressTracker(logger);
}
