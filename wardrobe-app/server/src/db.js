import { MongoClient, ObjectId } from 'mongodb';

export { ObjectId };

let _client = null;
let _db = null;

export async function getDb() {
  if (_db) return _db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in server/.env');
  _client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await _client.connect();
  _db = _client.db('drip_deck');
  // Ensure indexes
  const users = _db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true, sparse: true });
  await users.createIndex({ googleId: 1 }, { unique: true, sparse: true });
  await users.createIndex({ username: 1 }, { unique: true });
  console.log('[MongoDB] Connected to drip_deck');
  return _db;
}
