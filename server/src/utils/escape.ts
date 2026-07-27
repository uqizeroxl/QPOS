export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

export function trimAndStrip(value: string): string {
  return stripHtml(value.trim());
}
