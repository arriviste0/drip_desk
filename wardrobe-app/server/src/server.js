import http from 'node:http';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractWardrobeItemFromImage, extractWardrobeItemWithGroq, matchOutfitWithGroq, swapOutfitItemWithGroq } from './groq.js';
import { readMultipartImage } from './image.js';
import { extractProductContext, fetchProductPage, RequestError, validatePublicUrl } from './product-page.js';
import { createWardrobeItem, listWardrobeItems, updateWardrobeItem, deleteWardrobeItem } from './wardrobe.js';
import { getDb, ObjectId } from './db.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'uploads');

/** Convert a MongoDB user doc to the public User shape. */
function toUser(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email || '',
    username: doc.username || '',
    displayName: doc.displayName || doc.username || '',
    avatar: doc.avatar || null,
    bio: doc.bio || '',
    followersCount: doc.followersCount || 0,
    followingCount: doc.followingCount || 0,
    wardrobeCount: doc.wardrobeCount || 0,
    isVerified: doc.isVerified || false,
    isFollowing: false,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}

/** Extract and verify the JWT from Authorization header, return MongoDB user doc or null. */
async function getAuthUser(request) {
  try {
    const auth = request.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const payload = verifyToken(token);
    const db = await getDb();
    return db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
  } catch {
    return null;
  }
}

const PORT = Number(process.env.PORT) || 8787;
const MAX_JSON_BYTES = 32 * 1024;

