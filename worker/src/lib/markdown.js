// Sehr schlanker Text -> HTML Konverter für Blogartikel. Kein vollständiges
// Markdown, sondern genau die paar Regeln, die die bisherigen Artikel
// (siehe migrierte posts.json / blog/*.html) tatsächlich nutzen -- plus ein
// paar sinnvolle Ergänzungen für neue Artikel (echte Listen, Überschriften,
// fett/kursiv/Links), ohne dass der Autor im Admin-Panel HTML schreiben muss.
//
// Regeln (Block-Ebene, getrennt durch Leerzeilen):
//   "# Text"          -> <h1>Text</h1>
//   "## Text"        -> <h2>Text</h2>
//   "### Text"        -> <h3>Text</h3>
//   Block, in dem JEDE Zeile mit "- " beginnt -> <ul><li>...</li></ul>
//   alles andere      -> <p>...</p>, einzelne Zeilenumbrüche werden zu <br>
//
// Wichtig für die Darstellung: h1/h2/h3 bekommen im Artikel-Template feste,
// vordefinierte CSS-Regeln (Schriftart/-größe/Farbe). Es gibt keinen Weg,
// darüber im Editor abweichende Styles zu setzen -- jede Überschriftenebene
// sieht auf jeder Seite immer identisch aus.
// Inline: **fett**, *kursiv*, [Text](https://url)
//
// Wichtig: Eingaben werden zuerst HTML-escaped, danach werden nur die oben
// genannten Markdown-Muster in Tags übersetzt -- eingegebenes HTML kann also
// nicht "durchschlagen" (XSS-Schutz).

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text) {
  return text
    // [Text](https://...) -- nur http(s)-Links zulassen
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
}

export function renderContentHtml(raw) {
  const text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  const blocks = text.split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const h3 = trimmed.match(/^###\s+(.+)$/);
      if (h3 && !trimmed.includes("\n")) {
        return `<h3>${renderInline(escapeHtml(h3[1]))}</h3>`;
      }
      const h2 = trimmed.match(/^##\s+(.+)$/);
      if (h2 && !trimmed.includes("\n")) {
        return `<h2>${renderInline(escapeHtml(h2[1]))}</h2>`;
      }
      const h1 = trimmed.match(/^#\s+(.+)$/);
      if (h1 && !trimmed.includes("\n")) {
        return `<h1>${renderInline(escapeHtml(h1[1]))}</h1>`;
      }

      const lines = trimmed.split("\n");
      const isList = lines.length > 0 && lines.every((l) => /^-\s+/.test(l.trim()));
      if (isList) {
        const items = lines.map((l) => `<li>${renderInline(escapeHtml(l.trim().replace(/^-\s+/, "")))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }

      const withBreaks = lines.map((l) => renderInline(escapeHtml(l))).join("<br>");
      return `<p>${withBreaks}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

// Aus dem gerenderten HTML eine reine Textzusammenfassung ziehen (z.B. als
// Fallback für Meta-Description, falls das seo_desc-Feld leer bleibt).
export function stripToPlainText(html, maxLen) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!maxLen || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}
