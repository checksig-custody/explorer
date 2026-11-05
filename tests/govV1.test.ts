import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proposalAdapter } from '../src/libs/api/govV1.ts';

const wire = (fields: Record<string, unknown>) =>
  fields as Parameters<typeof proposalAdapter>[0];

test('the first message becomes the content, or its inner content when set', () => {
  const inner = { '@type': 'inner' };
  const outer = { '@type': 'outer', content: inner };
  const a = proposalAdapter(wire({ messages: [outer] }));
  assert.equal(a.content, inner);
  const b = proposalAdapter(wire({ messages: [{ '@type': 'plain' }] }));
  assert.deepEqual(b.content, { '@type': 'plain' });
});

test('an empty inner content falls back to the message, as `||` did', () => {
  const message = { '@type': 'outer', content: '' };
  const p = proposalAdapter(wire({ messages: [message] }));
  assert.equal(p.content, message);
});

test('the id, and the tally counts under the names the app reads', () => {
  const p = proposalAdapter(
    wire({
      id: '7',
      final_tally_result: { yes_count: '1', no_count: '2' },
    })
  );
  assert.equal(p.proposal_id, '7');
  assert.deepEqual(p.final_tally_result, {
    yes: '1',
    no: '2',
    no_with_veto: undefined,
    abstain: undefined,
  });
  const q = proposalAdapter(wire({ id: '7' }), false);
  assert.equal(q.proposal_id, undefined);
});
