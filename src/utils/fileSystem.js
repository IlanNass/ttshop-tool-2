import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory created or already exists: ${dirPath}`);
  } catch (err) {
    console.error(`Error creating directory: ${dirPath}`, err);
  }
} 