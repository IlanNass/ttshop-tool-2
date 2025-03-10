
export interface ShopProduct {
  name: string;
  price: number;
  salesCount: number;
  revenuePerItem: number;
}

export interface Shop {
  name: string;
  totalRevenue: number;
  itemsSold: number;
  products: ShopProduct[];
}

export interface ShopData {
  shops: Shop[];
  lastUpdated: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: 'name' | 'totalRevenue' | 'itemsSold';
  direction: SortDirection;
}

export interface CrawlerStats {
  isRunning: boolean;
  totalDiscovered: number;
  totalProcessed: number;
  queuedUrls: number;
  interval: number;
  batchSize: number;
}

// New types for historical data tracking
export interface RevenueSnapshot {
  shopName: string;
  totalRevenue: number;
  itemsSold: number;
  timestamp: string;
}

export interface TrendData {
  shopName: string;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  revenueData: {
    timestamp: string;
    totalRevenue: number;
  }[];
}

