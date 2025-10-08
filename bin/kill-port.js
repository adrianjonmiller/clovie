#!/usr/bin/env node
/**
 * Standalone kill-port script for Clovie
 * Can be used independently or via npm scripts
 */

import { killPort, checkPorts, killCommonPorts } from '../scripts/killPort.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('💀 Clovie Kill Port Utility');
  console.log('');
  console.log('Usage:');
  console.log('  node bin/kill-port.js <port> [port2] [port3] ...');
  console.log('  node bin/kill-port.js --common');
  console.log('  node bin/kill-port.js --check [port] [port2] ...');
  console.log('');
  console.log('Options:');
  console.log('  --common, -c     Kill common development ports (3000, 3001, 5000, 8000, 8080)');
  console.log('  --check, -k      Check ports instead of killing');
  console.log('  --verbose, -v    Show verbose output');
  console.log('  --help, -h       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node bin/kill-port.js 3000');
  console.log('  node bin/kill-port.js 3000 3001 5000');
  console.log('  node bin/kill-port.js --common');
  console.log('  node bin/kill-port.js --check');
  console.log('  node bin/kill-port.js --check 3000 8080');
  process.exit(0);
}

const isCheck = args.includes('--check') || args.includes('-k');
const isCommon = args.includes('--common') || args.includes('-c');
const isVerbose = args.includes('--verbose') || args.includes('-v');

// Filter out flags to get port numbers
const ports = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-') && !isNaN(Number(arg))).map(Number);

async function main() {
  try {
    if (isCheck) {
      // Check ports
      const portsToCheck = ports.length > 0 ? ports : [3000, 3001, 5000, 8000, 8080];
      console.log('🔍 Checking ports...');
      const results = await checkPorts(portsToCheck);
      
      for (const [port, info] of Object.entries(results)) {
        if (info.inUse) {
          console.log(`🔴 Port ${port}: Process ${info.pid} is running`);
        } else {
          console.log(`🟢 Port ${port}: Available`);
        }
      }
    } else if (isCommon) {
      // Kill common development ports
      console.log('💀 Killing processes on common development ports...');
      const results = await killCommonPorts({ verbose: isVerbose });
      
      console.log(`\n📊 Results:`);
      console.log(`  ✅ Killed: ${results.killed.length} processes`);
      console.log(`  ⚪ Not found: ${results.notFound.length} ports`);
      console.log(`  ❌ Errors: ${results.errors.length} failures`);
      
      if (results.killed.length > 0) {
        console.log('\n💀 Killed processes:');
        results.killed.forEach(({ port, pid }) => {
          console.log(`  Port ${port}: Process ${pid}`);
        });
      }
    } else if (ports.length > 0) {
      // Kill specific ports
      console.log(`💀 Killing processes on ports: ${ports.join(', ')}`);
      const results = await killPort(ports, { verbose: isVerbose });
      
      console.log(`\n📊 Results:`);
      console.log(`  ✅ Killed: ${results.killed.length} processes`);
      console.log(`  ⚪ Not found: ${results.notFound.length} ports`);
      console.log(`  ❌ Errors: ${results.errors.length} failures`);
      
      if (results.killed.length > 0) {
        console.log('\n💀 Killed processes:');
        results.killed.forEach(({ port, pid }) => {
          console.log(`  Port ${port}: Process ${pid}`);
        });
      }
    } else {
      console.error('❌ Please specify ports to kill or use --common flag');
      console.error('Use --help for usage information');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
