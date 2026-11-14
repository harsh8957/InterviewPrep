import 'dotenv/config';
import { app } from './app';
import { connectDB, disconnectDB } from './lib/db';

const PORT = Number(process.env.PORT) || 5000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[Server] Production-hardened server running on port ${PORT} [Env: ${process.env.NODE_ENV || 'development'}]`);
});

/**
 * Graceful Process Shutdown Handler
 */
const handleShutdown = async (signal: string) => {
  console.log(`[Server] ${signal} signal received. Initiating graceful shutdown...`);

  // Stop accepting new incoming HTTP connections
  server.close(async () => {
    console.log('[Server] HTTP listener closed.');
    try {
      await disconnectDB();
      console.log('[Server] Graceful shutdown completed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during shutdown cleanup:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if connections refuse to drain
  setTimeout(() => {
    console.error('[Server] Forced shutdown timeout exceeded (10s). Terminating process.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught Exception:', error);
  // Optional: in production, trigger container restart after logging
});
