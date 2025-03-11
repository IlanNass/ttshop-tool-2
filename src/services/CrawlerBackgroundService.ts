
import { CrawlerStorage } from './CrawlerStorage';
import { TikTokCrawlerService } from './TikTokCrawlerService';
import { DatabaseService } from './DatabaseService';

// Service for handling background crawler operations
export class CrawlerBackgroundService {
  private static instance: CrawlerBackgroundService;
  private intervalId: number | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
    this.initBroadcastChannel();
    this.initFromStorage();
    
    // Listen for unload to save state
    window.addEventListener('beforeunload', () => {
      if (this.intervalId !== null) {
        const state = CrawlerStorage.getState();
        CrawlerStorage.updateRunningState(true);
      }
    });
    
    // Listen for visibility change to handle tab focus/blur
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private initBroadcastChannel(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('tiktok_crawler_channel');
      this.broadcastChannel.onmessage = (event) => this.handleChannelMessage(event);
    } catch (error) {
      console.error('BroadcastChannel not supported', error);
    }
  }
  
  private handleChannelMessage(event: MessageEvent): void {
    if (event.data.type === 'CRAWLER_PING') {
      this.broadcastChannel?.postMessage({
        type: 'CRAWLER_PONG',
        data: { running: this.intervalId !== null }
      });
    } else if (event.data.type === 'CRAWLER_COMMAND') {
      if (event.data.command === 'START') {
        this.startCrawling(event.data.options);
      } else if (event.data.command === 'STOP') {
        this.stopCrawling();
      }
    }
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

  private initFromStorage(): void {
    const state = CrawlerStorage.getState();
    if (state.isRunning) {
      console.log('Restoring crawler from saved state');
      this.startCrawling(state.options);
    }
  }

  public static getInstance(): CrawlerBackgroundService {
    if (!CrawlerBackgroundService.instance) {
      CrawlerBackgroundService.instance = new CrawlerBackgroundService();
    }
    return CrawlerBackgroundService.instance;
  }

  public startCrawling(options?: { interval: number; batchSize: number; userAgent?: string }): void {
    if (this.intervalId !== null) {
      this.stopCrawling();
    }
    
    const crawlerService = TikTokCrawlerService.getInstance();
    
    // First immediate crawl
    this.performCrawl(crawlerService);
    
    // Then set up interval
    const interval = options?.interval || 30000;
    this.intervalId = window.setInterval(() => {
      this.performCrawl(crawlerService);
    }, interval);
    
    // Save state
    CrawlerStorage.updateRunningState(true);
    if (options) {
      CrawlerStorage.updateOptions(options);
    }
    
    // Notify other tabs
    this.broadcastChannel?.postMessage({
      type: 'CRAWLER_STATE_CHANGED',
      data: { running: true }
    });
    
    console.log(`Crawler started with interval ${interval}ms`);
  }
  
  private performCrawl(crawlerService: TikTokCrawlerService): void {
    crawlerService.processBatch().then(() => {
      // After processing, dispatch event to notify components
      const event = new CustomEvent('crawler-data-updated', { 
        detail: crawlerService.getCollectedData() 
      });
      window.dispatchEvent(event);
    });
  }

  public stopCrawling(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      
      // Save state
      CrawlerStorage.updateRunningState(false);
      
      // Notify other tabs
      this.broadcastChannel?.postMessage({
        type: 'CRAWLER_STATE_CHANGED',
        data: { running: false }
      });
      
      console.log('Crawler stopped');
    }
  }

  public isRunning(): boolean {
    return this.intervalId !== null;
  }
  
  public pingOtherTabs(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.broadcastChannel) {
        resolve(false);
        return;
      }
      
      const responseTimeout = setTimeout(() => resolve(false), 1000);
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'CRAWLER_PONG') {
          clearTimeout(responseTimeout);
          this.broadcastChannel?.removeEventListener('message', messageHandler);
          resolve(event.data.data.running);
        }
      };
      
      this.broadcastChannel.addEventListener('message', messageHandler);
      this.broadcastChannel.postMessage({ type: 'CRAWLER_PING' });
    });
  }
}
