import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

// A build exits 0 when Tailwind drops the daisyUI plugin: the CSS is then
// smaller and every component style is gone. Compile the entry's directives
// with the real config, as `vite build` does, and look for the daisyUI rules.
const compile = async (): Promise<string> => {
  const config = resolve(import.meta.dirname, '../tailwind.config.ts');
  const result = await postcss([tailwindcss({ config })]).process(
    '@tailwind base; @tailwind components; @tailwind utilities;',
    { from: 'src/style.css' }
  );
  return result.css;
};

test('the compiled CSS holds the daisyUI components, utilities and themes', async () => {
  const css = await compile();
  for (const selector of ['.btn {', '.modal {', '.menu {', '.bg-base-100 {']) {
    assert.ok(css.includes(selector), `missing ${selector}`);
  }
  for (const theme of ['[data-theme=light]', '[data-theme=dark]']) {
    assert.ok(css.includes(theme), `missing ${theme}`);
  }
});
