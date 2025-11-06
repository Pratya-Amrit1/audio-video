import { v4 as uuidv4 } from 'uuid';
import { verifyWebSocketToken } from './auth.js';
import { incCounter, decCounter } from './metrics.js';
import { recordStat } from './db.js';

// In-memory room state for signaling (authoritative data persisted in Mongo)
const rooms = new Map(); // roomId -> Map(connectionId -> conn)

function getIceServers() {
  try {
    if (process.env.ICE_SERVERS) return JSON.parse(process.env.ICE_SERVERS);
  } catch {}
  return [{ urls: ['stun:stun.l.google.com:19302'] }];
}

export function createSignaling(wss, logger) {
  wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.split('?')[1] || '');
    const token = params.get('token');
    let auth;
    try {
      auth = verifyWebSocketToken(token);
    } catch (e) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const connectionId = uuidv4();
    const { roomId, sub: userId, displayName } = auth;

    // Prepare peers list before inserting this connection
    const existingPeers = rooms.get(roomId) ? [...rooms.get(roomId).entries()].map(([cid, c]) => ({ connectionId: cid, userId: c.userId, displayName: c.displayName })) : [];
    ws.send(JSON.stringify({ type: 'welcome', connectionId, iceServers: getIceServers(), peers: existingPeers }));
    incCounter('ws_connections', 1);

    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);
    room.set(connectionId, { ws, userId, displayName });

    broadcast(roomId, { type: 'presence', event: 'join', connectionId, userId, displayName });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      handleMessage(roomId, connectionId, msg, logger);
    });

    ws.on('close', async () => {
      const r = rooms.get(roomId);
      if (r) {
        r.delete(connectionId);
        broadcast(roomId, { type: 'presence', event: 'leave', connectionId, userId, displayName });
        if (r.size === 0) rooms.delete(roomId);
      }
      decCounter('ws_connections', 1);
      await recordStat({ kind: 'disconnect', roomId, userId, connectionId });
    });
  });

  function handleMessage(roomId, connectionId, msg, logger) {
    switch (msg.type) {
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        const targetId = msg.to;
        const room = rooms.get(roomId);
        if (!room) return;
        const target = room.get(targetId);
        if (!target) return;
        target.ws.send(JSON.stringify({ ...msg, from: connectionId }));
        break;
      }
      case 'broadcast': {
        broadcast(roomId, { type: 'signal', from: connectionId, payload: msg.payload });
        break;
      }
      case 'stats': {
        recordStat({ kind: 'client-stats', roomId, connectionId, metrics: msg.metrics }).catch(() => {});
        break;
      }
      case 'restart-ice': {
        broadcast(roomId, { type: 'restart-ice', from: connectionId });
        break;
      }
      default:
        logger.debug({ msg }, 'Unknown message');
    }
  }
}

function broadcast(roomId, data) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const [, c] of room.entries()) {
    try { c.ws.send(msg); } catch {}
  }
}


