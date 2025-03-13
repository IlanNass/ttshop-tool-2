import { ShopData, Shop, CrawlerStats } from '@/lib/types';
import { DatabaseService } from './DatabaseService';
import { ShopExtractorService } from './ShopExtractorService';
import { ShopDiscoveryService } from './ShopDiscoveryService';
import { ShopDataService } from './ShopDataService';
import { ApiService } from './ApiService';

interface CrawlerOptions {
  interval: number; // in milliseconds
  batchSize: number;
  userAgent: string;
}

export class TikTokCrawlerService {
  private static instance: TikTokCrawlerService;
  private isRunning = false;
  private options: CrawlerOptions = {
    interval: 30000, // Default to 30 seconds
    batchSize: 2, // Default to 2 shops per batch
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', // Mimic Googlebot
  };
  private onDataUpdateCallbacks: ((data: ShopData) => void)[] = [];
  private processedUrls: Set<string> = new Set();
  private dbService: DatabaseService;
  private shopExtractor: ShopExtractorService;
  private shopDiscovery: ShopDiscoveryService;
  private shopDataService: ShopDataService;
  private apiService: ApiService;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
    this.dbService = DatabaseService.getInstance();
    this.shopExtractor = new ShopExtractorService();
    this.shopDiscovery = new ShopDiscoveryService();
    this.shopDataService = ShopDataService.getInstance();
    this.apiService = ApiService.getInstance();
    
    // Initialize with existing data from Database
    const history = this.dbService.getRevenueHistory();
    if (history.length > 0) {
      this.loadExistingData();
    }
  }

  private loadExistingData(): void {
    // Load the latest shop data from the database
    const shops = this.dbService.getLatestShopData();
    if (shops && shops.length > 0) {
      shops.forEach(shop => this.shopDataService.updateShopInCollection(shop));
    }
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
    return this.shopDataService.getShopData();
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
      totalDiscovered: this.shopDiscovery.getDiscoveredUrlsCount(),
      totalProcessed: this.processedUrls.size,
      queuedUrls: this.shopDiscovery.getUnprocessedUrlsCount(this.processedUrls),
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
    const batchUrls = this.shopDiscovery.getNextBatch(this.processedUrls, this.options.batchSize);
    
    if (batchUrls.length === 0) {
      console.log('No more URLs to process. Looking for more TikTok shops...');
      // Try to discover more shop URLs
      await this.shopDiscovery.discoverMoreShops(this.options.userAgent);
      return;
    }
    
    console.log(`Processing batch of ${batchUrls.length} TikTok shops`);
    
    // Process each URL in the batch with delay between requests
    for (const url of batchUrls) {
      try {
        await this.crawlShop(url);
        this.processedUrls.add(url);
        
        // Random delay between requests to avoid detection (3-7 seconds)
        const delay = 3000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        // Still mark as processed to avoid getting stuck
        this.processedUrls.add(url);
      }
    }
    
    // Update timestamp and notify subscribers
    this.shopDataService.updateTimestamp();
    
    // Save data to database
    this.dbService.saveShopsData(this.shopDataService.getShopData().shops);
    
    // Notify subscribers
    this.notifyDataUpdated();
  }

  private async crawlShop(url: string): Promise<void> {
    console.log(`Crawling TikTok shop: ${url}`);
    
    try {
      // Use API service to scrape the shop
      const shopData = await this.apiService.scrapeShop(url);
      
      if (!shopData) {
        throw new Error(`Failed to extract data from ${url}`);
      }
      
      // Update our collected data with the shop
      this.shopDataService.updateShopInCollection(shopData);
      console.log(`Successfully processed shop: ${shopData.name}`);
      
    } catch (error) {
      console.error(`Error crawling shop ${url}:`, error);
      // Add to retry queue if appropriate
      if (this.shouldRetry(url)) {
        this.shopDiscovery.addToRetryQueue(url);
      }
      throw error;
    }
  }

  private notifyDataUpdated(): void {
    const data = this.shopDataService.getShopData();
    
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

  private shouldRetry(url: string): boolean {
    // Implement retry logic based on error type and retry count
    const retryCount = this.shopDiscovery.getRetryCount(url);
    return retryCount < 3; // Allow up to 3 retries
  }
}
