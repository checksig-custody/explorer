import DOMPurify from 'dompurify';

// Not every node the hook sees is an element, so the members are optional.
DOMPurify.addHook('afterSanitizeAttributes', (node: Partial<Element>) => {
  node.classList?.remove('md-editor-echarts');
  const href = node.getAttribute?.('href');
  if (node.tagName?.toLowerCase() === 'a' && href && !href.startsWith('#')) {
    node.setAttribute?.('target', '_blank');
    node.setAttribute?.('rel', 'noopener noreferrer');
  }
});

// Cleans the HTML md-editor-v3 renders from chain text. Use as `:sanitize`
// on every MdPreview.
export function sanitizeMarkdownHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
