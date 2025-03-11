
// Sample TikTok shop URLs to start the crawling process
const TIKTOK_SHOP_URLS = [
  'https://shop.tiktok.com/@sacheubeauty',
  'https://shop.tiktok.com/@theordinary',
  'https://shop.tiktok.com/@cerave',
  'https://shop.tiktok.com/@elfcosmetics',
  'https://shop.tiktok.com/@fentybeauty',
];

export class ShopDiscoveryService {
  private discoveredUrls: string[] = [...TIKTOK_SHOP_URLS];
  
  public getDiscoveredUrlsCount(): number {
    return this.discoveredUrls.length;
  }
  
  public getUnprocessedUrlsCount(processedUrls: Set<string>): number {
    return this.discoveredUrls.filter(url => !processedUrls.has(url)).length;
  }
  
  public getNextBatch(processedUrls: Set<string>, batchSize: number): string[] {
    const unprocessedUrls = this.discoveredUrls.filter(url => !processedUrls.has(url));
    return unprocessedUrls.slice(0, batchSize);
  }
  
  public async discoverMoreShops(userAgent: string): Promise<void> {
    try {
      console.log('Attempting to discover more TikTok shops');
      
      // Try multiple discovery methods
      await Promise.allSettled([
        this.findShopURLsFromSearchEngines(userAgent),
        this.generateMockShopUrls()
      ]);
      
    } catch (error) {
      console.error('Error discovering shops:', error);
      // Fallback to mock URLs if all discovery methods fail
      this.addMoreMockUrls();
    }
  }
  
  private async findShopURLsFromSearchEngines(userAgent: string): Promise<void> {
    try {
      // Search Google for TikTok shops
      const searchURL = 'https://www.google.com/search?q=site:shop.tiktok.com';
      
      console.log(`Searching for more TikTok shops via: ${searchURL}`);
      
      const response = await fetch(searchURL, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      
      if (!response.ok) {
        console.log(`Search engine returned error: ${response.status}`);
        return;
      }
      
      const html = await response.text();
      
      // Extract URLs from search results
      const urlRegex = /href="(https:\/\/shop\.tiktok\.com\/@[^"]+)"/g;
      let match;
      const newUrls: string[] = [];
      
      while ((match = urlRegex.exec(html)) !== null) {
        const url = match[1];
        if (!this.discoveredUrls.includes(url)) {
          newUrls.push(url);
        }
      }
      
      if (newUrls.length > 0) {
        console.log(`Discovered ${newUrls.length} new TikTok shop URLs from search`);
        this.discoveredUrls.push(...newUrls);
      } else {
        console.log('No new TikTok shop URLs found from search');
      }
    } catch (error) {
      console.error('Error searching for shops:', error);
    }
  }
  
  private generateMockShopUrls(): Promise<void> {
    return new Promise(resolve => {
      // Generate some synthetic shop URLs based on popular brands
      const brands = [
        'maybelline', 'revlon', 'loreal', 'nyxcosmetics', 'covergirl',
        'maccosmetics', 'urbandecay', 'glossier', 'tarte', 'benefit'
      ];
      
      const newUrls = brands
        .filter(brand => !this.discoveredUrls.some(url => url.includes(`@${brand}`)))
        .map(brand => `https://shop.tiktok.com/@${brand}`);
      
      if (newUrls.length > 0) {
        this.discoveredUrls.push(...newUrls);
        console.log(`Generated ${newUrls.length} synthetic TikTok shop URLs`);
      }
      
      resolve();
    });
  }
  
  private addMoreMockUrls(): void {
    // Generate some random new shop URLs as fallback
    const newUrls = Array.from({ length: 5 }, (_, i) => 
      `https://shop.tiktok.com/@newshop${this.discoveredUrls.length + i}`
    );
    
    this.discoveredUrls.push(...newUrls);
    console.log(`Added ${newUrls.length} new shop URLs to the queue`);
  }
}
