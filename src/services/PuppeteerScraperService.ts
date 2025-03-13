import puppeteer, { Browser, Page } from 'puppeteer';
import { Shop, ShopProduct } from '@/lib/types';

export class PuppeteerScraperService {
  private browser: Browser | null = null;
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  ];

  constructor() {
    // Initialize will be called when needed
  }

  /**
   * Initialize the browser if not already initialized
   */
  private async initialize(): Promise<void> {
    if (!this.browser) {
      console.log('Initializing Puppeteer browser...');
      
      // Use environment-specific configuration
      const isProduction = process.env.NODE_ENV === 'production';
      
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
        ],
        // In production environments like Render, we need to specify Chrome path
        ...(isProduction && {
          executablePath: '/usr/bin/google-chrome',
        }),
      };
      
      this.browser = await puppeteer.launch(options);
      console.log('Puppeteer browser initialized successfully');
    }
  }

  /**
   * Close browser and cleanup resources
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Puppeteer browser closed');
    }
  }

  /**
   * Get a random user agent from the list
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Create a new page with a random user agent
   */
  private async createPage(): Promise<Page> {
    await this.initialize();
    if (!this.browser) {
      throw new Error('Browser initialization failed');
    }

    const page = await this.browser.newPage();
    
    // Set random user agent
    const userAgent = this.getRandomUserAgent();
    await page.setUserAgent(userAgent);
    
    // Set viewport size to mimic desktop
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set reasonable timeout for navigation
    page.setDefaultNavigationTimeout(60000);
    
    return page;
  }

  /**
   * Scrape a TikTok shop page using puppeteer
   */
  public async scrapeShop(url: string): Promise<Shop | null> {
    let page: Page | null = null;
    
    try {
      console.log(`Starting Puppeteer scrape for: ${url}`);
      page = await this.createPage();

      // Navigate to the shop URL
      console.log(`Navigating to: ${url}`);
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',  // Wait until network is idle (no requests for 500ms)
      });

      if (!response || !response.ok()) {
        const status = response ? response.status() : 'unknown';
        throw new Error(`Failed to load page, status: ${status}`);
      }

      // Extract shop name from URL
      const shopNameMatch = url.match(/@([^/?]+)/);
      if (!shopNameMatch) {
        throw new Error('Invalid shop URL format');
      }
      const shopName = shopNameMatch[1];

      // Wait for product items to load
      console.log('Waiting for product items to load...');
      await page.waitForSelector('.product-item, [data-e2e="product-item"]', { timeout: 10000 })
        .catch(() => console.log('Product selector timeout - continuing anyway'));

      // Allow extra time for all content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshot for debugging
      await page.screenshot({ path: `${shopName}-debug.png` });
      console.log(`Took screenshot: ${shopName}-debug.png`);
      
      // Extract products data
      console.log('Extracting product data...');
      const products: ShopProduct[] = await page.evaluate(() => {
        // Function that runs in browser context
        const productElements = document.querySelectorAll('.product-item, [data-e2e="product-item"]');
        console.log(`Found ${productElements.length} product elements`);
        
        if (productElements.length === 0) {
          // Try alternative selectors if the primary ones don't work
          const allElements = Array.from(document.querySelectorAll('*'));
          console.log('DOM structure:', document.documentElement.innerHTML.substring(0, 1000));
          
          // Look for possible price elements to debug
          const possiblePriceElements = allElements.filter(el => 
            el.textContent && /\$\d+\.\d+/.test(el.textContent)
          );
          console.log('Possible price elements:', possiblePriceElements.length);
        }
        
        return Array.from(productElements).map((product, index) => {
          // Extract product name
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
          
          // Calculate revenue
          const revenuePerItem = price * salesCount;
          
          return {
            name,
            price,
            salesCount,
            revenuePerItem
          };
        });
      });
      
      console.log(`Extracted ${products.length} products`);

      // If no products were found, try to get some debug info
      if (products.length === 0) {
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`Page title: ${pageTitle}`);
        console.log(`Final URL: ${pageUrl}`);
        
        // Check if we hit a captcha or error page
        const pageContent = await page.content();
        if (pageContent.includes('captcha') || pageContent.includes('robot') || 
            pageContent.includes('verify') || pageContent.includes('challenge')) {
          console.log('Detected possible CAPTCHA or verification page');
          // Save the page HTML for debugging
          await page.screenshot({ path: 'captcha-debug.png' });
        }
        
        throw new Error('No products found on page');
      }

      // Calculate totals
      let totalRevenue = 0;
      let totalItems = 0;
      
      products.forEach(product => {
        totalRevenue += product.revenuePerItem;
        totalItems += product.salesCount;
      });

      return {
        name: shopName,
        totalRevenue,
        itemsSold: totalItems,
        products
      };
    } catch (error) {
      console.error('Error in Puppeteer scraping:', error);
      return null;
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close();
      }
    }
  }
} 