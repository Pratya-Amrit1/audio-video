import { MongoClient } from 'mongodb';

let client;
let db;

export async function initDb(logger) {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'webrtc_demo';
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  await Promise.all([
    db.collection('rooms').createIndex({ roomId: 1 }, { unique: true }),
    db.collection('participants').createIndex({ roomId: 1 }),
    db.collection('stats').createIndex({ roomId: 1 }),
  ]);
  logger.info({ dbName }, 'Connected to MongoDB');
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export async function createRoom(roomId, meta = {}) {
  const now = new Date();
  await getDb().collection('rooms').updateOne(
    { roomId },
    { $setOnInsert: { roomId, createdAt: now }, $set: { meta, updatedAt: now } },
    { upsert: true }
  );
  return { roomId };
}

export async function upsertParticipant({ roomId, userId, displayName }) {
  const now = new Date();
  await getDb().collection('participants').updateOne(
    { roomId, userId },
    { $set: { roomId, userId, displayName, joinedAt: now, leftAt: null } },
    { upsert: true }
  );
}

export async function markParticipantLeft({ roomId, userId }) {
  await getDb().collection('participants').updateOne(
    { roomId, userId },
    { $set: { leftAt: new Date() } }
  );
}

export async function recordStat(entry) {
  await getDb().collection('stats').insertOne({ ...entry, at: new Date() });
}


