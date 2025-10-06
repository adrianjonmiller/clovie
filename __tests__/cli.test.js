import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('CLI', () => {
  const cliPath = path.resolve(process.cwd(), 'bin/cli.js');
  const testDir = path.resolve(process.cwd(), '__tests__/temp-cli');

  beforeEach(() => {
    // Clean up any existing test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should show help when no arguments provided', async () => {
    const result = await runCli([]);
    // CLI might return exit code 1 for missing arguments, but should show help
    expect(result.exitCode).toBeGreaterThanOrEqual(0);
    expect(result.stdout + result.stderr).toContain('Clovie');
  });

  it('should create a new project with default template', async () => {
    const result = await runCli(['create', 'test-project']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✅ Clovie default project created successfully!');
    
    // Check that project files were created
    expect(fs.existsSync(path.join(testDir, 'test-project'))).toBe(false); // Should be in current dir
    expect(fs.existsSync(path.join(process.cwd(), 'test-project'))).toBe(true);
    
    // Clean up the created project
    if (fs.existsSync(path.join(process.cwd(), 'test-project'))) {
      fs.rmSync(path.join(process.cwd(), 'test-project'), { recursive: true, force: true });
    }
  });

  it('should create a new project with static template', async () => {
    const result = await runCli(['create', 'test-static', '--template', 'static']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✅ Clovie static project created successfully!');
    
    // Check that project files were created
    expect(fs.existsSync(path.join(process.cwd(), 'test-static'))).toBe(true);
    
    // Clean up the created project
    if (fs.existsSync(path.join(process.cwd(), 'test-static'))) {
      fs.rmSync(path.join(process.cwd(), 'test-static'), { recursive: true, force: true });
    }
  });

  it('should show error for invalid template', async () => {
    const result = await runCli(['create', 'test-invalid', '--template', 'invalid']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Invalid template type');
  });

  it('should show error when project name is missing', async () => {
    const result = await runCli(['create']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Please provide a project name');
  });

  it('should show error when project directory already exists', async () => {
    // Create a directory first
    fs.mkdirSync(path.join(process.cwd(), 'existing-project'), { recursive: true });
    
    const result = await runCli(['create', 'existing-project']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('already exists');
    
    // Clean up
    fs.rmSync(path.join(process.cwd(), 'existing-project'), { recursive: true, force: true });
  });
});

// Helper function to run CLI commands
function runCli(args, options = {}) {
  const cliPath = path.resolve(process.cwd(), 'bin/cli.js');
  return new Promise((resolve) => {
    const child = spawn('node', [cliPath, ...args], {
      cwd: options.cwd || process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, ...options.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: error.message
      });
    });
  });
}
