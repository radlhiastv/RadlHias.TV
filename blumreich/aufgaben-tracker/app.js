/* BLUMREICH Aufgaben-Tracker
   Alles läuft im Browser. Die Daten liegen nur im localStorage dieses Geräts.
   Es gibt keinen Server-Aufruf außer dem Laden der App-Dateien selbst. */
(function () {
  "use strict";

  // ---- Einstellungen (vor der Veröffentlichung prüfen) ----
  var KONTAKT_MAIL = "mathias@blumreich.at";        // PLATZHALTER: Domain und Adresse noch nicht angelegt
  var WEBSITE = "https://blumreich.at/kontakt.html"; // PLATZHALTER: Domain noch nicht registriert
  var TAGE_PRO_WOCHE = 5, TAGE_PRO_JAHR = 220;
  var SPEICHER = "blumreich-aufgaben-tracker-v1";
  var VORSCHLAEGE = ["Angebote schreiben", "Rechnungen", "E-Mails", "Telefonate", "Material bestellen", "Termine planen"];

  // ---- Zustand ----
  var S;
  function neu() {
    return {
      v: 1,
      aufgaben: VORSCHLAEGE.map(function (p) { return { id: uid(), name: "", platzhalter: p }; }),
      eintraege: [],       // {id, aufgabe, start, ende|null}
      zeitraumStart: null,
      archiv: [],          // abgeschlossene Protokolle
      introGesehen: false
    };
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function laden() {
    try {
      var roh = localStorage.getItem(SPEICHER);
      if (roh) { var d = JSON.parse(roh); if (d && d.v === 1 && Array.isArray(d.aufgaben)) return d; }
    } catch (e) { /* Speicher gesperrt, z. B. privates Fenster */ }
    return neu();
  }
  var speicherWarnung = false;
  function speichern() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(S)); }
    catch (e) {
      if (!speicherWarnung) { speicherWarnung = true; toast("Speichern klappt in diesem Browser nicht. Im privaten Modus gehen die Einträge beim Schließen verloren."); }
    }
  }
  S = laden();

  // ---- Hilfen ----
  var $ = function (id) { return document.getElementById(id); };
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function zwei(n) { return (n < 10 ? "0" : "") + n; }
  function uhr(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 3600) + ":" + zwei(Math.floor(s / 60) % 60) + ":" + zwei(s % 60); }
  function dauer(ms) {
    var m = Math.round(ms / 60000);
    if (m < 1) return ms > 0 ? "unter 1 Min." : "0 Min.";
    var h = Math.floor(m / 60); m = m % 60;
    return h ? h + " Std. " + zwei(m) + " Min." : m + " Min.";
  }
  function stunden(ms) { var h = ms / 3600000; return (h < 10 ? h.toFixed(1) : Math.round(h).toString()).replace(".", ",") + " Std."; }
  function kurz(ms) { var m = Math.round(ms / 60000); return Math.floor(m / 60) + ":" + zwei(m % 60) + " h"; }
  function datum(ts) { var d = new Date(ts); return zwei(d.getDate()) + "." + zwei(d.getMonth() + 1) + "." + d.getFullYear(); }
  function zeit(ts) { var d = new Date(ts); return zwei(d.getHours()) + ":" + zwei(d.getMinutes()); }
  function tagSchluessel(ts) { var d = new Date(ts); return d.getFullYear() + "-" + zwei(d.getMonth() + 1) + "-" + zwei(d.getDate()); }
  var WOTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  function aufgabe(id) { for (var i = 0; i < S.aufgaben.length; i++) if (S.aufgaben[i].id === id) return S.aufgaben[i]; return null; }
  function nameVon(id, nr) {
    var a = aufgabe(id);
    if (a && a.name.trim()) return a.name.trim();
    if (a) return "Aufgabe " + (S.aufgaben.indexOf(a) + 1);
    return nr || "Gelöschte Aufgabe";
  }
  function laufend() { for (var i = 0; i < S.eintraege.length; i++) if (S.eintraege[i].ende == null) return S.eintraege[i]; return null; }
  function summe(id, jetzt) {
    var t = 0;
    S.eintraege.forEach(function (e) { if (e.aufgabe === id) t += (e.ende == null ? jetzt : e.ende) - e.start; });
    return t;
  }

  var toastTimer;
  function toast(text) {
    var t = $("toast"); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  // Aktionen hängen direkt an den Knöpfen, nicht am close-Ereignis des Dialogs
  var frageAktion = null;
  function frage(titel, text, ja, weiter) {
    $("frage-titel").textContent = titel; $("frage-text").textContent = text; $("frage-ja").textContent = ja;
    frageAktion = weiter; $("dlg-frage").showModal();
  }
  $("frage-ja").addEventListener("click", function (ev) {
    ev.preventDefault(); $("dlg-frage").close();
    var f = frageAktion; frageAktion = null; if (f) f();
  });

  // ---- Ansichten ----
  var ANSICHTEN = ["tracken", "protokoll", "eintraege", "frueher"];
  function zeige(name) {
    ANSICHTEN.forEach(function (n) { $("ansicht-" + n).hidden = n !== name; });
    window.scrollTo(0, 0);
    if (name !== "tracken" && history.state !== name) history.pushState(name, "");
  }
  window.addEventListener("popstate", function () { zeige("tracken"); render(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-zurueck]"), function (b) {
    b.addEventListener("click", function () { if (history.state) history.back(); else { zeige("tracken"); render(); } });
  });

  // ---- Tracken ----
  function render() {
    var liste = $("aufgaben"), lauf = laufend(), jetzt = Date.now();
    // Eingabefeld mit Fokus nicht neu bauen, sonst springt die Tastatur weg
    var schluessel = S.aufgaben.map(function (a) { return a.id; }).join(",");
    if (liste.dataset.schluessel !== schluessel) {
      liste.dataset.schluessel = schluessel;
      liste.innerHTML = "";
      S.aufgaben.forEach(function (a, i) {
        var li = document.createElement("li");
        li.className = "aufgabe"; li.dataset.aufgabe = a.id;
        li.innerHTML =
          '<div class="aufgabe-text">' +
          '<input type="text" maxlength="60" enterkeyhint="done" autocomplete="off" aria-label="Name der Aufgabe ' + (i + 1) + '" data-id="' + a.id + '" placeholder="' + esc(a.platzhalter ? "z. B. " + a.platzhalter : "Name der Aufgabe") + '" value="' + esc(a.name) + '">' +
          '<p class="aufgabe-zeit"></p></div>' +
          '<button class="weg" type="button" aria-label="Aufgabe entfernen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
          '<button class="start" type="button"></button>';
        liste.appendChild(li);
      });
    }
    Array.prototype.forEach.call(liste.children, function (li) {
      var id = li.dataset.aufgabe, laeuftHier = lauf && lauf.aufgabe === id;
      var inp = li.querySelector("input"), a = aufgabe(id);
      if (a && inp !== document.activeElement && inp.value !== a.name) inp.value = a.name;
      var btn = li.querySelector(".start"), z = li.querySelector(".aufgabe-zeit"), t = summe(id, jetzt);
      li.classList.toggle("laeuft", !!laeuftHier);
      btn.className = "start" + (laeuftHier ? " stopp" : (lauf ? " gesperrt" : ""));
      btn.innerHTML = laeuftHier
        ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>Stopp'
        : '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>Start';
      btn.setAttribute("aria-label", (laeuftHier ? "Stopp: " : "Start: ") + nameVon(id));
      if (lauf && !laeuftHier) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled");
      z.textContent = laeuftHier ? "läuft · " + uhr(t) : (t ? dauer(t) : "noch keine Zeit");
    });

    var st = $("status");
    st.classList.toggle("laeuft", !!lauf);
    if (lauf) {
      $("status-label").textContent = "Läuft gerade";
      $("status-name").textContent = nameVon(lauf.aufgabe);
      $("status-uhr").hidden = false;
      $("status-uhr").textContent = uhr(jetzt - lauf.start);
    } else {
      $("status-label").textContent = "Gerade läuft nichts";
      var benannt = S.aufgaben.some(function (x) { return x.name.trim(); });
      $("status-name").textContent = S.eintraege.length ? "Tippe bei der nächsten Aufgabe auf Start." : (benannt ? "Tippe bei einer Aufgabe auf Start." : "Gib deinen Aufgaben Namen und tippe auf Start.");
      $("status-uhr").hidden = true;
    }
    var ges = 0; S.eintraege.forEach(function (e) { ges += (e.ende == null ? jetzt : e.ende) - e.start; });
    $("status-zeitraum").textContent = S.zeitraumStart
      ? "Zeitraum seit " + datum(S.zeitraumStart) + ", " + zeit(S.zeitraumStart) + " · gesamt " + dauer(ges)
      : "";
    $("btn-frueher").hidden = !S.archiv.length;
    var hatEintraege = S.eintraege.length > 0;
    $("btn-abschliessen").disabled = !hatEintraege;
    $("btn-abschliessen").style.opacity = hatEintraege ? "" : ".5";
    $("btn-zwischenstand").hidden = !hatEintraege;
    $("btn-eintraege").hidden = !hatEintraege;
  }

  function starten(id) {
    var lauf = laufend();
    if (lauf && lauf.aufgabe !== id) { toast("Stoppe zuerst „" + nameVon(lauf.aufgabe) + "“."); pulse(lauf.aufgabe); return; }
    var a = aufgabe(id);
    if (!lauf && a && !a.name.trim()) {
      toast("Gib der Aufgabe zuerst einen Namen.");
      var inp = document.querySelector('input[data-id="' + id + '"]'); if (inp) inp.focus();
      return;
    }
    if (lauf) { lauf.ende = Date.now(); if (lauf.ende - lauf.start < 1000) S.eintraege.splice(S.eintraege.indexOf(lauf), 1); }
    else {
      var jetzt = Date.now();
      if (!S.zeitraumStart) S.zeitraumStart = jetzt;
      S.eintraege.push({ id: uid(), aufgabe: id, start: jetzt, ende: null });
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
    }
    speichern(); render();
  }
  function pulse(id) {
    var li = document.querySelector('.aufgabe[data-aufgabe="' + id + '"]');
    if (li && li.animate) li.animate([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 300 });
  }

  $("aufgaben").addEventListener("click", function (ev) {
    var li = ev.target.closest(".aufgabe"); if (!li) return;
    var id = li.dataset.aufgabe;
    if (ev.target.closest(".start")) starten(id);
    else if (ev.target.closest(".weg")) entfernen(id);
  });
  $("aufgaben").addEventListener("input", function (ev) {
    var a = aufgabe(ev.target.dataset.id); if (!a) return;
    a.name = ev.target.value; speichern();
    var lauf = laufend(); if (lauf && lauf.aufgabe === a.id) $("status-name").textContent = nameVon(a.id);
  });
  $("aufgaben").addEventListener("keydown", function (ev) { if (ev.key === "Enter") ev.target.blur(); });

  function entfernen(id) {
    var t = summe(id, Date.now()), n = nameVon(id);
    var weg = function () {
      S.eintraege = S.eintraege.filter(function (e) { return e.aufgabe !== id; });
      S.aufgaben = S.aufgaben.filter(function (a) { return a.id !== id; });
      speichern(); render();
    };
    if (t > 0) frage("Aufgabe entfernen?", "„" + n + "“ hat schon " + dauer(t) + ". Diese Zeit wird mit gelöscht.", "Entfernen", weg);
    else weg();
  }

  $("btn-neu").addEventListener("click", function () {
    var a = { id: uid(), name: "", platzhalter: "Name der Aufgabe" };
    S.aufgaben.push(a); speichern(); render();
    var inp = document.querySelector('input[data-id="' + a.id + '"]'); if (inp) inp.focus();
  });

  // ---- Protokoll ----
  function auswerten(eintraege, start, ende, namen) {
    var proAufgabe = {}, tage = {}, ges = 0;
    eintraege.forEach(function (e) {
      var bis = e.ende == null ? ende : e.ende, d = Math.max(0, bis - e.start);
      var k = e.aufgabe;
      if (!proAufgabe[k]) proAufgabe[k] = { name: namen(k), ms: 0, anzahl: 0 };
      proAufgabe[k].ms += d; proAufgabe[k].anzahl++; ges += d;
      tage[tagSchluessel(e.start)] = true;
    });
    var zeilen = Object.keys(proAufgabe).map(function (k) { return proAufgabe[k]; })
      .sort(function (a, b) { return b.ms - a.ms; });
    return { start: start, ende: ende, gesamt: ges, tage: Object.keys(tage).length, zeilen: zeilen };
  }

  function protokollHtml(p, abgeschlossen) {
    if (!p.zeilen.length) return '<p class="leer">Noch keine Einträge.</p>';
    var max = p.zeilen[0].ms || 1, tage = Math.max(1, p.tage);
    var h = '<div class="prot-kopf"><p class="label">' + (abgeschlossen ? "Protokoll" : "Zwischenstand") + '</p>' +
      '<h1>Wo deine Zeit hingeht</h1>' +
      '<p>' + datum(p.start) + ", " + zeit(p.start) + " bis " + datum(p.ende) + ", " + zeit(p.ende) + '</p>' +
      '<div class="prot-summe"><div><b>' + kurz(p.gesamt) + '</b><span>gemessen</span></div>' +
      '<div><b>' + p.tage + '</b><span>' + (p.tage === 1 ? "Tag" : "Tage") + ' mit Einträgen</span></div></div></div>';

    h += '<div class="karte"><h2>Zeit pro Aufgabe</h2><ul class="balken">';
    p.zeilen.forEach(function (z) {
      var proz = p.gesamt ? Math.round(z.ms / p.gesamt * 100) : 0;
      h += '<li><div class="balken-zeile"><span>' + esc(z.name) + '</span><span>' + dauer(z.ms) + " · " + proz + ' %</span></div>' +
        '<div class="balken-spur"><div class="balken-fuell" style="width:' + Math.max(2, z.ms / max * 100) + '%"></div></div></li>';
    });
    h += '</ul></div>';

    h += '<div class="karte"><h2>Hochgerechnet</h2><table class="tabelle"><thead><tr><th>Aufgabe</th><th>Ø Tag</th><th>Woche</th><th>Jahr</th></tr></thead><tbody>';
    p.zeilen.forEach(function (z) {
      var tag = z.ms / tage;
      h += '<tr><td>' + esc(z.name) + '</td><td>' + kurz(tag) + '</td><td>' + stunden(tag * TAGE_PRO_WOCHE).replace(" Std.", " h") + '</td><td>' + stunden(tag * TAGE_PRO_JAHR).replace(" Std.", " h") + '</td></tr>';
    });
    h += '</tbody></table><p class="klein" style="margin:10px 0 0">Durchschnitt pro Tag mit Einträgen, gerechnet mit ' + TAGE_PRO_WOCHE + ' Arbeitstagen pro Woche und rund ' + TAGE_PRO_JAHR + ' im Jahr. Je länger du misst, desto genauer wird es.</p></div>';

    var top = p.zeilen[0], jahr = stunden(top.ms / tage * TAGE_PRO_JAHR);
    h += '<div class="cta"><h2>Am meisten Zeit geht in „' + esc(top.name) + '“</h2>' +
      '<p>Hochgerechnet sind das rund ' + jahr.replace(" Std.", " Stunden") + ' im Jahr. Für genau solche Aufgaben baue ich einfache Tools, die dir einen Teil davon abnehmen. Wenn du wissen willst, was bei dir möglich ist, schick mir dein Protokoll.</p>' +
      '<a class="btn btn-haupt breit" id="btn-mail" href="#">Protokoll an Mathias schicken</a></div>';

    h += '<div class="prot-knoepfe">' +
      '<button class="btn btn-leise breit" type="button" id="btn-teilen">Teilen oder kopieren</button>' +
      '<button class="btn btn-leise breit" type="button" id="btn-drucken">Drucken oder als PDF sichern</button></div>';
    return h;
  }

  function protokollText(p) {
    var tage = Math.max(1, p.tage);
    var t = "BLUMREICH Aufgaben-Tracker – Protokoll\n" +
      datum(p.start) + ", " + zeit(p.start) + " bis " + datum(p.ende) + ", " + zeit(p.ende) + "\n" +
      "Gemessen: " + dauer(p.gesamt) + " an " + p.tage + (p.tage === 1 ? " Tag" : " Tagen") + "\n\n";
    p.zeilen.forEach(function (z) {
      var proz = p.gesamt ? Math.round(z.ms / p.gesamt * 100) : 0;
      t += "• " + z.name + ": " + dauer(z.ms) + " (" + proz + " %), hochgerechnet ca. " + stunden(z.ms / tage * TAGE_PRO_JAHR) + " im Jahr\n";
    });
    return t;
  }

  var aktuellesProtokoll = null;
  function zeigeProtokoll(p, abgeschlossen) {
    aktuellesProtokoll = p;
    $("protokoll").innerHTML = protokollHtml(p, abgeschlossen);
    zeige("protokoll");
    var mail = $("btn-mail");
    if (mail) mail.href = "mailto:" + KONTAKT_MAIL + "?subject=" + encodeURIComponent("Mein Protokoll aus dem Aufgaben-Tracker") +
      "&body=" + encodeURIComponent("Hallo Mathias,\n\nhier ist mein Protokoll. Mich würde interessieren, was bei mir möglich ist.\n\n" + protokollText(p) + "\nViele Grüße\n");
    var teilen = $("btn-teilen");
    if (teilen) teilen.addEventListener("click", function () {
      var text = protokollText(p);
      if (navigator.share) navigator.share({ title: "Mein Protokoll", text: text }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("Protokoll kopiert."); }, function () { toast("Kopieren hat nicht geklappt."); });
      else toast("Teilen geht in diesem Browser nicht.");
    });
    var druck = $("btn-drucken");
    if (druck) druck.addEventListener("click", function () { window.print(); });
  }

  $("btn-zwischenstand").addEventListener("click", function () {
    var jetzt = Date.now();
    zeigeProtokoll(auswerten(S.eintraege, S.zeitraumStart || jetzt, jetzt, function (k) { return nameVon(k); }), false);
  });

  $("btn-abschliessen").addEventListener("click", function () {
    if (!S.eintraege.length) return;
    var lauf = laufend();
    var text = (lauf ? "„" + nameVon(lauf.aufgabe) + "“ wird gestoppt. " : "") +
      "Du bekommst dein Protokoll, und die Uhren starten wieder bei null. Deine Aufgaben bleiben stehen.";
    frage("Zeitraum abschließen?", text, "Abschließen", function () {
      var jetzt = Date.now();
      if (lauf) lauf.ende = jetzt;
      var p = auswerten(S.eintraege, S.zeitraumStart || jetzt, jetzt, function (k) { return nameVon(k); });
      S.archiv.unshift(p);
      S.eintraege = []; S.zeitraumStart = null;
      speichern(); render();
      zeigeProtokoll(p, true);
    });
  });

  $("btn-frueher").addEventListener("click", function () {
    var ul = $("frueher"); ul.innerHTML = "";
    S.archiv.forEach(function (p, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button class="eintrag" type="button"><div><b>' + datum(p.start) + " bis " + datum(p.ende) + '</b><span>' +
        p.zeilen.length + (p.zeilen.length === 1 ? " Aufgabe" : " Aufgaben") + '</span></div><span class="dauer">' + dauer(p.gesamt) + '</span></button>';
      li.firstChild.addEventListener("click", function () { zeigeProtokoll(S.archiv[i], true); });
      ul.appendChild(li);
    });
    zeige("frueher");
  });

  // ---- Einträge korrigieren ----
  function renderEintraege() {
    var box = $("eintraege"), gruppen = {}, reihen = [];
    S.eintraege.slice().sort(function (a, b) { return b.start - a.start; }).forEach(function (e) {
      var k = tagSchluessel(e.start);
      if (!gruppen[k]) { gruppen[k] = []; reihen.push(k); }
      gruppen[k].push(e);
    });
    if (!reihen.length) { box.innerHTML = '<p class="leer">Noch keine Einträge.</p>'; return; }
    var h = "";
    reihen.forEach(function (k) {
      var d = new Date(gruppen[k][0].start);
      h += '<div class="tag-gruppe"><h2>' + WOTAG[d.getDay()] + ", " + datum(d) + '</h2><ul class="liste">';
      gruppen[k].forEach(function (e) {
        var offen = e.ende == null;
        h += '<li><button class="eintrag' + (offen ? " offen" : "") + '" type="button" data-eintrag="' + e.id + '"><div><b>' + esc(nameVon(e.aufgabe)) + '</b><span>' +
          zeit(e.start) + " – " + (offen ? "läuft" : zeit(e.ende)) + '</span></div><span class="dauer">' + (offen ? "läuft" : dauer(e.ende - e.start)) + '</span></button></li>';
      });
      h += '</ul></div>';
    });
    box.innerHTML = h;
  }
  $("btn-eintraege").addEventListener("click", function () { renderEintraege(); zeige("eintraege"); });
  $("eintraege").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-eintrag]"); if (!b) return;
    var e = S.eintraege.filter(function (x) { return x.id === b.dataset.eintrag; })[0];
    if (e) eintragDialog(e);
  });
  $("btn-nachtragen").addEventListener("click", function () { eintragDialog(null); });

  function zuInput(ts) { var d = new Date(ts); return { tag: tagSchluessel(ts), zeit: zwei(d.getHours()) + ":" + zwei(d.getMinutes()) }; }
  function ausInput(tag, z) { var t = tag.split("-"), u = z.split(":"); return new Date(+t[0], +t[1] - 1, +t[2], +u[0], +u[1]).getTime(); }

  var aktuellerEintrag = null;
  function eintragDialog(e) {
    aktuellerEintrag = e;
    var d = $("dlg-eintrag"), sel = $("e-aufgabe");
    sel.innerHTML = S.aufgaben.map(function (a) { return '<option value="' + a.id + '">' + esc(nameVon(a.id)) + '</option>'; }).join("");
    $("eintrag-titel").textContent = e ? "Eintrag ändern" : "Eintrag nachtragen";
    $("e-loeschen").hidden = !e;
    $("e-fehler").hidden = true;
    var jetzt = Date.now(), von = e ? e.start : jetzt - 30 * 60000, bis = e ? (e.ende == null ? jetzt : e.ende) : jetzt;
    sel.value = e ? e.aufgabe : S.aufgaben[0] && S.aufgaben[0].id;
    $("e-tag").value = zuInput(von).tag; $("e-von").value = zuInput(von).zeit; $("e-bis").value = zuInput(bis).zeit;
    d.showModal();
  }
  $("e-loeschen").addEventListener("click", function (ev) {
    ev.preventDefault(); $("dlg-eintrag").close();
    var e = aktuellerEintrag; if (!e) return;
    frage("Eintrag löschen?", "Dieser Eintrag wird entfernt.", "Löschen", function () {
      var i = S.eintraege.indexOf(e); if (i >= 0) S.eintraege.splice(i, 1);
      if (!S.eintraege.length) S.zeitraumStart = null;
      speichern(); render(); renderEintraege();
    });
  });
  $("form-eintrag").addEventListener("submit", function (ev) {
    var wer = ev.submitter ? ev.submitter.value : "speichern";
    if (wer !== "speichern") return;
    var tag = $("e-tag").value, von = $("e-von").value, bis = $("e-bis").value, f = $("e-fehler");
    if (!tag || !von || !bis) { ev.preventDefault(); f.textContent = "Bitte Tag, Von und Bis ausfüllen."; f.hidden = false; return; }
    var s = ausInput(tag, von), en = ausInput(tag, bis);
    if (en <= s) en += 86400000; // über Mitternacht
    if (en > Date.now() + 60000) { ev.preventDefault(); f.textContent = "Das Ende liegt in der Zukunft."; f.hidden = false; return; }
    if (en - s > 16 * 3600000) { ev.preventDefault(); f.textContent = "Mehr als 16 Stunden am Stück? Bitte prüf die Zeiten."; f.hidden = false; return; }
    var e = aktuellerEintrag;
    if (e) { e.aufgabe = $("e-aufgabe").value; e.start = s; e.ende = en; }
    else S.eintraege.push({ id: uid(), aufgabe: $("e-aufgabe").value, start: s, ende: en });
    S.zeitraumStart = Math.min.apply(null, S.eintraege.map(function (x) { return x.start; }).concat(S.zeitraumStart || Infinity));
    speichern(); render(); renderEintraege();
    toast(e ? "Eintrag geändert." : "Eintrag nachgetragen.");
  });

  // ---- Alles löschen ----
  $("btn-loeschen").addEventListener("click", function () {
    frage("Alle Daten löschen?", "Aufgaben, Einträge und frühere Protokolle werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen, denn ich habe keine Kopie.", "Alles löschen", function () {
      try { localStorage.removeItem(SPEICHER); } catch (e) {}
      S = neu(); S.introGesehen = true; speichern();
      zeige("tracken"); render(); toast("Alle Daten sind gelöscht.");
    });
  });

  // ---- Info, Installation ----
  var istIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var istApp = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var installEvent = null;
  function installHinweis() {
    if (istApp) return "";
    if (istIOS) return "In Safari unten auf Teilen tippen und dann „Zum Home-Bildschirm“. So bleiben deine Daten sicher gespeichert.";
    if (installEvent) return "Tippe auf „App installieren“. Dann liegt der Tracker wie eine App auf deinem Startbildschirm.";
    return "Im Browser-Menü „Zum Startbildschirm hinzufügen“ oder „App installieren“ wählen.";
  }
  function renderInstall() {
    var t = installHinweis();
    $("install").hidden = !t; $("install-text").textContent = t;
    $("btn-install").hidden = !installEvent;
    $("install-dlg").textContent = t ? "Tipp: " + t : "";
  }
  window.addEventListener("beforeinstallprompt", function (ev) { ev.preventDefault(); installEvent = ev; renderInstall(); });
  window.addEventListener("appinstalled", function () { installEvent = null; istApp = true; renderInstall(); });
  $("btn-install").addEventListener("click", function () {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.finally(function () { installEvent = null; renderInstall(); });
  });

  function infoZeigen() { renderInstall(); $("dlg-info").showModal(); }
  $("btn-info").addEventListener("click", infoZeigen);
  function introGesehen() { if (!S.introGesehen) { S.introGesehen = true; speichern(); } }
  $("dlg-info").addEventListener("close", introGesehen);
  $("dlg-info").querySelector("button[value=ok]").addEventListener("click", introGesehen);

  // ---- Start ----
  render(); renderInstall();
  if (!S.introGesehen) infoZeigen();
  setInterval(function () { if (laufend() && !$("ansicht-tracken").hidden) render(); }, 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { S = laden(); render(); } });

  // Speicher als dauerhaft markieren, damit der Browser ihn nicht von selbst räumt
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
