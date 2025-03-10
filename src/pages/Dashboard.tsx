
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScraperForm from '@/components/scraper/ScraperForm';
import DataTable from '@/components/scraper/DataTable';
import { ShopData } from '@/lib/types';

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

  const handleScrape = (url: string) => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setShopData(mockShopData);
      setIsLoading(false);
      toast.success('Analysis completed', {
        description: 'TikTok Shop data has been successfully analyzed.'
      });
    }, 2500);
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
              Extract data from TikTok Shop and analyze performance metrics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2">
              <DataTable data={shopData} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default Dashboard;
