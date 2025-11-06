import express from 'express';

let counters = {
  ws_connections: 0,
  rooms: 0,
  participants: 0,
};

export function metricsMiddleware(_req, _res, next) {
  next();
}

export function incCounter(name, by = 1) {
  counters[name] = (counters[name] || 0) + by;
}

export function decCounter(name, by = 1) {
  counters[name] = Math.max(0, (counters[name] || 0) - by);
}

export function metricsRouter() {
  const router = express.Router();
  router.get('/', (_req, res) => {
    res.type('text/plain');
    const lines = Object.entries(counters).map(([k, v]) => `webrtc_demo_${k} ${v}`);
    res.send(lines.join('\n') + '\n');
  });
  return router;
}


