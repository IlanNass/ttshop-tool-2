
import { Shop, RevenueSnapshot, TrendData } from '@/lib/types';

// Simulating a database with localStorage
export class DatabaseService {
  private static instance: DatabaseService;
  private readonly SHOPS_DATA_KEY = 'tiktok_shops_data';
  private readonly REVENUE_HISTORY_KEY = 'tiktok_revenue_history';
  
  private constructor() {
    // Initialize storage if needed
    if (!localStorage.getItem(this.REVENUE_HISTORY_KEY)) {
      localStorage.setItem(this.REVENUE_HISTORY_KEY, JSON.stringify([]));
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public saveShopSnapshot(shop: Shop): void {
    const snapshot: RevenueSnapshot = {
      shopName: shop.name,
      totalRevenue: shop.totalRevenue,
      itemsSold: shop.itemsSold,
      timestamp: new Date().toISOString(),
    };

    const history = this.getRevenueHistory();
    history.push(snapshot);
    localStorage.setItem(this.REVENUE_HISTORY_KEY, JSON.stringify(history));
  }

  public saveShopsData(shops: Shop[]): void {
    // Save the current snapshot of each shop
    shops.forEach(shop => this.saveShopSnapshot(shop));
  }

  public getRevenueHistory(): RevenueSnapshot[] {
    try {
      const data = localStorage.getItem(this.REVENUE_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving revenue history:', error);
      return [];
    }
  }

  public getShopTrends(days: number = 30): TrendData[] {
    const history = this.getRevenueHistory();
    const shopMap = new Map<string, RevenueSnapshot[]>();
    
    // Group snapshots by shop
    history.forEach(snapshot => {
      if (!shopMap.has(snapshot.shopName)) {
        shopMap.set(snapshot.shopName, []);
      }
      shopMap.get(snapshot.shopName)?.push(snapshot);
    });

    const trends: TrendData[] = [];
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));

    // Calculate trend for each shop
    shopMap.forEach((snapshots, shopName) => {
      // Sort snapshots by timestamp
      snapshots.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Filter snapshots within the specified time range
      const recentSnapshots = snapshots.filter(s => 
        new Date(s.timestamp) >= cutoffDate
      );
      
      if (recentSnapshots.length >= 2) {
        const oldestRevenue = recentSnapshots[0].totalRevenue;
        const latestRevenue = recentSnapshots[recentSnapshots.length - 1].totalRevenue;
        const percentChange = oldestRevenue > 0 
          ? ((latestRevenue - oldestRevenue) / oldestRevenue) * 100 
          : 0;
        
        const trend: 'up' | 'down' | 'stable' = 
          percentChange > 5 ? 'up' : 
          percentChange < -5 ? 'down' : 'stable';
        
        trends.push({
          shopName,
          trend,
          percentChange,
          revenueData: recentSnapshots.map(s => ({
            timestamp: s.timestamp,
            totalRevenue: s.totalRevenue,
          })),
        });
      }
    });
    
    // Sort by absolute percent change (largest changes first)
    return trends.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  }

  public clearHistory(): void {
    localStorage.setItem(this.REVENUE_HISTORY_KEY, JSON.stringify([]));
  }
}
