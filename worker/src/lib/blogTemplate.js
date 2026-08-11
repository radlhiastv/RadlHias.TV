// Serverseitiges Rendering der Blog-Seiten (/blog/index.html, /blog/:slug.html).
// Ersetzt die frueher von Hand angelegten, statischen Dateien in blog/*.html --
// Nav/Footer/Grundlayout sind 1:1 von dort uebernommen, damit sich am
// Erscheinungsbild nichts aendert.

import { resolveImageUrl } from "./blog.js";

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const NAV = `
<nav class="main-nav">
  <a href="/index.html" class="nav-logo">RadlHias.TV</a>
  <input type="checkbox" id="nav-burger-toggle" class="nav-toggle-checkbox">
  <label for="nav-burger-toggle" class="nav-toggle-burger" aria-label="Menü öffnen">
    <span></span><span></span><span></span>
  </label>
  <div class="nav-links">
        <a href="/bikeservice.html">Bike Service</a>
<div class="nav-dd">
      <input type="checkbox" id="nav-tools-toggle" class="nav-dd-check">
      <label for="nav-tools-toggle" class="nav-dd-label">Tools<span class="nav-dd-caret"></span></label>
      <div class="nav-dd-menu">
        <a href="/konfigurator.html"><svg class="nav-dd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="3"/><circle cx="4" cy="8" r="2.6" fill="#c85a14" stroke="none"/><circle cx="12" cy="15" r="2.6" fill="#c85a14" stroke="none"/><circle cx="20" cy="7" r="2.6" fill="#c85a14" stroke="none"/></svg>Fahrrad Konfigurator</a>
        <a href="/luftdruckrechner.html"><svg class="nav-dd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 13L16 9" stroke="#c85a14" stroke-width="2.4"/><circle cx="12" cy="13" r="1.4" fill="#c85a14" stroke="none"/><path d="M9 3h6"/><path d="M12 3v2"/></svg>Reifendruck Rechner</a>
        <a href="/bikefitting.html"><svg class="nav-dd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.4" r="2.2"/><path d="M12 6.6v5.2"/><path d="M12 11.8L7.6 20"/><path d="M12 11.8L16.4 20"/><path d="M8.4 9.2L15.6 9.2" stroke="#c85a14" stroke-width="2.4"/></svg>Bike-Fitting</a>
        <a href="/gebrauchtcheck.html"><svg class="nav-dd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L21 21"/><path d="M7.6 10.6l2.1 2.1 3.9-4.2" stroke="#c85a14" stroke-width="2.4"/></svg>Gebrauchtrad-Check</a>
        <a href="/preisradar.html"><svg class="nav-dd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.4" cy="7.4" r="1.6" fill="#c85a14" stroke="none"/></svg>Preisradar</a>
      </div>
    </div>
    <a href="/blog/index.html">Blog</a>
    <a href="/videos.html">Videos</a>
    <a href="/tour-de-hias/index.html">Tour de Hias</a>
      <a href="/faq.html">FAQ</a>
    <a href="/history.html">Meine Laufbahn</a>
    <a href="/index.html#kontakt" class="nav-cta">Kontakt</a>
  </div>
</nav>`;

const SOCIAL_BAR = `
<div class="social-bar">
  <a class="social-btn social-btn-instagram"
     href="https://www.instagram.com/radlhias.tv?igsh=eWN5dnBrcjZrY3M3"
     target="_blank"
     rel="noopener noreferrer"
     aria-label="Instagram">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
    <span class="social-tooltip">Instagram</span>
  </a>
  <div class="social-btn social-btn-youtube" aria-label="YouTube – kommt bald">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
    <span class="social-tooltip">Kommt bald</span>
  </div>
</div>`;

const FOOTER = `
<footer>
  <div class="footer-content">
    <div class="footer-wordmark">RadlHias.TV</div>
    <nav class="footer-nav">
      <a href="/bikeservice.html">Bike Service</a>
      <a href="/konfigurator.html">Fahrrad Konfigurator</a>
      <a href="/luftdruckrechner.html">Reifendruck Rechner</a>
      <a href="/bikefitting.html">Bike-Fitting</a>
      <a href="/gebrauchtcheck.html">Gebraucht-Check</a>
      <a href="/preisradar.html">Preisradar</a>
      <a href="/blog/index.html">Blog</a>
      <a href="/videos.html">Videos</a>
      <a href="/tour-de-hias/index.html">Tour de Hias</a>
      <a href="/faq.html">FAQ</a>
      <a href="/history.html">Meine Laufbahn</a>
      <a href="/impressum.html">Impressum</a>
      <a href="/datenschutz.html">Datenschutz</a>
    </nav>
    <div class="footer-social">
      <a href="https://www.instagram.com/radlhias.tv?igsh=eWN5dnBrcjZrY3M3" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </a>
      <span title="YouTube – kommt bald" aria-label="YouTube – kommt bald">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </span>
    </div>
    <div class="footer-bottom">
      <p>© 2026 RadlHias.TV – Mathias Blumreich</p>
    </div>
  </div>
</footer>`;

