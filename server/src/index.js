import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import pino from 'pino';
import { initDb } from './lib/db.js';
import { registerRoutes } from './lib/routes.js';
import { createSignaling } from './lib/signaling.js';
import { metricsMiddleware, metricsRouter } from './lib/metrics.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function main() {
  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  const allowAll = allowedOrigins.length === 0;
  app.use(cors({ origin: (origin, cb) => {
    if (allowAll) return cb(null, true);
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed'), false);
  }, credentials: true }));
  app.use(express.json());
  app.use(metricsMiddleware);

  await initDb(logger);

  registerRoutes(app, logger);
  app.use('/metrics', metricsRouter());

  const wss = new WebSocketServer({ server, path: '/ws' });
  createSignaling(wss, logger);

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    logger.info({ port }, 'Signaling server listening');
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error starting server', err);
  process.exit(1);
});


