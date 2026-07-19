const TOTAL = 10;
let answers = {};

// ---- PROGRESS ----
function updateProgress(step) {
  const pct = Math.round(step / TOTAL * 100) + '%';
  // Nav progress bar
  const navFill = document.getElementById('nav-prog-fill');
  const navLabel = document.getElementById('nav-prog-label');
  if (navFill) navFill.style.width = pct;
  if (navLabel) navLabel.textContent = step <= TOTAL ? `Schritt ${step} von ${TOTAL}` : 'Fertig!';
}

// ---- STEPPER ----
const stepperData = { alter: 35 };
function stepperChange(key, delta) {
  const limits = { alter: [10, 90] };
  stepperData[key] = Math.max(limits[key][0], Math.min(limits[key][1], stepperData[key] + delta));
  document.getElementById(key + '-val').textContent = stepperData[key];
  answers['s_' + key] = stepperData[key];
}
// init alter answer
answers['s_alter'] = 35;

// ---- SLIDERS ----
function updateSlider(id, valId) {
  const val = document.getElementById(id).value;
  document.getElementById(valId).textContent = val;
  answers['s_' + id] = parseInt(val);
}

function checkSchrittlPlausibel() {
  const groesse  = parseInt(document.getElementById('groesse')?.value  || 0);
  const schrittl = parseInt(document.getElementById('schrittl')?.value || 0);
  const warn     = document.getElementById('schrittl-warn');
  const warnText = document.getElementById('schrittl-warn-text');
  if (!warn || !groesse || !schrittl) return;

  const ratio = schrittl / groesse;
  const minS  = Math.round(groesse * 0.41);
  const maxS  = Math.round(groesse * 0.56);

  if (ratio < 0.41) {
    warnText.textContent = `Die Schrittlänge (${schrittl} cm) wirkt für eine Körpergröße von ${groesse} cm ungewöhnlich kurz – typisch wären ${minS}–${maxS} cm. Bitte Eingabe prüfen.`;
    warn.style.display = 'block';
  } else if (ratio > 0.56) {
    warnText.textContent = `Die Schrittlänge (${schrittl} cm) wirkt für eine Körpergröße von ${groesse} cm ungewöhnlich lang – typisch wären ${minS}–${maxS} cm. Bitte Eingabe prüfen.`;
    warn.style.display = 'block';
  } else {
    warn.style.display = 'none';
  }
}

function checkArmlaengePlausibel() {
  const groesse   = parseInt(document.getElementById('groesse')?.value   || 0);
  const armlaenge = parseInt(document.getElementById('armlaenge')?.value || 0);
  const warn      = document.getElementById('armlaenge-warn');
  const warnText  = document.getElementById('armlaenge-warn-text');
  if (!warn || !groesse || !armlaenge) return;

  const ratio = armlaenge / groesse;
  const minA  = Math.round(groesse * 0.27);
  const maxA  = Math.round(groesse * 0.45);

  if (ratio < 0.27) {
    warnText.textContent = `Die Armlänge (${armlaenge} cm) wirkt für eine Körpergröße von ${groesse} cm ungewöhnlich kurz – typisch wären ${minA}–${maxA} cm. Bitte Eingabe prüfen.`;
    warn.style.display = 'block';
  } else if (ratio > 0.45) {
    warnText.textContent = `Die Armlänge (${armlaenge} cm) wirkt für eine Körpergröße von ${groesse} cm ungewöhnlich lang – typisch wären ${minA}–${maxA} cm. Bitte Eingabe prüfen.`;
    warn.style.display = 'block';
  } else {
    warn.style.display = 'none';
  }
}
// init slider answers – nach DOM-Bereitschaft
function initSliderAnswers() {
  answers['s_gewicht'] = parseInt(document.getElementById('gewicht').value);
  answers['s_groesse'] = parseInt(document.getElementById('groesse').value);
  answers['s_schrittl'] = parseInt(document.getElementById('schrittl').value);
  answers['s_armlaenge'] = parseInt(document.getElementById('armlaenge').value);

  document.getElementById('gewicht').addEventListener('input', () => answers['s_gewicht'] = parseInt(document.getElementById('gewicht').value));
  document.getElementById('groesse').addEventListener('input', () => { answers['s_groesse'] = parseInt(document.getElementById('groesse').value); checkSchrittlPlausibel(); checkArmlaengePlausibel(); });
  document.getElementById('schrittl').addEventListener('input', () => answers['s_schrittl'] = parseInt(document.getElementById('schrittl').value));
  document.getElementById('armlaenge').addEventListener('input', () => answers['s_armlaenge'] = parseInt(document.getElementById('armlaenge').value));
}

// ---- TERRAIN SLIDERS ----
function updateTerrain(changed) {
  const ids = ['t1','t2','t3','t4'];
  const changedEl = document.getElementById(changed);
  const changedVal = parseInt(changedEl.value);

  // Sum of all OTHER sliders
  const othersSum = ids
    .filter(id => id !== changed)
    .reduce((sum, id) => sum + parseInt(document.getElementById(id).value), 0);

  // Cap the changed slider so total doesn't exceed 100
  const maxAllowed = 100 - othersSum;
  if (changedVal > maxAllowed) {
    changedEl.value = maxAllowed;
  }

  // Read final values and update display
  const vals = ids.map(id => parseInt(document.getElementById(id).value));
  const total = vals.reduce((a, b) => a + b, 0);
  const remaining = 100 - total;

  ids.forEach((id, i) => {
    document.getElementById(id + '-pct').textContent = vals[i];
    answers['s_' + id] = vals[i];
  });

  // Update remaining display
  const remEl = document.getElementById('terrain-remaining');
  if (remaining === 0) {
    remEl.textContent = '✓ 100% verteilt – perfekt!';
    remEl.style.color = 'var(--green)';
  } else {
    remEl.textContent = `Noch ${remaining}% zu verteilen.`;
    remEl.style.color = 'var(--navy)';
  }

  // Update total badge
  const el = document.getElementById('terrain-total');
  if (remaining === 0) {
    el.textContent = '✓ Gesamt: 100%';
    el.className = 'terrain-total ok';
    document.getElementById('next-7').disabled = false;
  } else {
    el.textContent = `Gesamt: ${total}% – noch ${remaining}% übrig`;
    el.className = 'terrain-total over';
    document.getElementById('next-7').disabled = true;
  }
}
// init terrain
answers['s_t1'] = 40; answers['s_t2'] = 30; answers['s_t3'] = 20; answers['s_t4'] = 10;

// ---- PICK (list) ----
function pick(btn, step, value, label) {
  btn.closest('.options').querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
  btn.classList.add('selected');
  answers['s' + step] = { value, label };
  const nb = document.getElementById('next-' + step);
  if (nb) nb.disabled = false;
}

// ---- PICK GRID ----
function pickGrid(btn, step, value, label) {
  btn.closest('.options-grid').querySelectorAll('.opt-grid').forEach(o => o.classList.remove('selected'));
  btn.classList.add('selected');
  answers['s' + step] = { value, label };
  const nb = document.getElementById('next-' + step + '-btn');
  if (nb) nb.disabled = false;
}

// ---- NAV ----
function goNext(step) {
  document.getElementById('step-' + step).classList.remove('active');
  document.getElementById('step-' + (step + 1)).classList.add('active');
  updateProgress(step + 1);
  window.scrollTo(0, 0);
}
function goBack(step) {
  document.getElementById('step-' + step).classList.remove('active');
  document.getElementById('step-' + (step - 1)).classList.add('active');
  updateProgress(step - 1);
  window.scrollTo(0, 0);
}

