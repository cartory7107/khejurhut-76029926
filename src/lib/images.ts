export const DEFAULT_PRODUCT_IMAGE = "/images/products/medjool.jpg";

const HAS_PROTOCOL = /^[a-z][a-z\d+.-]*:/i;
const HOSTNAME_LIKE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i;

export function normalizeImageUrl(value: string | null | undefined) {
  const url = (value || "").trim();
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/") || HAS_PROTOCOL.test(url)) return url;
  if (HOSTNAME_LIKE.test(url)) return `https://${url}`;
  return url;
}

export function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((image) => normalizeImageUrl(String(image))).filter(Boolean);
}
