
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendUpIcon, TrendDownIcon, TrendingUpIcon, AlertCircleIcon } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';
import { TrendData } from '@/lib/types';
import { DatabaseService } from '@/services/DatabaseService';
import Card from '../ui-custom/Card';

interface TrendingShopsProps {
  timeRange: number; // in days
}

const TrendingShops: React.FC<TrendingShopsProps> = ({ timeRange }) => {
  const [trendingShops, setTrendingShops] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrends = () => {
      const dbService = DatabaseService.getInstance();
      const trends = dbService.getShopTrends(timeRange);
      setTrendingShops(trends);
      setIsLoading(false);
    };

    loadTrends();
    
    // Refresh trends every minute
    const intervalId = setInterval(loadTrends, 60000);
    
    return () => clearInterval(intervalId);
  }, [timeRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <motion.div
        className="animate-pulse space-y-4"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="h-10 bg-muted rounded-md" />
        <div className="h-48 bg-muted rounded-md" />
        <div className="h-48 bg-muted rounded-md" />
      </motion.div>
    );
  }

  if (trendingShops.length === 0) {
    return (
      <motion.div
        className="p-6 border rounded-xl bg-card text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <AlertCircleIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No Trend Data</h3>
        <p className="mt-2 text-muted-foreground">
          Not enough historical data yet to show trends. Data will appear after the crawler has collected multiple snapshots.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-xl font-semibold">Trending Shops (Last {timeRange} Days)</h2>
      <div className="grid grid-cols-1 gap-6">
        {trendingShops.map((shop) => (
          <Card key={shop.shopName} className="overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{shop.shopName}</h3>
                  <div className="flex items-center mt-1">
                    {shop.trend === 'up' ? (
                      <TrendUpIcon className="h-5 w-5 text-green-500 mr-1" />
                    ) : shop.trend === 'down' ? (
                      <TrendDownIcon className="h-5 w-5 text-red-500 mr-1" />
                    ) : (
                      <TrendingUpIcon className="h-5 w-5 text-amber-500 mr-1" />
                    )}
                    <span 
                      className={`text-sm font-medium ${
                        shop.trend === 'up' 
                          ? 'text-green-500' 
                          : shop.trend === 'down' 
                            ? 'text-red-500' 
                            : 'text-amber-500'
                      }`}
                    >
                      {shop.percentChange > 0 ? '+' : ''}
                      {shop.percentChange.toFixed(1)}% ({shop.trend})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Current Revenue</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(shop.revenueData[shop.revenueData.length - 1].totalRevenue)}
                  </div>
                </div>
              </div>
              
              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={shop.revenueData.map(data => ({
                      date: formatDate(data.timestamp),
                      revenue: data.totalRevenue
                    }))}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value/1000}k`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={shop.trend === 'up' ? '#10b981' : shop.trend === 'down' ? '#ef4444' : '#f59e0b'}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default TrendingShops;
