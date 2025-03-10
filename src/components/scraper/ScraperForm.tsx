
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';
import Button from '../ui-custom/Button';
import { toast } from 'sonner';

interface ScraperFormProps {
  onScrape: (url: string) => void;
  isLoading: boolean;
}

const ScraperForm = ({ onScrape, isLoading }: ScraperFormProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!url.trim()) {
      setError('Please enter a TikTok Shop URL');
      return;
    }
    
    if (!url.includes('tiktok.com')) {
      setError('Please enter a valid TikTok Shop URL');
      return;
    }
    
    setError('');
    toast.info('Starting data collection', {
      description: 'Analyzing the provided TikTok Shop...'
    });
    onScrape(url);
  };

  return (
    <motion.div
      className="bg-card border rounded-xl p-6 shadow-sm"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-xl font-semibold mb-4">Analyze TikTok Shop</h2>
      <p className="text-muted-foreground mb-6">
        Enter a TikTok Shop URL to extract product data and calculate revenue metrics.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="shop-url" className="text-sm font-medium">
            TikTok Shop URL
          </label>
          <div className="relative">
            <input
              id="shop-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://shop.tiktok.com/@shopname"
              className={`w-full h-10 px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 pl-10 ${
                error ? 'border-destructive' : 'border-input'
              }`}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
          </div>
          {error && (
            <div className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={isLoading}
          icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : undefined}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Shop'}
        </Button>
      </form>
    </motion.div>
  );
};

export default ScraperForm;
