const path = require('path');
const mongoose = require('mongoose');

// Always load backend/.env even if the process was started from another directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';

const SERVER_SELECTION_MS = Number(process.env.MONGODB_SERVER_SELECTION_MS) || 15000;

function redactMongoUri(uri) {
  return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//***:***@');
}

async function connectDb() {
  mongoose.set('strictQuery', true);

  // eslint-disable-next-line no-console
  console.log('[db] connecting to', redactMongoUri(MONGODB_URI));

  const opts = { serverSelectionTimeoutMS: SERVER_SELECTION_MS };
  if (!MONGODB_URI.includes('mongodb+srv')) {
    opts.family = 4;
  }

  await mongoose.connect(MONGODB_URI, opts);

  // eslint-disable-next-line no-console
  console.log('[db] using database:', mongoose.connection?.name || '(unknown)');
}

module.exports = { connectDb, MONGODB_URI };
