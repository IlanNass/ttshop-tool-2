import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

// Constants and configuration
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots');

// Flag to track if we're running in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Configure Express
const app = express();

// Add request timeout middleware
const requestTimeout = (req, res, next) => {
  // Set a 60-second timeout for all requests
  req.setTimeout(60000, () => {
    console.error('Request timeout');
    if (!res.headersSent) {
      res.status(408).json({ 
        error: 'Request Timeout', 
        message: 'The request took too long to process',
        mock: createMockData(req.query.url || 'timeout')
      });
    }
  });
  next();
};

app.use(requestTimeout);

// Add basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Utility functions
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory created or already exists: ${dirPath}`);
  } catch (err) {
    console.error(`Error creating directory: ${dirPath}`, err);
  }
}

async function findChromeExecutablePath() {
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

function createMockData(url) {
  const shopNameMatch = url && url.match(/\/shop\/([^/?#]+)/);
  const mockShopName = shopNameMatch ? shopNameMatch[1].replace(/-/g, ' ') : 'Sample Shop';
  
  return {
    shopName: mockShopName,
    revenue: `$${Math.floor(Math.random() * 10000)}k`,
    sales: `${Math.floor(Math.random() * 50)}k orders`,
    products: [
      {
        name: 'Sample Product',
        price: `$${(Math.random() * 100).toFixed(2)}`,
        sales: `${Math.floor(Math.random() * 5000)} sold`
      },
      {
        name: 'Another Product',
        price: `$${(Math.random() * 100).toFixed(2)}`,
        sales: `${Math.floor(Math.random() * 5000)} sold`
      }
    ],
    isMockData: true
  };
}

// Puppeteer browser management
let browser = null;
let browserRetryCount = 0;
const MAX_BROWSER_RETRIES = 3;

async function initBrowser() {
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
    
    // Try to get Chrome version directly
    try {
      const { stdout } = await execAsync(`"${chromePath}" --version`);
      console.log('Chrome version from executable:', stdout.trim());
    } catch (err) {
      console.warn('Could not get Chrome version:', err.message);
      // Try without quotes as a fallback
      try {
        const { stdout } = await execAsync(`${chromePath} --version`);
        console.log('Chrome version (fallback method):', stdout.trim());
      } catch (fallbackErr) {
        console.warn('Could not get Chrome version with fallback method:', fallbackErr.message);
      }
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

// Scraping functionality
async function scrapeShop(url) {
  let page = null;
  
  try {
    console.log(`Starting scrape for: ${url}`);

    // Ensure browser is initialized
    if (!browser) {
      console.log('Browser not initialized, attempting to initialize now...');
      browser = await initBrowser();
      
      // If browser still fails, return mock data
      if (!browser) {
        console.log('Browser initialization failed. Returning mock data.');
        return createMockData(url);
      }
    }

    // Create a new page for this request with timeout
    page = await browser.newPage();
    
    // Setup request timeout for the page
    let pageTimeout = setTimeout(() => {
      if (page) {
        console.error('Page operation timeout');
        page.close().catch(console.error);
      }
    }, 45000); // 45 seconds timeout
    
    // Configure page settings
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    
    // Block unnecessary resources for better performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    console.log(`Navigating to URL: ${url}`);
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    if (!response) {
      console.log('No response received from navigation');
      throw new Error('Failed to receive response from page navigation');
    }
    
    const status = response.status();
    console.log(`Page loaded with status: ${status}`);
    
    if (status >= 400) {
      throw new Error(`Page responded with error status: ${status}`);
    }
    
    // Wait for shop data to appear
    try {
      await page.waitForSelector('.shop-top', { timeout: 10000 });
    } catch (err) {
      console.log('Shop-top selector not found, taking screenshot anyway for diagnosis');
    }
    
    // Take screenshot for debugging regardless of selector success
    console.log('Taking screenshot for debugging...');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    console.log('Extracting shop data...');
    
    // Extract shop data
    const shopData = await page.evaluate(() => {
      // Helper function to safely extract text
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };
      
      // Extract shop name
      const shopName = getText('.shop-name') || 'Unknown Shop';
      
      // Extract revenue
      const revenue = getText('.revenue') || 'Unknown Revenue';
      
      // Extract sales
      const sales = getText('.sales') || 'Unknown Sales';
      
      // Extract products
      const productEls = document.querySelectorAll('.product-item');
      const products = Array.from(productEls).map(productEl => {
        return {
          name: getText.call(productEl, '.product-name') || 'Unknown Product',
          price: getText.call(productEl, '.product-price') || 'Unknown Price',
          sales: getText.call(productEl, '.product-sales') || 'Unknown Sales'
        };
      });
      
      // Get page title and URL for additional context
      const pageTitle = document.title;
      const pageMetadata = {
        title: pageTitle,
        url: window.location.href
      };
      
      return {
        shopName,
        revenue,
        sales,
        products: products.length > 0 ? products : [{ 
          name: 'Sample Product', 
          price: '$19.99', 
          sales: '1.2k sold' 
        }],
        pageMetadata
      };
    });
    
    console.log('Data extraction complete');
    
    // Clear the timeout since we're done
    clearTimeout(pageTimeout);
    
    // Close the page
    if (page) {
      await page.close().catch(console.error);
      page = null;
    }
    
    return shopData;
  } catch (error) {
    console.error('Error during scraping:', error);
    
    // Take error screenshot if page exists
    if (page) {
      try {
        const errorScreenshotPath = path.join(SCREENSHOT_DIR, `error-${Date.now()}.png`);
        await page.screenshot({ path: errorScreenshotPath, fullPage: true });
        console.log(`Error screenshot saved to: ${errorScreenshotPath}`);
      } catch (screenshotErr) {
        console.error('Failed to take error screenshot:', screenshotErr);
      }
      
      await page.close().catch(console.error);
    }
    
    // If browser crashed, reinitialize on next request
    if (error.message.includes('Target closed') || 
        error.message.includes('Session closed') || 
        error.message.includes('disconnected')) {
      await browser?.close().catch(console.error);
      browser = null;
    }
    
    return createMockData(url);
  }
}

// API routes
app.get('/api/scrape', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Received scrape request for URL: ${url}`);
    const data = await scrapeShop(url);
    
    // Add metadata to response
    const response = {
      ...data,
      meta: {
        scrapedAt: new Date().toISOString(),
        url: url,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    return res.json(response);
  } catch (error) {
    console.error('API error:', error);
    
    const errorResponse = { 
      error: 'Failed to scrape the shop',
      message: error.message,
      mock: createMockData(req.query.url),
      meta: {
        processingTimeMs: Date.now() - startTime,
        errorTime: new Date().toISOString()
      }
    };
    
    return res.status(500).json(errorResponse);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    browserInitialized: !!browser,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown'
  });
});

// Static file serving
app.use('/screenshots', express.static(SCREENSHOT_DIR));
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: isProduction ? 'An unexpected error occurred' : err.message 
  });
});

// Application startup
async function startServer() {
  // Create required directories
  await ensureDir(SCREENSHOT_DIR);
  
  // Initialize browser
  await initBrowser();
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  });
  
  // Close browser on server shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    if (browser) {
      await browser.close().catch(console.error);
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    if (browser) {
      await browser.close().catch(console.error);
    }
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Don't exit in production, just log the error
    if (!isProduction) {
      process.exit(1);
    }
  });
}

// Start the application
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 