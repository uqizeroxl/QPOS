import DOMPurify from "dompurify";

DOMPurify.setConfig({
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
});

export function sanitize(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
