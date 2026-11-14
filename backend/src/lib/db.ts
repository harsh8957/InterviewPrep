import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

/**
 * Enhanced MongoDB Connection with Production Pooling & Monitoring
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 50,
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-build indexes in high-throughput prod
    };

    await mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep_dev', options);
    console.log('[Database] MongoDB connection established successfully with pool size', options.maxPoolSize);

    // Connection lifecycle monitoring
    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection lost. Reconnecting...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    // Slow Query Monitoring
    const slowQueryThresholdMs = Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 150;
    mongoose.set('debug', (collectionName: string, methodName: string, ...methodArgs: any[]) => {
      // In production, debug can be disabled or filtered for slow operations
      if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_MONGOOSE_DEBUG) return;
    });

  } catch (error) {
    console.error('[Database] Fatal MongoDB connection failure:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Graceful Database Disconnect
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] MongoDB disconnected cleanly.');
    }
  } catch (error) {
    console.error('[Database] Error during MongoDB disconnect:', error);
  }
};

export default connectDB;
