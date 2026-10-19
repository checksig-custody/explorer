import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let sanitizeMarkdownHtml: (html: string) => string;

before(async () => {
  globalThis.window = new JSDOM('')
    .window as unknown as typeof globalThis.window;
  ({ sanitizeMarkdownHtml } = await import('../src/libs/sanitize.ts'));
});

const doc = (html: string) =>
  new JSDOM(`<body>${sanitizeMarkdownHtml(html)}</body>`).window.document;

test('img onerror handler is removed', () => {
  const out = sanitizeMarkdownHtml('<img src=x onerror=alert(1)>');
  assert.doesNotMatch(out, /onerror/i);
  assert.match(out, /<img/);
});

test('script element is removed', () => {
  const out = sanitizeMarkdownHtml('<p>hi</p><script>alert(1)</script>');
  assert.doesNotMatch(out, /script|alert/i);
  assert.match(out, /<p>hi<\/p>/);
});

test('javascript: link href is removed', () => {
  const a = doc('<a href="javascript:alert(1)">x</a>').querySelector('a');
  assert.ok(!a?.getAttribute('href')?.toLowerCase().includes('javascript'));
});

test('iframe is removed', () => {
  assert.doesNotMatch(
    sanitizeMarkdownHtml('<iframe src="https://evil.example"></iframe>'),
    /iframe/i
  );
});

test('ordinary markup survives', () => {
  const d = doc(
    '<ul><li>a</li></ul><pre><code>x &lt; y</code></pre>' +
      '<img src="https://example.com/a.png" alt="a">' +
      '<a href="https://example.com/p">link</a>'
  );
  assert.equal(d.querySelectorAll('li').length, 1);
  assert.equal(d.querySelector('pre code')?.textContent, 'x < y');
  assert.equal(
    d.querySelector('img')?.getAttribute('src'),
    'https://example.com/a.png'
  );
  assert.equal(
    d.querySelector('a')?.getAttribute('href'),
    'https://example.com/p'
  );
});

test('links open in a new tab without opener', () => {
  const a = doc('<a href="https://example.com">x</a>').querySelector('a');
  assert.ok(a);
  assert.equal(a.getAttribute('target'), '_blank');
  assert.match(a.getAttribute('rel') ?? '', /noopener/);
  assert.match(a.getAttribute('rel') ?? '', /noreferrer/);
});

test('in-page anchors keep working', () => {
  const a = doc('<a href="#top">x</a>').querySelector('a');
  assert.ok(a);
  assert.equal(a.getAttribute('href'), '#top');
});

test('target on other elements is removed', () => {
  const out = sanitizeMarkdownHtml(
    '<form target="_blank"><input></form><a href="https://e.com" target="x">y</a>'
  );
  assert.doesNotMatch(out, /<form[^>]*target/i);
});

test('svg anchors get rel too', () => {
  const out = sanitizeMarkdownHtml(
    '<svg><a href="https://e.com"><text>x</text></a></svg>'
  );
  assert.match(out, /rel="noopener noreferrer"/);
});

test('echarts container class is removed', () => {
  const out = sanitizeMarkdownHtml(
    '<div class="md-editor-echarts other">{a:1}</div>'
  );
  assert.doesNotMatch(out, /md-editor-echarts/);
});
