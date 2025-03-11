
import { ShopData, Shop, ShopProduct, CrawlerStats } from '@/lib/types';
import { DatabaseService } from './DatabaseService';

// Mock shop URLs to crawl automatically
const TIKTOK_SHOP_URLS = [
  'https://shop.tiktok.com/@shop1',
  'https://shop.tiktok.com/@shop2',
  'https://shop.tiktok.com/@shop3',
  'https://shop.tiktok.com/@shop4',
  'https://shop.tiktok.com/@shop5',
  // In a real implementation, these would be dynamically discovered
];

interface CrawlerOptions {
  interval: number; // in milliseconds
  batchSize: number;
}

export class TikTokCrawlerService {
  private static instance: TikTokCrawlerService;
  private isRunning = false;
  private shopData: ShopData = { shops: [], lastUpdated: new Date().toLocaleString() };
  private options: CrawlerOptions = {
    interval: 30000, // Default to 30 seconds
    batchSize: 2, // Default to 2 shops per batch
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
      // Process existing data to populate shopData
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
    console.log('Starting automated TikTok shop crawler');
    console.log(`Crawling interval: ${this.options.interval}ms, Batch size: ${this.options.batchSize}`);
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
      console.log('No more URLs to process. Adding more mock URLs...');
      // In a real implementation, this would discover new shops from the ones we've crawled
      this.addMoreMockUrls();
      return;
    }
    
    console.log(`Processing batch of ${batchUrls.length} TikTok shops`);
    
    // Process each URL in the batch
    for (const url of batchUrls) {
      await this.crawlShop(url);
      this.processedUrls.add(url);
    }
    
    // Update timestamp
    this.shopData.lastUpdated = new Date().toLocaleString();
    
    // Save data to database
    this.dbService.saveShopsData(this.shopData.shops);
    
    // Notify subscribers
    this.notifyDataUpdated();
  }

  private async crawlShop(url: string): Promise<void> {
    console.log(`Crawling TikTok shop: ${url}`);
    
    try {
      // In a real implementation, this would make an actual request to the TikTok shop
      // For now, we'll generate mock data
      const mockShop = this.generateMockShopData(url);
      
      // Add to our collected data
      const existingShopIndex = this.shopData.shops.findIndex(shop => shop.name === mockShop.name);
      
      if (existingShopIndex >= 0) {
        // Update existing shop data
        this.shopData.shops[existingShopIndex] = mockShop;
      } else {
        // Add new shop
        this.shopData.shops.push(mockShop);
      }
      
      // In a real implementation, we would also extract new shop URLs to crawl
      // this.discoverNewShops(responseData);
      
      console.log(`Successfully processed shop: ${mockShop.name}`);
    } catch (error) {
      console.error(`Error crawling shop ${url}:`, error);
    }
  }

  private notifyDataUpdated(): void {
    for (const callback of this.onDataUpdateCallbacks) {
      callback(this.shopData);
    }
  }

  private addMoreMockUrls(): void {
    // In a real implementation, this would come from the crawling process
    // Generate some random new shop URLs
    const newUrls = Array.from({ length: 5 }, (_, i) => 
      `https://shop.tiktok.com/@newshop${this.discoveredUrls.length + i}`
    );
    
    this.discoveredUrls.push(...newUrls);
    console.log(`Added ${newUrls.length} new shop URLs to the queue`);
  }

  private generateMockShopData(url: string): Shop {
    // Extract shop name from URL
    const shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
    
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
