
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScraperForm from '@/components/scraper/ScraperForm';
import DataTable from '@/components/scraper/DataTable';
import CrawlerControl from '@/components/scraper/CrawlerControl';
import TrendingShops from '@/components/scraper/TrendingShops';
import { ShopData } from '@/lib/types';
import { TikTokCrawlerService } from '@/services/TikTokCrawlerService';
import { DatabaseService } from '@/services/DatabaseService';

// Mock data for demonstration
const mockShopData: ShopData = {
  shops: [
    {
      name: 'SACHEU Beauty',
      totalRevenue: 16890216,
      itemsSold: 1424818,
      products: [
        {
          name: 'Thick Skin Serum',
          price: 28,
          salesCount: 602793,
          revenuePerItem: 16878204,
        },
        {
          name: 'Lip Sleep Mask',
          price: 24,
          salesCount: 500,
          revenuePerItem: 12000,
        },
      ],
    },
    {
      name: 'Shop XYZ',
      totalRevenue: 50000,
      itemsSold: 2500,
      products: [
        {
          name: 'Premium Product',
          price: 60,
          salesCount: 500,
          revenuePerItem: 30000,
        },
        {
          name: 'Budget Product',
          price: 20,
          salesCount: 1000,
          revenuePerItem: 20000,
        },
      ],
    },
  ],
  lastUpdated: new Date().toLocaleString(),
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [trendTimeRange, setTrendTimeRange] = useState(30); // 30 days default

  // Initialize with data from the crawler service if it exists
  useEffect(() => {
    const crawlerService = TikTokCrawlerService.getInstance();
    const initialData = crawlerService.getCollectedData();
    
    if (initialData.shops.length > 0) {
      setShopData(initialData);
    }
  }, []);

  const handleScrape = (url: string) => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setShopData(mockShopData);
      setIsLoading(false);
      
      // Save to database
      const dbService = DatabaseService.getInstance();
      dbService.saveShopsData(mockShopData.shops);
      
      toast.success('Analysis completed', {
        description: 'TikTok Shop data has been successfully analyzed.'
      });
    }, 2500);
  };

  const handleCrawlerDataUpdate = (data: ShopData) => {
    setShopData(data);
    toast.info('New data collected', {
      description: `Automatically analyzed ${data.shops.length} TikTok Shops.`,
    });
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">TikTok Shop Analyzer Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Extract data from TikTok Shop and analyze performance metrics automatically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3 space-y-8">
              <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
              <CrawlerControl onDataUpdate={handleCrawlerDataUpdate} />
            </div>
            
            <div className="lg:col-span-9 space-y-8">
              <DataTable data={shopData} isLoading={isLoading} />
              
              <div className="mt-12 pt-8 border-t">
                <TrendingShops timeRange={trendTimeRange} />
              </div>
              
              <div className="text-center text-xs text-muted-foreground mt-8">
                <p>Shop data is saved automatically for trend analysis.</p>
                <p>The trend analysis looks for significant changes in shop revenue over time.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default Dashboard;