const SCROLL_RESTORE_SNIPPET = `<script>if('scrollRestoration' in history){history.scrollRestoration='manual';}window.addEventListener('pageshow',function(e){if(e.persisted&&!location.hash)window.scrollTo(0,0);});</script>`;
const YEAR_SNIPPET = `<script>(function(){var y=new Date().getFullYear()-1999;document.querySelectorAll(".js-years").forEach(function(el){el.textContent=y;});})();</script>`;

function shell({ title, description, canonical, ogImage, robots, jsonLd, extraStyle, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
${SCROLL_RESTORE_SNIPPET}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogImage ? "article" : "website"}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ""}
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=Barlow+Condensed:wght@400;600;700;900&display=fallback">
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=Barlow+Condensed:wght@400;600;700;900&display=fallback" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=Barlow+Condensed:wght@400;600;700;900&display=fallback" rel="stylesheet"></noscript>
<link rel="preload" as="font" type="font/woff2" href="/Abuget.woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=12">
<style>${extraStyle}</style>
</head>
<body>
${NAV}
${bodyHtml}
${SOCIAL_BAR}
${FOOTER}
${YEAR_SNIPPET}
</body>
</html>`;
}

const LISTING_STYLE = `
  :root {
    --navy:#1c3448; --navy2:#254560; --blue:#2d6e9e; --blue-lt:#a8c8dc;
    --orange:#c85a14; --cream:#f5f1eb; --cream2:#ede7dc;
    --text:#2a3a48; --text-dim:#7a8a98; --shadow:0 2px 20px rgba(28,52,72,0.10);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Barlow', sans-serif; background: var(--cream); color: var(--text); }
  .page-header { max-width: 1100px; margin: 0 auto; padding: 100px 20px 20px; text-align: center; }
  .page-header h1 {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase;
    font-size: clamp(30px, 6vw, 44px); color: var(--navy); margin-bottom: 10px;
  }
  .page-header p { color: var(--text-dim); font-size: 15px; }
  .blog-grid { max-width: 1100px; margin: 0 auto; padding: 30px 20px 80px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .blog-card {
    background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);
    border: 1px solid var(--cream2); text-decoration: none; color: inherit; display: flex; flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .blog-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(28,52,72,0.15); }
  .blog-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
  .blog-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
  .blog-card-cat {
    display: inline-block; align-self: flex-start; background: rgba(200,90,20,0.12); color: var(--orange);
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px;
  }
  .blog-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 10px; }
  .blog-card-excerpt { font-size: 14px; color: var(--text-dim); line-height: 1.6; margin-bottom: 12px; flex: 1; }
  .blog-card-date { font-size: 12px; color: var(--text-dim); }
  .empty-state { text-align: center; color: var(--text-dim); padding: 40px 20px; grid-column: 1 / -1; }
