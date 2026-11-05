import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFeatured } from '../src/libs/featured.ts';
import type { FeaturedInfo } from '../src/libs/featured.ts';

// A node may omit the moniker; the types call it required.
const who = (fields: Partial<FeaturedInfo>) => fields as FeaturedInfo;

test('a validator whose website ends with an endpoint provider is featured', () => {
  assert.equal(
    isFeatured(['ping'], who({ website: 'https://ping.pub', moniker: 'x' })),
    true
  );
});

test('a website match does not need a moniker', () => {
  assert.equal(
    isFeatured(['ping'], who({ website: 'https://ping.pub' })),
    true
  );
});

test('a validator with neither a matching website nor a moniker is not featured', () => {
  assert.equal(isFeatured(['ping'], who({})), false);
  assert.equal(
    isFeatured(['ping'], who({ website: 'https://other.org' })),
    false
  );
});

test('the moniker is matched without regard to case', () => {
  assert.equal(isFeatured(['ping'], who({ moniker: 'My PING node' })), true);
  assert.equal(
    isFeatured(['ping'], who({ website: '', moniker: 'My PING node' })),
    true
  );
});

test('no validator is not featured', () => {
  assert.equal(isFeatured(['ping'], undefined), false);
});
