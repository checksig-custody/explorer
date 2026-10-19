import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillBlock } from '../src/libs/uptime.ts';
import type { BlockColor, UptimeBlock } from '../src/libs/uptime.ts';

const validators = [{ base64: 'a' }, { base64: 'b' }];
const block = (flag?: string): UptimeBlock => ({
  block: {
    header: { height: '7' },
    last_commit: {
      signatures: flag ? [{ validator_address: 'a', block_id_flag: flag }] : [],
    },
  },
});

test('a failed block fetch (an empty reply) leaves the grid as it was', () => {
  const colors: Record<string, BlockColor[]> = {};
  // fetchBlock returns {} when the node does not answer
  assert.doesNotThrow(() => {
    fillBlock(colors, validators, {} as UptimeBlock, 'start');
  });
  assert.deepEqual(colors, {});
});

test('a signer is green, a non-signer is red, a nil vote is yellow', () => {
  const colors: Record<string, BlockColor[]> = {};
  fillBlock(colors, validators, block('BLOCK_ID_FLAG_COMMIT'));
  fillBlock(colors, validators, block('BLOCK_ID_FLAG_NIL'));
  assert.deepEqual(
    colors['a']?.map((c) => c.color),
    ['bg-green-500', 'bg-yellow-500']
  );
  assert.deepEqual(
    colors['b']?.map((c) => c.color),
    ['bg-red-500', 'bg-red-500']
  );
});

test('an older block goes first and a row keeps at most 50 blocks', () => {
  const colors: Record<string, BlockColor[]> = {};
  fillBlock(colors, validators, block());
  fillBlock(colors, validators, block('BLOCK_ID_FLAG_COMMIT'), 'start');
  assert.equal(colors['a']?.[0]?.color, 'bg-green-500');
  for (let i = 0; i < 60; i += 1) fillBlock(colors, validators, block());
  assert.equal(colors['a']?.length, 50);
});

test('a block with no last commit counts as not signed', () => {
  const colors: Record<string, BlockColor[]> = {};
  fillBlock(colors, validators, { block: { header: { height: '3' } } });
  assert.equal(colors['a']?.[0]?.color, 'bg-red-500');
});
