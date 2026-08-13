// D1-Hilfsfunktionen rund um die Tabelle `posts` (Blog).

import { renderContentHtml, stripToPlainText } from "./markdown.js";

function newId() {
  return crypto.randomUUID();
}

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // Umlaute/Akzente entfernen (ä -> a usw.)
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function slugExists(db, slug, excludeId) {
  const row = excludeId
    ? await db.prepare(`SELECT id FROM posts WHERE slug = ? AND id != ?`).bind(slug, excludeId).first()
    : await db.prepare(`SELECT id FROM posts WHERE slug = ?`).bind(slug).first();
  return !!row;
}

export async function uniqueSlug(db, baseInput, excludeId) {
  const base = slugify(baseInput) || "artikel";
  let candidate = base;
  let n = 2;
  while (await slugExists(db, candidate, excludeId)) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

function rowToPost(row) {
  if (!row) return null;
  return { ...row, published: !!row.published };
}

// Bild-URL aus image_key/image_source ableiten: bestehende, migrierte Artikel
// zeigen weiterhin auf die statischen Dateien in /blogimages/, neue Uploads
// laufen über den KV-Auslieferungs-Endpunkt.
export function resolveImageUrl(post) {
  if (!post || !post.image_key) return "";
  if (post.image_source === "static") return `/${post.image_key}`;
  return `/api/blog-images/${post.image_key}`;
}

function buildPostsWhere({ publishedOnly, category }) {
  const conditions = [];
  const params = [];
  if (publishedOnly) conditions.push("published = 1");
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export async function listPosts(db, { publishedOnly = false, limit, offset = 0, category } = {}) {
  const { where, params } = buildPostsWhere({ publishedOnly, category });
  const limitSql = limit ? `LIMIT ${Number(limit)} OFFSET ${Number(offset) || 0}` : "";
  const { results } = await db
    .prepare(`SELECT * FROM posts ${where} ORDER BY date DESC, created_at DESC ${limitSql}`)
    .bind(...params)
    .all();
  return results.map(rowToPost);
}

// Anzahl Artikel (für die Paginierung der Blog-Übersicht), respektiert
// dieselben Filter wie listPosts (veröffentlicht/Kategorie).
export async function countPosts(db, { publishedOnly = false, category } = {}) {
  const { where, params } = buildPostsWhere({ publishedOnly, category });
  const row = await db
    .prepare(`SELECT COUNT(*) AS c FROM posts ${where}`)
    .bind(...params)
    .first();
  return row ? Number(row.c) : 0;
}

// Alle in der DB vorkommenden Kategorien (für die Filterleiste der Blog-
// Übersicht) -- nur Kategorien, die tatsächlich einen Artikel haben.
export async function listCategories(db, { publishedOnly = false } = {}) {
  const where = publishedOnly ? "WHERE published = 1" : "";
  const { results } = await db
    .prepare(`SELECT DISTINCT category FROM posts ${where} ORDER BY category ASC`)
    .all();
  return results.map((r) => r.category).filter(Boolean);
}

export async function getPostBySlug(db, slug, { publishedOnly = false } = {}) {
  const sql = publishedOnly
    ? `SELECT * FROM posts WHERE slug = ? AND published = 1`
    : `SELECT * FROM posts WHERE slug = ?`;
  const row = await db.prepare(sql).bind(slug).first();
  return rowToPost(row);
}

export async function getPostById(db, id) {
  const row = await db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first();
  return rowToPost(row);
}

export async function createPost(db, data) {
  const id = newId();
  const now = new Date().toISOString();
  const slug = data.slug ? slugify(data.slug) : await uniqueSlug(db, data.title);
  const contentHtml = renderContentHtml(data.content_raw);
  const seoDesc = data.seo_desc || stripToPlainText(contentHtml, 160) || data.excerpt || "";
  const sourcesHtml = renderContentHtml(data.sources_raw);

  await db
    .prepare(
      `INSERT INTO posts
        (id, slug, title, excerpt, content_raw, content_html, category, seo_desc,
         image_key, image_source, image_alt, published, date, created_at, updated_at,
         sources_raw, sources_html)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      slug,
      data.title,
      data.excerpt || "",
      data.content_raw || "",
      contentHtml,
      data.category || "Blog",
      seoDesc,
      data.image_key || null,
      data.image_source || "kv",
      data.image_alt || data.title,
      data.published === false ? 0 : 1,
      data.date || now.slice(0, 10),
      now,
      now,
      data.sources_raw || "",
      sourcesHtml
    )
    .run();

  return getPostById(db, id);
}

export async function updatePost(db, id, data) {
  const existing = await getPostById(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const slug =
    data.slug !== undefined && slugify(data.slug) !== existing.slug
      ? await uniqueSlug(db, data.slug, id)
      : existing.slug;

  const contentRaw = data.content_raw !== undefined ? data.content_raw : existing.content_raw;
  const contentHtml = renderContentHtml(contentRaw);
  const title = data.title !== undefined ? data.title : existing.title;
  const excerpt = data.excerpt !== undefined ? data.excerpt : existing.excerpt;
  const seoDesc =
    data.seo_desc !== undefined && data.seo_desc !== ""
      ? data.seo_desc
      : existing.seo_desc || stripToPlainText(contentHtml, 160) || excerpt;
  const sourcesRaw = data.sources_raw !== undefined ? data.sources_raw : existing.sources_raw || "";
  const sourcesHtml = renderContentHtml(sourcesRaw);

  await db
    .prepare(
      `UPDATE posts SET
        slug = ?, title = ?, excerpt = ?, content_raw = ?, content_html = ?,
        category = ?, seo_desc = ?, image_key = ?, image_source = ?, image_alt = ?,
        published = ?, date = ?, updated_at = ?, sources_raw = ?, sources_html = ?
       WHERE id = ?`
    )
    .bind(
      slug,
      title,
      excerpt,
      contentRaw,
      contentHtml,
      data.category !== undefined ? data.category : existing.category,
      seoDesc,
      data.image_key !== undefined ? data.image_key : existing.image_key,
      data.image_source !== undefined ? data.image_source : existing.image_source,
      data.image_alt !== undefined ? data.image_alt : existing.image_alt || title,
      data.published !== undefined ? (data.published ? 1 : 0) : existing.published ? 1 : 0,
      data.date !== undefined ? data.date : existing.date,
      now,
      sourcesRaw,
      sourcesHtml,
      id
    )
    .run();

  return getPostById(db, id);
}

export async function deletePost(db, id) {
  const existing = await getPostById(db, id);
  if (!existing) return null;
  await db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
  return existing;
}
