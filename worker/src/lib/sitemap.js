// Dynamisches sitemap.xml: statische Seiten (Liste unten, selten geändert)
// + alle veröffentlichten Blogartikel aus D1. Ersetzt die bisher manuell
// gepflegte /sitemap.xml -- ein neuer Artikel taucht automatisch auf, ohne
// dass jemand die Datei anfassen muss.

const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/konfigurator.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/luftdruckrechner.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/bikefitting.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/gebrauchtcheck.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/preisradar.html", changefreq: "monthly", priority: "0.8" },
  { loc: "/videos.html", changefreq: "weekly", priority: "0.7" },
  { loc: "/bikeservice.html", changefreq: "monthly", priority: "0.9" },
  { loc: "/faq.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/history.html", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/", changefreq: "weekly", priority: "0.7" },
  { loc: "/tour-de-hias/", changefreq: "monthly", priority: "0.8" },
  { loc: "/tour-de-hias/tour_de_hias.html", changefreq: "monthly", priority: "0.7" },
  { loc: "/impressum.html", changefreq: "yearly", priority: "0.2" },
  { loc: "/datenschutz.html", changefreq: "yearly", priority: "0.2" },
];

function urlEntry(origin, loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${origin}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function renderSitemap(db, origin) {
  const today = new Date().toISOString().slice(0, 10);
  const staticEntries = STATIC_URLS.map((u) => urlEntry(origin, u.loc, today, u.changefreq, u.priority));

  const { results } = await db
    .prepare(`SELECT slug, date, updated_at FROM posts WHERE published = 1 ORDER BY date DESC`)
    .all();
  const postEntries = results.map((p) =>
    urlEntry(origin, `/blog/${p.slug}.html`, (p.updated_at || p.date || today).slice(0, 10), "monthly", "0.7")
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries.join("\n")}
${postEntries.join("\n")}
</urlset>
`;
}
