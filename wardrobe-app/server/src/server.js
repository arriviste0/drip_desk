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
  function toDbItem(doc) {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name || '',
      brand: doc.brand,
      category: doc.category || 'tops',
      itemType: doc.itemType,
      color: doc.color || [],
      primaryColor: doc.primaryColor,
      secondaryColor: doc.secondaryColor,
      size: doc.size,
      material: doc.material,
      pattern: doc.pattern,
      seasons: doc.seasons || [],
      occasions: doc.occasions || [],
      imageUrl: doc.imageUrl || '',
      wearCount: doc.wearCount || 0,
      purchasePrice: doc.purchasePrice,
      currency: doc.currency || 'USD',
      notes: doc.notes,
      productUrl: doc.productUrl,
      isWishlist: Boolean(doc.isWishlist),
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    };
  }

  if (request.method === 'GET' && request.url === '/api/wardrobe') {
    try {
      const user = await getAuthUser(request);
      if (!user) return sendJson(response, 200, []);
      const db = await getDb();
      const items = await db.collection('items').find({ userId: user._id.toString(), isWishlist: { $ne: true } }).toArray();
      return sendJson(response, 200, items.map(toDbItem));
    } catch (error) {
      console.error('[wardrobe-get]', error);
      return sendJson(response, 500, { message: 'Could not load wardrobe' });
    }
  }

  if (request.method === 'GET' && request.url === '/api/wishlist') {
    try {
      const user = await getAuthUser(request);
      if (!user) return sendJson(response, 200, []);
      const db = await getDb();
      const items = await db.collection('items').find({ userId: user._id.toString(), isWishlist: true }).toArray();
      return sendJson(response, 200, items.map(toDbItem));
    } catch (error) {
      console.error('[wishlist-get]', error);
      return sendJson(response, 500, { message: 'Could not load wishlist' });
    }
  }

  if (request.method === 'POST' && request.url === '/api/items') {
    try {
      const user = await getAuthUser(request);
      const body = await readJson(request);
      const db = await getDb();
      const now = new Date().toISOString();
      const doc = {
        userId: user ? user._id.toString() : 'guest',
        name: String(body.name || '').trim(),
        brand: body.brand ? String(body.brand).trim() : undefined,
        category: String(body.category || 'tops').toLowerCase(),
        itemType: body.itemType ? String(body.itemType).trim() : undefined,
        color: Array.isArray(body.color) ? body.color : [],
        primaryColor: body.primaryColor ? String(body.primaryColor).trim() : undefined,
        secondaryColor: body.secondaryColor ? String(body.secondaryColor).trim() : undefined,
        size: body.size ? String(body.size).trim() : undefined,
        material: body.material ? String(body.material).trim() : undefined,
        pattern: body.pattern ? String(body.pattern).trim() : undefined,
        seasons: Array.isArray(body.seasons) ? body.seasons : [],
        occasions: Array.isArray(body.occasions) ? body.occasions : [],
        imageUrl: String(body.imageUrl || '').trim(),
        wearCount: 0,
        purchasePrice: Number.isFinite(Number(body.purchasePrice)) ? Number(body.purchasePrice) : undefined,
        currency: String(body.currency || 'USD').toUpperCase(),
        notes: body.notes ? String(body.notes).trim() : undefined,
        productUrl: body.productUrl ? String(body.productUrl).trim() : undefined,
        isWishlist: Boolean(body.isWishlist),
        createdAt: now,
        updatedAt: now,
      };
      const { insertedId } = await db.collection('items').insertOne(doc);
      if (user && !body.isWishlist) {
        await db.collection('users').updateOne({ _id: user._id }, { $inc: { wardrobeCount: 1 } });
      }
      return sendJson(response, 201, toDbItem({ _id: insertedId, ...doc }));
    } catch (error) {
      console.error('[item-create]', error);
      return sendJson(response, 500, { message: 'Could not save wardrobe item' });
    }
  }

  const itemsMatch = request.url.match(/^\/api\/items\/([^/]+)$/);
  if (itemsMatch) {
    const itemId = itemsMatch[1];
    if (request.method === 'PUT') {
      try {
        const body = await readJson(request);
        const db = await getDb();
        const query = ObjectId.isValid(itemId) ? { _id: new ObjectId(itemId) } : { _id: itemId };
        await db.collection('items').updateOne(query, { $set: { ...body, updatedAt: new Date().toISOString() } });
        const updated = await db.collection('items').findOne(query);
        return sendJson(response, 200, updated ? toDbItem(updated) : { id: itemId, ...body });
      } catch (error) {
        console.error('[item-update]', error);
        return sendJson(response, 500, { message: 'Could not update item' });
      }
    }
    if (request.method === 'DELETE') {
      try {
        const db = await getDb();
        const query = ObjectId.isValid(itemId) ? { _id: new ObjectId(itemId) } : { _id: itemId };
        const existing = await db.collection('items').findOne(query);
        await db.collection('items').deleteOne(query);
        return sendJson(response, 200, existing ? toDbItem(existing) : { id: itemId });
      } catch (error) {
        console.error('[item-delete]', error);
        return sendJson(response, 500, { message: 'Could not delete item' });
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

  // ── Posts CRUD ─────────────────────────────────────────────────────────────
  if (request.method === 'POST' && request.url === '/api/posts') {
    try {
      const user = await getAuthUser(request);
      if (!user) return sendJson(response, 401, { message: 'Unauthorized' });
      const body = await readJson(request);
      const db = await getDb();
      const now = new Date().toISOString();
      const postDoc = {
        userId: user._id.toString(),
        username: user.username,
        userAvatar: user.avatar || null,
        userDisplayName: user.displayName || user.username,
        isVerified: user.isVerified || false,
        images: Array.isArray(body.images) ? body.images : [],
        caption: body.caption ? String(body.caption).trim() : '',
        tags: Array.isArray(body.tags) ? body.tags : [],
        likeCount: 0,
        commentCount: 0,
        likedBy: [],
        savedBy: [],
        createdAt: now,
        updatedAt: now,
      };
      const { insertedId } = await db.collection('posts').insertOne(postDoc);
      return sendJson(response, 201, {
        id: insertedId.toString(),
        user: { username: user.username, avatarUrl: user.avatar, isVerified: user.isVerified || false },
        images: postDoc.images,
        caption: postDoc.caption,
        tags: postDoc.tags,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isSaved: false,
        createdAt: now,
      });
    } catch (error) {
      console.error('[post-create]', error);
      return sendJson(response, 500, { message: 'Could not create post' });
    }
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  if (request.method === 'GET' && (request.url === '/api/feed' || request.url?.startsWith('/api/feed?'))) {
    try {
      const authUser = await getAuthUser(request);
      const db = await getDb();
      const posts = await db.collection('posts').find({}).sort({ createdAt: -1 }).limit(100).toArray();
      const feedPosts = posts.map((p) => {
        const isLiked = authUser ? (p.likedBy || []).includes(authUser._id.toString()) : false;
        const isSaved = authUser ? (p.savedBy || []).includes(authUser._id.toString()) : false;
        return {
          id: p._id.toString(),
          user: { username: p.username, avatarUrl: p.userAvatar, isVerified: p.isVerified || false },
          images: p.images || [],
          caption: p.caption || '',
          tags: p.tags || [],
          likeCount: p.likeCount || 0,
          commentCount: p.commentCount || 0,
          isLiked,
          isSaved,
          createdAt: p.createdAt,
        };
      });
      return sendJson(response, 200, { posts: feedPosts, nextCursor: null });
    } catch (error) {
      console.error('[feed-get]', error);
      return sendJson(response, 200, { posts: [], nextCursor: null });
    }
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

  // ── Single Post routes ────────────────────────────────────────────────────
  const singlePostMatch = request.url.match(/^\/api\/posts\/([^/]+)$/);
  if (singlePostMatch) {
    const postId = singlePostMatch[1];
    if (request.method === 'GET') {
      try {
        const authUser = await getAuthUser(request);
        const db = await getDb();
        const query = ObjectId.isValid(postId) ? { _id: new ObjectId(postId) } : { _id: postId };
        const post = await db.collection('posts').findOne(query);
        if (!post) return sendJson(response, 404, { message: 'Post not found' });
        const uid = authUser ? authUser._id.toString() : '';
        return sendJson(response, 200, {
          id: post._id.toString(),
          author: {
            id: post.userId,
            username: post.username,
            displayName: post.userDisplayName || post.username,
            email: '',
            avatar: post.userAvatar || null,
            followersCount: 0,
            followingCount: 0,
            wardrobeCount: 0,
            isVerified: post.isVerified || false,
            createdAt: post.createdAt,
          },
          imageUrl: (post.images || [])[0] || '',
          caption: post.caption || '',
          tags: post.tags || [],
          hashtags: [],
          likesCount: post.likeCount || 0,
          commentsCount: post.commentCount || 0,
          isLiked: (post.likedBy || []).includes(uid),
          isSaved: (post.savedBy || []).includes(uid),
          createdAt: post.createdAt,
        });
      } catch (error) {
        console.error('[post-get-one]', error);
        return sendJson(response, 500, { message: 'Could not fetch post' });
      }
    }
    if (request.method === 'DELETE') {
      try {
        const authUser = await getAuthUser(request);
        if (!authUser) return sendJson(response, 401, { message: 'Unauthorized' });
        const db = await getDb();
        const query = ObjectId.isValid(postId) ? { _id: new ObjectId(postId) } : { _id: postId };
        const post = await db.collection('posts').findOne(query);
        if (!post) return sendJson(response, 404, { message: 'Post not found' });
        if (post.userId !== authUser._id.toString()) return sendJson(response, 403, { message: 'Not authorized' });
        await db.collection('posts').deleteOne(query);
        return sendJson(response, 200, { ok: true });
      } catch (error) {
        console.error('[post-delete]', error);
        return sendJson(response, 500, { message: 'Could not delete post' });
      }
    }
    if (request.method === 'PATCH') {
      try {
        const authUser = await getAuthUser(request);
        if (!authUser) return sendJson(response, 401, { message: 'Unauthorized' });
        const body = await readJson(request);
        const db = await getDb();
        const query = ObjectId.isValid(postId) ? { _id: new ObjectId(postId) } : { _id: postId };
        const post = await db.collection('posts').findOne(query);
        if (!post) return sendJson(response, 404, { message: 'Post not found' });
        if (post.userId !== authUser._id.toString()) return sendJson(response, 403, { message: 'Not authorized' });
        const updates = {};
        if (body.caption !== undefined) updates.caption = String(body.caption).trim();
        updates.updatedAt = new Date().toISOString();
        await db.collection('posts').updateOne(query, { $set: updates });
        return sendJson(response, 200, { ok: true });
      } catch (error) {
        console.error('[post-edit]', error);
        return sendJson(response, 500, { message: 'Could not edit post' });
      }
    }
  }

  // ── Post actions (like/save/share/comment) ────────────────────────────────
  const postActionMatch = request.url.match(/^\/api\/posts\/([^/]+)\/(like|save|share|comment)$/);
  if (request.method === 'POST' && postActionMatch) {
    const postId = postActionMatch[1];
    const action = postActionMatch[2];
    try {
      const authUser = await getAuthUser(request);
      if (!authUser) return sendJson(response, 200, { ok: true });
      const db = await getDb();
      const uid = authUser._id.toString();
      const query = ObjectId.isValid(postId) ? { _id: new ObjectId(postId) } : { _id: postId };

      if (action === 'like') {
        const post = await db.collection('posts').findOne(query);
        if (post) {
          const alreadyLiked = (post.likedBy || []).includes(uid);
          if (alreadyLiked) {
            await db.collection('posts').updateOne(query, { $pull: { likedBy: uid }, $inc: { likeCount: -1 } });
          } else {
            await db.collection('posts').updateOne(query, { $addToSet: { likedBy: uid }, $inc: { likeCount: 1 } });
          }
        }
      } else if (action === 'save') {
        const post = await db.collection('posts').findOne(query);
        if (post) {
          const alreadySaved = (post.savedBy || []).includes(uid);
          if (alreadySaved) {
            await db.collection('posts').updateOne(query, { $pull: { savedBy: uid } });
          } else {
            await db.collection('posts').updateOne(query, { $addToSet: { savedBy: uid } });
          }
        }
      }
      return sendJson(response, 200, { ok: true });
    } catch (error) {
      console.error('[post-action]', error);
      return sendJson(response, 200, { ok: true });
    }
  }

  // ── User profiles ──────────────────────────────────────────────────────────
  if (request.method === 'GET' && (request.url === '/api/users' || request.url.startsWith('/api/users?'))) {
    try {
      const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const q = parsedUrl.searchParams.get('q') || '';
      const db = await getDb();
      let query = {};
      if (q.trim()) {
        const regex = { $regex: q.trim(), $options: 'i' };
        query = { $or: [{ username: regex }, { displayName: regex }] };
      }
      // Return top 50 users
      const users = await db.collection('users').find(query).limit(50).toArray();
      return sendJson(response, 200, users.map(toUser));
    } catch (error) {
      console.error('[users-search]', error);
      return sendJson(response, 500, { message: 'Failed to search users' });
    }
  }

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
    const uname = userPostsMatch[1];
    try {
      const authUser = await getAuthUser(request);
      const db = await getDb();
      const posts = await db.collection('posts').find({ username: uname }).sort({ createdAt: -1 }).toArray();
      const mapped = posts.map((p) => {
        const uid = authUser ? authUser._id.toString() : '';
        return {
          id: p._id.toString(),
          author: {
            id: p.userId,
            username: p.username,
            displayName: p.userDisplayName || p.username,
            email: '',
            avatar: p.userAvatar || null,
            followersCount: 0,
            followingCount: 0,
            wardrobeCount: 0,
            isVerified: p.isVerified || false,
            createdAt: p.createdAt,
          },
          imageUrl: (p.images || [])[0] || '',
          caption: p.caption || '',
          tags: p.tags || [],
          hashtags: [],
          likesCount: p.likeCount || 0,
          commentsCount: p.commentCount || 0,
          isLiked: (p.likedBy || []).includes(uid),
          isSaved: (p.savedBy || []).includes(uid),
          createdAt: p.createdAt,
        };
      });
      return sendJson(response, 200, mapped);
    } catch (error) {
      console.error('[user-posts]', error);
      return sendJson(response, 200, []);
    }
  }

  const userStatsMatch = request.url.match(/^\/api\/users\/([^/]+)\/stats$/);
  if (request.method === 'GET' && userStatsMatch) {
    const uname = userStatsMatch[1];
    try {
      const db = await getDb();
      const user = await db.collection('users').findOne({ username: uname });
      const userId = user ? user._id.toString() : null;
      const postCount = userId ? await db.collection('posts').countDocuments({ username: uname }) : 0;
      const items = userId ? await db.collection('items').find({ userId, isWishlist: { $ne: true } }).toArray() : [];
      const wardrobeValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
      return sendJson(response, 200, {
        posts: postCount,
        outfits: 0,
        wardrobeValue,
      });
    } catch (error) {
      console.error('[user-stats]', error);
      return sendJson(response, 200, { posts: 0, outfits: 0, wardrobeValue: 0 });
    }
  }

  const userFollowersMatch = request.url.match(/^\/api\/users\/([^/]+)\/(followers|following)$/);
  if (request.method === 'GET' && userFollowersMatch) {
    try {
      const username = userFollowersMatch[1];
      const listType = userFollowersMatch[2];
      const db = await getDb();
      if (listType === 'followers') {
        const follows = await db.collection('follows').find({ targetUsername: username }).toArray();
        const followerIds = follows.map((f) => f.followerId);
        const users = await db.collection('users').find({ _id: { $in: followerIds } }).toArray();
        return sendJson(response, 200, users.map(toUser));
      } else {
        const user = await db.collection('users').findOne({ username });
        if (!user) return sendJson(response, 200, []);
        const follows = await db.collection('follows').find({ followerId: user._id }).toArray();
        const targetUsernames = follows.map((f) => f.targetUsername);
        const users = await db.collection('users').find({ username: { $in: targetUsernames } }).toArray();
        return sendJson(response, 200, users.map(toUser));
      }
    } catch {
      return sendJson(response, 200, []);
    }
  }

  const userFollowMatch = request.url.match(/^\/api\/users\/([^/]+)\/follow$/);
  if (userFollowMatch) {
    const targetUsername = userFollowMatch[1];
    try {
      const authUser = await getAuthUser(request);
      if (!authUser) return sendJson(response, 401, { message: 'Unauthorized' });
      const db = await getDb();

      if (request.method === 'POST') {
        const existing = await db.collection('follows').findOne({ followerId: authUser._id, targetUsername });
        if (!existing) {
          await db.collection('follows').insertOne({ followerId: authUser._id, targetUsername, createdAt: new Date().toISOString() });
          await db.collection('users').updateOne({ _id: authUser._id }, { $inc: { followingCount: 1 } });
          await db.collection('users').updateOne({ username: targetUsername }, { $inc: { followersCount: 1 } });
        }
        return sendJson(response, 200, { ok: true });
      }

      if (request.method === 'DELETE') {
        const existing = await db.collection('follows').findOne({ followerId: authUser._id, targetUsername });
        if (existing) {
          await db.collection('follows').deleteOne({ _id: existing._id });
          await db.collection('users').updateOne({ _id: authUser._id }, { $inc: { followingCount: -1 } });
          await db.collection('users').updateOne({ username: targetUsername }, { $inc: { followersCount: -1 } });
        }
        return sendJson(response, 200, { ok: true });
      }
    } catch (err) {
      console.error('[follow-mutation]', err);
      return sendJson(response, 500, { message: 'Failed to update follow' });
    }
  }

  const userListingsMatch = request.url.match(/^\/api\/users\/([^/]+)\/listings$/);
  if (request.method === 'GET' && userListingsMatch) {
    return sendJson(response, 200, []);
  }

  const userMatch = request.url.match(/^\/api\/users\/([^/]+)$/);
  if (request.method === 'GET' && userMatch) {
    const uname = userMatch[1];
    try {
      const authUser = await getAuthUser(request);
      const db = await getDb();
      const dbUser = await db.collection('users').findOne({ username: uname });
      let isFollowing = false;
      if (authUser) {
        const followDoc = await db.collection('follows').findOne({ followerId: authUser._id, targetUsername: uname });
        isFollowing = Boolean(followDoc);
      }
      if (dbUser) {
        return sendJson(response, 200, {
          ...toUser(dbUser),
          isFollowing,
        });
      }
    } catch (err) {
      console.error('[user-profile]', err);
    }
    return sendJson(response, 200, {
      ...makeUser(`u-${uname}`, uname, uname.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
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
