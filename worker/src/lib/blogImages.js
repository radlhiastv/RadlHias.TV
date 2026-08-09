// Ablage/Auslieferung von Blog-Bildern über Workers KV (Binding
// `env.BLOG_IMAGES_KV`, siehe wrangler.toml). KV statt R2, weil R2 in
// Cloudflare eine Zahlungsmethode auf dem Account voraussetzt (auch im
// kostenlosen Tarif) -- KV nicht. Werte sind auf 25 MB begrenzt, für
// komprimierte WebP-Titelbilder (paar hundert KB) mehr als ausreichend.
// Der Client (admin-blog.html) verkleinert/konvertiert Bilder bereits im
// Browser zu WebP (Canvas) -- der Worker nimmt hier nur noch entgegen,
// validiert grob und legt ab. Serviert wird unter /api/blog-images/:key
// (same-origin, kein CORS nötig, langes Caching weil der Key den
// Dateinamen bereits eindeutig macht).

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB Sicherheitsnetz (Client liefert i.d.R. <500 KB)
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

export function extForType(type) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "webp";
}

export async function putBlogImage(env, { bytes, contentType, slugHint }) {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("Nicht unterstütztes Bildformat. Erlaubt: WebP, JPEG, PNG.");
  }
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Bild ist zu groß (max. 6 MB).");
  }

  const ext = extForType(contentType);
  const base = (slugHint || "bild").slice(0, 60);
  const key = `posts/${base}-${Date.now()}.${ext}`;

  await env.BLOG_IMAGES_KV.put(key, bytes, { metadata: { contentType } });

  return { key, url: `/api/blog-images/${key}` };
}

// Liefert { bytes, contentType } oder null, wenn der Key nicht existiert.
export async function getBlogImage(env, key) {
  const { value, metadata } = await env.BLOG_IMAGES_KV.getWithMetadata(key, { type: "arrayBuffer" });
  if (!value) return null;
  return { bytes: value, contentType: (metadata && metadata.contentType) || "image/webp" };
}

export async function deleteBlogImage(env, key) {
  if (!key) return;
  await env.BLOG_IMAGES_KV.delete(key);
}
