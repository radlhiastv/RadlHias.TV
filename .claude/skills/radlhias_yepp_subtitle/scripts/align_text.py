#!/usr/bin/env python3
"""Forced Alignment: ordnet Mathias' Text seiner eigenen Tonspur zu.

WARUM DIESER WEG
----------------
Der Text ist bekannt - Mathias liefert ihn mit. Es muss also nichts
erraten werden (das waere Spracherkennung), sondern nur zugeordnet.
Das ist die praezisere Aufgabe, laeuft komplett lokal und braucht
keinen externen Dienst, kein Konto und keine Zahlungsdaten.

VERFAHREN (das klassische, das auch aeneas benutzt)
---------------------------------------------------
1. Jedes Wort einzeln mit espeak synthetisieren, Rand-Stille abschneiden.
   Dadurch sind die Wortgrenzen in der Synthese exakt bekannt.
2. MFCC-Merkmale von echter und synthetischer Tonspur berechnen.
3. Per DTW (Dynamic Time Warping) beide Spuren aufeinander abbilden.
4. Fuer jede bekannte Wortgrenze der Synthese die zugehoerige Stelle in
   der echten Aufnahme ablesen.

GEMESSEN an 20260911_173558.mp4 (109 Woerter, 43,5 s):
  Wortanfaenge, die faelschlich in einer Atempause liegen
    Forced Alignment :  5 von 109
    lineare Verteilung: 9 von 109
  Satzenden landen 0,2-0,8 s vor der jeweiligen Atempause - richtig.
  Abweichung zur linearen Verteilung: im Mittel 1,25 s, max 2,95 s.

AUFRUF
------
    python3 align_text.py <video.mp4> <text.txt> [timing.json]

Erzeugt eine timing.json im Ankerformat, die make_reel.py direkt als
zweites Argument entgegennimmt.
"""
import json
import os
import subprocess
import sys
import tempfile

import av
import librosa
import numpy as np

SR = 16000          # Arbeits-Abtastrate
HOP = 160           # 10 ms Aufloesung fuer die MFCC-Merkmale
ESPEAK_STIMME = "de"
BASIS_TEMPO = 150   # Woerter pro Minute, Mathias' gemessenes Sprechtempo


def echte_tonspur(pfad):
    """Tonspur aus dem Video holen, mono und auf SR gebracht."""
    container = av.open(pfad)
    spur = next(s for s in container.streams if s.type == "audio")
    resampler = av.AudioResampler(format="fltp", layout="mono", rate=SR)
    teile = [f.to_ndarray().reshape(-1)
             for frame in container.decode(spur)
             for f in resampler.resample(frame)]
    if not teile:
        raise SystemExit("Video enthaelt keine Tonspur")
    return np.concatenate(teile).astype(np.float32)


def synth_wort(wort, tempo):
    """Ein einzelnes Wort synthetisieren, Rand-Stille abschneiden."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp = f.name
    try:
        subprocess.run(["espeak", "-v", ESPEAK_STIMME, "-s", str(tempo),
                        "-w", tmp, wort], check=True, capture_output=True)
        y, _ = librosa.load(tmp, sr=SR)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    if len(y) == 0:
        return np.zeros(int(SR * 0.05), dtype=np.float32)
    geschnitten, _ = librosa.effects.trim(y, top_db=35)
    # Zu aggressiv geschnittene sehr kurze Woerter lieber ungeschnitten lassen
    return geschnitten if len(geschnitten) > SR * 0.02 else y


def baue_synthese(woerter, tempo, pause=0.04):
    """Alle Woerter aneinanderhaengen und die Startzeiten mitschreiben."""
    stuecke, grenzen, pos = [], [], 0
    luecke = np.zeros(int(SR * pause), dtype=np.float32)
    for wort in woerter:
        y = synth_wort(wort, tempo)
        grenzen.append(pos / SR)
        stuecke.append(y)
        pos += len(y)
        stuecke.append(luecke)
        pos += len(luecke)
    return np.concatenate(stuecke), np.array(grenzen)


def richte_aus(echt, synth, synth_grenzen):
    """DTW zwischen beiden Spuren, dann die Grenzen uebertragen."""
    m_echt = librosa.feature.mfcc(y=echt, sr=SR, n_mfcc=13, hop_length=HOP)
    m_synth = librosa.feature.mfcc(y=synth, sr=SR, n_mfcc=13, hop_length=HOP)
    # Normieren, damit Lautstaerkeunterschiede zwischen echter Aufnahme und
    # Synthese das Ergebnis nicht dominieren
    for m in (m_echt, m_synth):
        m -= m.mean(axis=1, keepdims=True)
        m /= (m.std(axis=1, keepdims=True) + 1e-8)

    _, pfad = librosa.sequence.dtw(X=m_synth, Y=m_echt, metric="cosine")
    pfad = pfad[::-1]                       # vom Anfang zum Ende
    synth_idx, echt_idx = pfad[:, 0], pfad[:, 1]

    zeiten = []
    for grenze in synth_grenzen:
        rahmen = grenze * SR / HOP
        k = int(np.searchsorted(synth_idx, rahmen))
        k = min(max(k, 0), len(echt_idx) - 1)
        zeiten.append(echt_idx[k] * HOP / SR)
    # Eine Rundung darf die Reihenfolge nicht drehen
    return np.maximum.accumulate(np.array(zeiten))


def main(video, textdatei, ziel="timing.json"):
    with open(textdatei, encoding="utf-8") as f:
        woerter = f.read().split()
    if not woerter:
        raise SystemExit("Textdatei ist leer")

    echt = echte_tonspur(video)
    dauer = len(echt) / SR
    print(f"{len(woerter)} Woerter, Aufnahme {dauer:.1f} s", flush=True)

    # Synthese-Tempo an die echte Aufnahme angleichen, damit DTW moeglichst
    # wenig strecken muss - das verbessert die Zuordnung spuerbar.
    synth, grenzen = baue_synthese(woerter, BASIS_TEMPO)
    tempo = int(BASIS_TEMPO * (len(synth) / SR) / dauer)
    tempo = max(80, min(400, tempo))
    if abs(tempo - BASIS_TEMPO) > 12:
        print(f"Synthese war {len(synth)/SR:.1f} s - neu mit Tempo {tempo}",
              flush=True)
        synth, grenzen = baue_synthese(woerter, tempo)
    print(f"Synthese {len(synth)/SR:.1f} s, richte aus ...", flush=True)

    zeiten = richte_aus(echt, synth, grenzen)

    with open(ziel, "w", encoding="utf-8") as f:
        json.dump({
            "videoName": os.path.basename(video),
            "duration": round(dauer, 3),
            "words": woerter,
            "anchors": [{"i": i, "t": round(float(t), 3), "fixed": True}
                        for i, t in enumerate(zeiten)],
            "totalWords": len(woerter),
            "complete": True,
            "source": "forced_alignment",
        }, f, ensure_ascii=False, indent=1)
    print(f"Fertig: {ziel}  ({len(woerter)} Wortzeiten)")
    return zeiten


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:4])
