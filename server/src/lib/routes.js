import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { issueRoomToken, verifyAuth } from './auth.js';
import { createRoom, upsertParticipant, markParticipantLeft } from './db.js';

export function registerRoutes(app, logger) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  router.post('/rooms', async (req, res, next) => {
    try {
      const roomId = req.body.roomId || uuidv4();
      await createRoom(roomId, req.body.meta || {});
      res.json({ roomId });
    } catch (e) { next(e); }
  });

  router.post('/rooms/:roomId/join', async (req, res, next) => {
    try {
      const { roomId } = req.params;
      const displayName = req.body.displayName || 'Guest';
      const userId = req.body.userId || uuidv4();
      await upsertParticipant({ roomId, userId, displayName });
      const token = issueRoomToken({ roomId, userId, displayName });
      res.json({ token, roomId, userId, displayName });
    } catch (e) { next(e); }
  });

  router.post('/rooms/:roomId/leave', async (req, res, next) => {
    try {
      const auth = verifyAuth(req.headers.authorization || '');
      const { roomId } = req.params;
      await markParticipantLeft({ roomId, userId: auth.sub });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Basic error handler
  app.use('/api', router, (err, req, res, _next) => {
    logger.error({ err }, 'API error');
    res.status(400).json({ error: err.message || 'Bad Request' });
  });
}


