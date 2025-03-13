import { Shop, ShopProduct } from '@/lib/types';

export class ShopExtractorService {
  public extractShopDataFromHTML(html: string, url: string): Shop | null {
    try {
      // Extract shop name from URL
      const shopNameMatch = url.match(/@([^/?]+)/);
      if (!shopNameMatch) {
        throw new Error('Invalid shop URL format');
      }
      const shopName = shopNameMatch[1];
      
      // Extract product data from HTML
      const productMatches = html.match(/<div[^>]*product-item[^>]*>.*?<\/div>/gs);
      if (!productMatches) {
        throw new Error('No product data found in HTML');
      }

      console.log(`Found ${productMatches.length} potential products`);
      
      const products: ShopProduct[] = [];
      let totalRevenue = 0;
      let totalItems = 0;
      
      // Process products (limit to 5 for performance)
      const maxProducts = Math.min(productMatches.length, 5);
      
      for (let i = 0; i < maxProducts; i++) {
        const productHTML = productMatches[i];
        
        // Extract product details
        const nameMatch = productHTML.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
        const priceMatch = productHTML.match(/\$(\d+\.\d+|\d+)/);
        const salesMatch = productHTML.match(/(\d+)\s*sold/i);
        
        if (!nameMatch || !priceMatch || !salesMatch) {
          console.warn(`Skipping product ${i + 1} due to missing data`);
          continue;
        }
        
        const productName = nameMatch[1].trim();
        const price = parseFloat(priceMatch[1]);
        const salesCount = parseInt(salesMatch[1], 10);
        const revenuePerItem = price * salesCount;
        
        products.push({
          name: productName,
          price,
          salesCount,
          revenuePerItem
        });
        
        totalRevenue += revenuePerItem;
        totalItems += salesCount;
      }
      
      if (products.length === 0) {
        throw new Error('Failed to extract any valid product data');
      }
      
      console.log(`Successfully extracted ${products.length} products for shop ${shopName}`);
      
      return {
        name: shopName,
        totalRevenue,
        itemsSold: totalItems,
        products
      };
    } catch (error) {
      console.error('Error extracting shop data:', error);
      return null;
    }
  }
}
