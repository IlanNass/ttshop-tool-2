import { Shop, ShopData } from '@/lib/types';

export class ApiService {
  private static instance: ApiService;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  /**
   * Scrape a shop via the server API
   */
  public async scrapeShop(url: string): Promise<Shop | null> {
    try {
      console.log(`Requesting scrape for: ${url}`);
      
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraping failed: ${response.status} - ${errorText}`);
      }
      
      const shopData = await response.json();
      console.log('Successfully scraped shop data:', shopData);
      
      return shopData;
    } catch (error) {
      console.error('Error in API scrape:', error);
      return null;
    }
  }
} 