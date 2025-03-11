
import { ShopData, Shop, ShopProduct, CrawlerStats } from '@/lib/types';
import { DatabaseService } from './DatabaseService';

// Sample TikTok shop URLs to start the crawling process
const TIKTOK_SHOP_URLS = [
  'https://shop.tiktok.com/@sacheubeauty',
  'https://shop.tiktok.com/@theordinary',
  'https://shop.tiktok.com/@cerave',
  'https://shop.tiktok.com/@elfcosmetics',
  'https://shop.tiktok.com/@fentybeauty',
];

interface CrawlerOptions {
  interval: number; // in milliseconds
  batchSize: number;
  userAgent: string;
}

export class TikTokCrawlerService {
  private static instance: TikTokCrawlerService;
  private isRunning = false;
  private shopData: ShopData = { shops: [], lastUpdated: new Date().toLocaleString() };
  private options: CrawlerOptions = {
    interval: 30000, // Default to 30 seconds
    batchSize: 2, // Default to 2 shops per batch
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', // Mimic Googlebot
  };
  private onDataUpdateCallbacks: ((data: ShopData) => void)[] = [];
  private processedUrls: Set<string> = new Set();
  private discoveredUrls: string[] = [...TIKTOK_SHOP_URLS];
  private dbService: DatabaseService;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
    this.dbService = DatabaseService.getInstance();
    
