import DOMPurify from 'dompurify';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  const href = node.getAttribute?.('href');
  if (node.tagName === 'A' && href && !href.startsWith('#')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

// Cleans the HTML md-editor-v3 renders from chain text. Use as `:sanitize`
// on every MdPreview.
export function sanitizeMarkdownHtml(html: string): string {
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
