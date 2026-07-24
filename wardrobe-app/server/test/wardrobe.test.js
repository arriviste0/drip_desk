import test from 'node:test';
import assert from 'node:assert/strict';
import { createWardrobeItem } from '../src/wardrobe.js';

test('rejects wardrobe items without required fields', async () => {
  await assert.rejects(() => createWardrobeItem({ category: 'tops' }), /Name is required/);
  await assert.rejects(() => createWardrobeItem({ name: 'Shirt', category: 'invalid' }), /valid category/);
});
