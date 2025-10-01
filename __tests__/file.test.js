import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createClovie } from '../lib/createClovie.js';

describe('File', () => {
  let clovie;

  beforeEach(async () => {
    clovie = await createClovie();
  });
  const testDir = path.join(process.cwd(), '__tests__', 'temp');
  const testFile = path.join(testDir, 'test.txt');
  const testContent = 'Hello, World!';

  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create test file
    fs.writeFileSync(testFile, testContent, 'utf8');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  it('should read a single file', () => {
    const content = clovie.file.readFile(testFile);
    expect(content).toBe(testContent);
  });

  it('should return null for non-existent file', () => {
    const content = clovie.file.readFile('non-existent.txt');
    expect(content).toBe(null);
  });

  it('should check if file exists', () => {
    expect(clovie.file.exists(testFile)).toBe(true);
    expect(clovie.file.exists('non-existent.txt')).toBe(false);
  });

  it('should extract filename from path', () => {
    expect(clovie.file.getFileName(testFile)).toBe('test.txt');
    expect(clovie.file.getFileName('/some/path/file.js')).toBe('file.js');
  });

  it('should extract file extension', () => {
    expect(clovie.file.getFileExtension(testFile)).toBe('.txt');
    expect(clovie.file.getFileExtension('file.js')).toBe('.js');
  });

  it('should extract base name (filename without extension)', () => {
    expect(clovie.file.getBaseName(testFile)).toBe('test');
    expect(clovie.file.getBaseName('file.js')).toBe('file');
  });

  it('should read directory names', () => {
    const names = clovie.file.readNames(testDir);
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain(testFile);
  });

  it('should create directory', () => {
    const newDir = path.join(testDir, 'newdir');
    const result = clovie.file.createDirectory(newDir);
    expect(result).toBe(true);
    expect(fs.existsSync(newDir)).toBe(true);
    
    // Clean up
    fs.rmdirSync(newDir);
  });

  it('should return false when creating existing directory', () => {
    const result = clovie.file.createDirectory(testDir);
    expect(result).toBe(false);
  });
});
