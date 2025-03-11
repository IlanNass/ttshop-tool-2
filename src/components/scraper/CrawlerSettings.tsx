
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui-custom/Button';
import { Settings } from 'lucide-react';

interface CrawlerSettingsProps {
  intervalMs: number;
  batchSize: number;
  userAgent: string;
  userAgentOptions: Record<string, string>;
  onApplySettings: (settings: { interval: number; batchSize: number; userAgent: string }) => void;
}

const CrawlerSettings: React.FC<CrawlerSettingsProps> = ({
  intervalMs,
  batchSize,
  userAgent,
  userAgentOptions,
  onApplySettings
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localIntervalMs, setLocalIntervalMs] = useState(intervalMs);
  const [localBatchSize, setLocalBatchSize] = useState(batchSize);
  const [localUserAgent, setLocalUserAgent] = useState(userAgent);

  const applySettings = () => {
    onApplySettings({
      interval: localIntervalMs,
      batchSize: localBatchSize,
      userAgent: localUserAgent
    });
    setShowSettings(false);
  };

  const formatInterval = (ms: number) => {
    return ms < 60000
      ? `${ms / 1000} seconds`
      : `${ms / 60000} minutes`;
  };

  return (
    <div className="mt-4">
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
              value={localIntervalMs}
              onChange={(e) => setLocalIntervalMs(Number(e.target.value))}
              className="w-full h-9 px-3 py-2 bg-background border rounded-md"
            />
            <div className="text-xs text-muted-foreground">
              {formatInterval(localIntervalMs)} between crawl batches
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
              value={localBatchSize}
              onChange={(e) => setLocalBatchSize(Number(e.target.value))}
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
              value={localUserAgent}
              onChange={(e) => setLocalUserAgent(e.target.value)}
              className="w-full h-9 px-3 py-2 bg-background border rounded-md"
            >
              {Object.entries(userAgentOptions).map(([key, value]) => (
                <option key={key} value={value}>{key}</option>
              ))}
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
  );
};

export default CrawlerSettings;
