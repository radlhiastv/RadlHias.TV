-- RadlHias Blog – Artikel-Verwaltung
-- Ersetzt das bisherige posts.json + die von Hand gepflegten blog/*.html-Dateien.
-- content_raw: was der Autor im Admin-Panel eingibt (einfacher Text/Markdown-light).
-- content_html: daraus serverseitig gerenderter HTML-Auszug (siehe src/lib/markdown.js),
-- wird bei jedem Speichern neu erzeugt -- so bleibt die Editierbarkeit erhalten (das
-- Textfeld zeigt immer content_raw), während die Artikelseite content_html ausliefert.

CREATE TABLE IF NOT EXISTS posts (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  excerpt           TEXT NOT NULL,
  content_raw       TEXT NOT NULL,
  content_html      TEXT NOT NULL,
  category          TEXT NOT NULL,
  seo_desc          TEXT,
  image_key         TEXT,          -- z.B. "blogimages/foo.webp" (Alt-Artikel) oder "posts/<id>.webp" (R2)
  image_source      TEXT NOT NULL DEFAULT 'r2',  -- 'r2' | 'static' (bestehende Dateien in /blogimages/)
  image_alt         TEXT,
  published         INTEGER NOT NULL DEFAULT 1,
  date              TEXT NOT NULL,   -- ISO-Datum, redaktionelles Veröffentlichungsdatum
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_date ON posts (date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (published);
