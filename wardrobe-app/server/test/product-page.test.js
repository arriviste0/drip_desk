import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProductContext, isPrivateAddress, validatePublicUrl } from '../src/product-page.js';
import { normalizeWardrobeItem } from '../src/groq.js';

test('blocks private network addresses and localhost URLs', async () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true);
  assert.equal(isPrivateAddress('10.0.2.2'), true);
  assert.equal(isPrivateAddress('192.168.1.10'), true);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
  await assert.rejects(() => validatePublicUrl('http://localhost/product'), /Private network/);
});

test('extracts metadata, JSON-LD products, and readable text', () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Oxford Shirt">
      <script type="application/ld+json">{"@type":"Product","name":"Oxford Shirt","brand":"Acme"}</script>
    </head><body><div class="product-image"><img src="/images/shirt.jpg"></div><h1>Oxford Shirt</h1><p>Blue cotton shirt.</p></body></html>`;
  const context = extractProductContext(html, 'https://example.com/shirt');
  assert.equal(context.metadata['og:title'], 'Oxford Shirt');
  assert.equal(context.structuredProducts[0].brand, 'Acme');
  assert.equal(context.candidateImages[0], 'https://example.com/images/shirt.jpg');
  assert.match(context.visibleText, /Blue cotton shirt/);
});

test('normalizes Groq output to the app wardrobe schema', () => {
  const item = normalizeWardrobeItem({
    name: 'Oxford Shirt',
    category: 'shirt',
    primaryColor: 'Navy Blue',
    occasions: ['Work'],
    price: '49.95',
    currency: 'usd',
  }, 'https://example.com/shirt');
  assert.equal(item.category, 'tops');
  assert.equal(item.purchasePrice, 49.95);
  assert.equal(item.currency, 'USD');
  assert.equal(item.productUrl, 'https://example.com/shirt');
});
