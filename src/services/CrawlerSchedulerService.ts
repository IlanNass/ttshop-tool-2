
// Service for scheduling and timing crawler operations

import { CrawlerStorage } from './CrawlerStorage';
import { TikTokCrawlerService } from './TikTokCrawlerService';

export class CrawlerSchedulerService {
  private static instance: CrawlerSchedulerService;
  private intervalId: number | null = null;
  private crawlerService: TikTokCrawlerService;
  
  private constructor() {
    this.crawlerService = TikTokCrawlerService.getInstance();
    
    // Listen for visibility change to handle tab focus/blur
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for unload to save state
    window.addEventListener('beforeunload', () => {
      if (this.intervalId !== null) {
        CrawlerStorage.updateRunningState(true);
      }
    });
  }
  
  public static getInstance(): CrawlerSchedulerService {
    if (!CrawlerSchedulerService.instance) {
      CrawlerSchedulerService.instance = new CrawlerSchedulerService();
    }
    return CrawlerSchedulerService.instance;
  }
  
  private handleVisibilityChange(): void {
    // When tab becomes visible, check if we should be running
    if (document.visibilityState === 'visible') {
      const state = CrawlerStorage.getState();
      if (state.isRunning && this.intervalId === null) {
        this.startCrawling(state.options);
      }
    }
  }
  
  public startCrawling(options?: { interval: number; batchSize: number; userAgent?: string }): void {
    if (this.intervalId !== null) {
      this.stopCrawling();
    }
    
    // First immediate crawl
    this.performCrawl();
    
    // Then set up interval
    const interval = options?.interval || 30000;
    this.intervalId = window.setInterval(() => {
      this.performCrawl();
    }, interval);
    
    // Save state
    CrawlerStorage.updateRunningState(true);
    if (options) {
      CrawlerStorage.updateOptions(options);
    }
    
    console.log(`Crawler started with interval ${interval}ms`);
  }
  
  public stopCrawling(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      
      // Save state
      CrawlerStorage.updateRunningState(false);
      
      console.log('Crawler stopped');
    }
  }
  
  public performCrawl(): void {
    this.crawlerService.processBatch().then(() => {
      // After processing, dispatch event to notify components
      const event = new CustomEvent('crawler-data-updated', { 
        detail: this.crawlerService.getCollectedData() 
      });
      window.dispatchEvent(event);
    });
  }
  
  public isRunning(): boolean {
    return this.intervalId !== null;
  }
}
