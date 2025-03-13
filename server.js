import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Puppeteer scraper setup - only runs on server
let browser = null;

async function initBrowser() {
  try {
    console.log('Initializing Puppeteer browser...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);
    
    // Configuration options
    const options = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--single-process',
      ],
      ...(isProduction && {
        executablePath: '/usr/bin/google-chrome',
        dumpio: true,
      }),
    };
    
    console.log('Launching browser with options:', JSON.stringify(options, null, 2));
    browser = await puppeteer.launch(options);
    console.log('Puppeteer browser initialized successfully');
  } catch (error) {
    console.error('Failed to initialize browser:', error);
  }
}

// Initialize browser when server starts
initBrowser();

// API endpoint for scraping
app.get('/api/scrape', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Ensure browser is initialized
    if (!browser) {
      await initBrowser();
      if (!browser) {
        return res.status(500).json({ error: 'Failed to initialize browser' });
      }
    }
    
    console.log(`Scraping TikTok Shop: ${url}`);
    
    // Create a new page
    const page = await browser.newPage();
    
    try {
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      
      // Navigate to the shop
      console.log(`Navigating to: ${url}`);
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 90000,
      });
      
      if (!response || !response.ok()) {
        const status = response ? response.status() : 'unknown';
        console.error(`Failed to load page, status: ${status}`);
        return res.status(400).json({ error: `Failed to load page, status: ${status}` });
      }
      
      // Extract shop name
      const shopNameMatch = url.match(/@([^/?]+)/);
      if (!shopNameMatch) {
        return res.status(400).json({ error: 'Invalid shop URL format' });
      }
      const shopName = shopNameMatch[1];
      
      // Wait for products to load
      await page.waitForSelector('.product-item, [data-e2e="product-item"]', { timeout: 10000 })
        .catch(() => console.log('Product selector timeout - continuing anyway'));
      
      // Allow extra time for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take a screenshot for debugging
      const screenshotPath = path.join(__dirname, 'public', 'screenshots', `${shopName}-debug.png`);
      await page.screenshot({ path: screenshotPath });
      
      // Extract products data
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-item, [data-e2e="product-item"]');
        
        if (productElements.length === 0) {
          console.log('No product elements found');
          return [];
        }
        
        return Array.from(productElements).map((product, index) => {
          // Extract product details
          const nameElement = product.querySelector('h3, h4, [data-e2e="product-title"]') || 
                             product.querySelector('.product-title');
          const name = nameElement?.textContent?.trim() || `Product ${index + 1}`;
          
          // Extract price
          let price = 0;
          const priceText = product.textContent || '';
          const priceMatch = priceText.match(/\$(\d+\.\d+|\d+)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1]);
          }
          
          // Extract sales count
          let salesCount = 0;
          const salesText = product.textContent || '';
          const salesMatch = salesText.match(/(\d+)\s*sold/i);
          if (salesMatch) {
            salesCount = parseInt(salesMatch[1], 10);
          }
          
          return {
            name,
            price,
            salesCount,
            revenuePerItem: price * salesCount
          };
        });
      });
      
      // Check if products were found
      if (products.length === 0) {
        console.log('No products found on page');
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`Page title: ${pageTitle}`);
        console.log(`Final URL: ${pageUrl}`);
        
        // Check for captcha
        const pageContent = await page.content();
        if (pageContent.includes('captcha') || pageContent.includes('robot') || 
            pageContent.includes('verify') || pageContent.includes('challenge')) {
          console.log('Detected possible CAPTCHA or verification page');
          await page.screenshot({ path: path.join(__dirname, 'public', 'screenshots', 'captcha-debug.png') });
          return res.status(403).json({ error: 'CAPTCHA or verification detected' });
        }
        
        return res.status(404).json({ error: 'No products found on page' });
      }
      
      // Calculate totals
      let totalRevenue = 0;
      let totalItems = 0;
      products.forEach(product => {
        totalRevenue += product.revenuePerItem;
        totalItems += product.salesCount;
      });
      
      // Return shop data
      const shopData = {
        name: shopName,
        totalRevenue,
        itemsSold: totalItems,
        products,
        lastUpdated: new Date().toISOString()
      };
      
      return res.json(shopData);
    } finally {
      // Close the page to free resources
      await page.close();
    }
  } catch (error) {
    console.error('Error in scraper:', error);
    return res.status(500).json({ error: 'Scraping failed: ' + error.message });
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