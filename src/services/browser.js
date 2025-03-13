import puppeteer from 'puppeteer-core';
import { findChromeExecutablePath, getChromeVersion } from './chromeDetection.js';

// Browser state
let browser = null;
let browserRetryCount = 0;
const MAX_BROWSER_RETRIES = 3;

// Environment flag
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initializes the Puppeteer browser with proper configuration
 * @returns {Promise<Browser|null>} The browser instance or null if failed
 */
export async function initBrowser() {
  // Log environment data for debugging
  try {
    console.log('Environment information:', {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      puppeteerSkipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
      currentWorkingDir: process.cwd()
    });
    
    // Get Chrome path
    const chromePath = await findChromeExecutablePath();
    if (!chromePath) {
      console.error('No Chrome executable found, cannot proceed with browser initialization');
      return null;
    }
    
    // Try to get Chrome version
    const versionOutput = await getChromeVersion(chromePath);
    if (versionOutput) {
      console.log('Chrome version from executable:', versionOutput);
    }
    
    // Configure browser launch options with best practices for production
    const launchOptions = {
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-audio-output',
        '--window-size=1280,720',
        '--hide-scrollbars'
      ],
      headless: true, // Use headless mode
      ignoreHTTPSErrors: true // Ignore HTTPS errors for scraping
    };
    
    console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2));
    browser = await puppeteer.launch(launchOptions);
    console.log('Puppeteer browser initialized successfully');
    
    // Check browser version
    const version = await browser.version();
    console.log('Browser version:', version);

    // Setup browser error handler
    browser.on('disconnected', () => {
      console.log('Browser disconnected');
      browser = null;
      
      // Auto-restart browser in production
      if (isProduction && browserRetryCount < MAX_BROWSER_RETRIES) {
        console.log(`Attempting to restart browser (attempt ${browserRetryCount + 1}/${MAX_BROWSER_RETRIES})`);
        browserRetryCount++;
        setTimeout(() => {
          initBrowser().catch(err => {
            console.error('Failed to restart browser:', err);
          });
        }, 1000 * browserRetryCount); // Increase delay with each retry
      }
    });
    
    // Reset retry counter on successful start
    browserRetryCount = 0;
    
    return browser;
  } catch (error) {
    console.error('Failed to initialize browser:', error);
    return null;
  }
}

/**
 * Get the current browser instance, initializing if necessary
 * @returns {Promise<Browser|null>} The browser instance or null if initialization failed
 */
export async function getBrowser() {
  if (!browser) {
    console.log('Browser not initialized, attempting to initialize now...');
    return await initBrowser();
  }
  return browser;
}

/**
 * Clean up the browser instance
 */
export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      console.log('Browser closed successfully');
    } catch (err) {
      console.error('Error closing browser:', err);
    } finally {
      browser = null;
    }
  }
} 