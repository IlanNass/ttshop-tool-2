
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