// ---- CALC RESULT ----
function calcResult() {
  const alter    = answers['s_alter'] || 35;
  const gewicht  = answers['s_gewicht'] || 80;
  const groesse  = answers['s_groesse'] || 175;
  const schrittl = answers['s_schrittl'] || 80;
  const armlaenge= answers['s_armlaenge'] || 62;
  const einsatz  = answers['s6']?.value || 'trekking';
  const t1 = answers['s_t1'] || 40; // Asphalt
  const t2 = answers['s_t2'] || 30; // Waldweg
  const t3 = answers['s_t3'] || 20; // Singletrack
  const t4 = answers['s_t4'] || 10; // Feldweg
  const km       = answers['s8']?.value || 'km_mid';
  const hm       = answers['s9']?.value || 'hm_huegel';
  const ebike    = answers['s10']?.value || 'ebike_nein';

  const specs = [];
  const preise = [];

  // ---- RAHMENGRÖSSE BERECHNEN ----
  let rahmenGroesse = '';
  let rahmenLabel = '';
  let rahmenSub = 'Berechnet aus deinen Körpermaßen';
  let reachRange = '–';
  let sattelrohrInfo = '–';

  if (einsatz === 'mtb_trail' || einsatz === 'mtb_xc') {
    // Moderne MTBs werden über Reach (horizontaler Abstand Tretlager → Steuerrohr) bemessen.
    // Sitzrohrlänge ist irrelevant – wird durch Vario-Sattelstütze ausgeglichen.
    // Reach-Richtwerte nach Körpergröße (Hersteller-Konsens: Cube, Trek, Giant, Specialized):
    // bis 160 cm  → XS  (Reach ~390–420 mm)
    // 160–170 cm  → S   (Reach ~410–450 mm)
    // 170–177 cm  → M   (Reach ~430–470 mm)
    // 177–183 cm  → L   (Reach ~450–490 mm)
    // ab 183 cm   → XL  (Reach ~470–510 mm)
    //
    // Korrekturfaktor: langer Rumpf/Arme → eher größer; kurzer Rumpf/kurze Arme → eher kleiner
    const rumpf = groesse - schrittl; // Rumpflänge näherungsweise
    const rumpfNorm = groesse * 0.53; // Rumpfanteil ~53% der Körpergröße (Körpergröße minus Beinlänge)
    const rumpfDelta = rumpf - rumpfNorm; // positiv = langer Rumpf, negativ = kurzer Rumpf

    // Arm-Korrekturfaktor (Normwert ca. 60cm bei 175cm Körpergröße)
    const armNorm = groesse * 0.343;
    const armDelta = armlaenge - armNorm;

    // Kombinierter Korrekturfaktor: langer Rumpf + lange Arme → Tendenz größer
    const korrektiv = rumpfDelta + armDelta;

    let reachMin, reachMax, groesseLabel;
    if (groesse < 160) {
      reachMin = 390; reachMax = 420; groesseLabel = 'XS';
    } else if (groesse < 170) {
      reachMin = 410; reachMax = 450; groesseLabel = 'S';
    } else if (groesse < 177) {
      reachMin = 430; reachMax = 470; groesseLabel = 'M';
    } else if (groesse < 183) {
      reachMin = 450; reachMax = 490; groesseLabel = 'L';
    } else {
      reachMin = 470; reachMax = 510; groesseLabel = 'XL';
    }

    // Korrektiv-Hinweis für Grenzfälle
    let korrektivHinweis = '';
    if (korrektiv > 4) {
      korrektivHinweis = ' – langer Rumpf/Arme: eher oberes Ende des Reach-Bereichs oder eine Größe größer prüfen';
    } else if (korrektiv < -4) {
      korrektivHinweis = ' – kurzer Rumpf/Arme: eher unteres Ende des Reach-Bereichs oder eine Größe kleiner prüfen';
    }

    rahmenGroesse = groesseLabel;
    rahmenLabel = 'MTB-Rahmengröße (Reach-basiert)';
    rahmenSub = `Empfohlener Reach: ${reachMin}–${reachMax} mm${korrektivHinweis}. Beim modernen MTB zählt der Reach – nicht die Sitzrohrlänge.`;
    reachRange = `${reachMin}–${reachMax} mm`;
    const _stMapMTB = { XS: '370–390', S: '390–420', M: '420–450', L: '450–480', XL: '480–510' };
    sattelrohrInfo = (_stMapMTB[groesseLabel] || '–') + ' mm';

  } else if (einsatz === 'gravel') {
    // Gravel: liegt zwischen Rennrad und MTB – Reach ist heute der maßgebliche Vergleichswert.
    // Gravel-Reach-Werte sind etwas kompakter als MTB, aber ähnlich strukturiert.
    // Richtwerte nach Körpergröße (Hersteller-Konsens für Gravelbikes):
    // bis 160 cm  → XS  (Reach ~360–390 mm)
    // 160–170 cm  → S   (Reach ~375–405 mm)
    // 170–180 cm  → M   (Reach ~390–420 mm)
    // 178–188 cm  → L   (Reach ~405–435 mm)
    // ab 187 cm   → XL  (Reach ~420–450 mm)

    const rumpfG = groesse - schrittl;
    const rumpfNormG = groesse * 0.53;
    const rumpfDeltaG = rumpfG - rumpfNormG;
    const armNormG = groesse * 0.343;
    const armDeltaG = armlaenge - armNormG;
    const korrektivG = rumpfDeltaG + armDeltaG;

    let reachMinG, reachMaxG, groesseLabelG;
    if (groesse < 160) {
      reachMinG = 360; reachMaxG = 390; groesseLabelG = 'XS';
    } else if (groesse < 170) {
      reachMinG = 375; reachMaxG = 405; groesseLabelG = 'S';
    } else if (groesse < 179) {
      reachMinG = 390; reachMaxG = 420; groesseLabelG = 'M';
    } else if (groesse < 188) {
      reachMinG = 405; reachMaxG = 435; groesseLabelG = 'L';
    } else {
      reachMinG = 420; reachMaxG = 450; groesseLabelG = 'XL';
    }

    let korrektivHinweisG = '';
    if (korrektivG > 4) {
      korrektivHinweisG = ' – langer Rumpf/Arme: eher oberes Ende des Reach-Bereichs oder eine Größe größer prüfen';
    } else if (korrektivG < -4) {
      korrektivHinweisG = ' – kurzer Rumpf/Arme: eher unteres Ende des Reach-Bereichs oder eine Größe kleiner prüfen';
    }

    rahmenGroesse = groesseLabelG;
    rahmenLabel = 'Gravel-Rahmengröße (Reach-basiert)';
    rahmenSub = `Empfohlener Reach: ${reachMinG}–${reachMaxG} mm${korrektivHinweisG}. Beim Gravel ist der Reach der entscheidende Vergleichswert – die Sitzrohrlänge wird durch Vorbau und Sattelstütze angepasst.`;
    reachRange = `${reachMinG}–${reachMaxG} mm`;
    const _stMapGravel = { XS: '370–400', S: '400–430', M: '430–460', L: '460–490', XL: '490–520' };
    sattelrohrInfo = (_stMapGravel[groesseLabelG] || '–') + ' mm';

  } else {
    // Rennrad, Trekking, City: klassische Sitzrohr-basierte Berechnung
    let faktor = 0.685;
    if (einsatz === 'rennrad') faktor = 0.67;

    const rahmenCm = Math.round(schrittl * faktor);

    if (einsatz === 'rennrad') {
      if (rahmenCm <= 50) rahmenGroesse = `${rahmenCm} cm (XS)`;
      else if (rahmenCm <= 53) rahmenGroesse = `${rahmenCm} cm (S)`;
      else if (rahmenCm <= 56) rahmenGroesse = `${rahmenCm} cm (M)`;
      else if (rahmenCm <= 59) rahmenGroesse = `${rahmenCm} cm (L)`;
      else rahmenGroesse = `${rahmenCm} cm (XL)`;
      rahmenLabel = 'Rennrad-Rahmengröße (Rohrlänge)';
      sattelrohrInfo = rahmenCm + ' cm';
    } else {
      if (rahmenCm <= 46) rahmenGroesse = `${rahmenCm} cm (XS)`;
      else if (rahmenCm <= 50) rahmenGroesse = `${rahmenCm} cm (S)`;
      else if (rahmenCm <= 54) rahmenGroesse = `${rahmenCm} cm (M)`;
      else if (rahmenCm <= 58) rahmenGroesse = `${rahmenCm} cm (L)`;
      else rahmenGroesse = `${rahmenCm} cm (XL)`;
      rahmenLabel = 'Empfohlene Rahmengröße';
      sattelrohrInfo = rahmenCm + ' cm';
    }
  }

  // Vorbaulänge-Empfehlung aus Armlänge
  let vorbau = '90mm';
  if (armlaenge < 48) vorbau = '70–80mm';
  else if (armlaenge > 62) vorbau = '100–120mm';

  // ---- LAUFRADGRÖSSE ----
  let laufradVal = '', laufradWhy = '', laufradTipp = '';

  if (groesse < 130) {
    laufradVal = '20"';
    laufradWhy = 'Für Kinder bis ca. 130 cm Körpergröße die richtige Laufradgröße.';
  } else if (groesse < 140) {
    laufradVal = '24"';
    laufradWhy = 'Für Kinder bis ca. 140 cm die richtige Wahl – sicheres Standover-Maß, gute Kontrolle.';
  } else if (groesse < 148 && (einsatz === 'mtb_trail' || einsatz === 'mtb_xc' || einsatz === 'mtb_enduro')) {
    laufradVal = '24"';
    laufradWhy = 'Für 140–148 cm ist 24" die sichere Standardempfehlung.';
    laufradTipp = schrittl >= 62
      ? '26" XS als Alternative: Wenn die Schrittlänge über 62 cm liegt, passt ein 26" MTB in XS bereits gut – das Rad wächst deutlich länger mit und spart auf mittlere Sicht einen Neukauf.'
      : 'Ein 26" XS wäre ab einer Schrittlänge von ca. 62 cm möglich – dann wächst das Kind länger in das Rad hinein. Aktuell ist 24" aber die sicherere Wahl.';
  } else if (groesse < 148) {
    laufradVal = '24"';
    laufradWhy = 'Für Kinder und Jugendliche bis ca. 148 cm – Übergang zur vollen Erwachsenengröße.';
  } else if (groesse < 155 && (einsatz === 'mtb_trail' || einsatz === 'mtb_xc' || einsatz === 'mtb_enduro')) {
    laufradVal = '26" oder 27,5"';
    laufradWhy = 'In dieser Körpergröße (148–155 cm) bieten manche Hersteller noch 26"-MTBs an – moderne 27,5"-Rahmen in XS passen aber sehr gut und sind die bessere Wahl, da das Sortiment an 26"-Reifen stark geschrumpft ist.';
  } else if (einsatz === 'rennrad') {
    laufradVal = '28" (700c)';
    laufradWhy = 'Standard beim Rennrad – geringer Rollwiderstand auf Asphalt, maximale Effizienz.';
  } else if (einsatz === 'city' || einsatz === 'trekking' || einsatz === 'gravel') {
    laufradVal = '28" (700c)';
    laufradWhy = 'Standard für Stadt, Trekking und Gravel – gute Rolleffizienz, breites Reifensortiment verfügbar.';
  } else if (einsatz === 'mtb_xc') {
    if (groesse >= 175) {
      laufradVal = '29"';
      laufradWhy = 'Ab 175 cm Körpergröße ist 29" im XC die effizientere Wahl – besseres Überrollen von Hindernissen, höhere Rollgeschwindigkeit.';
    } else {
      laufradVal = '27,5"';
      laufradWhy = 'Unter 175 cm passt 27,5" geometrisch besser – agileres Handling, kein Nachteil im XC-Einsatz.';
    }
  } else if (einsatz === 'mtb_trail') {
    if (groesse >= 180) {
      laufradVal = '29"';
      laufradWhy = 'Große Fahrer profitieren von 29" auch im Trail-Bereich – mehr Laufruhe, besseres Überrollen. Mullet (29" vorne / 27,5" hinten) als Alternative möglich: das größere Vorderrad für mehr Laufruhe bergab, das kleinere Hinterrad für mehr Agilität in Kurven.';
    } else if (groesse >= 165) {
      laufradVal = '27,5" oder 29" (Mullet möglich)';
      laufradWhy = '27,5" ist im Trail die vielseitigere Wahl – agiler bergab, ausreichend rollend bergauf. Mullet-Setup (29" vorne / 27,5" hinten) kombiniert das Beste aus beiden Welten. „Mullet" bezeichnet dabei die asymmetrische Laufradkombination: das größere Vorderrad rollt besser über Hindernisse und sorgt für mehr Laufruhe, das kleinere Hinterrad macht das Bike agiler und ermöglicht engere Kurvenradien.';
    } else {
      laufradVal = '27,5"';
      laufradWhy = 'Unter 165 cm ist 27,5" die bessere Wahl – 29" wird geometrisch für kleinere Fahrer problematisch.';
    }
  } else {
    // Fallback
    laufradVal = '28" (700c)';
    laufradWhy = 'Standard für die meisten Einsatzbereiche – gute Verfügbarkeit, breites Reifensortiment.';
  }

  specs.push({ icon: '⭕', label: 'Laufradgröße', value: laufradVal, why: laufradWhy, warn: '', tipp: laufradTipp });

  // ---- FAHRRADTYP ----
  let radTyp = '', radWhy = '', radWarn = '', radVon = 0, radBis = 0;
  const offroad = t2 + t3 + t4;
  const isEbike = ebike === 'ebike_ja' || (ebike === 'ebike_offen' && (alter > 55 || hm === 'hm_berg'));

  if (isEbike) {
    radTyp = '⚡ E-Bike'; radVon = 2000; radBis = 5000;
    radWhy = `Du hast dich für ein Fahrrad mit elektrischer Unterstützung entschieden – und das ist eine gute Entscheidung. Ein E-Bike bringt dich weiter, macht Strecken möglich, die du sonst auslassen würdest, und öffnet die Tür für gemeinsame Ausfahrten mit Freunden und Familie, auch wenn die konditionell unterschiedlich aufgestellt sind. Kurz: Du wirst mehr Rad fahren. Das ist gut für den Körper und die Gesundheit.`;
    radWarn = `Worüber du dir im Klaren sein solltest: Ein Akku hat eine begrenzte Lebensdauer von etwa 3–7 Jahren – danach ist ein Ersatz fällig, der schnell 500–1.000 € kosten kann. Lade deinen Akku regelmäßig und richtig (nicht dauerhaft vollgeladen lagern, nicht tiefentladen). Reifen und Antrieb verschleißen durch das höhere Gewicht und die höheren Geschwindigkeiten schneller als beim normalen Fahrrad – das gehört in deine Betriebskostenrechnung. Und: Entscheide dich für einen Motor eines Markenherstellers – Bosch, Panasonic oder Brose. Damit gehst du von Anfang an bösen Überraschungen und Reklamationen aus dem Weg.`;
  } else if (einsatz === 'city') {
    radTyp = '🏙 City-/Urbanbike'; radVon = 700; radBis = 1400;
    radWhy = 'Für deinen Haupteinsatz in der Stadt das richtige Werkzeug. Robust, praktisch, wartungsarm.';
    radWarn = '';
  } else if (einsatz === 'rennrad') {
    radTyp = '🏎 Rennrad'; radVon = 1200; radBis = 4000;
    radWhy = `${km === 'km_vhigh' ? 'Mit deinen Wochenkilometern' : 'Für deinen sportlichen Fokus'} auf Asphalt ist das Rennrad die richtige Wahl.`;
    radWarn = alter > 50 ? 'Mit 50+ lohnt sich ein Endurance-Rennrad (aufrechter, komfortabler) statt Race-Geometrie.' : 'Sitz- und Lenkerposition korrekt einstellen – falsche Einstellung führt bei längeren Fahrten zu Schmerzen in Rücken, Nacken und Handgelenken. Wer das Rad intensiv nutzt, für den lohnt sich ein professionelles Bikefitting.';
  } else if (einsatz === 'gravel') {
    radTyp = 'Gravel-Bike'; radVon = 1000; radBis = 3500;
    radWhy = `Bei deiner Untergrundverteilung (${t1}% Asphalt / ${offroad}% Off-Road) ist ein Gravel-Bike der ehrlichste Kompromiss.`;
    radWarn = '"Gravel" ist ein Trendbegriff – vergleiche konkret Rahmen, Schaltung und Bremsen, nicht den Markennamen.';
  } else if (einsatz === 'mtb_trail') {
    radTyp = '🏔 Trail-MTB'; radVon = 1500; radBis = 5000;
    radWhy = `${t3}% Singletrack und Trail-Fokus – hier brauchst du ein richtiges Trail-Rad, kein Kompromiss.`;
    radWarn = 'Fahrwerk-Service (Gabel + Dämpfer) regelmäßig einplanen – das wird beim Kauf oft nicht erwähnt.';
  } else if (einsatz === 'mtb_xc') {
    radTyp = '⛰ XC-MTB / Hardtail'; radVon = 800; radBis = 2500;
    radWhy = 'Cross-Country Fokus mit Ausdauer im Gelände – ein Hardtail ist hier effizienter und wartungsärmer.';
    radWarn = 'Auf die Federgabel achten – eine schlechte Gabel macht ein gutes Hardtail zur Enttäuschung.';
  } else {
    radTyp = '🗺 Trekkingrad'; radVon = 700; radBis = 2000;
    radWhy = `Bei ${t1}% Asphalt und ${offroad}% gemischtem Untergrund ist ein Trekkingrad dein ehrlichster Allrounder.`;
    radWarn = 'Trekkingräder sind aufgrund ihrer komplexen Zubehörteile mit 12 bis 16 kg schwer. Wer heute mit dem Radfahren anfängt, kann schnell Gefallen daran finden – und bald mehr wollen. Bzw. weniger. Nämlich weniger Gewicht am Rad. Diese Möglichkeit sollte vor dem Kauf bedacht werden.';
  }
  // E-Bike Einschätzung wenn Frage 10 = "unentschlossen"
  let radTipp = '';
  if (ebike === 'ebike_offen') {
    if (isEbike) {
      // System empfiehlt E-Bike wegen Alter/Gelände
      radTipp = '💡 Zur E-Bike Frage: Basierend auf deinem Profil – ' + (alter > 55 ? 'deinem Alter' : '') + (alter > 55 && hm === 'hm_berg' ? ' und ' : '') + (hm === 'hm_berg' ? 'dem bergigen Gelände' : '') + ' – empfehle ich dir ein E-Bike. Der Motor macht genau dort einen Unterschied, wo du ihn wirklich brauchst. Du wirst mehr fahren – und das mit mehr Freude.';
    } else {
      // System empfiehlt klassisches Rad
      radTipp = '💡 Zur E-Bike Frage: Basierend auf deinem Profil brauchst du keinen Motor. Deine Strecken, dein Gelände und deine körperliche Situation sprechen für ein klassisches Fahrrad. Ein E-Bike wäre technisch möglich – bringt dir hier aber keinen echten Mehrwert. Dafür bist du mit einem klassischen Rad leichter unterwegs, sparst bei der Anschaffung und hast deutlich weniger Folgekosten (kein Akku-Verschleiß, einfachere Wartung). Wenn du in ein paar Jahren nochmal überlegst – gut. Aber jetzt kauf dir ein klassisches Rad.';
    }
  }
  specs.push({ icon: '🚲', label: 'Fahrradtyp', value: radTyp, why: radWhy, warn: radWarn, tipp: radTipp });
  preise.push({ label: 'Komplettes Rad (Basis)', von: radVon, bis: radBis, note: 'Rahmen + Aufbau ab Händler' });

  // ---- RAHMEN ----
  const _isMTBorGravel = (einsatz === 'mtb_trail' || einsatz === 'mtb_xc' || einsatz === 'gravel');
  let _rahmenGrid = '';
  if (_isMTBorGravel) {
    _rahmenGrid = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">'
      + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:10px;font-weight:700;color:#7a8a98;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Rahmengröße</div>'
      + '<div style="font-size:20px;font-weight:700;color:var(--navy,#1c3448);">' + rahmenGroesse + '</div></div>'
      + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:10px;font-weight:700;color:#7a8a98;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Reach</div>'
      + '<div style="font-size:16px;font-weight:700;color:var(--navy,#1c3448);">' + reachRange + '</div></div>'
      + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:10px;font-weight:700;color:#7a8a98;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Sattelrohr</div>'
      + '<div style="font-size:16px;font-weight:700;color:var(--navy,#1c3448);">' + sattelrohrInfo + '</div></div>'
      + '</div>';
  }
  const _rahmenWhy = _rahmenGrid
    + '<div style="font-size:12px;font-weight:700;color:#7a8a98;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Rahmenmaterial: Aluminium oder Carbon?</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:12px;font-size:12px;line-height:1.7;">'
    + '<div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:6px;">🔩 Aluminium</div>'
    + '<span style="color:#2a7a2a;">✓ Günstiger (kein Aufpreis)</span><br>'
    + '<span style="color:#2a7a2a;">✓ Robust, reparierbar</span><br>'
    + '<span style="color:#2a7a2a;">✓ Unempfindlich bei Sturz</span><br>'
    + '<span style="color:#b05000;">✗ Etwas schwerer (+200–500 g)</span><br>'
    + '<span style="color:#b05000;">✗ Überträgt mehr Vibrationen</span>'
    + '</div>'
    + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:12px;font-size:12px;line-height:1.7;">'
    + '<div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:6px;">🏁 Carbon</div>'
    + '<span style="color:#2a7a2a;">✓ Leichter (–200–500 g)</span><br>'
    + '<span style="color:#2a7a2a;">✓ Bessere Vibrationsdämpfung</span><br>'
    + '<span style="color:#2a7a2a;">✓ Gezieltere Steifigkeit</span><br>'
    + '<span style="color:#b05000;">✗ Teurer (+500–2.000 €)</span><br>'
    + '<span style="color:#b05000;">✗ Bei Sturz: Rahmen prüfen lassen</span>'
    + '</div></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + '<button onclick="selectRahmenMaterial(\'alu\')" id="btn-rahmen-alu" style="background:var(--navy,#1c3448);color:#fff;border:none;border-radius:6px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s;">Aluminium wählen</button>'
    + '<button onclick="selectRahmenMaterial(\'carbon\')" id="btn-rahmen-carbon" style="background:var(--navy,#1c3448);color:#fff;border:none;border-radius:6px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s;">Carbon wählen</button>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--green,#3a7a4a);background:#f0f7f2;border-left:3px solid var(--green,#3a7a4a);border-radius:0 4px 4px 0;padding:7px 10px;margin-bottom:10px;line-height:1.5;">'
    + '💡 <strong>* Wichtiger Hinweis zur Rahmengröße:</strong> Diese Empfehlung basiert auf deinen Körpermaßen und ist ein rechnerischer Richtwert. Fahrradhersteller bieten ihre Modelle in eigenen Größenstufungen an – die Bezeichnungen und Sitzrohrlängen variieren je nach Marke und Modell teils erheblich. Vor dem Kauf immer die Geometrietabelle des konkreten Modells prüfen und im Zweifel Probefahrt machen oder den Händler konsultieren.'
    + '</div>'
    + '<div id="rahmen-material-detail" style="display:none;"></div>';
  const _rahmenValue = _isMTBorGravel ? ('Größe ' + rahmenGroesse + ' – Details zum Rahmen') : (rahmenGroesse + ' – deine optimale Rahmenhöhe*');
  specs.push({ icon: '🔩', label: 'Rahmen', value: _rahmenValue, why: _rahmenWhy, warn: '', tipp: '' });

  // ---- ANTRIEB (nur bei unentschlossenen Nutzern) ----
  if (ebike === 'ebike_offen') {
    const _antriebWhy = '<div style="font-size:12px;font-weight:700;color:#7a8a98;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Mit oder ohne Elektroantrieb?</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
      + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:12px;font-size:12px;line-height:1.7;">'
      + '<div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:6px;">⚡ Mit Elektroantrieb</div>'
      + '<span style="color:#2a7a2a;">✓ Größere Reichweite</span><br>'
      + '<span style="color:#2a7a2a;">✓ Bergauf deutlich leichter</span><br>'
      + '<span style="color:#2a7a2a;">✓ Mehr Spaß, mehr Kilometer</span><br>'
      + '<span style="color:#b05000;">✗ Schwerer (+3–5 kg)</span><br>'
      + '<span style="color:#b05000;">✗ Akku kostet 500–1.000 € Ersatz</span><br>'
      + '<span style="color:#b05000;">✗ Aufwändigere Wartung</span>'
      + '</div>'
      + '<div style="background:var(--cream2,#f0ede8);border-radius:8px;padding:12px;font-size:12px;line-height:1.7;">'
      + '<div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:6px;">🚲 Ohne Elektroantrieb</div>'
      + '<span style="color:#2a7a2a;">✓ Leichter, agiler</span><br>'
      + '<span style="color:#2a7a2a;">✓ Keine Akku-Folgekosten</span><br>'
      + '<span style="color:#2a7a2a;">✓ Einfachere Wartung</span><br>'
      + '<span style="color:#b05000;">✗ Keine Motorunterstützung</span><br>'
      + '<span style="color:#b05000;">✗ Bergstrecken rein aus eigener Kraft</span><br>'
      + '<span style="color:#b05000;">✗ Kürzere Ausfahrten bei schlechter Kondition</span>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
      + '<button onclick="selectAntrieb(\'ebike\')" id="btn-antrieb-ebike" style="background:var(--navy,#1c3448);color:#fff;border:none;border-radius:6px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s;">Mit Elektroantrieb</button>'
      + '<button onclick="selectAntrieb(\'klassisch\')" id="btn-antrieb-klassisch" style="background:var(--navy,#1c3448);color:#fff;border:none;border-radius:6px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s;">Ohne Elektroantrieb</button>'
      + '</div>'
      + '<div id="antrieb-detail" style="display:none;"></div>';
    specs.push({ icon: '⚡', label: 'Antrieb', value: 'Noch offen – triff deine Wahl', why: _antriebWhy, warn: '', tipp: '' });
  }

  // ---- FEDERUNG ----
  let fedVal = '', fedWhy = '', fedWarn = '';
  if (einsatz === 'city' || einsatz === 'rennrad' || einsatz === 'gravel') {
    fedVal = 'Starrgabel';
    if (einsatz === 'rennrad') {
      fedWhy = 'Rennräder fahren grundsätzlich mit Starrgabel – das gehört zur DNA des Fahrrads. Komfort erreichst du hier über den Reifendruck: breitere Reifen (28–32 mm) lassen sich mit wenig Luftdruck fahren und schlucken Unebenheiten deutlich besser als schmale Reifen mit hohem Druck. Das macht auf langen Touren einen spürbaren Unterschied – bei praktisch null Mehrkosten wenn du beim nächsten Reifenwechsel auf eine breitere Dimension gehst.';
    } else if (einsatz === 'gravel') {
      fedWhy = 'Gravel Bikes fahren mit Starrgabel – Federgabeln sind in diesem Segment absolut unüblich und auch nicht sinnvoll. Komfort holst du dir beim Gravel über den Reifen: breitere Reifen (40–50 mm) erlauben niedrigeren Luftdruck, der Unebenheiten und Schotter spürbar abfedert. Das ist die richtige und günstige Lösung – nicht eine Federgabel. Wer auf sehr ruppigem Terrain unterwegs ist, sollte eher über ein MTB nachdenken als über eine Federgabel am Gravel Bike.';
    } else {
      fedWhy = 'Für deinen Einsatz wartungsfrei und leichter.';
    }
  } else if (einsatz === 'mtb_trail') {
    if (t3 > 40) {
      fedVal = 'Vollfederung (Luftfeder)'; fedWhy = `${t3}% Singletrack – Vollfederung ist hier die richtige Wahl. Ein vollgefedertes Rad hat zwei Federelemente: Gabel vorne und Dämpfer hinten. Beide enthalten Öl, das mit der Zeit altert und seine Dämpfungseigenschaften verliert. Wer den Service vernachlässigt, merkt das zuerst am Fahrgefühl – das Rad wird unruhiger, der Grip schlechter, die Kontrolle bergab nimmt ab. Im schlimmsten Fall verschleißen Dichtungen und Lagerstellen, was deutlich teurer wird als ein rechtzeitiges Service. Gabel und Dämpfer sollten alle 100–200 Betriebsstunden gewartet werden – wer das regelmäßig macht, hat lange Freude an einem Rad das sich anfühlt wie am ersten Tag.`;
      preise.push({ label: 'Fahrwerk (Gabel + Dämpfer)', von: 400, bis: 1200, note: 'Luftfeder, RockShox/Fox' });
    } else {
      fedVal = 'Federgabel Hardtail (130–150mm)'; fedWhy = 'Für deinen Trail-Anteil reicht ein Hardtail mit guter Gabel. Unbedingt auf eine Luftfeder-Gabel achten – nur so lässt sich der Luftdruck exakt auf das Fahrergewicht abstimmen. Federgabeln mit Stahlfeder-System sind nur sehr begrenzt einstellbar – der Federkomfort bleibt dort hinter den Erwartungen, besonders im sportlichen Trail-Einsatz.';
      preise.push({ label: 'Federgabel', von: 250, bis: 600, note: 'Luftfeder, RockShox Pike/Fox Rhythm' });
    }
  } else if (t2 + t3 > 40) {
    fedVal = 'Federgabel (80–100mm)';
    fedWhy = `Bei ${offroad}% Off-Road macht eine Federgabel Sinn. Service alle 100–200 Betriebsstunden nicht vergessen.`;
    preise.push({ label: 'Federgabel', von: 150, bis: 400, note: 'Einstieg Luftfeder' });
  } else {
    fedVal = 'Starrgabel'; fedWhy = 'Bei überwiegend Asphalt und hartem Untergrund ist eine Starrgabel die effizientere Wahl.';
  }

  // Luftfeder-Hinweis direkt in why integrieren, kein separater Tipp-Block
  const istLeichterFahrer = gewicht < 65;
  const istSchwerFahrer = gewicht > 100;
  const istSportlicherFahrer = einsatz === 'mtb_trail' || einsatz === 'mtb_xc' || km === 'km_high' || km === 'km_vhigh';
  if (fedVal !== 'Starrgabel') {
    if (istSchwerFahrer) {
      // Starke, explizite Warnung für schwere Fahrer
      fedWhy += ` Bei deinem Gewicht solltest du unbedingt darauf achten, dass dein neues Fahrrad mit einer Luftfedergabel ausgestattet ist. Nur Luftfedergabeln können durch Druck an verschiedene Belastungen angepasst werden und gewährleisten so eine optimale Funktion ohne Durchzuschlagen. Bei Stahlfeder- und Elastomer-Systemen sind Einstellungen im erforderlichen Ausmaß nicht möglich.`;
      if (einsatz === 'mtb_trail' && t3 > 40) {
        fedWhy += ` Gleiches gilt für den Hinterbau-Dämpfer: Auch hier ausschließlich Luftfeder wählen.`;
      }
      fedWarn = `Wichtig bei ${gewicht} kg: Keine Stahlfeder-Gabel, kein Elastomer. Nur Luftfeder – sowohl an der Gabel als auch am Hinterbau-Dämpfer. Das ist keine Frage des Komforts, sondern der Funktion.`;
    } else if (einsatz !== 'mtb_trail') {
      if (istLeichterFahrer || istSportlicherFahrer) {
        fedWhy += ` Unbedingt auf eine Luftfeder-Gabel achten – der Luftdruck lässt sich exakt auf das Fahrergewicht abstimmen, was den Federweg und die Ansprechcharakteristik direkt beeinflusst.${istLeichterFahrer ? ' Bei leichten Fahrern (unter 65 kg) besonders wichtig – Stahlfedern sind oft zu hart und nicht ausreichend anpassbar.' : ''} Federgabeln mit Stahlfeder-System sind nur sehr begrenzt einstellbar – der Federkomfort bleibt dort hinter den Erwartungen.`;
      } else {
        fedWhy += ` Eine Luftfeder-Gabel ist empfehlenswert – sie lässt sich per Luftdruck auf das Fahrergewicht abstimmen und spricht dadurch besser an. Federgabeln mit Stahlfedern sind nur begrenzt einstellbar; die Erwartungen an Federkomfort und Dämpfung sollten dort nicht zu hoch sein.`;
      }
    }
  }

  specs.push({ icon: '🔰', label: 'Federung', value: fedVal, why: fedWhy, warn: fedWarn, tipp: '' });

  // ---- SCHALTUNG ----
  // Kilometerkalkulation: Mittelwert der gewählten km-Klasse × 52 Wochen × 7 Jahre
  const kmProWocheMap = { km_low: 20, km_mid: 65, km_high: 150, km_vhigh: 250 };
  const kmProWoche = kmProWocheMap[km] || 65;
  const km7JahreBasis = kmProWoche * 52 * 7;

  // Verschleißfaktor durch Höhenmeter:
  // Flach:   kein Aufschlag (Faktor 1.0)
  // Hügelig: +15% (Faktor 1.15) – häufigeres Schalten, mehr Zugkraft bergauf, mehr Bremslast bergab
  // Bergig:  +30% (Faktor 1.30) – alpine Touren, Pässe, deutlich kürzere Verschleißintervalle
  const verschleissFaktor = hm === 'hm_berg' ? 1.30 : hm === 'hm_huegel' ? 1.15 : 1.0;
  const km7Jahre = Math.round(km7JahreBasis * verschleissFaktor);
  const verschleissHinweis = verschleissFaktor > 1.0
    ? ` (inkl. ${Math.round((verschleissFaktor - 1) * 100)}% Verschleißaufschlag für ${hm === 'hm_berg' ? 'bergiges' : 'hügeliges'} Gelände)`
    : '';

  // Schaltwerk-Lebensdauer Referenzwerte (Erfahrungswerte Community):
  // Deore:  15.000–25.000 km → Grenze bei ~20.000 km
  // SLX:    25.000–35.000 km → Grenze bei ~30.000 km
  // XT:     35.000–50.000 km → Grenze bei ~42.000 km
  // XTR:    40.000–60.000 km → lohnt ab Rennsport/sehr hoch

  let schaltGruppe = '', schaltGruppeBegruendung = '', schaltGruppeWarn = '';
  let schVon = 0, schBis = 0;
  const brauchtGroesseUebersetzung = hm === 'hm_berg' || km === 'km_high' || km === 'km_vhigh';

  if (einsatz === 'city') {
    // Stadtrad → Nabenschaltung, km-Logik nicht anwendbar
    schaltGruppe = 'Nabenschaltung Shimano Nexus 7/8';
    schVon = 150; schBis = 350;
    schaltGruppeBegruendung = 'Die Empfehlung ist eine Nabenschaltung. Die Kosten für Ersatzteile dieser Schaltung sind deutlich geringer, der Aufwand bei Reinigung, Wartung und Einstellung ist minimal, und es gibt keine Elemente die verbogen oder beschädigt werden können – da sich der gesamte Schaltmechanismus im Nabenkörper befindet. Eine Nabenschaltung kann man im Stand schalten – wenn man vor der Ampel vergessen hat zurückzuschalten.';
    schaltGruppeWarn = '';
    specs.push({ icon: '⚙️', label: 'Schaltung', value: schaltGruppe, why: schaltGruppeBegruendung, warn: schaltGruppeWarn });
    preise.push({ label: 'Nabenschaltung', von: schVon, bis: schBis, note: 'Wartungsarme Stadtlösung' });

  } else if (einsatz === 'rennrad' || einsatz === 'gravel') {
    // Rennrad/Gravel → Shimano 105 / GRX – andere Gruppenlogik, kein MTB-Schaltwerk
    const grpName = km7Jahre > 54000
      ? (brauchtGroesseUebersetzung ? 'Shimano Ultegra / GRX 2×12 (Compact)' : 'Shimano Ultegra 2×12')
      : (brauchtGroesseUebersetzung ? 'Shimano 105 / GRX 2×11 (Compact)' : 'Shimano 105 / GRX 2×11');
    schVon = 250; schBis = 700;
    schaltGruppeBegruendung = `In 7 Jahren fährst du ca. ${Math.round(km7Jahre / 1000)}.000 km${verschleissHinweis}.${km7Jahre > 54000 ? ' Bei dieser Laufleistung lohnt Ultegra – robustere Lager, höhere Fertigungstoleranz.' : ' 105/GRX ist das Mittelklasse-Optimum: 95% der Topgruppen-Performance.'}${brauchtGroesseUebersetzung ? ' Compact-Übersetzung für Berge ist Pflicht.' : ''}`;
    schaltGruppeWarn = 'Den Kettenverschleiß im Auge behalten ist das Wichtigste. Wer die Zahnkränze gleichmäßig nutzt und die Kette rechtzeitig wechselt, spart viel Geld bei Kettenblatt und Kassette – denn ein rechtzeitiger Kettentausch verhindert den teuren Folgeverschleiß.';
    const rennradDowngrade = km7Jahre > 54000
      ? `💡 <strong>Tipp:</strong> Das Schaltwerk (Ultegra) ist die kritische Komponente – hier nicht sparen. Bei Schalthebeln, Kettenblatt und Kurbel kannst du auf Shimano 105 downgraden. Das bedeutet etwas schlechtere Schaltpräzision und ein paar Gramm mehr Gewicht – im Alltag kaum spürbar. Diese Teile verschleißen deutlich langsamer und können bei Bedarf später einzeln getauscht werden.`
      : `💡 <strong>Tipp:</strong> Das Schaltwerk (105/GRX) trägt den Hauptverschleiß – hier die empfohlene Gruppe nehmen. Bei Schalthebeln, Kettenblatt und Kurbel kannst du auf Shimano Tiagra downgraden – eine Stufe tiefer, nicht weiter. Das kostet etwas Schaltpräzision und bringt mehr Gewicht, ist aber technisch noch vertretbar. Tiagra ist die unterste Grenze für laufruhiges Schalten.`;
    specs.push({ icon: '⚙️', label: 'Schaltung', value: grpName, why: schaltGruppeBegruendung, warn: schaltGruppeWarn, tipp: rennradDowngrade });
    preise.push({ label: 'Schaltgruppe', von: schVon, bis: schBis, note: 'Schalthebel, Kassette, Kette' });

  } else {
    // MTB / Trekking → Schaltwerk-Lebensdauer-Logik
    let gruppenName = '';
    let gruppenKuerzel = '';

    if (km7Jahre <= 20000) {
      gruppenName = brauchtGroesseUebersetzung ? 'Shimano Deore 1×11 oder 2×10' : 'Shimano Deore 2×10';
      gruppenKuerzel = 'Deore';
      schVon = 100; schBis = 280;
    } else if (km7Jahre <= 35000) {
      gruppenName = brauchtGroesseUebersetzung ? 'Shimano SLX 1×12 (10–51T)' : 'Shimano SLX 1×11';
      gruppenKuerzel = 'SLX';
      schVon = 180; schBis = 380;
    } else if (km7Jahre <= 55000) {
      gruppenName = brauchtGroesseUebersetzung ? 'Shimano XT 1×12 (10–51T)' : 'Shimano XT 1×12';
      gruppenKuerzel = 'XT';
      schVon = 280; schBis = 520;
    } else {
      gruppenName = 'Shimano XT oder XTR 1×12';
      gruppenKuerzel = 'XT/XTR';
      schVon = 350; schBis = 800;
    }

    // Warum-Text mit Kilometer-Begründung
    const kmGerundet = Math.round(km7Jahre / 1000);
    let warumText = `In 7 Jahren fährst du bei deinen Angaben ca. ${kmGerundet}.000 km${verschleissHinweis}. `;
    if (gruppenKuerzel === 'Deore') {
      warumText += `Das Deore-Schaltwerk hält bis ~20.000 km zuverlässig – du liegst mit ${kmGerundet}.000 km gut im Rahmen. Für diesen Einsatz ist Deore die ehrlichste und günstigste Lösung.`;
    } else if (gruppenKuerzel === 'SLX') {
      warumText += `Deore-Schaltwerke sind bei ~20.000 km am Limit. SLX hält bis ~30.000–35.000 km und gibt dir bei ${kmGerundet}.000 km ausreichend Reserve. Gutes Preis-Leistungs-Verhältnis.`;
    } else if (gruppenKuerzel === 'XT') {
      warumText += `SLX wäre bei deiner Laufleistung zu knapp. Das XT-Schaltwerk hält 35.000–50.000 km und deckt deine ${kmGerundet}.000 km mit Reserve ab. Kugelgelagerte Röllchen, robusterer Spannarm.`;
    } else {
      warumText += `Bei ${kmGerundet}.000 km in 7 Jahren ist XT das Minimum. XTR lohnt sich, wenn du Gewicht sparen willst oder im Renneinsatz unterwegs bist. Sonst: XT ist die rationellere Entscheidung.`;
    }

    const warnText = 'Den Kettenverschleiß im Auge behalten ist das Wichtigste. Wer die Zahnkränze gleichmäßig nutzt und die Kette rechtzeitig wechselt, spart viel Geld bei Kettenblatt und Kassette – denn ein rechtzeitiger Kettentausch verhindert den teuren Folgeverschleiß.';

    // Downgrade-Hinweis für andere Komponenten – immer nur eine Gruppe tiefer
    let downgradeHinweis;
    if (gruppenKuerzel === 'Deore') {
      downgradeHinweis = `💡 <strong>Tipp:</strong> Das Schaltwerk trägt den Hauptverschleiß – hier unbedingt Deore nehmen. Bei Schalthebeln, Umwerfer, Kettenblatt und Kurbel ist Deore bereits die unterste sinnvolle Grenze – ein weiterer Downgrade auf Altus/Acera würde die Schaltpräzision merklich verschlechtern und lohnt sich nicht.`;
    } else if (gruppenKuerzel === 'SLX') {
      downgradeHinweis = `💡 <strong>Tipp:</strong> Das Schaltwerk (SLX) bleibt gesetzt – hier nicht sparen. Bei Schalthebeln, Umwerfer, Kettenblatt und Kurbel kannst du auf Deore-Niveau downgraden. Das kostet etwas Schaltpräzision und bringt ein paar Gramm mehr, aber technisch ist das vertretbar. Diese Teile verschleißen deutlich langsamer als das Schaltwerk und können bei Bedarf einzeln getauscht werden.`;
    } else if (gruppenKuerzel === 'XT') {
      downgradeHinweis = `💡 <strong>Tipp:</strong> Das Schaltwerk (XT) bleibt gesetzt – hier nicht sparen. Bei Schalthebeln, Umwerfer, Kettenblatt und Kurbel kannst du auf SLX-Niveau downgraden. Der Unterschied in der Praxis ist gering – etwas weniger präzises Schaltgefühl, minimal mehr Gewicht. Diese Teile verschleißen deutlich langsamer als das Schaltwerk und können später einzeln erneuert werden.`;
    } else {
      downgradeHinweis = `💡 <strong>Tipp:</strong> Das Schaltwerk (XT oder XTR) bleibt gesetzt – das ist bei dieser Laufleistung keine Frage. Bei Schalthebeln, Umwerfer, Kettenblatt und Kurbel kannst du auf XT-Niveau downgraden, wenn XTR zu teuer ist. Der Gewichtsunterschied ist dann minimal, die Funktion identisch. XTR lohnt sich wirklich nur, wenn Gewicht ein echtes Kriterium ist.`;
    }

    specs.push({
      icon: '⚙️',
      label: 'Schaltung',
      value: gruppenName,
      why: warumText,
      warn: warnText,
      tipp: downgradeHinweis
    });
    preise.push({ label: 'Schaltgruppe', von: schVon, bis: schBis, note: 'Schaltwerk, Schalthebel, Kassette' });
  }

  // ---- BREMSEN ----
  let bremVal = '', bremWhy = '', bremWarn = '', bremTipp = '';
  let bremVon = 0, bremBis = 0;

  if (!isEbike && einsatz === 'city' && km === 'km_low') {
    bremVal = 'Felgenbremse oder mech. Scheibe'; bremVon = 30; bremBis = 80;
    bremWhy = 'Felgenbremsen sind einfacher im Service, Ersatzteile kosten weniger, und die Bremsleistung ist für kurze Stadtfahrten absolut ausreichend. Wer mehr Bremsleistung will, tauscht einfach die Bremsbeläge gegen eine weichere Gummimischung – je weicher der Gummi, desto mehr Biss, desto höher aber auch der Verschleiß. Scheibenbremsen haben grundsätzlich mehr Bremsleistung und sind unabhängig vom Felgenzustand – dafür sind Folgekosten höher und Reparaturen aufwändiger. Bei Regen verlieren Felgenbremsen spürbar an Leistung – wer oft im Regen fährt, ist mit einer mechanischen Scheibenbremse besser bedient.';
    bremWarn = '';
    bremTipp = '';
  } else {
    // Bremsgruppe passend zur Schaltgruppe bestimmen
    // Faustregel: Deore-Niveau ist das Minimum (keine Bremsen darunter – Undichtigkeitsproblem)
    // Rennrad/Gravel: Shimano 105 / Ultegra hydraulisch
    // MTB: Deore / SLX / XT je nach Schaltgruppe

    let bremGruppe = '';
    let bremDowngrade = '';

    if (einsatz === 'rennrad' || einsatz === 'gravel') {
      if (km7Jahre > 54000) {
        bremGruppe = 'Shimano Ultegra hydraulisch';
        bremDowngrade = 'Shimano 105 hydraulisch';
        bremVon = 100; bremBis = 220;
      } else {
        bremGruppe = 'Shimano 105 hydraulisch';
        bremDowngrade = 'Shimano Tiagra hydraulisch';
        bremVon = 80; bremBis = 180;
      }
      bremVal = bremGruppe;
      bremWhy = `Zur empfohlenen Schaltgruppe passende Bremse. Hydraulisch ist Pflicht – mechanische Scheibenbremsen am Rennrad sind ein Kompromiss, kein Standard.`;
      bremWarn = 'Shimano = Mineralöl. Nicht mit DOT-Öl (SRAM, Magura) mischen – das zerstört die Dichtungen.';
      bremTipp = `💡 <strong>Tipp:</strong> Downgrade auf ${bremDowngrade} möglich – diese Bremse ist leicht schlechter dosierbar, aber zuverlässig dicht und wartungsfreundlich. Keine Bremsen unterhalb Shimano Tiagra hydraulisch nehmen – hier habe ich wiederholt Undichtigkeitsprobleme erlebt.`;

    } else {
      // MTB / Trekking: Gruppe aus km7Jahre ableiten (selbe Logik wie Schaltwerk)
      if (km7Jahre <= 20000) {
        bremGruppe = 'Shimano Deore hydraulisch';
        bremDowngrade = null;
        bremVon = 60; bremBis = 120;
      } else if (km7Jahre <= 35000) {
        bremGruppe = 'Shimano SLX hydraulisch';
        bremDowngrade = 'Shimano Deore';
        bremVon = 80; bremBis = 150;
      } else {
        bremGruppe = 'Shimano XT hydraulisch';
        bremDowngrade = 'Shimano Deore oder SLX';
        bremVon = 100; bremBis = 190;
      }

      bremVal = bremGruppe;
      bremWhy = `Zur empfohlenen Schaltgruppe passende Bremse. Hydraulisch ist heute Standard – funktioniert unabhängig von Nässe, Felgenzustand und Wetter.`;
      bremWarn = isEbike ? `E-Bike: Serienmäßig sind oft 160mm (hinten) / 180mm (vorne) verbaut – das ist zu wenig. Empfehlung: mindestens 180/180mm, besser 203/180mm (vorne/hinten). Mehr Kühlfläche = gleichbleibende Bremsleistung bei E-Bike-Gewicht und -Geschwindigkeit.` : '';

      // Downgrade-Tipp + Scheiben-Tipp
      const scheibentipp = `Unabhängig von der gewählten Bremse lohnt sich eine <strong>Shimano XT Bremsscheibe</strong> – ihre leicht aufgeraute Oberfläche verbessert die Dosierbarkeit und Bremsperformance spürbar, auch in Kombination mit günstigeren Bremssätteln.`;

      if (bremDowngrade) {
        bremTipp = `💡 <strong>Tipp:</strong> Downgrade auf ${bremDowngrade} ist möglich – zuverlässig dicht, günstigere Ersatzteile. Keine Bremsen unterhalb Shimano Deore nehmen – hier habe ich wiederholt Undichtigkeitsprobleme erlebt.${isEbike ? ` Serienmäßig sind oft 160mm (hinten) / 180mm (vorne) verbaut – ich empfehle mindestens 180/180mm, besser 203/180mm (vorne/hinten).` : ''} ${scheibentipp}`;
      } else {
        bremTipp = `💡 <strong>Tipp:</strong> Deore ist das empfohlene Minimum – keine Bremsen günstigerer Gruppen nehmen. In der Praxis zeigen diese Bremsen häufig Probleme mit Undichtigkeit.${isEbike ? ` Serienmäßig sind oft 160mm (hinten) / 180mm (vorne) verbaut – ich empfehle mindestens 180/180mm, besser 203/180mm (vorne/hinten).` : ''} ${scheibentipp}`;
      }
    }
  }
  specs.push({ icon: '🔴', label: 'Bremsen', value: bremVal, why: bremWhy, warn: bremWarn, tipp: bremTipp });
  preise.push({ label: 'Bremsen (pro Stück)', von: bremVon, bis: bremBis, note: 'Vorne + Hinten, je Bremse' });

  // ---- REIFEN ----
  let reifVal = '', reifWhy = '', reifWarn = '', reifTipp = '';
  let reifVon = 0, reifBis = 0;

  const istSportlich = einsatz === 'mtb_trail' || einsatz === 'mtb_xc' || einsatz === 'gravel' || einsatz === 'rennrad';
  const istAlltag = einsatz === 'city' || einsatz === 'trekking';

  // Grundempfehlung ist immer Draht-/Faltreifen mit Schlauch
  reifVal = 'Draht-/Faltreifen mit Schlauch';
  reifVon = 30; reifBis = 80;

  if (istAlltag) {
    reifWhy = 'Für Stadt und Alltag die eindeutig richtige Wahl. Draht- und Faltreife mit Schlauch sind überall erhältlich, einfach zu wechseln und im Pannenfall auch am Straßenrand problemlos zu reparieren. Kein Sonderwerkzeug, kein Aufwand.';
    reifWarn = '';
    reifTipp = '';
  } else if (einsatz === 'mtb_trail' || t3 > 30) {
    reifWhy = `Draht-/Faltreifen mit Schlauch sind einfach zu wechseln, überall verfügbar und im Pannenfall am Trail kein Problem – Schlauch rein, fertig. Das ist die unkomplizierteste Lösung und für viele Fahrer die richtige Wahl.`;
    reifWarn = '';
    reifTipp = `💡 <strong>Upgrade-Tipp: Tubeless Ready</strong> – Wenn du viel Trail fährst, lohnt sich der Umstieg auf ein Tubeless-System. Die Vorteile: weniger Luftdruck möglich (mehr Grip, besserer Komfort), kleine Einstiche dichten sich durch die Dichtmilch oft selbst ab (keine Reifenpanne). Der Verschleiß der Reifen selbst ist ähnlich wie mit Schlauch. <strong>Aber ehrlich:</strong> Tubeless bedeutet Mehraufwand. Die Dichtmilch muss alle 2–4 Monate kontrolliert und bei Bedarf erneuert werden – trockene Milch dichtet nicht mehr ab. Das Aufziehen ist komplizierter als bei einem normalen Reifen. Und bei einem größeren Riss hilft nur ein mitgeführter Schlauch als Notlösung. Für viele Alltags-Trailfahrer ist der ehrliche Mehrwert überschaubar – aber wer konsequent fährt, weiß den Grip-Gewinn zu schätzen. Einmaliges Setup-Budget: ca. 60–120 €.`;
    preise.push({ label: 'Tubeless-Setup (optional, einmalig)', von: 60, bis: 120, note: 'Felgenband, Ventile, Milch, Reifen' });
  } else if (istSportlich) {
    reifWhy = `Draht-/Faltreifen mit Schlauch sind überall verfügbar, einfach zu wechseln und im Pannenfall unkompliziert zu reparieren. Für den Einstieg und für alle, die keine Lust auf Mehraufwand haben, ist das die richtige und sinnvollste Wahl.`;
    reifWarn = '';
    reifTipp = `💡 <strong>Upgrade-Tipp: Tubeless Ready</strong> – Für sportliche Einsätze auf Schotter oder Gravel lohnt sich das Thema Tubeless. Weniger Luftdruck möglich (besserer Grip, weniger Vibrationen), kleine Einstiche dichten sich oft von selbst ab. <strong>Aber auch hier gilt:</strong> Tubeless bedeutet Mehraufwand. Die Dichtmilch trocknet aus und muss alle 2–4 Monate erneuert werden – wer das vergisst, hat kein funktionierendes System mehr. Das Aufziehen ist anspruchsvoller als mit Schlauch, und einen Ersatzschlauch für den Notfall sollte man immer dabei haben. Kosten und Verschleiß der Reifen selbst unterscheiden sich kaum von Reifen mit Schlauch – der Aufwand entsteht durch die laufende Milch-Pflege. Einmaliges Setup-Budget: ca. 50–100 €.`;
    preise.push({ label: 'Tubeless-Setup (optional, einmalig)', von: 50, bis: 100, note: 'Felgenband, Ventile, Milch, Reifen' });
  } else {
    reifWhy = `Draht-/Faltreifen mit Schlauch sind die einfachste und zuverlässigste Wahl. Überall erhältlich, einfach zu wechseln – auch ohne Pannenkurs am Straßenrand.`;
    reifWarn = '';
    reifTipp = '';
  }
  specs.push({ icon: '🔵', label: 'Reifen-System', value: reifVal, why: reifWhy, warn: reifWarn, tipp: reifTipp });

  // ---- ALTER/KOMFORT-HINWEIS ----
  let komfortVal = '', komfortWhy = '';
  if (alter >= 50) {
    komfortVal = 'Komfort-Geometrie empfohlen';
    komfortWhy = `Mit ${alter} Jahren lohnt sich ein etwas aufrechter Sitz – Endurance-Geometrie statt Race. Gefederte Sattelstütze oder Federsattel können Rücken und Po schonen. Kein Kompromiss beim Spaß, aber weniger Schmerzen nach 3 Stunden.`;
  } else if (alter <= 25 && km === 'km_vhigh') {
    komfortVal = 'Sportliche Race-Geometrie möglich';
    komfortWhy = `Mit ${alter} Jahren und hohem Trainingsumfang verträgt dein Körper eine aggressivere Position gut. Trotzdem: Bikefitting macht den Unterschied zwischen "gut" und "perfekt".`;
  } else {
    komfortVal = 'Neutrale / Allroad-Geometrie';
    komfortWhy = 'Weder zu sportlich noch zu aufrecht – der vernünftige Mittelweg für die meisten Fahrer.';
  }
  specs.push({ icon: '🧘', label: 'Geometrie & Komfort', value: komfortVal, why: komfortWhy, warn: '' });


  // ---- RENDER SPECS ----
  let specHtml = '';
  specs.forEach(s => {
    specHtml += `<div class="spec-row">
      <div class="spec-icon">${s.icon}</div>
      <div class="spec-content">
        <div class="spec-label">${s.label}</div>
        <div class="spec-value">${s.value}</div>
        ${s.why ? `<div class="spec-why">${s.why}</div>` : ''}
        ${s.warn ? `<div class="spec-warn">⚠ ${s.warn}</div>` : ''}
        ${s.tipp ? `<div class="spec-tipp">${s.tipp}</div>` : ''}
      </div>
    </div>`;
  });
  document.getElementById('spec-grid').innerHTML = specHtml;

  // Staggered animation für Spec-Karten
  document.querySelectorAll('.spec-row').forEach((row, i) => {
    row.style.animationDelay = (i * 80) + 'ms';
  });

  // ---- XXL-HINWEIS ----
  const xxlBox = document.getElementById('xxl-hinweis');
  if (gewicht > 100 || groesse > 195) {
    let xxlGrund = [];
    if (gewicht > 100) xxlGrund.push('deinem Gewicht von ' + gewicht + ' kg');
    if (groesse > 195) xxlGrund.push('deiner Körpergröße von ' + groesse + ' cm');
    const xxlGrundText = xxlGrund.join(' und ');

    xxlBox.innerHTML = `
      <div style="font-size:13px; font-weight:700; color:var(--orange); letter-spacing:1px; text-transform:uppercase; margin-bottom:10px;">⚠ Hinweis: Du bist im XXL-Bereich</div>
      <p style="font-size:14px; line-height:1.6; margin:0 0 12px;">
        Aufgrund von ${xxlGrundText} wirst du bei Standard-Händlern und Massenherstellern nur schwer ein passendes Rad finden. Die meisten Serienräder sind bis etwa 120 kg Systemgewicht und bis ~195 cm Körpergröße ausgelegt – danach wird die Auswahl dünn.
      </p>
      <p style="font-size:14px; line-height:1.6; margin:0 0 14px;">
        Diese drei Hersteller haben sich auf genau deinen Bereich spezialisiert und sind dein bester Startpunkt:
      </p>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:4px;">
        <div style="background:#f9f6f2; border-left:3px solid var(--orange); border-radius:0 8px 8px 0; padding:12px 14px;">
          <div style="font-weight:700; font-size:14px; color:var(--navy); margin-bottom:4px;">🏭 MAXX Bikes – Rosenheim (DE)</div>
          <div style="font-size:13px; line-height:1.5; color:#333;">Der Spezialist für große Fahrer von Stange. Körpergrößen 1,90–2,15 m, Systemgewicht bis 185 kg, Online-Konfigurator, breite Modellpalette von MTB bis E-Trekking. <a href="https://www.maxx.de" target="_blank" style="color:var(--orange);">maxx.de</a></div>
        </div>
        <div style="background:#f9f6f2; border-left:3px solid var(--orange); border-radius:0 8px 8px 0; padding:12px 14px;">
          <div style="font-weight:700; font-size:14px; color:var(--navy); margin-bottom:4px;">🏭 Schauff Sumo – Remagen (DE)</div>
          <div style="font-size:13px; line-height:1.5; color:#333;">Stahlrahmen, handgefertigt, Schwerpunkt auf sehr hohem Körpergewicht. Das Modell „Sumo" trägt bis zu 190 kg Zuladung und ist eines der bekanntesten XXL-Räder überhaupt – robust, langlebig, kein Kompromiss. <a href="https://www.schauff.de" target="_blank" style="color:var(--orange);">schauff.de</a></div>
        </div>
        <div style="background:#f9f6f2; border-left:3px solid var(--orange); border-radius:0 8px 8px 0; padding:12px 14px;">
          <div style="font-weight:700; font-size:14px; color:var(--navy); margin-bottom:4px;">🏭 Nicolai – Eschenlohe (DE)</div>
          <div style="font-size:13px; line-height:1.5; color:#333;">Maßrahmen für MTB-Fahrer mit extremen Körpermaßen. Hochfestes 7020-T6-Aluminium, auf Anfrage für jede Größe und jeden Körperbau gefertigt. Klare Empfehlung für ambitionierte Biker jenseits der Normgrößen. <a href="https://www.nicolai.net" target="_blank" style="color:var(--orange);">nicolai.net</a></div>
        </div>
      </div>
    `;
    xxlBox.style.display = 'block';
  } else {
    xxlBox.style.display = 'none';
    xxlBox.innerHTML = '';
  }

  // ---- SUMMARY RENDERN ----
  const einsatzLabels = { city:'Stadtrad', trekking:'Trekking', rennrad:'Rennrad', gravel:'Gravel', mtb_xc:'MTB Cross Country', mtb_trail:'MTB Trail' };
  const kmLabels = { km_low:'bis 30 km/Wo', km_mid:'30–100 km/Wo', km_high:'100–200 km/Wo', km_vhigh:'über 200 km/Wo' };
  const hmLabels = { hm_flach:'Flaches Gelände', hm_huegel:'Hügelig', hm_berg:'Bergig' };
  const ebikeLabels = { ebike_ja:'E-Bike', ebike_nein:'Ohne Motor', ebike_offen:'Offen' };

  const summaryItems = [
    { label: 'Alter', val: alter + ' Jahre' },
    { label: 'Gewicht', val: gewicht + ' kg' },
    { label: 'Körpergröße', val: groesse + ' cm' },
    { label: 'Schrittlänge', val: schrittl + ' cm' },
    { label: 'Einsatzbereich', val: einsatzLabels[einsatz] || einsatz },
    { label: 'Wöchentliche km', val: kmLabels[km] || km },
    { label: 'Gelände/Höhenmeter', val: hmLabels[hm] || hm },
    { label: 'Antrieb', val: ebikeLabels[ebike] || ebike },
    { label: 'Terrain', val: 'Asphalt ' + t1 + '% / Wald ' + t2 + '% / Single ' + t3 + '%' },
  ];

  const summaryGrid = document.getElementById('summary-grid');
  if (summaryGrid) {
    summaryGrid.innerHTML = summaryItems.map(function(item) {
      return '<div class="summary-item"><span>' + item.label + '</span>' + item.val + '</div>';
    }).join('');
  }

  // Ladeanimation → dann Ergebnis zeigen
  // Step-10 sofort ausblenden, bevor das Overlay erscheint
  document.getElementById('step-10').classList.remove('active');

  showLoadingOverlay(function() {
    document.getElementById('step-result').classList.add('active');
    updateProgress(TOTAL + 1);
    window.scrollTo(0, 0);
    launchConfetti();
  });
}

