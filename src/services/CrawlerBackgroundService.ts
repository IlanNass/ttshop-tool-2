
import { CrawlerStorage } from './CrawlerStorage';
import { TikTokCrawlerService } from './TikTokCrawlerService';
import { CrawlerChannelService } from './CrawlerChannelService';
import { CrawlerSchedulerService } from './CrawlerSchedulerService';

// Service for handling background crawler operations
export class CrawlerBackgroundService {
  private static instance: CrawlerBackgroundService;
  private channelService: CrawlerChannelService;
  private schedulerService: CrawlerSchedulerService;
  private crawlerService: TikTokCrawlerService;
  
  private constructor() {
    // Initialize services
    this.channelService = CrawlerChannelService.getInstance();
    this.schedulerService = CrawlerSchedulerService.getInstance();
    this.crawlerService = TikTokCrawlerService.getInstance();
    
    // Setup channel communication
    this.channelService.setIsRunningCallback(() => this.isRunning());
    this.channelService.onCommand(this.handleCommand.bind(this));
    
    // Initialize from storage
    this.initFromStorage();
  }

  private initFromStorage(): void {
    const state = CrawlerStorage.getState();
    if (state.isRunning) {
      console.log('Restoring crawler from saved state');
      this.startCrawling(state.options);
    }
  }
  
  private handleCommand(command: string, options?: any): void {
    if (command === 'START') {
      this.startCrawling(options);
    } else if (command === 'STOP') {
      this.stopCrawling();
    }
  }

  public static getInstance(): CrawlerBackgroundService {
    if (!CrawlerBackgroundService.instance) {
      CrawlerBackgroundService.instance = new CrawlerBackgroundService();
    }
    return CrawlerBackgroundService.instance;
  }

  public startCrawling(options?: { interval: number; batchSize: number; userAgent?: string }): void {
    // Update crawler service options
    if (options) {
      this.crawlerService.updateOptions(options);
    }
    
    // Start crawler service
    this.crawlerService.startCrawling(options);
    
    // Start scheduler
    this.schedulerService.startCrawling(options);
    
    // Notify other tabs
    this.channelService.notifyStateChange(true);
  }

  public stopCrawling(): void {
    // Stop crawler service
    this.crawlerService.stopCrawling();
    
    // Stop scheduler
    this.schedulerService.stopCrawling();
    
    // Notify other tabs
    this.channelService.notifyStateChange(false);
  }

  public isRunning(): boolean {
    return this.schedulerService.isRunning();
  }
  
  public pingOtherTabs(): Promise<boolean> {
    return this.channelService.pingOtherTabs();
  }
  
  public performCrawl(): void {
    this.schedulerService.performCrawl();
  }
}
