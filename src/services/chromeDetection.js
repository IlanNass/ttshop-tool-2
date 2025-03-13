import fs from 'fs/promises';
import { execAsync } from '../utils/fileSystem.js';

/**
 * Finds the Chrome executable path by checking common locations and environment variables
 * @returns {Promise<string|null>} The path to Chrome or null if not found
 */
export async function findChromeExecutablePath() {
  console.log('Finding Chrome executable path...');
  
  // Check environment variable first
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log(`Using Chrome path from environment: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    try {
      await fs.access(process.env.PUPPETEER_EXECUTABLE_PATH);
      console.log('Confirmed executable exists at the path');
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    } catch (err) {
      console.error(`Chrome executable not found at ${process.env.PUPPETEER_EXECUTABLE_PATH}:`, err.message);
    }
  }
  
  // List of possible Chrome paths on Render and Linux systems
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/app/.apt/usr/bin/google-chrome-stable',
    '/app/.apt/usr/bin/google-chrome',
    '/app/.chrome/bin/chrome'
  ];
  
  // Check each path
  for (const chromePath of possiblePaths) {
    try {
      console.log(`Checking Chrome path: ${chromePath}`);
      await fs.access(chromePath);
      console.log(`Chrome found at: ${chromePath}`);
      return chromePath;
    } catch (err) {
      console.log(`Chrome not found at: ${chromePath}`);
    }
  }
  
  // Try to find using which command
  try {
    const { stdout } = await execAsync('which google-chrome-stable || which google-chrome || which chromium');
    const chromePath = stdout.trim();
    if (chromePath) {
      console.log(`Chrome found using 'which' command at: ${chromePath}`);
      return chromePath;
    }
  } catch (err) {
    console.log('Failed to find Chrome using which command:', err.message);
  }
  
  console.error('Could not find Chrome executable in any expected location');
  return null;
}

/**
 * Gets Chrome version from the specified path
 * @param {string} chromePath - Path to Chrome executable
 * @returns {Promise<string|null>} The Chrome version or null if not found
 */
export async function getChromeVersion(chromePath) {
  if (!chromePath) return null;
  
  try {
    const { stdout } = await execAsync(`"${chromePath}" --version`);
    return stdout.trim();
  } catch (err) {
    console.warn('Could not get Chrome version:', err.message);
    // Try without quotes as a fallback
    try {
      const { stdout } = await execAsync(`${chromePath} --version`);
      return stdout.trim();
    } catch (fallbackErr) {
      console.warn('Could not get Chrome version with fallback method:', fallbackErr.message);
      return null;
    }
  }
} 