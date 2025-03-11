
import React from 'react';
import { Database } from 'lucide-react';
import Card from '../ui-custom/Card';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

interface CrawlerStatsProps {
  stats: {
    totalDiscovered: number;
    totalProcessed: number;
    queuedUrls: number;
  };
  intervalMs: number;
  batchSize: number;
  userAgent: string;
}

const CrawlerStats: React.FC<CrawlerStatsProps> = ({ 
  stats, 
  intervalMs, 
  batchSize, 
  userAgent 
}) => {
  const formatInterval = (ms: number) => {
    return ms < 60000
      ? `${ms / 1000} seconds`
      : `${ms / 60000} minutes`;
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <Card className="bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center mb-1">
              <Database size={16} className="mr-1" />
              <span className="text-xs text-muted-foreground">Discovered</span>
            </div>
            <p className="font-medium">{stats.totalDiscovered}</p>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <RefreshCw size={16} className="mr-1" />
              <span className="text-xs text-muted-foreground">Processed</span>
            </div>
            <p className="font-medium">{stats.totalProcessed}</p>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Database size={16} className="mr-1" />
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <p className="font-medium">{stats.queuedUrls}</p>
          </div>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        Crawling {batchSize} shops every {formatInterval(intervalMs)}
        <div className="mt-1">User-Agent: {userAgent.substring(0, 20)}...</div>
      </div>
    </motion.div>
  );
};

export default CrawlerStats;
