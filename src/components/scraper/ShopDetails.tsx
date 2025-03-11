
import React from 'react';
import { Shop, ShopHistoryData } from '@/lib/types';
import ShopHistory from './ShopHistory';

interface ShopDetailsProps {
  shop: Shop;
  history: ShopHistoryData | null;
}

const ShopDetails = ({ shop, history }: ShopDetailsProps) => {
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

  return (
    <div className="space-y-6">
      <ShopHistory history={history} />
      
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
  );
};

export default ShopDetails;
