
// Service for storing crawler state across sessions

interface CrawlerState {
  isRunning: boolean;
  options: {
    interval: number;
    batchSize: number;
  };
  lastRuntime: string;
}

const DEFAULT_STATE: CrawlerState = {
  isRunning: false,
  options: {
    interval: 30000,
    batchSize: 2,
  },
  lastRuntime: new Date().toISOString(),
};

export class CrawlerStorage {
  private static readonly STORAGE_KEY = 'tiktok_crawler_state';

  static saveState(state: CrawlerState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    
    // Also dispatch an event to let other tabs know the state changed
    const event = new CustomEvent('crawler-state-changed', { detail: state });
    window.dispatchEvent(event);
  }

  static getState(): CrawlerState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATE;
    } catch (error) {
      console.error('Failed to parse crawler state', error);
      return DEFAULT_STATE;
    }
  }

  static updateRunningState(isRunning: boolean): void {
    const currentState = this.getState();
    this.saveState({
      ...currentState,
      isRunning,
      lastRuntime: new Date().toISOString(),
    });
  }

  static updateOptions(options: Partial<CrawlerState['options']>): void {
    const currentState = this.getState();
    this.saveState({
      ...currentState,
      options: {
        ...currentState.options,
        ...options,
      },
    });
  }
}
