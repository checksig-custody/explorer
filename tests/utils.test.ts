import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defined, maybe, orDefault, orDefaultWith } from '../src/libs/utils.ts';

test('defined throws the TypeError that reading the property would raise', () => {
  assert.throws(() => {
    defined(undefined, 'a');
  }, new TypeError("Cannot read properties of undefined (reading 'a')"));
  assert.throws(() => {
    defined(null, 'a');
  }, new TypeError("Cannot read properties of null (reading 'a')"));
});

test('defined returns a value that is set, including 0 and the empty string', () => {
  assert.equal(defined(0, 'x'), 0);
  assert.equal(defined('', 'x'), '');
});

test('maybe returns its argument unchanged', () => {
  const value = { a: 1 };
  assert.equal(maybe(value), value);
});

test('orDefault takes the fallback for every falsy value, as || does', () => {
  assert.equal(orDefault(undefined, 'x'), 'x');
  assert.equal(orDefault(null, 'x'), 'x');
  assert.equal(orDefault('', 'x'), 'x');
  assert.equal(orDefault(0, 5), 5);
  assert.equal(orDefault(Number.NaN, 5), 5);
  assert.equal(orDefault(false, true), true);
  assert.equal(orDefault('a', 'x'), 'a');
  assert.equal(orDefault(3, 5), 3);
});

test('orDefaultWith computes the fallback only when the value is falsy', () => {
  let calls = 0;
  const fallback = () => {
    calls += 1;
    return 5;
  };
  assert.equal(orDefaultWith(3, fallback), 3);
  assert.equal(calls, 0);
  assert.equal(orDefaultWith(0, fallback), 5);
  assert.equal(orDefaultWith(undefined, fallback), 5);
  assert.equal(calls, 2);
});
