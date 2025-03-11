import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ArrowUpDown, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fadeInUp } from '@/lib/animations';
import { Shop, ShopData, SortOptions, ShopHistoryData } from '@/lib/types';
import { DatabaseService } from '@/services/DatabaseService';
import Card from '../ui-custom/Card';
import Button from '../ui-custom/Button';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: ShopData | null;
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const DataTable = ({ data, isLoading }: DataTableProps) => {
  const [expandedShop, setExpandedShop] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOptions>({
    field: 'totalRevenue',
    direction: 'desc',
  });
  const [shopHistory, setShopHistory] = useState<Record<string, ShopHistoryData | null>>({});
  
  useEffect(() => {
    if (expandedShop) {
      const dbService = DatabaseService.getInstance();
      const historyData = dbService.getShopHistory(expandedShop);
      
      if (historyData && historyData.revenueData.length >= 2) {
        const oldestRevenue = historyData.revenueData[0].revenue;
        const latestRevenue = historyData.revenueData[historyData.revenueData.length - 1].revenue;
        const percentChange = ((latestRevenue - oldestRevenue) / oldestRevenue) * 100;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (percentChange > 1) trend = 'up';
        else if (percentChange < -1) trend = 'down';
        
        setShopHistory({
          ...shopHistory,
          [expandedShop]: {
            ...historyData,
            percentChange,
            trend
          }
        });
      } else {
        setShopHistory({
          ...shopHistory,
          [expandedShop]: null
        });
      }
    }
  }, [expandedShop]);

  if (isLoading) {
    return (
      <motion.div
        className="space-y-4"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Shop Data</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Filter size={16} />}
              disabled
            >
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Download size={16} />}
              disabled
            >
              Export
            </Button>
          </div>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-md" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-md" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data || !data.shops || data.shops.length === 0) {
    return (
      <motion.div
        className="text-center py-12 border rounded-xl bg-card"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <p className="text-muted-foreground">
          No data available. Start by analyzing a TikTok Shop.
        </p>
      </motion.div>
    );
  }

  const sortedShops = [...data.shops].sort((a, b) => {
    if (sort.field === 'name') {
      return sort.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  const handleSort = (field: SortOptions['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const toggleExpandShop = (shopName: string) => {
    setExpandedShop((prev) => (prev === shopName ? null : shopName));
  };

  const SortIcon = ({ field }: { field: SortOptions['field'] }) => {
    if (sort.field !== field) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp size={14} className="ml-1" />
    ) : (
      <ChevronDown size={14} className="ml-1" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <motion.div
      className="space-y-4"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Shop Data</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Filter size={16} />}
          >
            Filter
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Shop Name
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort('totalRevenue')}
                >
                  <div className="flex items-center justify-end">
                    Total Revenue
                    <SortIcon field="totalRevenue" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort('itemsSold')}
                >
                  <div className="flex items-center justify-end">
                    Items Sold
                    <SortIcon field="itemsSold" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedShops.map((shop) => (
                <React.Fragment key={shop.name}>
                  <tr 
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      expandedShop === shop.name && "bg-muted/30"
                    )}
                  >
                    <td className="px-4 py-3 text-sm">{shop.name}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(shop.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(shop.itemsSold)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandShop(shop.name)}
                        icon={
                          expandedShop === shop.name ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        }
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                  {expandedShop === shop.name && (
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="space-y-6">
                          {shopHistory[shop.name] ? (
                            <div className="bg-card border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-base font-medium">Performance History</h3>
                                  <div className="flex items-center mt-1">
                                    {shopHistory[shop.name]?.trend === 'up' ? (
                                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    ) : shopHistory[shop.name]?.trend === 'down' ? (
                                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                    ) : (
                                      <Activity className="h-4 w-4 text-amber-500 mr-1" />
                                    )}
                                    <span 
                                      className={`text-xs font-medium ${
                                        shopHistory[shop.name]?.trend === 'up' 
                                          ? 'text-green-500' 
                                          : shopHistory[shop.name]?.trend === 'down' 
                                            ? 'text-red-500' 
                                            : 'text-amber-500'
                                      }`}
                                    >
                                      {shopHistory[shop.name]?.percentChange && shopHistory[shop.name]?.percentChange > 0 ? '+' : ''}
                                      {shopHistory[shop.name]?.percentChange?.toFixed(1)}% ({shopHistory[shop.name]?.trend})
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={shopHistory[shop.name]?.revenueData.map(data => ({
                                      date: formatDate(data.date),
                                      revenue: data.revenue
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
                                      stroke={
                                        shopHistory[shop.name]?.trend === 'up' 
                                          ? '#10b981' 
                                          : shopHistory[shop.name]?.trend === 'down' 
                                            ? '#ef4444' 
                                            : '#f59e0b'
                                      }
                                      strokeWidth={2}
                                      dot={{ r: 4 }}
                                      activeDot={{ r: 6 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 border rounded-md bg-card">
                              <p className="text-muted-foreground text-sm">
                                Not enough historical data yet to show performance trend.
                                <br />
                                Data will appear after the crawler has collected multiple snapshots.
                              </p>
                            </div>
                          )}
                          
                          <div className="text-sm">
                            <h4 className="font-medium mb-2">Products</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {shop.products.map((product, index) => (
                                <div 
                                  key={index} 
                                  className="bg-card border rounded-md p-3 shadow-sm"
                                >
                                  <h5 className="font-medium text-xs mb-2 line-clamp-1">
                                    {product.name}
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <p className="text-muted-foreground">Price</p>
                                      <p>{formatCurrency(product.price)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Sales</p>
                                      <p>{formatNumber(product.salesCount)}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-muted-foreground">Revenue</p>
                                      <p className="font-medium">
                                        {formatCurrency(product.revenuePerItem)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          Last updated: {data.lastUpdated}
        </div>
      </Card>
    </motion.div>
  );
};

export default DataTable;
