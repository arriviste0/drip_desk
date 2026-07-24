import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase().split('%')[0];
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

export function isPrivateAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

export async function validatePublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new RequestError(400, 'Enter a valid product URL');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new RequestError(400, 'Only public HTTP or HTTPS product URLs are allowed');
  }
  if ((url.protocol === 'http:' && url.port && url.port !== '80') || (url.protocol === 'https:' && url.port && url.port !== '443')) {
    throw new RequestError(400, 'Custom URL ports are not allowed');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw new RequestError(400, 'Private network URLs are not allowed');
  }

  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new RequestError(400, 'The product URL host could not be resolved');
  }
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new RequestError(400, 'Private network URLs are not allowed');
  }
  return url;
}

async function readBoundedText(response) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_BYTES) {
    throw new RequestError(413, 'The product page is too large');
  }

  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new RequestError(413, 'The product page is too large');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function fetchProductPage(inputUrl) {
  let currentUrl = await validatePublicUrl(inputUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'WardrobeImporter/1.0',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirect === MAX_REDIRECTS) throw new RequestError(400, 'Too many product-page redirects');
      const location = response.headers.get('location');
      if (!location) throw new RequestError(400, 'Invalid product-page redirect');
      currentUrl = await validatePublicUrl(new URL(location, currentUrl).href);
      continue;
    }

    if (!response.ok) throw new RequestError(422, `Product page returned HTTP ${response.status}`);
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new RequestError(415, 'The URL does not point to an HTML product page');
    }
    return { html: await readBoundedText(response), finalUrl: currentUrl.href };
  }

  throw new RequestError(400, 'Could not load the product page');
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? '');
  }
  return result;
}

function findProducts(value, products = []) {
  if (!value || typeof value !== 'object') return products;
  if (Array.isArray(value)) {
    value.forEach((entry) => findProducts(entry, products));
    return products;
  }
  const type = value['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) products.push(value);
  Object.values(value).forEach((entry) => findProducts(entry, products));
  return products;
}

export function extractProductContext(html, finalUrl) {
  const metadata = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = attributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    if (key && attrs.content && attrs.content.length <= 5_000) metadata[key] = attrs.content;
  }

  const products = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      findProducts(JSON.parse(decodeEntities(match[1].trim())), products);
    } catch {
      // Ignore malformed merchant JSON-LD and continue with other page signals.
    }
  }

  const candidateImages = new Set();
  const addImage = (value) => {
    if (Array.isArray(value)) return value.forEach(addImage);
    if (value && typeof value === 'object') return addImage(value.url || value.contentUrl);
    if (typeof value !== 'string' || !value.trim()) return;
    try {
      const imageUrl = new URL(value.trim(), finalUrl);
      if (['http:', 'https:'].includes(imageUrl.protocol)) candidateImages.add(imageUrl.href);
    } catch {
      // Ignore malformed merchant image URLs.
    }
  };
  addImage(metadata['og:image']);
  addImage(metadata['twitter:image']);
  products.forEach((product) => addImage(product.image));
  for (const match of html.matchAll(/<(?:div|figure)\b[^>]*class=["'][^"']*(?:view-product|product-image|product-gallery|gallery)[^"']*["'][^>]*>[\s\S]{0,2500}?<img\b([^>]*)>/gi)) {
    const attrs = attributes(`<img ${match[1]}>`);
    addImage(attrs['data-zoom-image'] || attrs['data-src'] || attrs.src);
  }

  const text = decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  ).slice(0, 18_000);

  return {
    url: finalUrl,
    metadata,
    structuredProducts: products.slice(0, 3),
    candidateImages: [...candidateImages].slice(0, 8),
    visibleText: text,
  };
}
