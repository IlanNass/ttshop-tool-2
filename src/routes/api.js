import express from 'express';
import { scrapeShop } from '../services/scraper.js';
import { createErrorResponse, logError } from '../utils/errorHandler.js';
import { createFallbackResponse } from '../utils/recovery.js';
import { getBrowser } from '../services/browser.js';

const router = express.Router();

/**
 * Scrape endpoint - fetches data from a TikTok shop URL
 */
router.get('/scrape', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json(
        createErrorResponse('URL parameter is required', 400)
      );
    }
    
    console.log(`Received scrape request for URL: ${url}`);
    const data = await scrapeShop(url);
    
    // Add metadata to response
    const response = {
      ...data,
      meta: {
        scrapedAt: new Date().toISOString(),
        url: url,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    return res.json(response);
  } catch (error) {
    logError(error, 'API Scrape');
    
    // Only in production environment, return a formatted error with fallback data
    const isDevEnvironment = process.env.NODE_ENV !== 'production';
    
    // Create a standardized error response
    const errorResponse = createErrorResponse(
      'Failed to scrape the shop data', 
      500, 
      {
        url: req.query.url,
        processingTimeMs: Date.now() - startTime,
        fallback: isDevEnvironment ? undefined : createFallbackResponse(req.query.url, error)
      }
    );
    
    // Add stack trace in development
    if (isDevEnvironment) {
      errorResponse.stack = error.stack;
    }
    
    return res.status(500).json(errorResponse);
  }
});

/**
 * Health check endpoint to monitor service status
 */
router.get('/health', async (req, res) => {
  const browser = await getBrowser();
  
  res.json({ 
    status: 'ok', 
    browserInitialized: !!browser,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router; 