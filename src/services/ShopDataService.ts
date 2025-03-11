
import { ShopData, Shop } from '@/lib/types';

export class ShopDataService {
  private static instance: ShopDataService;
  private shopData: ShopData = { shops: [], lastUpdated: new Date().toLocaleString() };
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): ShopDataService {
    if (!ShopDataService.instance) {
      ShopDataService.instance = new ShopDataService();
    }
    return ShopDataService.instance;
  }
  
  public getShopData(): ShopData {
    return this.shopData;
  }
  
  public updateShopInCollection(shop: Shop): void {
    // Check if shop already exists in our data
    const existingShopIndex = this.shopData.shops.findIndex(s => s.name === shop.name);
    
    if (existingShopIndex >= 0) {
      // Update existing shop
      this.shopData.shops[existingShopIndex] = shop;
    } else {
      // Add new shop
      this.shopData.shops.push(shop);
    }
  }
  
  public updateTimestamp(): void {
    this.shopData.lastUpdated = new Date().toLocaleString();
  }
  
  public clearData(): void {
    this.shopData = { shops: [], lastUpdated: new Date().toLocaleString() };
  }
}
