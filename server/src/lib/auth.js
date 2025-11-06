import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function issueRoomToken({ roomId, userId, displayName }) {
  const payload = { sub: userId || uuidv4(), roomId, displayName };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyAuth(header) {
  if (!header) throw new Error('Missing Authorization');
  const token = header.replace('Bearer ', '');
  return jwt.verify(token, JWT_SECRET);
}

export function verifyWebSocketToken(token) {
  return jwt.verify(token, JWT_SECRET);
}


