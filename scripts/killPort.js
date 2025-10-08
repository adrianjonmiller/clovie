/**
 * Kill processes running on specific ports
 * Cross-platform utility for terminating processes by port number
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Get the process ID running on a specific port
 * @param {number} port - Port number to check
 * @returns {Promise<number|null>} Process ID or null if not found
 */
async function getProcessIdOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        if (line.includes(`:${port} `) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          return parseInt(pid, 10);
        }
      }
    } else {
      // Unix-like systems (macOS, Linux)
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pid = stdout.trim();
      return pid ? parseInt(pid, 10) : null;
    }
  } catch (error) {
    // Port not in use or command failed
    return null;
  }
}

/**
 * Kill a process by its ID
 * @param {number} pid - Process ID to kill
 * @returns {Promise<boolean>} True if killed successfully
 */
async function killProcess(pid) {
  try {
    if (process.platform === 'win32') {
      // Windows
      await execAsync(`taskkill /PID ${pid} /F`);
    } else {
      // Unix-like systems
      await execAsync(`kill -9 ${pid}`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Kill all processes running on the specified ports
 * @param {number|number[]} ports - Port number(s) to kill processes on
 * @param {Object} options - Options for killing
 * @param {boolean} options.verbose - Show verbose output
 * @returns {Promise<Object>} Result object with killed processes
 */
export async function killPort(ports, options = {}) {
  const { verbose = false } = options;
  const portArray = Array.isArray(ports) ? ports : [ports];
  const results = {
    killed: [],
    notFound: [],
    errors: []
  };

  for (const port of portArray) {
    try {
      if (verbose) console.log(`Checking port ${port}...`);
      
      const pid = await getProcessIdOnPort(port);
      
      if (!pid) {
        if (verbose) console.log(`No process found on port ${port}`);
        results.notFound.push(port);
        continue;
      }

      if (verbose) console.log(`Killing process ${pid} on port ${port}...`);
      
      const killed = await killProcess(pid);
      
      if (killed) {
        if (verbose) console.log(`✅ Successfully killed process ${pid} on port ${port}`);
        results.killed.push({ port, pid });
      } else {
        if (verbose) console.log(`❌ Failed to kill process ${pid} on port ${port}`);
        results.errors.push({ port, pid, error: 'Kill command failed' });
      }
    } catch (error) {
      if (verbose) console.log(`❌ Error checking port ${port}: ${error.message}`);
      results.errors.push({ port, error: error.message });
    }
  }

  return results;
}

/**
 * Check what processes are running on specified ports
 * @param {number|number[]} ports - Port number(s) to check
 * @returns {Promise<Object>} Object with port information
 */
export async function checkPorts(ports) {
  const portArray = Array.isArray(ports) ? ports : [ports];
  const results = {};

  for (const port of portArray) {
    const pid = await getProcessIdOnPort(port);
    results[port] = {
      inUse: !!pid,
      pid: pid || null
    };
  }

  return results;
}

/**
 * Kill all common development ports (3000, 3001, 5000, 8000, 8080)
 * @param {Object} options - Options for killing
 * @returns {Promise<Object>} Result object
 */
export async function killCommonPorts(options = {}) {
  const commonPorts = [3000, 3001, 5000, 8000, 8080];
  return killPort(commonPorts, options);
}
