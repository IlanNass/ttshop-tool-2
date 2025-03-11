
import { Shop, ShopProduct } from '@/lib/types';

export class ShopExtractorService {
  public extractShopDataFromHTML(html: string, url: string): Shop | null {
    try {
      // Extract shop name from URL as fallback
      const shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
      
      // Look for shop data in HTML
      // This is simplified and would need to be adapted based on actual TikTok shop HTML structure
      
      // Try to find product data
      const productMatches = html.match(/<div[^>]*product-item[^>]*>.*?<\/div>/gs);
      const products: ShopProduct[] = [];
      
      let totalRevenue = 0;
      let totalItems = 0;
      
      if (productMatches && productMatches.length > 0) {
        console.log(`Found ${productMatches.length} potential products`);
        
        // Process up to 5 products max
        const maxProducts = Math.min(productMatches.length, 5);
        
        for (let i = 0; i < maxProducts; i++) {
          const productHTML = productMatches[i];
          
          // Try to extract product details (simplified)
          const nameMatch = productHTML.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
          const priceMatch = productHTML.match(/\$(\d+\.\d+|\d+)/);
          
          if (nameMatch && priceMatch) {
            const productName = nameMatch[1].trim();
            const price = parseFloat(priceMatch[1]);
            
            // Generate reasonable sales counts
            const salesCount = Math.floor(100 + Math.random() * 1000);
            const revenuePerItem = price * salesCount;
            
            products.push({
              name: productName,
              price: price,
              salesCount: salesCount,
              revenuePerItem: revenuePerItem
            });
            
            totalRevenue += revenuePerItem;
            totalItems += salesCount;
          }
        }
      }
      
      // If we couldn't extract products, return null to fall back to mock data
      if (products.length === 0) {
        console.log('Could not extract product data, will use mock data');
        return null;
      }
      
      console.log(`Extracted ${products.length} products for shop ${shopName}`);
      
      return {
        name: shopName,
        totalRevenue: totalRevenue,
        itemsSold: totalItems,
        products: products
      };
    } catch (error) {
      console.error('Error parsing HTML:', error);
      return null;
    }
  }
  
  public generateMockShopData(url: string, shopName: string = ''): Shop {
    // Extract shop name from URL if not provided
    if (!shopName) {
      shopName = url.split('@')[1] || `Shop${Math.floor(Math.random() * 1000)}`;
    }
    
    // Generate random metrics
    const totalRevenue = Math.floor(10000 + Math.random() * 1000000);
    const itemsSold = Math.floor(500 + Math.random() * 5000);
    
    // Generate random products
    const productCount = Math.floor(2 + Math.random() * 5);
    const products: ShopProduct[] = Array.from({ length: productCount }, (_, i) => {
      const price = Math.floor(10 + Math.random() * 100);
      const salesCount = Math.floor(50 + Math.random() * 1000);
      const revenuePerItem = price * salesCount;
      
      return {
        name: `Product ${i + 1} from ${shopName}`,
        price,
        salesCount,
        revenuePerItem,
      };
    });
    
    return {
      name: shopName,
      totalRevenue,
      itemsSold,
      products,
    };
  }
}
