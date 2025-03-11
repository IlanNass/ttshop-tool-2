
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Settings, RefreshCw, Database, LogOut } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';
import Button from '../ui-custom/Button';
import Card from '../ui-custom/Card';
import { TikTokCrawlerService } from '@/services/TikTokCrawlerService';
import { CrawlerBackgroundService } from '@/services/CrawlerBackgroundService';
import { CrawlerStorage } from '@/services/CrawlerStorage';
import { useAuth } from '@/contexts/AuthContext';

interface CrawlerControlProps {
  onDataUpdate: (data: any) => void;
}

const CrawlerControl = ({ onDataUpdate }: CrawlerControlProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    totalDiscovered: 0,
    totalProcessed: 0,
    queuedUrls: 0,
  });
  const [intervalMs, setIntervalMs] = useState(30000);
  const [batchSize, setBatchSize] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  const crawlerService = TikTokCrawlerService.getInstance();
  const backgroundService = CrawlerBackgroundService.getInstance();

  useEffect(() => {
    // Restore settings from storage
    const state = CrawlerStorage.getState();
    setIntervalMs(state.options.interval);
    setBatchSize(state.options.batchSize);
    setIsRunning(state.isRunning);

    // Set up the data update listener
    const unsubscribe = crawlerService.onDataUpdate((data) => {
      onDataUpdate(data);
    });

    // Listen for crawler-data-updated events
    const handleDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      onDataUpdate(customEvent.detail);
    };
    window.addEventListener('crawler-data-updated', handleDataUpdate);

    // Update status periodically
    const statusInterval = setInterval(() => {
      const status = crawlerService.getCurrentStatus();
      setStats({
        totalDiscovered: status.totalDiscovered,
        totalProcessed: status.totalProcessed,
        queuedUrls: status.queuedUrls,
      });
      
      // Also check if background service is running
      setIsRunning(backgroundService.isRunning() || state.isRunning);
    }, 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('crawler-data-updated', handleDataUpdate);
      clearInterval(statusInterval);
    };
  }, [onDataUpdate]);

  const startCrawling = () => {
    const options = {
      interval: intervalMs,
      batchSize: batchSize,
    };
    
    crawlerService.startCrawling(options);
    backgroundService.startCrawling(options);
    setIsRunning(true);
  };

  const stopCrawling = () => {
    crawlerService.stopCrawling();
    backgroundService.stopCrawling();
    setIsRunning(false);
  };

  const applySettings = () => {
    const options = {
      interval: intervalMs,
      batchSize: batchSize,
    };
    
    crawlerService.updateOptions(options);
    CrawlerStorage.updateOptions(options);
    
    if (isRunning) {
      // Restart with new settings
      stopCrawling();
      startCrawling();
    }
    
    setShowSettings(false);
  };

  const formatInterval = (ms: number) => {
    return ms < 60000
      ? `${ms / 1000} seconds`
      : `${ms / 60000} minutes`;
  };

  const handleLogout = () => {
    // Stop crawler before logging out
    if (isRunning) {
      stopCrawling();
    }
    logout();
  };

  return (
    <motion.div
      className="bg-card border rounded-xl p-6 shadow-sm"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Automated Crawler</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Automatically discover and analyze TikTok Shops without manual input.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Status: </span>
            <span className={`text-sm font-medium ${isRunning ? 'text-green-500' : 'text-amber-500'}`}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <Button
            variant={isRunning ? 'outline' : 'primary'}
            size="sm"
            icon={isRunning ? <Pause size={16} /> : <Play size={16} />}
            onClick={isRunning ? stopCrawling : startCrawling}
          >
            {isRunning ? 'Pause Crawler' : 'Start Crawler'}
          </Button>
        </div>

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
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Settings size={16} />}
          onClick={() => setShowSettings(!showSettings)}
          fullWidth
        >
          Crawler Settings
        </Button>

        {showSettings && (
          <motion.div
            className="mt-4 space-y-4 p-4 border rounded-md bg-muted/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-2">
              <label htmlFor="interval" className="text-sm font-medium">
                Crawl Interval (ms)
              </label>
              <input
                id="interval"
                type="number"
                min="5000"
                step="1000"
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="w-full h-9 px-3 py-2 bg-background border rounded-md"
              />
              <div className="text-xs text-muted-foreground">
                {formatInterval(intervalMs)} between crawl batches
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="batchSize" className="text-sm font-medium">
                Batch Size
              </label>
              <input
                id="batchSize"
                type="number"
                min="1"
                max="10"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full h-9 px-3 py-2 bg-background border rounded-md"
              />
              <div className="text-xs text-muted-foreground">
                Number of shops to process in each batch
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={applySettings}
              >
                Apply Settings
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CrawlerControl;
