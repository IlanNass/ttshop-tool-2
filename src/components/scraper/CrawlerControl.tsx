import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { TikTokCrawlerService } from '@/services/TikTokCrawlerService';
import { CrawlerBackgroundService } from '@/services/CrawlerBackgroundService';
import { CrawlerStorage } from '@/services/CrawlerStorage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CrawlerStats from './CrawlerStats';
import CrawlerActions from './CrawlerActions';
import CrawlerSettings from './CrawlerSettings';

interface CrawlerControlProps {
  onDataUpdate: (data: any) => void;
}

const CRAWLER_USER_AGENTS = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
};

const CrawlerControl: React.FC<CrawlerControlProps> = ({ onDataUpdate }) => {
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

  const crawlerService = TikTokCrawlerService.getInstance();
  const backgroundService = CrawlerBackgroundService.getInstance();

  useEffect(() => {
    const state = CrawlerStorage.getState();
    setIntervalMs(state.options.interval);
    setBatchSize(state.options.batchSize);
    setIsRunning(state.isRunning);

    const unsubscribe = crawlerService.onDataUpdate((data) => {
      onDataUpdate(data);
    });

    const handleDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      onDataUpdate(customEvent.detail);
    };
    window.addEventListener('crawler-data-updated', handleDataUpdate);

    const statusInterval = setInterval(() => {
      const status = crawlerService.getCurrentStatus();
      setStats({
        totalDiscovered: status.totalDiscovered,
        totalProcessed: status.totalProcessed,
        queuedUrls: status.queuedUrls,
      });
      
      setIsRunning(backgroundService.isRunning());
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
    
    backgroundService.startCrawling(options);
    setIsRunning(true);
    
    toast.info('Real-time crawler started', {
      description: 'Attempting to collect data from actual TikTok shops.'
    });
  };

  const stopCrawling = () => {
    backgroundService.stopCrawling();
    setIsRunning(false);
    
    toast.info('Crawler stopped', {
      description: 'TikTok shop data collection paused.'
    });
  };

  const applySettings = (settings: { interval: number; batchSize: number; userAgent: string }) => {
    setIntervalMs(settings.interval);
    setBatchSize(settings.batchSize);
    setUserAgent(settings.userAgent);
    
    crawlerService.updateOptions(settings);
    CrawlerStorage.updateOptions(settings);
    
    if (isRunning) {
      stopCrawling();
      startCrawling();
    }
    
    toast.success('Crawler settings updated', {
      description: 'New settings will be applied to future requests.'
    });
  };

  const handleLogout = () => {
    if (isRunning) {
      stopCrawling();
    }
    logout();
  };

  const handleProcessNow = () => {
    if (isRunning) {
      backgroundService.performCrawl();
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
      </div>
      
      <p className="text-muted-foreground mb-6">
        Analyze real TikTok Shop data by crawling their public pages.
      </p>

      <div className="space-y-4">
        <CrawlerActions 
          isRunning={isRunning}
          onStart={startCrawling}
          onStop={stopCrawling}
          onProcessNow={handleProcessNow}
          onLogout={handleLogout}
        />
        
        <CrawlerStats 
          stats={stats}
          intervalMs={intervalMs}
          batchSize={batchSize}
          userAgent={userAgent}
        />
        
        <CrawlerSettings 
          intervalMs={intervalMs}
          batchSize={batchSize}
          userAgent={userAgent}
          userAgentOptions={CRAWLER_USER_AGENTS}
          onApplySettings={applySettings}
        />
      </div>
    </motion.div>
  );
};

export default CrawlerControl;
