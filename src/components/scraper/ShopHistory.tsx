
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ShopHistoryData } from '@/lib/types';
import Card from '../ui-custom/Card';

interface ShopHistoryProps {
  history: ShopHistoryData | null;
}

const ShopHistory = ({ history }: ShopHistoryProps) => {
  if (!history || history.revenueData.length < 2) {
    return (
      <div className="text-center py-4 border rounded-md bg-card">
        <p className="text-muted-foreground text-sm">
          Not enough historical data yet to show performance trend.
          <br />
          Data will appear after the crawler has collected multiple snapshots.
        </p>
      </div>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-medium">Performance History</h3>
          <div className="flex items-center mt-1">
            {history.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : history.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <Activity className="h-4 w-4 text-amber-500 mr-1" />
            )}
            <span 
              className={`text-xs font-medium ${
                history.trend === 'up' 
                  ? 'text-green-500' 
                  : history.trend === 'down' 
                    ? 'text-red-500' 
                    : 'text-amber-500'
              }`}
            >
              {history.percentChange > 0 ? '+' : ''}
              {history.percentChange.toFixed(1)}% ({history.trend})
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history.revenueData.map(data => ({
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
                history.trend === 'up' 
                  ? '#10b981' 
                  : history.trend === 'down' 
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
    </Card>
  );
};

export default ShopHistory;