// In-memory mock user — mutated by PATCH /api/users/me so edits survive the session
let mockUser = {
  id: 'mock-user-id',
  username: 'drip_user',
  displayName: 'Drip User',
  email: 'user@drip.app',
  avatar: 'https://i.pravatar.cc/150?u=drip_user',
  bio: 'Just another fashion enthusiast 👗',
  followersCount: 3,
  followingCount: 5,
  wardrobeCount: 0,
  isVerified: true,
  isFollowing: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function makeUser(id, username, displayName, verified = false) {
  return {
    id,
    username,
    displayName,
    email: `${username}@drip.app`,
    avatar: `https://i.pravatar.cc/150?u=${username}`,
    bio: 'Living for fashion ✨',
    followersCount: Math.floor(Math.random() * 2000) + 50,
    followingCount: Math.floor(Math.random() * 500) + 20,
    wardrobeCount: Math.floor(Math.random() * 80) + 5,
    isVerified: verified,
    isFollowing: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

let CREATORS = [];
let mockFollowers = [];
let mockFollowing = [];

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) throw new RequestError(413, 'Request body is too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Request body must be valid JSON');
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  if (request.method === 'GET' && request.url === '/health') {
    return sendJson(response, 200, {
      ok: true,
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      mongoConfigured: Boolean(process.env.MONGODB_URI),
      textModel: process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
      visionModel: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
    });
  }
  if (request.method === 'GET' && request.url === '/api/wardrobe') {
    try {
      const items = await listWardrobeItems();
      return sendJson(response, 200, items.filter(item => !item.isWishlist));
    } catch (error) {
      console.error(error);
      return sendJson(response, 500, { message: 'Could not load wardrobe' });
    }
  }
  if (request.method === 'GET' && request.url === '/api/wishlist') {
    try {
      const items = await listWardrobeItems();
      return sendJson(response, 200, items.filter(item => item.isWishlist));
    } catch (error) {
      console.error(error);
      return sendJson(response, 500, { message: 'Could not load wishlist' });
    }
  }
  if (request.method === 'POST' && request.url === '/api/items') {
    try {
      return sendJson(response, 201, await createWardrobeItem(await readJson(request)));
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      if (status >= 500) console.error(error);
      return sendJson(response, status, {
        message: error instanceof RequestError ? error.message : 'Could not save wardrobe item',
      });
    }
  }

  const itemsMatch = request.url.match(/^\/api\/items\/([^/]+)$/);
  if (itemsMatch) {
    const id = itemsMatch[1];
    if (request.method === 'PUT') {
      try {
        return sendJson(response, 200, await updateWardrobeItem(id, await readJson(request)));
      } catch (error) {
        const status = error instanceof RequestError ? error.status : 500;
        return sendJson(response, status, { message: error.message || 'Could not update item' });
      }
    }
    if (request.method === 'DELETE') {
      try {
        return sendJson(response, 200, await deleteWardrobeItem(id));
      } catch (error) {
        const status = error instanceof RequestError ? error.status : 500;
        return sendJson(response, status, { message: error.message || 'Could not delete item' });
      }
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (request.method === 'POST' && request.url === '/api/auth/register') {
    try {
      const body = await readJson(request);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const displayName = String(body.displayName || body.name || '').trim();
      if (!email || !password) return sendJson(response, 400, { message: 'Email and password are required' });
      if (password.length < 8) return sendJson(response, 400, { message: 'Password must be at least 8 characters' });
      const db = await getDb();
      if (await db.collection('users').findOne({ email })) {
        return sendJson(response, 409, { code: 'ACCOUNT_EXISTS', message: 'An account with this email already exists. Please sign in instead.' });
      }
      const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_').toLowerCase().slice(0, 30);
      const safeUsername = await (async (base) => {
        let u = base, n = 1;
        while (await db.collection('users').findOne({ username: u })) u = `${base}${n++}`;
        return u;
      })(username);
      const now = new Date().toISOString();
      const { insertedId } = await db.collection('users').insertOne({
        email, password: hashPassword(password),
        username: safeUsername, displayName: displayName || safeUsername,
        avatar: `https://i.pravatar.cc/150?u=${safeUsername}`, bio: '',
        followersCount: 0, followingCount: 0, wardrobeCount: 0,
        isVerified: false, createdAt: now,
      });
      const user = await db.collection('users').findOne({ _id: insertedId });
      const token = signToken({ userId: insertedId.toString() });
      return sendJson(response, 201, { token, user: toUser(user) });
    } catch (error) {
      console.error('[register]', error);
      return sendJson(response, 500, { message: 'Registration failed. Please try again.' });
    }
  }

  if (request.method === 'POST' && request.url === '/api/auth/login') {
    try {
      const body = await readJson(request);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return sendJson(response, 400, { message: 'Email and password are required' });
      const db = await getDb();
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return sendJson(response, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'No account found with this email. Please create an account first.' });
      }
      if (!user.password || !verifyPassword(password, user.password)) {
        return sendJson(response, 401, { code: 'INVALID_PASSWORD', message: 'Incorrect password. Please try again.' });
      }
      const token = signToken({ userId: user._id.toString() });
      return sendJson(response, 200, { token, user: toUser(user) });
    } catch (error) {
      console.error('[login]', error);
      return sendJson(response, 500, { message: 'Login failed. Please try again.' });
    }
  }

  if (request.method === 'POST' && request.url === '/api/auth/google') {
    try {
      const body = await readJson(request);
      const accessToken = String(body.accessToken || '').trim();
      if (!accessToken) return sendJson(response, 400, { message: 'accessToken is required' });
      // Verify with Google userinfo endpoint
      const gRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!gRes.ok) return sendJson(response, 401, { message: 'Invalid Google token' });
      const g = await gRes.json();
      const db = await getDb();
      // Find by googleId or email
      let user = await db.collection('users').findOne({ googleId: g.id })
        ?? await db.collection('users').findOne({ email: g.email });
      if (user) {
        await db.collection('users').updateOne({ _id: user._id }, {
          $set: { googleId: g.id, avatar: g.picture || user.avatar },
        });
        user = await db.collection('users').findOne({ _id: user._id });
      } else {
        const base = (g.email || '').split('@')[0].replace(/[^a-z0-9_]/g, '_').toLowerCase().slice(0, 30) || 'user';
        let username = base, n = 1;
        while (await db.collection('users').findOne({ username })) username = `${base}${n++}`;
        const now = new Date().toISOString();
        const { insertedId } = await db.collection('users').insertOne({
          email: g.email, password: null, googleId: g.id,
          username, displayName: g.name || username,
          avatar: g.picture || `https://i.pravatar.cc/150?u=${username}`, bio: '',
          followersCount: 0, followingCount: 0, wardrobeCount: 0,
          isVerified: Boolean(g.verified_email), createdAt: now,
        });
        user = await db.collection('users').findOne({ _id: insertedId });
      }
      const token = signToken({ userId: user._id.toString() });
      return sendJson(response, 200, { token, user: toUser(user) });
    } catch (error) {
      console.error('[google-auth]', error);
      return sendJson(response, 500, { message: 'Google sign-in failed' });
    }
  }

  if (request.method === 'GET' && request.url === '/api/auth/me') {
    try {
      const user = await getAuthUser(request);
      if (!user) return sendJson(response, 401, { message: 'Unauthorized' });
      return sendJson(response, 200, toUser(user));
    } catch {
      return sendJson(response, 401, { message: 'Unauthorized' });
    }
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  if (request.method === 'GET' && (request.url === '/api/feed' || request.url?.startsWith('/api/feed?'))) {
    const feedPosts = [];
    return sendJson(response, 200, { posts: feedPosts, nextCursor: null });
  }

  // ── Listings ───────────────────────────────────────────────────────────────
  if (request.method === 'GET' && request.url === '/api/listings') {
    return sendJson(response, 200, []);
  }
  const listingMatch = request.url.match(/^\/api\/listings\/([^/]+)$/);
  if (request.method === 'GET' && listingMatch) {
    return sendJson(response, 404, { message: 'Listing not found' });
  }
  if (request.method === 'POST' && request.url === '/api/orders') {
    return sendJson(response, 201, { id: 'order-stub', ok: true, message: 'Order placed (stub)' });
  }

  // ── Post actions ───────────────────────────────────────────────────────────
  const postActionMatch = request.url.match(/^\/api\/posts\/([^/]+)\/(like|save|share|comment)$/);
  if (request.method === 'POST' && postActionMatch) {
    return sendJson(response, 200, { ok: true });
  }

  // ── User profiles ──────────────────────────────────────────────────────────
  // /api/users/following is a special top-level route (not a username)
  if (request.method === 'GET' && request.url === '/api/users/following') {
    return sendJson(response, 200, []);
  }

  // ── Current-user "me" routes (must come before generic :username match) ────
  if (request.url === '/api/users/me') {
    if (request.method === 'GET') {
      try {
        const user = await getAuthUser(request);
        if (!user) return sendJson(response, 401, { message: 'Unauthorized' });
        return sendJson(response, 200, toUser(user));
      } catch {
        return sendJson(response, 401, { message: 'Unauthorized' });
      }
    }
    if (request.method === 'PATCH') {
      try {
        const user = await getAuthUser(request);
        if (!user) return sendJson(response, 401, { message: 'Unauthorized' });
        const body = await readJson(request);
        const updates = {};
        if (body.username) updates.username = String(body.username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);
        if (body.displayName) updates.displayName = String(body.displayName).trim().slice(0, 60);
        if (body.bio !== undefined) updates.bio = String(body.bio ?? '').trim().slice(0, 300);
        if (body.avatar) updates.avatar = String(body.avatar).trim();
        const db = await getDb();
        await db.collection('users').updateOne({ _id: user._id }, { $set: updates });
        const updated = await db.collection('users').findOne({ _id: user._id });
        return sendJson(response, 200, toUser(updated));
      } catch {
        return sendJson(response, 400, { message: 'Could not update profile' });
      }
    }
  }
  if (request.method === 'POST' && request.url === '/api/users/me/avatar') {
    try {
      const user = await getAuthUser(request);
      if (!user) return sendJson(response, 401, { message: 'Unauthorized' });
      const dataUrl = await readMultipartImage(request);
      const [meta, base64Data] = dataUrl.split(',');
      const mimeType = meta.split(';')[0].replace('data:', '');
      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const filename = `avatar-${user._id}.${ext}`;
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.writeFile(join(UPLOADS_DIR, filename), Buffer.from(base64Data, 'base64'));
      const host = request.headers['host'] || `localhost:${PORT}`;
      const avatarUrl = `http://${host}/uploads/${filename}?v=${Date.now()}`;
      const db = await getDb();
      await db.collection('users').updateOne({ _id: user._id }, { $set: { avatar: avatarUrl } });
      return sendJson(response, 200, { url: avatarUrl });
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      if (status >= 500) console.error('[avatar]', error);
      return sendJson(response, status, { message: error instanceof RequestError ? error.message : 'Could not upload avatar' });
    }
  }
  if (request.url === '/api/users/me/privacy') {
    if (request.method === 'GET') return sendJson(response, 200, { visibility: 'public' });
    if (request.method === 'PATCH') return sendJson(response, 200, { ok: true });
  }
  if (request.url === '/api/users/me/notifications') {
    if (request.method === 'GET') {
      return sendJson(response, 200, {
        likes: true, comments: true, follows: true,
        offers: true, sales: true, mentions: true,
      });
    }
    if (request.method === 'PATCH') return sendJson(response, 200, { ok: true });
  }

  const userPostsMatch = request.url.match(/^\/api\/users\/([^/]+)\/posts$/);
  if (request.method === 'GET' && userPostsMatch) {
    return sendJson(response, 200, []);
  }

  const userStatsMatch = request.url.match(/^\/api\/users\/([^/]+)\/stats$/);
  if (request.method === 'GET' && userStatsMatch) {
    return sendJson(response, 200, {
      posts: 0,
      outfits: 0,
      wardrobeValue: 0,
    });
  }

  const userFollowersMatch = request.url.match(/^\/api\/users\/([^/]+)\/(followers|following)$/);
  if (request.method === 'GET' && userFollowersMatch) {
    const username = userFollowersMatch[1];
    const listType = userFollowersMatch[2];
    if (listType === 'followers') {
      return sendJson(response, 200, mockFollowers.filter((u) => u.username !== username && u.isFollowing));
    }
    return sendJson(response, 200, mockFollowing.filter((u) => u.username !== username));
  }

  const userFollowMatch = request.url.match(/^\/api\/users\/([^/]+)\/follow$/);
  if (userFollowMatch) {
    const targetUsername = userFollowMatch[1];
    if (request.method === 'POST') {
      if (!mockFollowing.some((u) => u.username === targetUsername)) {
        mockFollowing.push(makeUser(`g-${targetUsername}`, targetUsername,
          targetUsername.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())));
        mockUser.followingCount = mockFollowing.length;
      }
      return sendJson(response, 200, { ok: true });
    }
    if (request.method === 'DELETE') {
      mockFollowing = mockFollowing.filter((u) => u.username !== targetUsername);
      mockUser.followingCount = mockFollowing.length;
      return sendJson(response, 200, { ok: true });
    }
  }

  const userListingsMatch = request.url.match(/^\/api\/users\/([^/]+)\/listings$/);
  if (request.method === 'GET' && userListingsMatch) {
    return sendJson(response, 200, []);
  }

  const userMatch = request.url.match(/^\/api\/users\/([^/]+)$/);
  if (request.method === 'GET' && userMatch) {
    const uname = userMatch[1];
    const existing = [...mockFollowers, ...mockFollowing].find((u) => u.username === uname);
    if (existing) return sendJson(response, 200, { ...existing, isFollowing: mockFollowing.some((u) => u.username === uname) });
    return sendJson(response, 200, {
      ...makeUser(`u-${uname}`, uname, uname.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
      isFollowing: mockFollowing.some((u) => u.username === uname),
    });
  }

  // ── Offers ────────────────────────────────────────────────────────────────
  const offerMatch = request.url.match(/^\/api\/offers\/([^/]+)$/);
  if (offerMatch) {
    if (request.method === 'GET') {
      return sendJson(response, 404, { message: 'Offer not found' });
    }
    if (request.method === 'PATCH') {
      return sendJson(response, 200, { ok: true });
    }
  }
  if (request.method === 'POST' && request.url === '/api/offers') {
    return sendJson(response, 201, { id: 'offer-stub', ok: true });
  }
  if (request.method === 'GET' && request.url === '/api/offers') {
    return sendJson(response, 200, []);
  }

  // ── Messages / Conversations ───────────────────────────────────────────────
  if (request.method === 'GET' && request.url === '/api/conversations') {
    return sendJson(response, 200, []);
  }
  const conversationMatch = request.url.match(/^\/api\/conversations\/([^/]+)(\/messages)?$/);
  if (conversationMatch) {
    if (request.method === 'GET') return sendJson(response, 200, conversationMatch[2] ? [] : { id: conversationMatch[1] });
    if (request.method === 'POST') return sendJson(response, 201, { id: 'msg-stub', ok: true });
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  const postMatch = request.url.match(/^\/api\/posts\/([^/]+)$/);
  if (request.method === 'GET' && postMatch) {
    return sendJson(response, 404, { message: 'Post not found' });
  }
  if (request.method === 'GET' && request.url === '/api/posts') {
    return sendJson(response, 200, []);
  }

  // ── Outfits ────────────────────────────────────────────────────────────────
  if (request.method === 'POST' && request.url === '/api/outfits') {
    return sendJson(response, 201, { id: 'outfit-stub', ok: true });
  }
  if (request.method === 'GET' && request.url === '/api/outfits') {
    return sendJson(response, 200, []);
  }

  // ── AI outfit matching ────────────────────────────────────────────────────
  if (request.method === 'POST' && request.url === '/api/ai/match') {
    try {
      const body = await readJson(request);
      const allItems = await listWardrobeItems();
      const items = allItems.filter((i) => !i.isWishlist);
      if (!items.length) {
        return sendJson(response, 400, { message: 'Add items to your wardrobe first' });
      }
      const { selectedIds, reasoning } = await matchOutfitWithGroq(
        items,
        String(body.occasion || '').trim() || 'casual day out',
        body.weather ?? null,
        Array.isArray(body.colors) ? body.colors : []
      );
      const outfitItems = selectedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);
      // Fallback: pick first 3 if Groq returned nothing usable
      const finalItems = outfitItems.length ? outfitItems : items.slice(0, Math.min(3, items.length));
      return sendJson(response, 200, { outfitItems: finalItems, reasoning });
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      const message = error instanceof RequestError ? error.message : 'Could not generate outfit';
      if (status >= 500) console.error(error);
      return sendJson(response, status, { message });
    }
  }

  if (request.method === 'POST' && request.url === '/api/ai/swap') {
    try {
      const body = await readJson(request);
      const allItems = await listWardrobeItems();
      const items = allItems.filter((i) => !i.isWishlist);
      const { selectedId } = await swapOutfitItemWithGroq(
        items,
        String(body.currentItemId || ''),
        String(body.occasion || '').trim() || 'casual'
      );
      const swapped = items.find((i) => i.id === selectedId);
      if (!swapped) return sendJson(response, 404, { message: 'Replacement item not found' });
      return sendJson(response, 200, swapped);
    } catch (error) {
      const status = error instanceof RequestError ? error.status : 500;
      const message = error instanceof RequestError ? error.message : 'Could not swap item';
      if (status >= 500) console.error(error);
      return sendJson(response, status, { message });
    }
  }

  // ── Uploaded file serving ─────────────────────────────────────────────────
  const uploadsMatch = (request.url.split('?')[0]).match(/^\/uploads\/([a-zA-Z0-9_.\-]+)$/);
  if (request.method === 'GET' && uploadsMatch) {
    try {
      const filename = uploadsMatch[1];
      const data = await fs.readFile(join(UPLOADS_DIR, filename));
      const ext = (filename.split('.').pop() || '').toLowerCase();
      const contentType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' });
      return response.end(data);
    } catch {
      return sendJson(response, 404, { message: 'Not found' });
    }
  }

  // ── AI item routes ─────────────────────────────────────────────────────────
  const supportedRoute = request.url === '/api/items/import-url' || request.url === '/api/items/analyze-url' || request.url === '/api/items/analyze' || request.url === '/api/items/remove-bg';
  if (request.method !== 'POST' || !supportedRoute) {
    return sendJson(response, 404, { message: 'Route not found' });
  }

  // Handle remove-bg stub (no implementation — let the app fall back gracefully)
  if (request.url === '/api/items/remove-bg') {
    return sendJson(response, 501, { message: 'Background removal is not configured on this server' });
  }

  try {
    if (request.url === '/api/items/import-url') {
      const body = await readJson(request);
      if (typeof body.url !== 'string' || !body.url.trim()) throw new RequestError(400, 'Product URL is required');
      const { html, finalUrl } = await fetchProductPage(body.url.trim());
      const context = extractProductContext(html, finalUrl);
      return sendJson(response, 200, await extractWardrobeItemWithGroq(context));
    }

    if (request.url === '/api/items/analyze-url') {
      const body = await readJson(request);
      if (typeof body.imageUrl !== 'string' || !body.imageUrl.trim()) throw new RequestError(400, 'Image URL is required');
      const imageUrl = (await validatePublicUrl(body.imageUrl.trim())).href;
      return sendJson(response, 200, await extractWardrobeItemFromImage(imageUrl, imageUrl));
    }

    const imageDataUrl = await readMultipartImage(request);
    return sendJson(response, 200, await extractWardrobeItemFromImage(imageDataUrl));
  } catch (error) {
    const status = error instanceof RequestError ? error.status : error?.name === 'TimeoutError' ? 504 : 500;
    const message = error instanceof RequestError ? error.message : error?.name === 'TimeoutError' ? 'The request timed out' : 'Could not analyze this item';
    if (status >= 500) console.error(error);
    return sendJson(response, status, { message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Wardrobe API listening on http://0.0.0.0:${PORT}`);
  console.log(`   GROQ_API_KEY   : ${process.env.GROQ_API_KEY ? '✅ SET (' + process.env.GROQ_API_KEY.slice(0, 8) + '...)' : '❌ MISSING'}`);
  console.log(`   GROQ_TEXT_MODEL: ${process.env.GROQ_TEXT_MODEL || '⚠️  not set, using default'}`);
  console.log(`   GROQ_VISION_MODEL: ${process.env.GROQ_VISION_MODEL || '⚠️  not set, using default'}`);
  console.log(`   MONGODB_URI    : ${process.env.MONGODB_URI ? '✅ SET' : '⚠️  not set, using local file storage'}`);
  console.log(`   Health check   : http://0.0.0.0:${PORT}/health\n`);
});
