
// Service for handling broadcast channel communication between tabs

export class CrawlerChannelService {
  private static instance: CrawlerChannelService;
  private broadcastChannel: BroadcastChannel | null = null;
  private commandListeners: ((command: string, options?: any) => void)[] = [];
  private stateChangeListeners: ((isRunning: boolean) => void)[] = [];
  
  private constructor() {
    this.initBroadcastChannel();
  }
  
  public static getInstance(): CrawlerChannelService {
    if (!CrawlerChannelService.instance) {
      CrawlerChannelService.instance = new CrawlerChannelService();
    }
    return CrawlerChannelService.instance;
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
        data: { running: this.isRunningCallback ? this.isRunningCallback() : false }
      });
    } else if (event.data.type === 'CRAWLER_COMMAND') {
      this.commandListeners.forEach(listener => {
        listener(event.data.command, event.data.options);
      });
    } else if (event.data.type === 'CRAWLER_STATE_CHANGED') {
      this.stateChangeListeners.forEach(listener => {
        listener(event.data.data.running);
      });
    }
  }
  
  private isRunningCallback: (() => boolean) | null = null;
  
  public setIsRunningCallback(callback: () => boolean): void {
    this.isRunningCallback = callback;
  }
  
  public onCommand(listener: (command: string, options?: any) => void): () => void {
    this.commandListeners.push(listener);
    return () => {
      this.commandListeners = this.commandListeners.filter(l => l !== listener);
    };
  }
  
  public onStateChange(listener: (isRunning: boolean) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
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
  
  public sendCommand(command: string, options?: any): void {
    this.broadcastChannel?.postMessage({
      type: 'CRAWLER_COMMAND',
      command,
      options
    });
  }
  
  public notifyStateChange(isRunning: boolean): void {
    this.broadcastChannel?.postMessage({
      type: 'CRAWLER_STATE_CHANGED',
      data: { running: isRunning }
    });
  }
}
