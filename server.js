import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import modules
import { ensureDir } from './src/utils/fileSystem.js';
import { initBrowser, closeBrowser } from './src/services/browser.js';
import { requestTimeout, requestLogger, errorHandler } from './src/middleware/index.js';
import apiRoutes from './src/routes/api.js';

// Constants and configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots');

// Flag to track if we're running in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Configure Express
const app = express();

// Apply middleware
app.use(requestTimeout(60000));
app.use(requestLogger());

// Register API routes
app.use('/api', apiRoutes);

// Static file serving
app.use('/screenshots', express.static(SCREENSHOT_DIR));
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler(isProduction));

// Application startup
async function startServer() {
  try {
    // Create required directories
    await ensureDir(SCREENSHOT_DIR);
    
    // Initialize browser
    await initBrowser();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    });
    
    // Close browser on server shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Shutting down gracefully...');
      await closeBrowser();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Shutting down gracefully...');
      await closeBrowser();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      // Don't exit in production, just log the error
      if (!isProduction) {
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Error during server startup:', err);
    process.exit(1);
  }
}

// Start the application
startServer(); 