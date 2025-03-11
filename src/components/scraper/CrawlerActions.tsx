
import React from 'react';
import Button from '../ui-custom/Button';
import { Play, Pause, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface CrawlerActionsProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onProcessNow: () => void;
  onLogout: () => void;
}

const CrawlerActions: React.FC<CrawlerActionsProps> = ({
  isRunning,
  onStart,
  onStop,
  onProcessNow,
  onLogout
}) => {
  const handleProcessNow = () => {
    if (isRunning) {
      onProcessNow();
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
            onClick={handleProcessNow}
          >
            Process Now
          </Button>
          <Button
            variant={isRunning ? 'outline' : 'primary'}
            size="sm"
            icon={isRunning ? <Pause size={16} /> : <Play size={16} />}
            onClick={isRunning ? onStop : onStart}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<LogOut size={16} />}
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default CrawlerActions;
