import dotenv from 'dotenv';
import pino from 'pino';
import { initDb, createRoom } from '../src/lib/db.js';

dotenv.config();

const logger = pino({ level: 'info' });

async function run() {
  await initDb(logger);
  await createRoom('demo', { title: 'Demo Room' });
  logger.info('Seeded room: demo');
  process.exit(0);
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


