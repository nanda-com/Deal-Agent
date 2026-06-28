import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initFirebase } from './config/firebase.js';
import { initGemini } from './config/gemini.js';
import { initTwilio } from './config/twilio.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { setupSocket } from './socket/index.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
// Allow multiple origins: localhost for development, all Vercel deployments for production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://omni-flow-ai-2027.vercel.app"
];

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  OmniFlow AI — Server Starting');
  console.log('═══════════════════════════════════════════\n');

  // Firebase (optional)
  try {
    initFirebase();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[WARN] Firebase not configured: ' + message);
  }

  // Gemini AI (optional)
  try {
    initGemini();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[WARN] Gemini AI not configured: ' + message);
  }

  // Twilio (optional)
  try {
    initTwilio();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[WARN] Twilio not configured: ' + message);
  }

  const app = express();
  const httpServer = createServer(app);

  app.use(cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path);
    next();
  });

  app.use('/api', apiRoutes);

  // Root health check endpoint for hosting providers
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'OmniFlow AI API — Backend Server is running.',
      health: '/api/health',
      version: '1.0.0',
    });
  });

  // Setup Socket.IO
  setupSocket(httpServer);
  console.log('[Socket] IO namespace /chat ready');

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found. See /api/health for available endpoints.',
    });
  });

  app.use(errorHandler);

  httpServer.listen(PORT, () => {
    console.log('\n─────────────────────────────────────────────');
    console.log('  Server:    http://localhost:' + PORT);
    console.log('  Health:    http://localhost:' + PORT + '/api/health');
    console.log('  Socket:    ws://localhost:' + PORT + '/chat');
    console.log('  CORS:      Allowing localhost and *.vercel.app');
    console.log('─────────────────────────────────────────────\n');
  });
}

main().catch((error) => {
  console.error('[FATAL] Server failed to start:', error);
  process.exit(1);
});