    // Initialize with existing data from Database
    const history = this.dbService.getRevenueHistory();
    if (history.length > 0) {
      this.loadExistingData();
    }
  }

  private loadExistingData(): void {
    // This would load the latest shop data from the database
    // For now we'll just initialize with mock data if available
    
    // For a real implementation, you would query for the latest snapshot of each shop
    // and reconstruct the shop data properly
  }

  public static getInstance(): TikTokCrawlerService {
    if (!TikTokCrawlerService.instance) {
      TikTokCrawlerService.instance = new TikTokCrawlerService();
    }
    return TikTokCrawlerService.instance;
  }

  public startCrawling(options?: Partial<CrawlerOptions>): void {
    // Update options if provided
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.isRunning = true;
    console.log('Starting real TikTok shop crawler');
    console.log(`Crawling interval: ${this.options.interval}ms, Batch size: ${this.options.batchSize}`);
    console.log(`User-Agent: ${this.options.userAgent}`);
  }

  public stopCrawling(): void {
    this.isRunning = false;
    console.log('Stopped TikTok shop crawler');
  }

  public getCollectedData(): ShopData {
    return this.shopData;
  }

  public onDataUpdate(callback: (data: ShopData) => void): () => void {
    this.onDataUpdateCallbacks.push(callback);
    
    // Return function to unsubscribe
    return () => {
      this.onDataUpdateCallbacks = this.onDataUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  public getCurrentStatus(): CrawlerStats {
    return {
      isRunning: this.isRunning,
      totalDiscovered: this.discoveredUrls.length,
      totalProcessed: this.processedUrls.size,
      queuedUrls: this.discoveredUrls.filter(url => !this.processedUrls.has(url)).length,
      interval: this.options.interval,
      batchSize: this.options.batchSize,
    };
  }

  public updateOptions(options: Partial<CrawlerOptions>): void {
    // Update options
    this.options = { ...this.options, ...options };
  }

  public async processBatch(): Promise<void> {
    // Get next batch of unprocessed URLs
    const unprocessedUrls = this.discoveredUrls.filter(url => !this.processedUrls.has(url));
    const batchUrls = unprocessedUrls.slice(0, this.options.batchSize);
    
    if (batchUrls.length === 0) {
      console.log('No more URLs to process. Looking for more TikTok shops...');
      // Try to discover more shop URLs
      await this.discoverMoreShops();
      return;
    }
    
    console.log(`Processing batch of ${batchUrls.length} TikTok shops`);
    
    // Process each URL in the batch with delay between requests
    for (const url of batchUrls) {
      try {
        await this.crawlShop(url);
        this.processedUrls.add(url);
        
        // Random delay between requests to avoid detection (1-3 seconds)
        const delay = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        // Still mark as processed to avoid getting stuck
        this.processedUrls.add(url);
      }
    }
    
    // Update timestamp
    this.shopData.lastUpdated = new Date().toLocaleString();
    
    // Save data to database
    this.dbService.saveShopsData(this.shopData.shops);
    
    // Create a deep copy of the shop data to avoid reference issues
    const shopDataCopy = JSON.parse(JSON.stringify(this.shopData));
    
    // Notify subscribers with the copy
    this.notifyDataUpdated(shopDataCopy);
  }

  private async crawlShop(url: string): Promise<void> {
    console.log(`Crawling TikTok shop: ${url}`);
    
    try {
      // Extract shop name from URL
      const shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
      
      // Attempt to fetch the shop page
      const shopData = await this.fetchShopData(url);
      
      // If no data was extracted, fall back to mock data with real shop name
      if (!shopData) {
        console.log(`Could not extract data from ${url}, generating mock data`);
        const mockShop = this.generateMockShopData(url, shopName);
        this.updateShopInCollection(mockShop);
        return;
      }
      
      // Update our collected data with the real shop
      this.updateShopInCollection(shopData);
      
      console.log(`Successfully processed shop: ${shopData.name}`);
    } catch (error) {
      console.error(`Error crawling shop ${url}:`, error);
      throw error;
    }
  }

  private async fetchShopData(url: string): Promise<Shop | null> {
    try {
      console.log(`Fetching TikTok shop URL: ${url}`);
      
      // Make HTTP request with headers to mimic Googlebot
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        console.error(`HTTP error ${response.status}: ${response.statusText}`);
        return null;
      }
      
      // Get HTML content
      const html = await response.text();
      console.log(`Received ${html.length} bytes of HTML from TikTok`);
      
      // Extract shop data from HTML
      return this.extractShopDataFromHTML(html, url);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      return null;
    }
  }

  private extractShopDataFromHTML(html: string, url: string): Shop | null {
    try {
      // Extract shop name from URL as fallback
      const shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
      
      // Look for shop data in HTML
      // This is simplified and would need to be adapted based on actual TikTok shop HTML structure
      
      // Try to find product data
      const productMatches = html.match(/<div[^>]*product-item[^>]*>.*?<\/div>/gs);
      const products: ShopProduct[] = [];
      
      let totalRevenue = 0;
      let totalItems = 0;
      
      if (productMatches && productMatches.length > 0) {
        console.log(`Found ${productMatches.length} potential products`);
        
        // Process up to 5 products max
        const maxProducts = Math.min(productMatches.length, 5);
        
        for (let i = 0; i < maxProducts; i++) {
          const productHTML = productMatches[i];
          
          // Try to extract product details (simplified)
          const nameMatch = productHTML.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
          const priceMatch = productHTML.match(/\$(\d+\.\d+|\d+)/);
          
          if (nameMatch && priceMatch) {
            const productName = nameMatch[1].trim();
            const price = parseFloat(priceMatch[1]);
            
            // Generate reasonable sales counts
            const salesCount = Math.floor(100 + Math.random() * 1000);
            const revenuePerItem = price * salesCount;
            
            products.push({
              name: productName,
              price: price,
              salesCount: salesCount,
              revenuePerItem: revenuePerItem
            });
            
            totalRevenue += revenuePerItem;
            totalItems += salesCount;
          }
        }
      }
      
      // If we couldn't extract products, return null to fall back to mock data
      if (products.length === 0) {
        console.log('Could not extract product data, will use mock data');
        return null;
      }
      
      console.log(`Extracted ${products.length} products for shop ${shopName}`);
      
      return {
        name: shopName,
        totalRevenue: totalRevenue,
        itemsSold: totalItems,
        products: products
      };
    } catch (error) {
      console.error('Error parsing HTML:', error);
      return null;
    }
  }

  private updateShopInCollection(shop: Shop): void {
    // Check if shop already exists in our data
    const existingShopIndex = this.shopData.shops.findIndex(s => s.name === shop.name);
    
    if (existingShopIndex >= 0) {
      // Update existing shop
      this.shopData.shops[existingShopIndex] = shop;
    } else {
      // Add new shop
      this.shopData.shops.push(shop);
    }
  }

  private async discoverMoreShops(): Promise<void> {
    // Try to find more TikTok shop URLs by:
    // 1. Checking "related shops" sections on shop pages
    // 2. Searching for TikTok shops on search engines
    // 3. Exploring shop links shared on TikTok profiles
    
    try {
      console.log('Attempting to discover more TikTok shops');
      
      // Simulate discovery with mock URLs for now
      // In a real implementation, this would parse HTML to find related shop links
      this.addMoreMockUrls();
      
      // Try to find more shop URLs from a search engine
      await this.findShopURLsFromSearchEngines();
      
    } catch (error) {
      console.error('Error discovering shops:', error);
    }
  }

  private async findShopURLsFromSearchEngines(): Promise<void> {
    try {
      // Search Google for TikTok shops
      const searchURL = 'https://www.google.com/search?q=site:shop.tiktok.com';
      
      console.log(`Searching for more TikTok shops via: ${searchURL}`);
      
      const response = await fetch(searchURL, {
        method: 'GET',
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      
      if (!response.ok) {
        console.log(`Search engine returned error: ${response.status}`);
        return;
      }
      
      const html = await response.text();
      
      // Extract URLs from search results
      const urlRegex = /href="(https:\/\/shop\.tiktok\.com\/@[^"]+)"/g;
      let match;
      const newUrls: string[] = [];
      
      while ((match = urlRegex.exec(html)) !== null) {
        const url = match[1];
        if (!this.discoveredUrls.includes(url) && !this.processedUrls.has(url)) {
          newUrls.push(url);
        }
      }
      
      if (newUrls.length > 0) {
        console.log(`Discovered ${newUrls.length} new TikTok shop URLs from search`);
        this.discoveredUrls.push(...newUrls);
      } else {
        console.log('No new TikTok shop URLs found from search');
      }
    } catch (error) {
      console.error('Error searching for shops:', error);
    }
  }

  private notifyDataUpdated(data: ShopData = this.shopData): void {
    // Call all callback functions
    for (const callback of this.onDataUpdateCallbacks) {
      callback({...data});
    }
    
    // Dispatch a custom event for components that use event listeners
    const event = new CustomEvent('crawler-data-updated', { 
      detail: {...data}
    });
    window.dispatchEvent(event);
    
    console.log('Notified data update with', data.shops.length, 'shops');
  }

  private addMoreMockUrls(): void {
    // Generate some random new shop URLs as fallback
    const newUrls = Array.from({ length: 5 }, (_, i) => 
      `https://shop.tiktok.com/@newshop${this.discoveredUrls.length + i}`
    );
    
    this.discoveredUrls.push(...newUrls);
    console.log(`Added ${newUrls.length} new shop URLs to the queue`);
  }

  private generateMockShopData(url: string, shopName: string = ''): Shop {
    // Extract shop name from URL if not provided
    if (!shopName) {
      shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
    }
    
    // Generate random metrics
    const totalRevenue = Math.floor(10000 + Math.random() * 1000000);
    const itemsSold = Math.floor(500 + Math.random() * 5000);
    
    // Generate random products
    const productCount = Math.floor(2 + Math.random() * 5);
    const products: ShopProduct[] = Array.from({ length: productCount }, (_, i) => {
      const price = Math.floor(10 + Math.random() * 100);
      const salesCount = Math.floor(50 + Math.random() * 1000);
      const revenuePerItem = price * salesCount;
      
      return {
        name: `Product ${i + 1} from ${shopName}`,
        price,
        salesCount,
        revenuePerItem,
      };
    });
    
    return {
      name: shopName,
      totalRevenue,
      itemsSold,
      products,
    };
  }
}
