
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

// Shop history data for visualizations
export interface ShopHistoryData {
  shopName: string;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  revenueData: {
    date: string;
    revenue: number;
  }[];
}

// Authentication types
export interface User {
  username: string;
  isAuthenticated: boolean;
}

export interface Credentials {
  username: string;
  password: string;
}
