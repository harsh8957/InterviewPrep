import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

interface SubsystemHealth {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

router.get('/', async (req, res) => {
  const startTime = Date.now();
  const subsystems: Record<string, SubsystemHealth> = {};

  // 1. MongoDB Database Check
  try {
    const dbStartTime = Date.now();
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      subsystems.database = {
        status: 'up',
        latencyMs: Date.now() - dbStartTime,
        details: {
          readyState: 'connected',
          host: mongoose.connection.host,
          databaseName: mongoose.connection.name,
        },
      };
    } else {
      subsystems.database = {
        status: 'down',
        message: `Mongoose connection state: ${mongoose.connection.readyState}`,
      };
    }
  } catch (dbError: any) {
    subsystems.database = {
      status: 'down',
      message: dbError.message || 'Database ping failed',
    };
  }

  // 2. Evaluator Service (FastAPI) Check
  const evaluatorUrl = process.env.EVALUATOR_SERVICE_URL || 'http://localhost:8001';
  try {
    const evalStartTime = Date.now();
    const evalRes = await axios.get(`${evaluatorUrl}/health`, {
      timeout: 2000,
      headers: {
        'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY || '',
      },
    });
    subsystems.evaluator = {
      status: evalRes.status === 200 ? 'up' : 'degraded',
      latencyMs: Date.now() - evalStartTime,
      details: evalRes.data,
    };
  } catch (evalError: any) {
    subsystems.evaluator = {
      status: 'degraded',
      message: evalError.code === 'ECONNREFUSED'
        ? 'Evaluator microservice is offline or unreachable'
        : (evalError.message || 'Evaluator health check failed'),
    };
  }

  // 3. Online Coding Judge Check
  const judgeBaseUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  try {
    const judgeStartTime = Date.now();
    // Quick ping to judge languages or about endpoint
    const judgeRes = await axios.get(`${judgeBaseUrl}/about`, {
      timeout: 2500,
      headers: process.env.RAPIDAPI_KEY ? {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
      } : {},
      validateStatus: () => true, // Don't throw on non-200, evaluate cleanly
    });

    subsystems.judge = {
      status: (judgeRes.status >= 200 && judgeRes.status < 400) ? 'up' : 'degraded',
      latencyMs: Date.now() - judgeStartTime,
      details: {
        provider: process.env.JUDGE_PROVIDER || (judgeBaseUrl.includes('rapidapi') ? 'rapidapi_judge0' : 'self_hosted'),
        statusCode: judgeRes.status,
      },
    };
  } catch (judgeError: any) {
    subsystems.judge = {
      status: 'degraded',
      message: judgeError.message || 'Judge service probe timeout',
      details: {
        provider: process.env.JUDGE_PROVIDER || 'rapidapi_judge0',
      },
    };
  }

  // Determine overall status
  const isHealthy = subsystems.database.status === 'up';
  const isDegraded = subsystems.evaluator.status !== 'up' || subsystems.judge.status !== 'up';

  const overallStatus = !isHealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy';
  const httpCode = !isHealthy ? 503 : 200;

  const memUsage = process.memoryUsage();

  res.status(httpCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - startTime,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryMb: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
    subsystems,
  });
});

export default router;
