WebRTC Conferencing Prototype

Quickstart

1. Install deps

   - npm i
   - npm --prefix server i
   - npm --prefix client i

2. Start services (Mongo, optional coturn, server, client)

   - docker compose up -d mongo coturn
   - npm run seed
   - npm run dev

3. Open two browser tabs at http://localhost:5173, join room "demo".

Environment

- Server env (create server/.env)
  - PORT=4000
  - MONGO_URI=mongodb://root:example@localhost:27017
  - MONGO_DB=webrtc_demo
  - JWT_SECRET=change_me
  - ALLOWED_ORIGINS=http://localhost:5173
  - ICE_SERVERS=[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:localhost:3478?transport=udp","turn:localhost:3478?transport=tcp"],"username":"demo","credential":"demo"}]

Notes

- Mesh topology for small rooms. For large rooms, use SFU.
- Bitrate can be adjusted from the UI; ICE restart supported.
- Basic metrics at /metrics, health at /api/health.


