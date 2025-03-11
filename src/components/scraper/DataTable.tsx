
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';
import { Shop, ShopData, SortOptions, ShopHistoryData } from '@/lib/types';
import { DatabaseService } from '@/services/DatabaseService';
import Card from '../ui-custom/Card';
import Button from '../ui-custom/Button';
import ShopDetails from './ShopDetails';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: ShopData | null;
  isLoading: boolean;
}

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
      const trends = dbService.getShopTrends(30);
      const shopTrend = trends.find(trend => trend.shopName === expandedShop);
      
      if (shopTrend && shopTrend.revenueData.length >= 2) {
        const historyData: ShopHistoryData = {
          shopName: shopTrend.shopName,
          trend: shopTrend.trend,
          percentChange: shopTrend.percentChange,
          revenueData: shopTrend.revenueData.map(data => ({
            date: data.timestamp,
            revenue: data.totalRevenue,
          }))
        };
        
        setShopHistory({
          ...shopHistory,
          [expandedShop]: historyData
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

  const sortedShops = [...(data?.shops || [])].sort((a, b) => {
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
                        <ShopDetails 
                          shop={shop} 
                          history={shopHistory[shop.name]} 
                        />
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
