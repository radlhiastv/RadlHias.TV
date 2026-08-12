// QR-Code-Erzeugung für den Werkstatt-Status-Link (siehe statusTemplate.js).
// Rendert serverseitig ein SVG -- kein Rückgriff auf einen externen
// QR-Code-Dienst noetig (Datenschutz + funktioniert offline/ohne Drittanbieter).

import qrcodeGenerator from "qrcode-generator";

/**
 * Erzeugt ein QR-Code-SVG für den übergebenen Text.
 * @param {string} text - z.B. die Status-URL "https://radlhias.tv/status/<id>.html"
 * @param {{ size?: number, margin?: number }} [opts]
 * @returns {string} SVG-Markup
 */
export function qrCodeSvg(text, opts = {}) {
  const size = opts.size || 240;
  const margin = opts.margin ?? 2;

  // Typ 0 = automatische Größenwahl je nach Datenmenge.
  const qr = qrcodeGenerator(0, "M");
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const cell = size / (count + margin * 2);

  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        const x = (col + margin) * cell;
        const y = (row + margin) * cell;
        path += `M${x},${y}h${cell}v${cell}h${-cell}z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