`;

const ARTICLE_STYLE = `
  :root {
    --navy:#1c3448; --navy2:#254560; --orange:#c85a14; --orange2:#e06820;
    --text:#c8d8e8; --muted:rgba(168,200,220,0.55); --border:rgba(255,255,255,0.08);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--navy);color:var(--text);font-family:'Barlow',sans-serif;min-height:100vh;}
  .article{max-width:740px;margin:0 auto;padding:100px 40px 80px;}
  .article-tag{background:rgba(200,90,20,0.15);border:1px solid rgba(200,90,20,0.3);
    color:var(--orange);font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;
    letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-right:10px;}
  .article-date{font-size:13px;color:var(--muted);}
  h1{font-family:'Barlow Condensed',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:900;
    text-transform:uppercase;color:#fff;line-height:0.95;margin:16px 0 28px;}
  .article-hero-img{width:100%;height:auto;border-radius:16px;margin-bottom:36px;display:block;
    max-height:420px;object-fit:cover;}
  .article-body{font-size:16px;line-height:1.8;color:var(--text);}
  .article-body p{margin-bottom:20px;}
  .article-body h2{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;
    text-transform:uppercase;color:#fff;margin:36px 0 14px;}
  .article-body h3{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;
    color:var(--orange2);margin:28px 0 10px;}
  .article-body ul,ol{padding-left:22px;margin-bottom:20px;}
  .article-body li{margin-bottom:8px;}
  .article-body strong{color:#fff;}
  .article-body a{color:var(--orange2);text-decoration:none;}
  .article-body a:hover{text-decoration:underline;}
  .article-sources{margin-top:36px;padding-top:24px;border-top:1px solid var(--border);}
  .article-sources h2{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;
    letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;}
  .article-sources .article-body{font-size:14px;color:var(--muted);}
  .article-sources .article-body p{margin-bottom:10px;}
  .article-sources .article-body a{color:var(--orange2);}
  .back-link{display:inline-flex;align-items:center;gap:8px;font-family:'Barlow Condensed',sans-serif;
    font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);
    text-decoration:none;margin-top:48px;transition:color 0.2s;border-top:1px solid var(--border);
    padding-top:32px;width:100%;}
  .back-link:hover{color:var(--orange2);}
  @media(max-width:600px){.article{padding:90px 20px 60px;}}
`;

function formatDateDe(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${parseInt(m[3], 10)}. ${monate[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

export function renderListingPage(posts, origin) {
  const cards = posts.length
    ? posts
        .map((post) => {
          const img = resolveImageUrl(post);
          return `<a class="blog-card" href="/blog/${escapeHtml(post.slug)}.html">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(post.image_alt || post.title)}" width="800" height="450" loading="lazy">
      <div class="blog-card-body">
        <span class="blog-card-cat">${escapeHtml(post.category || "Blog")}</span>
        <div class="blog-card-title">${escapeHtml(post.title)}</div>
        <div class="blog-card-excerpt">${escapeHtml(post.excerpt || "")}</div>
        <div class="blog-card-date">${formatDateDe(post.date)}</div>
      </div>
    </a>`;
        })
        .join("\n")
    : `<p class="empty-state">Aktuell sind keine Artikel verfügbar.</p>`;

  const bodyHtml = `
<div class="page-header">
  <h1>Blog</h1>
  <p>Tipps, Tests und ehrliche Erfahrungen rund ums Fahrrad.</p>
</div>
<div class="blog-grid">${cards}</div>`;

  return shell({
    title: "Blog – RadlHias.TV",
    description: "Alle Blogartikel von RadlHias.TV – Tipps, Tests und ehrliche Erfahrungen rund ums Fahrrad.",
    canonical: `${origin}/blog/`,
    ogImage: "",
    jsonLd: null,
    extraStyle: LISTING_STYLE,
    bodyHtml,
  });
}

export function renderArticlePage(post, origin) {
  const img = resolveImageUrl(post);
  const imgAbs = img ? `${origin}${img}` : "";
  const canonical = `${origin}/blog/${post.slug}.html`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_desc || post.excerpt || "",
    datePublished: post.date,
    dateModified: post.updated_at || post.date,
    author: { "@type": "Person", name: "Mathias", url: "https://radlhias.tv" },
    publisher: { "@type": "Organization", name: "RadlHias.TV", url: "https://radlhias.tv" },
    ...(imgAbs ? { image: imgAbs } : {}),
  };

  const bodyHtml = `
<div class="article">
  <div>
    <span class="article-tag">${escapeHtml(post.category || "Blog")}</span>
    <span class="article-date">${formatDateDe(post.date)}</span>
  </div>
  <h1>${escapeHtml(post.title)}</h1>
  ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(post.image_alt || post.title)}" class="article-hero-img" width="1200" height="675">` : ""}
  <div class="article-body">
${post.content_html}
  </div>
  ${post.sources_html ? `<div class="article-sources">
    <h2>Quellen</h2>
    <div class="article-body">
${post.sources_html}
    </div>
  </div>` : ""}
  <a href="/blog/index.html" class="back-link">← Zurück zum Blog</a>
</div>`;

  return shell({
    title: `${post.title} – RadlHias.TV`,
    description: post.seo_desc || post.excerpt || "",
    canonical,
    ogImage: imgAbs,
    jsonLd,
    extraStyle: ARTICLE_STYLE,
    bodyHtml,
  });
}

export function render404Page(origin) {
  const bodyHtml = `
<div class="page-header">
  <h1>Artikel nicht gefunden</h1>
  <p>Dieser Beitrag existiert nicht (mehr). <a href="/blog/index.html" style="color:var(--orange);">Zurück zum Blog</a></p>
</div>
<div class="blog-grid"></div>`;
  return shell({
    title: "Artikel nicht gefunden – RadlHias.TV",
    description: "Dieser Blogartikel existiert nicht oder wurde entfernt.",
    canonical: `${origin}/blog/index.html`,
    ogImage: "",
    robots: "noindex",
    jsonLd: null,
    extraStyle: LISTING_STYLE,
    bodyHtml,
  });
}
