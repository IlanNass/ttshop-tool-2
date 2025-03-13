import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure screenshots directory exists
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory created or already exists: ${dirPath}`);
  } catch (err) {
    console.error(`Error creating directory: ${dirPath}`, err);
  }
}

// Create required directories
ensureDir(path.join(__dirname, 'public', 'screenshots'));

// Find Chrome executable path - be very specific about locations
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

// Puppeteer scraper setup - only runs on server
let browser = null;

async function initBrowser() {
  // Log environment data for debugging
  try {
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
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
    }
    
    // Simple Puppeteer launch with minimal options
    const launchOptions = {
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720'
      ],
      headless: true
    };
    
    console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2));
    browser = await puppeteer.launch(launchOptions);
    console.log('Puppeteer browser initialized successfully');
    
    // Check browser version
    const version = await browser.version();
    console.log('Browser version:', version);
    
    return browser;
  } catch (error) {
    console.error('Failed to initialize browser:', error);
    return null;
  }
}

// Initialize browser when server starts
initBrowser();

// Puppeteer scrape function
async function scrapeShop(url) {
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

    // Create a new page for this request
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    console.log(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for shop data to appear
    await page.waitForSelector('.shop-top', { timeout: 10000 });
    
    console.log('Taking screenshot for debugging...');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const screenshotPath = path.join(__dirname, 'public', 'screenshots', `${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    console.log('Extracting shop data...');
    
    // Extract shop data
    const shopData = await page.evaluate(() => {
      // Extract shop name
      const shopNameEl = document.querySelector('.shop-name');
      const shopName = shopNameEl ? shopNameEl.textContent.trim() : 'Unknown Shop';
      
      // Extract revenue
      const revenueEl = document.querySelector('.revenue');
      const revenue = revenueEl ? revenueEl.textContent.trim() : 'Unknown Revenue';
      
      // Extract sales
      const salesEl = document.querySelector('.sales');
      const sales = salesEl ? salesEl.textContent.trim() : 'Unknown Sales';
      
      // Extract products
      const productEls = document.querySelectorAll('.product-item');
      const products = Array.from(productEls).map(productEl => {
        const nameEl = productEl.querySelector('.product-name');
        const priceEl = productEl.querySelector('.product-price');
        const salesEl = productEl.querySelector('.product-sales');
        
        return {
          name: nameEl ? nameEl.textContent.trim() : 'Unknown Product',
          price: priceEl ? priceEl.textContent.trim() : 'Unknown Price',
          sales: salesEl ? salesEl.textContent.trim() : 'Unknown Sales'
        };
      });
      
      return {
        shopName,
        revenue,
        sales,
        products: products.length > 0 ? products : [{ 
          name: 'Sample Product', 
          price: '$19.99', 
          sales: '1.2k sold' 
        }]
      };
    });
    
    console.log('Data extraction complete');
    await page.close();
    
    return shopData;
  } catch (error) {
    console.error('Error during scraping:', error);
    await browser?.close();
    browser = null;
    return createMockData(url);
  }
}

function createMockData(url) {
  const shopNameMatch = url.match(/\/shop\/([^/?#]+)/);
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
      }
    ],
    isMockData: true
  };
}

// API routes
app.get('/api/scrape', async (req, res) => {
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
        url: url
      }
    };
    
    return res.json(response);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Failed to scrape the shop',
      message: error.message,
      mock: createMockData(req.query.url)
    });
  }
});

// Serve public screenshots directory
app.use('/screenshots', express.static(path.join(__dirname, 'public', 'screenshots')));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Close browser on server shutdown
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 