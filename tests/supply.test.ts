import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supplyRow } from '../src/libs/supply.ts';

const amount = (denom: string) => `amount of ${denom}`;

test('a denom with no asset config and no metadata still gets a row', () => {
  const row = supplyRow({ denom: 'ibc/ab12', amount: '5' }, undefined, amount);
  assert.deepEqual(row, {
    denom: 'AB12',
    amount: 'amount of ibc/ab12',
    base: 'ibc/ab12',
    info: 'ibc/ab12',
    logo: '/logo.svg',
  });
});

test('the asset symbol, base, display and logo win over the coin denom', () => {
  const row = supplyRow(
    { denom: 'uatom', amount: '5' },
    { symbol: 'ATOM', base: 'uatom', display: 'atom', logo_URIs: { svg: 'a.svg', png: 'a.png' } },
    amount
  );
  assert.deepEqual(row, {
    denom: 'ATOM',
    amount: 'amount of ATOM',
    base: 'uatom',
    info: 'atom',
    logo: 'a.svg',
  });
});

test('the png logo is used when there is no svg', () => {
  const row = supplyRow({ denom: 'x', amount: '1' }, { logo_URIs: { png: 'a.png' } }, amount);
  assert.equal(row.logo, 'a.png');
});
