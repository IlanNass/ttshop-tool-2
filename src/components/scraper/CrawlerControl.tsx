
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
import { toast } from 'sonner';

interface CrawlerControlProps {
  onDataUpdate: (data: any) => void;
}

const CRAWLER_USER_AGENTS = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
};

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
  const [userAgent, setUserAgent] = useState(CRAWLER_USER_AGENTS.googlebot);
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
      userAgent: userAgent,
    };
    
    crawlerService.startCrawling(options);
    backgroundService.startCrawling(options);
    setIsRunning(true);
    
    toast.info('Real-time crawler started', {
      description: 'Attempting to collect data from actual TikTok shops.'
    });
  };

  const stopCrawling = () => {
    crawlerService.stopCrawling();
    backgroundService.stopCrawling();
    setIsRunning(false);
    
    toast.info('Crawler stopped', {
      description: 'TikTok shop data collection paused.'
    });
  };

  const applySettings = () => {
    const options = {
      interval: intervalMs,
      batchSize: batchSize,
      userAgent: userAgent,
    };
    
    crawlerService.updateOptions(options);
    CrawlerStorage.updateOptions(options);
    
    if (isRunning) {
      // Restart with new settings
      stopCrawling();
      startCrawling();
    }
    
    setShowSettings(false);
    
    toast.success('Crawler settings updated', {
      description: 'New settings will be applied to future requests.'
    });
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

  const handleReset = () => {
    // Force the crawler to run a batch immediately
    if (isRunning) {
      crawlerService.processBatch();
      toast.info('Processing new batch', {
        description: 'Attempting to process next batch of TikTok shops.'
      });
    } else {
      toast.error('Crawler is not running', {
        description: 'Start the crawler first to process shop data.'
      });
    }
  };

  return (
    <motion.div
      className="bg-card border rounded-xl p-6 shadow-sm"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">TikTok Shop Crawler</h2>
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
        Analyze real TikTok Shop data by crawling their public pages.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Status: </span>
            <span className={`text-sm font-medium ${isRunning ? 'text-green-500' : 'text-amber-500'}`}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={16} />}
              onClick={handleReset}
            >
              Process Now
            </Button>
            <Button
              variant={isRunning ? 'outline' : 'primary'}
              size="sm"
              icon={isRunning ? <Pause size={16} /> : <Play size={16} />}
              onClick={isRunning ? stopCrawling : startCrawling}
            >
              {isRunning ? 'Pause' : 'Start'}
            </Button>
          </div>
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
          <div className="mt-1">User-Agent: {userAgent.substring(0, 20)}...</div>
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
            
            <div className="space-y-2">
              <label htmlFor="userAgent" className="text-sm font-medium">
                User Agent
              </label>
              <select
                id="userAgent"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                className="w-full h-9 px-3 py-2 bg-background border rounded-md"
              >
                <option value={CRAWLER_USER_AGENTS.googlebot}>Googlebot</option>
                <option value={CRAWLER_USER_AGENTS.bingbot}>Bingbot</option>
                <option value={CRAWLER_USER_AGENTS.chrome}>Chrome</option>
                <option value={CRAWLER_USER_AGENTS.safari}>Safari</option>
              </select>
              <div className="text-xs text-muted-foreground">
                The crawler will identify as this browser/bot
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
