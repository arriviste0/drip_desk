import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RequestError } from './product-page.js';

const CATEGORIES = new Set(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags']);
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.data');
const DATA_FILE = path.join(DATA_DIR, 'wardrobe.json');

function cleanString(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanStringArray(value, maxItems = 20) {
  return Array.isArray(value)
    ? value.map((entry) => cleanString(entry, 100)).filter(Boolean).slice(0, maxItems)
    : [];
}

async function readItems() {
  try {
    const value = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeItems(items) {
  await mkdir(DATA_DIR, { recursive: true });
  const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(items, null, 2), 'utf8');
  await rename(temporaryFile, DATA_FILE);
}

export async function listWardrobeItems() {
  return readItems();
}

export async function createWardrobeItem(value) {
  const name = cleanString(value?.name, 160);
  const category = cleanString(value?.category, 40).toLowerCase();
  if (!name) throw new RequestError(400, 'Name is required');
  if (!CATEGORIES.has(category)) throw new RequestError(400, 'A valid category is required');

  const price = Number(value?.purchasePrice);
  const primaryColor = cleanString(value?.primaryColor, 80);
  const secondaryColor = cleanString(value?.secondaryColor, 80);
  const suppliedColors = cleanStringArray(value?.color, 2);
  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    userId: 'local-user',
    name,
    brand: cleanString(value?.brand, 100) || undefined,
    category,
    itemType: cleanString(value?.itemType, 100) || undefined,
    color: suppliedColors.length ? suppliedColors : [primaryColor, secondaryColor].filter(Boolean),
    primaryColor: primaryColor || undefined,
    secondaryColor: secondaryColor || undefined,
    size: cleanString(value?.size, 80) || undefined,
    material: cleanString(value?.material, 160) || undefined,
    pattern: cleanString(value?.pattern, 100) || undefined,
    seasons: cleanStringArray(value?.seasons, 4),
    occasions: cleanStringArray(value?.occasions, 10),
    imageUrl: cleanString(value?.imageUrl, 2_000),
    tags: cleanStringArray(value?.tags, 20),
    wearCount: 0,
    purchasePrice: Number.isFinite(price) && price >= 0 ? price : undefined,
    currency: cleanString(value?.currency, 8).toUpperCase() || 'USD',
    notes: cleanString(value?.notes, 1_500) || undefined,
    productUrl: cleanString(value?.productUrl, 2_000) || undefined,
    isForSale: false,
    isWishlist: Boolean(value?.isWishlist),
    createdAt: now,
    updatedAt: now,
  };

  const items = await readItems();
  items.unshift(item);
  await writeItems(items);
  return item;
}

export async function updateWardrobeItem(id, value) {
  const items = await readItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new RequestError(404, 'Item not found');

  const item = items[index];
  if (value.name !== undefined) item.name = cleanString(value.name, 160);
  if (value.category !== undefined) {
    const category = cleanString(value.category, 40).toLowerCase();
    if (CATEGORIES.has(category)) item.category = category;
  }
  if (value.brand !== undefined) item.brand = cleanString(value.brand, 100) || undefined;
  if (value.itemType !== undefined) item.itemType = cleanString(value.itemType, 100) || undefined;
  if (value.purchasePrice !== undefined) {
    const price = Number(value.purchasePrice);
    item.purchasePrice = Number.isFinite(price) && price >= 0 ? price : undefined;
  }
  if (value.primaryColor !== undefined) item.primaryColor = cleanString(value.primaryColor, 80) || undefined;
  if (value.secondaryColor !== undefined) item.secondaryColor = cleanString(value.secondaryColor, 80) || undefined;
  if (value.size !== undefined) item.size = cleanString(value.size, 80) || undefined;
  if (value.material !== undefined) item.material = cleanString(value.material, 160) || undefined;
  if (value.pattern !== undefined) item.pattern = cleanString(value.pattern, 100) || undefined;
  if (value.seasons !== undefined) item.seasons = cleanStringArray(value.seasons, 4);
  if (value.occasions !== undefined) item.occasions = cleanStringArray(value.occasions, 10);
  if (value.tags !== undefined) item.tags = cleanStringArray(value.tags, 20);
  if (value.notes !== undefined) item.notes = cleanString(value.notes, 1_500) || undefined;
  if (value.productUrl !== undefined) item.productUrl = cleanString(value.productUrl, 2_000) || undefined;
  if (value.imageUrl !== undefined) item.imageUrl = cleanString(value.imageUrl, 2_000);
  if (value.isWishlist !== undefined) item.isWishlist = Boolean(value.isWishlist);

  item.updatedAt = new Date().toISOString();

  await writeItems(items);
  return item;
}

export async function deleteWardrobeItem(id) {
  const items = await readItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new RequestError(404, 'Item not found');

  const [deleted] = items.splice(index, 1);
  await writeItems(items);
  return deleted;
}
