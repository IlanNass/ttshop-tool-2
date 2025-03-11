
import React from 'react';
import { ShopData } from '@/lib/types';

interface DashboardContentProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  leftColumn, 
  rightColumn 
}) => {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-3 space-y-8">
        {leftColumn}
      </div>
      
      <div className="lg:col-span-9 space-y-8">
        {rightColumn}
        
        <div className="text-center text-xs text-muted-foreground mt-8">
          <p>Shop data is saved automatically for trend analysis.</p>
          <p>The crawler attempts to extract real data, but may fall back to simulated data if TikTok blocks access.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