// ---- LADEANIMATION ----
function showLoadingOverlay(callback) {
  const delay = 2000 + Math.floor(Math.random() * 2001); // 2–4 Sekunden

  // CSS für Rad-Animation einmalig einfügen
  if (!document.getElementById('radl-spin-style')) {
    const style = document.createElement('style');
    style.id = 'radl-spin-style';
    style.textContent = '@keyframes radlSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--cream);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;';

  overlay.innerHTML = `
    <div style="text-align:center; max-width:300px;">
      <div style="margin-bottom:28px;">
        <div style="display:inline-block; animation: radlSpin 1.4s linear infinite;">
          <svg width="88" height="88" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#1c3448" stroke-width="5"/>
            <circle cx="40" cy="40" r="30" fill="none" stroke="#1c3448" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.35"/>
            <line x1="40" y1="40" x2="40" y2="5"  stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="40" y2="75" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="5"  y2="40" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="75" y2="40" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="65" y2="14" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="15" y2="66" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="15" y2="14" stroke="#2d6e9e" stroke-width="1.8"/>
            <line x1="40" y1="40" x2="65" y2="66" stroke="#2d6e9e" stroke-width="1.8"/>
            <circle cx="40" cy="40" r="6" fill="#1c3448"/>
            <circle cx="40" cy="40" r="3" fill="#a8c8dc"/>
          </svg>
        </div>
      </div>
      <div style="font-family:'Abuget',cursive; font-size:38px; color:#1c3448; margin-bottom:14px; line-height:1.2;">Radl Hias</div>
      <p style="font-family:'Barlow',sans-serif; font-size:14px; color:#4a6a84; line-height:1.8; font-style:italic; margin:0;">
        Der Radl Hias schaut sich nochmal deine Daten an und überlegt, welches Fahrrad zu Dir passt&nbsp;…
      </p>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(function() {
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity = '0';
    setTimeout(function() {
      overlay.remove();
      callback();
    }, 500);
  }, delay);
}

// ---- KONFETTI ----
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#c85a14','#1c3448','#2d6e9e','#f5f1eb','#a8c8dc','#e8a060'];
  const pieces = Array.from({length: 80}, function() {
    return {
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      r: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 3,
      spin: (Math.random() - 0.5) * 0.2,
      angle: Math.random() * Math.PI * 2,
      sway: (Math.random() - 0.5) * 1.5
    };
  });

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(function(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r * 0.5);
      ctx.restore();
      p.y += p.speed;
      p.x += p.sway;
      p.angle += p.spin;
    });
    frame++;
    if (frame < 120) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  draw();
}

// ---- PDF EXPORT ----
function exportPDF() {
  const rahmenVal = document.querySelector('.rahmen-hl-val')?.textContent || '';
  const rahmenLabel = document.querySelector('.rahmen-hl-label')?.textContent || 'Rahmengröße';
  const rahmenSub = document.querySelector('.rahmen-hl-sub')?.textContent || '';

  const rows = document.querySelectorAll('#spec-grid .spec-row');
  let specsHtml = '';
  rows.forEach(function(row) {
    const label = row.querySelector('.spec-label')?.textContent || '';
    const value = row.querySelector('.spec-value')?.textContent || '';
    const why   = row.querySelector('.spec-why')?.textContent || '';
    const warn  = row.querySelector('.spec-warn')?.textContent || '';
    const tipp  = row.querySelector('.spec-tipp')?.textContent || '';
    specsHtml += '<tr><td style="padding:8px 10px;font-weight:700;color:#1c3448;border-bottom:1px solid #ede7dc;vertical-align:top;white-space:nowrap;">' + label + '</td>'
      + '<td style="padding:8px 10px;font-weight:700;color:#2d6e9e;border-bottom:1px solid #ede7dc;vertical-align:top;">' + value + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;color:#444;border-bottom:1px solid #ede7dc;vertical-align:top;">'
      + (why || '')
      + (warn ? '<br><span style="color:#c85a14;">&#9888; ' + warn + '</span>' : '')
      + (tipp ? '<br><span style="color:#2a6a3a;">&#128161; ' + tipp + '</span>' : '')
      + '</td></tr>';
  });

  const summaryItems = document.querySelectorAll('#summary-grid .summary-item');
  let summaryHtml = '';
  summaryItems.forEach(function(item) {
    const label = item.querySelector('span')?.textContent || '';
    const val = item.textContent.replace(label, '').trim();
    summaryHtml += '<div style="font-size:12px;padding:3px 0;"><span style="color:#a8c8dc;">' + label + ':</span> ' + val + '</div>';
  });

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Radl Hias \u2013 Meine Fahrrad-Empfehlung</title>'
    + '<style>body{font-family:Arial,sans-serif;margin:0;padding:0;color:#2a3a48;background:#fff;}'
    + 'table{border-collapse:collapse;width:100%;}'
    + '@media print{.no-print{display:none!important;}@page{margin:15mm;}}'
    + '</style></head><body>'
    + '<div style="background:#1c3448;padding:24px 32px;">'
    + '<div style="color:#f5f1eb;font-size:22px;font-weight:700;letter-spacing:1px;">Radl Hias</div>'
    + '<div style="color:#a8c8dc;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Pers\u00f6nliche Fahrrad-Empfehlung</div>'
    + '</div>'
    + '<div style="background:#f0f6fb;border-left:4px solid #2d6e9e;margin:24px 32px 0;padding:16px 20px;border-radius:0 8px 8px 0;">'
    + '<div style="font-size:11px;color:#7a8a98;letter-spacing:2px;text-transform:uppercase;">' + rahmenLabel + '</div>'
    + '<div style="font-size:32px;font-weight:700;color:#1c3448;margin:4px 0;">' + rahmenVal + '</div>'
    + '<div style="font-size:12px;color:#555;">' + rahmenSub + '</div>'
    + '</div>'
    + '<div style="margin:20px 32px 0;padding:16px;background:#1c3448;border-radius:8px;color:#f5f1eb;">'
    + '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8c8dc;margin-bottom:10px;">Dein Profil</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;">' + summaryHtml + '</div>'
    + '</div>'
    + '<div style="margin:20px 32px;">'
    + '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a8a98;margin-bottom:10px;">Empfohlene Spezifikation</div>'
    + '<table><thead><tr>'
    + '<th style="text-align:left;padding:8px 10px;background:#f5f1eb;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#7a8a98;width:120px;">Komponente</th>'
    + '<th style="text-align:left;padding:8px 10px;background:#f5f1eb;font-size:10px;width:150px;">Empfehlung</th>'
    + '<th style="text-align:left;padding:8px 10px;background:#f5f1eb;font-size:10px;">Details</th>'
    + '</tr></thead><tbody>' + specsHtml + '</tbody></table>'
    + '</div>'
    + '<div style="margin:24px 32px;padding-top:16px;border-top:1px solid #ede7dc;font-size:11px;color:#aaa;">'
    + 'Erstellt mit Radl Hias Fahrrad-Berater \u00b7 Alle Empfehlungen basieren auf pers\u00f6nlicher Erfahrung und stellen keine verbindliche Fachberatung dar.'
    + '</div>'
    + '<div class="no-print" style="text-align:center;padding:20px;">'
    + '<button onclick="window.print()" style="background:#c85a14;color:white;border:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;">Drucken / Als PDF speichern</button>'
    + '</div>'
    + '</body></html>';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
// ---- BIKE FITTING ACCORDION ----
function toggleFitStep(num) {
  const body = document.getElementById('fit-body-' + num);
  const chev = document.getElementById('fit-chev-' + num);
  const header = document.querySelector('#fit-step-' + num + ' .fitting-step-header');
  const isOpen = body.style.display !== 'none';
  // Close all
  [1,2,3,4,5].forEach(function(n) {
    const b = document.getElementById('fit-body-' + n);
    const c = document.getElementById('fit-chev-' + n);
    if (b) b.style.display = 'none';
    if (c) { c.style.transform = 'rotate(0deg)'; c.style.color = 'var(--blue)'; }
  });
  // Open clicked if it was closed
  if (!isOpen) {
    body.style.display = 'block';
    chev.style.transform = 'rotate(90deg)';
    chev.style.color = 'var(--orange)';
    setTimeout(function() {
      document.getElementById('fit-step-' + num).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}
function toggleGebrauchtStep(num) {
  const body = document.getElementById('gb-body-' + num);
  const chev = document.getElementById('gb-chev-' + num);
  const isOpen = body.style.display !== 'none';
  // Close all
  [1,2,3,4,5,6,7,8].forEach(function(n) {
    const b = document.getElementById('gb-body-' + n);
    const c = document.getElementById('gb-chev-' + n);
    if (b) b.style.display = 'none';
    if (c) { c.style.transform = 'rotate(0deg)'; c.style.color = 'var(--blue)'; }
  });
  // Open clicked if it was closed
  if (!isOpen) {
    body.style.display = 'block';
    chev.style.transform = 'rotate(90deg)';
    chev.style.color = 'var(--orange)';
    setTimeout(function() {
      document.getElementById('gb-step-' + num).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}

// Alle Schritte starten geschlossen
document.addEventListener('DOMContentLoaded', function() {
  // Fortschrittsbalken in Nav initialisieren
  updateProgress(1);
  // Bike-Fitting: alle Schritte geschlossen
  [1,2,3,4,5].forEach(function(n) {
    const b = document.getElementById('fit-body-' + n);
    if (b) b.style.display = 'none';
  });
  // Gebraucht-Check: alle Schritte geschlossen
  [1,2,3,4,5,6,7,8].forEach(function(n) {
    const b = document.getElementById('gb-body-' + n);
    if (b) b.style.display = 'none';
  });
});

function showTab(tab) {
  const beraterWrap = document.querySelector('.wizard-wrap-outer');
  const beraterBanner = document.getElementById('berater-banner');
  const druckBereich = document.getElementById('druck-bereich');
  const fittingBereich = document.getElementById('fitting-bereich');
  const gebrauchtBereich = document.getElementById('gebraucht-bereich');
  const kontaktBereich = document.getElementById('kontakt-bereich');
  const tabBerater = document.getElementById('tab-berater');
  const tabDruck = document.getElementById('tab-druck');
  const tabFitting = document.getElementById('tab-fitting');
  const tabGebraucht = document.getElementById('tab-gebraucht');

  // Reset all
  [tabBerater, tabDruck, tabFitting, tabGebraucht].forEach(function(t) {
    if (t) { t.style.borderBottomColor = 'transparent'; t.style.color = 'var(--text-dim)'; }
  });

  // Alle Bereiche verstecken
  function hideAll() {
    beraterWrap.style.display = 'none';
    if (beraterBanner) beraterBanner.style.display = 'none';
    druckBereich.style.display = 'none';
    fittingBereich.style.display = 'none';
    if (gebrauchtBereich) gebrauchtBereich.style.display = 'none';
    if (kontaktBereich) kontaktBereich.style.display = 'none';
  }

  if (tab === 'gebraucht') {
    hideAll();
    if (gebrauchtBereich) gebrauchtBereich.style.display = 'block';
    if (tabGebraucht) { tabGebraucht.style.borderBottomColor = 'var(--orange)'; tabGebraucht.style.color = 'var(--navy)'; }
  } else if (tab === 'fitting') {
    hideAll();
    fittingBereich.style.display = 'block';
    if (tabFitting) { tabFitting.style.borderBottomColor = 'var(--orange)'; tabFitting.style.color = 'var(--navy)'; }
  } else if (tab === 'druck') {
    hideAll();
    druckBereich.style.display = 'block';
    if (tabDruck) { tabDruck.style.borderBottomColor = 'var(--orange)'; tabDruck.style.color = 'var(--navy)'; }
    berechneDruck();
  } else if (tab === 'kontakt') {
    hideAll();
    if (kontaktBereich) kontaktBereich.style.display = 'block';
  } else {
    hideAll();
    beraterWrap.style.display = '';
    if (beraterBanner) beraterBanner.style.display = '';
    if (tabBerater) { tabBerater.style.borderBottomColor = 'var(--orange)'; tabBerater.style.color = 'var(--navy)'; }
  }
}

// ---- LUFTDRUCK LOGIK ----
function updateBreiteSlider(val) {
  val = parseInt(val);
  document.getElementById('druck-breite-val').textContent = val;
  var label;
  if (val <= 25)      label = 'Rennrad schmal';
  else if (val <= 32) label = 'Rennrad / Gravel';
  else if (val <= 45) label = 'Gravel / Trekking';
  else if (val <= 56) label = 'Trekking / City';
  else if (val <= 62) label = 'MTB 27,5"';
  else if (val <= 66) label = 'MTB Trail (2,4–2,6")';
  else                label = 'MTB Plus / Enduro (2,6–2,8")';
  document.getElementById('druck-breite-label').textContent = label;
}

function druckOpt(groupId, btn) {
  document.getElementById(groupId).querySelectorAll('.druck-opt').forEach(function(b) {
    b.classList.remove('selected');
  });
  btn.classList.add('selected');
}

function druckOptVal(groupId) {
  const sel = document.getElementById(groupId)?.querySelector('.druck-opt.selected');
  return sel ? sel.dataset.val : null;
}

function berechneDruck() {
  const gewicht = parseInt(document.getElementById('druck-gewicht')?.value || 80);
  const breite  = document.getElementById('druck-breite-slider')?.value || '23';
  const profil  = druckOptVal('druck-profil-opts');
  const typ     = druckOptVal('druck-typ-opts');
  const grund   = druckOptVal('druck-grund-opts');
  const rad     = druckOptVal('druck-rad-opts');

  if (!breite || !profil || !typ || !grund || !rad) return;

  const breiteN = parseInt(breite); // mm; '66' = 2,4–2,6" MTB

  // ── 1. REFERENZ-DRÜCKE bei 75 kg Fahrergewicht, 28"/700c, Asphalt, Schlauch ──
  // Quellen: Schwalbe Pressure Prof, SILCA Pro Calculator, ADAC 2026, Maxxis Tech Guide
  // Hinterrad trägt ~57 % des Systemgewichts, Vorderrad ~43 %
  const refTable = [
    { w: 23, h: 6.8,  v: 5.8  },  // 23 mm – Rennrad-Slick
    { w: 28, h: 4.9,  v: 4.2  },  // 28 mm – Trekking/Gravel schmal
    { w: 38, h: 3.4,  v: 2.9  },  // 38–40 mm – Trekking/Hybrid
    { w: 50, h: 2.7,  v: 2.3  },  // 50–54 mm – City/Hybrid breit
    { w: 57, h: 2.1,  v: 1.85 },  // 57–60 mm ≈ 2,1–2,25" MTB
    { w: 66, h: 1.85, v: 1.60 },  // 61–66 mm ≈ 2,4–2,6" MTB
    { w: 70, h: 1.65, v: 1.45 },  // 67–70 mm ≈ 2,6–2,8" MTB Plus / Enduro
  ];

  // Referenzwert (lineare Interpolation für Zwischenwerte)
  let refH, refV;
  const lower = [...refTable].reverse().find(e => e.w <= breiteN) || refTable[0];
  const upper = refTable.find(e => e.w >= breiteN) || refTable[refTable.length - 1];
  if (lower.w === upper.w) {
    refH = lower.h; refV = lower.v;
  } else {
    const t = (breiteN - lower.w) / (upper.w - lower.w);
    refH = lower.h + t * (upper.h - lower.h);
    refV = lower.v + t * (upper.v - lower.v);
  }

  // ── 2. GEWICHTSSKALIERUNG ──
  // Industriestandard (Schwalbe, SILCA): ca. +1 % Druck pro kg Abweichung von 75 kg
  const gewichtFaktor = Math.max(0.65, Math.min(1.60, 1.0 + (gewicht - 75) * 0.010));
  refH *= gewichtFaktor;
  refV *= gewichtFaktor;

  // ── 3. FELGENGRÖSSE ──
  // Kleinerer Innendurchmesser = weniger Luftvolumen bei gleicher Reifenbreite = mehr Druck nötig
  // Quelle: Schwalbe Pressure Prof – ca. 0.1 bar Unterschied pro Radstufe (26"→27.5"→28"/29")
  // 28" / 29" / 700c Rennrad sind alle 622 mm ETRTO – physikalisch identische Felge → gleicher Faktor
  let radFaktor = 1.0;
  if      (rad === '26')      radFaktor = 1.07;  // 559 mm: ~7 % weniger Volumen als 622 mm → mehr Druck
  else if (rad === '27.5')    radFaktor = 1.04;  // 584 mm: ~4 % weniger Volumen als 622 mm → etwas mehr Druck
  else if (rad === '28')      radFaktor = 1.00;  // Referenz (622 mm)
  else if (rad === '29')      radFaktor = 1.00;  // ebenfalls 622 mm
  else if (rad === 'rennrad') radFaktor = 1.00;  // ebenfalls 622 mm
  refH *= radFaktor;
  refV *= radFaktor;

  // ── 4. UNTERGRUND (absolut in bar) ──
  // Quelle: SILCA K-Faktor Methodik – weniger Druck für mehr Kontaktfläche auf losem Grund
  let grundAbzugH = 0.0, grundAbzugV = 0.0;
  if (grund === 'schotter') {
    grundAbzugH = breiteN <= 38 ? 0.40 : 0.30;
    grundAbzugV = breiteN <= 38 ? 0.35 : 0.25;
  } else if (grund === 'trail') {
    grundAbzugH = breiteN <= 38 ? 0.70 : 0.45;
    grundAbzugV = breiteN <= 38 ? 0.60 : 0.40;
  }
  refH -= grundAbzugH;
  refV -= grundAbzugV;

  // ── 5. REIFENPROFIL ──
  // Slick: refTable ist auf Semi-Slick/Trekking kalibriert → reiner Slick läuft etwas mehr Druck
  if (profil === 'slick')  { refH += 0.10; refV += 0.10; }
  if (profil === 'gravel') { refH -= 0.10; refV -= 0.10; }
  if (profil === 'mtb')    { refH -= 0.15; refV -= 0.15; }

  // ── 6. TUBELESS ──
  // Auf Asphalt: 0,3–0,4 bar weniger möglich (kein Einquetschplatten-Risiko)
  // Off-Road: kleinerer Abzug – Untergrundkorrektur deckt den Haupteffekt bereits ab
  // Quelle: SRAM/Zipp Tire Pressure Guide, Maxxis Tech Guide
  if (typ === 'tubeless') {
    let tAbzug;
    if (breiteN >= 50) {
      tAbzug = grund === 'asphalt' ? 0.40 : 0.20;
    } else {
      tAbzug = grund === 'asphalt' ? 0.30 : 0.15;
    }
    refH -= tAbzug;
    refV -= tAbzug;
  }

  // ── 7. PLAUSIBILITÄTS-GRENZEN ──
  // Maximalwerte rein aus Reifenbreite – nicht aus Radtyp-Button (28/29/700c sind alle 622 mm)
  const maxH = breiteN <= 28 ? 8.5 : 5.5;
  const maxV = breiteN <= 28 ? 8.0 : 5.0;
  const minH = breiteN >= 50 ? 1.0 : (breiteN >= 38 ? 1.5 : 1.8);
  const minV = breiteN >= 50 ? 0.8 : (breiteN >= 38 ? 1.3 : 1.5);

  const druckH = Math.max(minH, Math.min(maxH, Math.round(refH * 10) / 10));
  const druckV = Math.max(minV, Math.min(maxV, Math.round(refV * 10) / 10));

  document.getElementById('druck-vorne').textContent  = druckV.toFixed(1);
  document.getElementById('druck-hinten').textContent = druckH.toFixed(1);

  // ── 8. ERKLÄRUNG ──
  let erkl = '';
  if (rad === 'rennrad' || breiteN <= 23) {
    erkl = 'Rennradreifen brauchen den höchsten Druck – das minimiert Rollwiderstand und Pannengefahr auf Asphalt. Bei Regen oder schlechtem Belag 0,3–0,5 bar weniger für mehr Grip.';
  } else if (breiteN <= 28) {
    erkl = 'Schmale Trekking- und Gravel-Reifen laufen mit hohem Druck. Auf nasser Fahrbahn 0,2–0,3 bar weniger einplanen – das verbessert die Haftung spürbar.';
  } else if (breiteN <= 38) {
    erkl = 'Im mittleren Breitenbereich hast du Spielraum: mehr Druck = schneller auf Asphalt, weniger Druck = mehr Komfort und Grip auf losem Untergrund.';
  } else if (breiteN <= 50) {
    erkl = 'Breite City- und Hybridreifen fahren mit moderatem Druck. Das Luftvolumen federt Unebenheiten schon ohne großen Komfortverlust ab.';
  } else {
    erkl = 'MTB-Reifen arbeiten mit niedrigem Druck – das Volumen schützt vor Felgenschlag. Zu viel Druck kostet Traktion und macht das Rad bergab unberechenbar.';
  }
  if (rad === '29') erkl += ' 29"-Räder rollen ruhiger über Hindernisse und haben durch das größere Laufrad etwas mehr Luftvolumen als ein 27,5er – das macht sich besonders auf ruppigem Untergrund bemerkbar.';
  if (rad === '26') erkl += ' 26"-Räder haben weniger Volumen und brauchen etwas mehr Druck, um denselben Rollwiderstand wie größere Laufräder zu erzielen.';
  if (typ === 'tubeless') erkl += ' Tubeless erlaubt auf Asphalt 0,3–0,4 bar weniger, off-road etwa 0,2 bar weniger – kein Einquetschplatten-Risiko, besserer Grip.';
  if (grund === 'trail')    erkl += ' Auf Trails gilt: lieber etwas zu wenig als zu viel – der Reifen muss sich dem Untergrund anpassen können.';
  if (grund === 'schotter') erkl += ' Auf Schotter etwas weniger als auf Asphalt – mehr Kontaktfläche, mehr Kontrolle.';
  if ((profil === 'gravel' || profil === 'mtb') && (grund === 'schotter' || grund === 'trail')) {
    erkl += ' Der niedrige Empfehlungswert ergibt sich aus der Kombination von Reifenprofil und Untergrund – beide Faktoren zusammen ergeben einen niedrigeren Druck als jeder Faktor allein. Das ist korrekt so.';
  }

  // ── Warnung bei unrealistischen Kombinationen ──
  let warnung = '';
  if (breiteN <= 32 && (grund === 'trail' || grund === 'schotter')) {
    warnung = '⚠️ Hinweis: Reifen unter 32 mm sind für Trail- oder Schotterfahrten nicht geeignet. Prüfe deine Eingaben – die Berechnung wurde trotzdem durchgeführt.';
  }
  if (profil === 'mtb' && (rad === 'rennrad' || breiteN <= 32)) {
    warnung = '⚠️ Hinweis: MTB-Profil und schmale Reifen passen nicht zusammen. Prüfe deine Eingaben.';
  }
  const warnEl = document.getElementById('druck-warnung');
  if (warnEl) {
    warnEl.textContent = warnung;
    warnEl.style.display = warnung ? 'block' : 'none';
  }

  document.getElementById('druck-erklaerung').textContent = erkl;
}

// ---- FAQ: siehe faq-data.js ----
function selectAntrieb(typ) {
  const detail = document.getElementById('antrieb-detail');
  const btnEbike = document.getElementById('btn-antrieb-ebike');
  const btnKlassisch = document.getElementById('btn-antrieb-klassisch');
  if (!detail) return;

  if (typ === 'ebike') {
    if (btnEbike) btnEbike.style.background = 'var(--orange, #e85d26)';
    if (btnKlassisch) btnKlassisch.style.background = 'var(--navy, #1c3448)';
    detail.innerHTML = `
      <div style="background:#f9f6f2;border-left:3px solid var(--orange,#e85d26);border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;line-height:1.7;color:#333;">
        <div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:8px;">⚡ Worauf du beim E-Bike-Motor achten solltest</div>
        <p style="margin:0 0 8px;"><strong>Mittelmotor ist Standard – mit gutem Grund:</strong> Beim Mittelmotor sitzt der Antrieb am Tretlager, direkt im Schwerpunkt des Fahrrads. Das sorgt für ein natürliches Fahrgefühl, bessere Gewichtsverteilung und kompatible Schaltung. Nabenmotoren (im Hinterrad) sind günstiger, haben aber ein unnatürlicheres Ansprechverhalten und schränken die Reifenwahl ein.</p>
        <p style="margin:0 0 8px;"><strong>Motormarken – worauf du setzen solltest:</strong> Bosch ist Marktführer – breites Servicenetz, zuverlässige Software, lange Ersatzteilverfügbarkeit. Shimano EP8 ist die sportlichere Alternative – leichter, effizienter, beliebt im MTB-Bereich. Fazua und Brose sind leistungsfähig, aber mit kleinerem Servicenetz. Günstige Eigenmarken von Fernost-Herstellern: hohes Risiko bei Softwareupdates und Ersatzteilen in 5+ Jahren.</p>
        <p style="margin:0 0 8px;"><strong>Drehmoment und Unterstützungsstufen:</strong> 75–85 Nm sind ausreichend für Alltag, Trekking und leichtes Gelände. Für steiles Berggelände oder schweres MTB: 85 Nm oder mehr. Mehr Drehmoment bedeutet nicht automatisch mehr Spaß – entscheidender ist die Qualität des Tuning-Algorithmus (wie natürlich sich der Motor anfühlt).</p>
        <p style="margin:0 0 8px;"><strong>Akku-Kapazität:</strong> 500 Wh deckt Alltagstouren ab (ca. 60–100 km je nach Gelände und Unterstützungsstufe). 625 Wh oder mehr für lange Touren oder bergiges Terrain. Zusatzakku (Range Extender) ist bei einigen Systemen nachrüstbar – sinnvoll wenn du dir nicht sicher bist. Wichtig: Der Akku ist das teuerste Verschleißteil – er kostet nach 500–800 Ladezyklen 500–1.000 € Ersatz. Das gehört in die Kaufkalkulation.</p>
        <p style="margin:0;"><strong>Fazit:</strong> Bosch oder Shimano EP8, Mittelmotor, mindestens 500 Wh. Alles andere ist Kompromiss. Wer ein E-Bike kauft, kauft auch das Servicenetz des Motorherstellers – das ist genauso wichtig wie die technischen Daten.</p>
      </div>`;
  } else {
    if (btnKlassisch) btnKlassisch.style.background = 'var(--orange, #e85d26)';
    if (btnEbike) btnEbike.style.background = 'var(--navy, #1c3448)';
    detail.innerHTML = `
      <div style="background:#f9f6f2;border-left:3px solid var(--orange,#e85d26);border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;line-height:1.7;color:#333;">
        <div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:8px;">🚲 Klassisches Fahrrad – worauf du jetzt achten solltest</div>
        <p style="margin:0 0 8px;"><strong>Gewicht als Qualitätsmerkmal:</strong> Ohne Motor zählt das Eigengewicht des Fahrrads deutlich mehr. Ein gutes Hardtail-MTB liegt unter 12 kg, ein Trekking unter 14 kg. Mehr als das deutet auf minderwertige Komponenten oder einen zu schweren Rahmen hin – beides kostet Fahrspaß.</p>
        <p style="margin:0 0 8px;"><strong>Das Budget fließt in bessere Teile:</strong> Was du gegenüber einem E-Bike sparst (oft 1.500–3.000 €), kannst du in hochwertigere Schaltung, Bremsen und Federung investieren. Ein klassisches Rad um 2.000 € hat oft deutlich bessere Komponenten als ein E-Bike um 2.500 €.</p>
        <p style="margin:0 0 8px;"><strong>Schaltung richtig wählen:</strong> 1x12 (einkettig, 12-Gang) ist der aktuelle Standard für MTB und Gravel – kein Umwerfer, weniger Gewicht, einfacheres Schalten. Für Trekking und City ist 1x11 oder 1x10 ausreichend. Zweifach-Schaltung nur beim Rennrad sinnvoll.</p>
        <p style="margin:0 0 8px;"><strong>Wartung ist unkomplizierter:</strong> Kein Software-Update, kein Akku-Management, kein Motorservice. Kette ölen, Schaltung nachstellen, Bremsen kontrollieren – das reicht für viele Jahre zuverlässigen Betrieb.</p>
        <p style="margin:0;"><strong>Fazit:</strong> Für dein Profil ist ein klassisches Fahrrad die puristische, wartungsarme und langfristig günstigere Entscheidung. Das eingesparte Geld fließt sinnvoller in Qualitätskomponenten als in einen Motor, den du vielleicht gar nicht brauchst.</p>
      </div>`;
  }
  detail.style.display = 'block';
  setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function selectRahmenMaterial(typ) {
  const detail = document.getElementById('rahmen-material-detail');
  const btnAlu = document.getElementById('btn-rahmen-alu');
  const btnCarbon = document.getElementById('btn-rahmen-carbon');
  if (!detail) return;

  if (typ === 'alu') {
    if (btnAlu) btnAlu.style.background = 'var(--orange, #e85d26)';
    if (btnCarbon) btnCarbon.style.background = 'var(--navy, #1c3448)';
    detail.innerHTML = `
      <div style="background:#f9f6f2;border-left:3px solid var(--orange,#e85d26);border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;line-height:1.7;color:#333;">
        <div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:8px;">🔩 Worauf du bei einem Aluminiumrahmen achten solltest</div>
        <p style="margin:0 0 8px;"><strong>Schweißnähte und Rohrverbindungen:</strong> Schau dir die Schweißnähte an – sie sollten gleichmäßig und sauber sein. Grobe, unregelmäßige Nähte sind ein Qualitätsmerkmal, das dir über die Langlebigkeit des Rahmens etwas sagt.</p>
        <p style="margin:0 0 8px;"><strong>Legierung macht den Unterschied:</strong> Nicht jedes Alu ist gleich. 6061-Alu ist der Standard – solide, günstig, bewährt. 7005- oder 7020-Legierungen sind steifer und leichter, aber auch spröder. Hochwertige Rahmen haben unterschiedliche Wandstärken (Hydroforming / Butting), was Gewicht spart ohne Steifigkeit zu verlieren.</p>
        <p style="margin:0 0 8px;"><strong>Kein Angst vor Gewicht:</strong> Der Gewichtsunterschied zwischen einem guten Alu-Rahmen und einem günstigen Carbon-Rahmen ist oft kleiner als gedacht – 200 bis 400 g. Ein Alu-Rahmen um 1.200 € schlägt qualitätsmäßig viele Carbon-Einsteiger-Rahmen.</p>
        <p style="margin:0 0 8px;"><strong>Vibrationsdämpfung:</strong> Alu ist steifer als Carbon und überträgt Stöße direkter. Das macht sich auf langen Ausfahrten auf ruppigem Untergrund bemerkbar. Gegenmaßnahmen: Carbonlenker, breitere Reifen mit wenig Druck, gefederter Sattelstütze.</p>
        <p style="margin:0;"><strong>Fazit:</strong> Für die meisten Fahrer – besonders im Alltag, MTB-Trail, und Einstieg bis Mittelklasse – ist ein guter Alu-Rahmen die ehrlichste Wahl. Das Geld, das du gegenüber Carbon sparst, investierst du sinnvoller in Antrieb, Federung oder Bremsen.</p>
      </div>`;
  } else {
    if (btnCarbon) btnCarbon.style.background = 'var(--orange, #e85d26)';
    if (btnAlu) btnAlu.style.background = 'var(--navy, #1c3448)';
    detail.innerHTML = `
      <div style="background:#f9f6f2;border-left:3px solid var(--orange,#e85d26);border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;line-height:1.7;color:#333;">
        <div style="font-weight:700;color:var(--navy,#1c3448);margin-bottom:8px;">🏁 Worauf du bei einem Carbonrahmen achten solltest</div>
        <p style="margin:0 0 8px;"><strong>Qualitätsstufen – es gibt massive Unterschiede:</strong> "Carbon" ist kein einheitliches Material. Günstiges Carbon (unter 1.500 € Rahmenpreis) hat oft dickere Wandstärken und bringt kaum Gewichtsvorteil gegenüber hochwertigem Alu. Hochwertiges Carbon (T700, T800, T1000 Fasern) ist steifer, leichter, aber auch deutlich teurer. Orientiere dich nicht am Markennamen, sondern am Fasertyp und der Layup-Qualität.</p>
        <p style="margin:0 0 8px;"><strong>Sturz und Schlag – das größte Risiko:</strong> Carbon bricht nicht wie Alu – es splittert oder reißt von innen, ohne dass das von außen sichtbar ist. Nach jedem ernsthaften Sturz oder Schlag (z.B. Transport, Umfallen) muss der Rahmen geprüft werden – im Zweifel beim Fachhändler oder mit einer speziellen Carbon-Prüflampe. Ein beschädigter Carbonrahmen kann ohne Vorwarnung versagen.</p>
        <p style="margin:0 0 8px;"><strong>Anzugsmomente einhalten:</strong> Carbon-Kontaktflächen (Lenker, Sattelstütze, Vorbau) reagieren empfindlich auf Überdrehen. Immer mit Drehmomentschlüssel und Carbon-Montagepaste arbeiten. Die Werte stehen am Rahmen – die sind ernst gemeint.</p>
        <p style="margin:0 0 8px;"><strong>Reparatur ist aufwändig:</strong> Kleine Risse lassen sich reparieren, aber es ist teuer und aufwändig. Alu lässt sich schweißen – das ist einfacher und günstiger.</p>
        <p style="margin:0;"><strong>Fazit:</strong> Carbon lohnt sich erst ab einem bestimmten Qualitätsniveau – und das kostet. Wenn du mehr als 2.500 € für den Rahmen oder mehr als 4.000–5.000 € für das Komplettrad ausgibst, macht Carbon Sinn. Darunter investiere das Geld lieber in bessere Komponenten.</p>
      </div>`;
  }
  detail.style.display = 'block';
  setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function restartWizard() {
  answers = { 's_alter': 35, 's_gewicht': 80, 's_groesse': 175, 's_schrittl': 80, 's_armlaenge': 55,
              's_t1': 40, 's_t2': 30, 's_t3': 20, 's_t4': 10 };
  stepperData.alter = 35;
  document.getElementById('alter-val').textContent = 35;
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.opt, .opt-grid').forEach(o => o.classList.remove('selected'));
  document.querySelectorAll('[id^="next-"]').forEach(b => { if (b.tagName === 'BUTTON') b.disabled = false; });
  document.getElementById('next-8').disabled = true;
  document.getElementById('next-9').disabled = true;
  document.getElementById('next-10').disabled = true;
  document.getElementById('next-6-btn').disabled = true;
  document.getElementById('step-1').classList.add('active');
  updateProgress(1);
  window.scrollTo(0, 0);
}

/* ===== NAV DROPDOWN ===== */
function toggleNavDropdown() {
  var dd = document.getElementById('nav-dropdown');
  var arrow = document.getElementById('nav-arrow');
  var isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  arrow.style.opacity = isOpen ? '1' : '0.7';
}

function navSelect(tab, label) {
  document.getElementById('nav-active-label').textContent = label;
  document.getElementById('nav-dropdown').style.display = 'none';
  document.getElementById('nav-arrow').style.transform = '';
  showTab(tab);
}

document.addEventListener('click', function(e) {
  var nav = document.getElementById('main-nav');
  if (nav && !nav.contains(e.target)) {
    var dd = document.getElementById('nav-dropdown');
    var arrow = document.getElementById('nav-arrow');
    if (dd) dd.style.display = 'none';
    if (arrow) arrow.style.transform = '';
  }
});
