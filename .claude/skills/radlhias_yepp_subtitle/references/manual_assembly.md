# Manuelle Fertigstellung, falls das Skript mittendrin abbricht (Timeout)

`make_reel.py` rendert bei längeren Videos manchmal länger als ein einzelnes
Tool-Zeitlimit erlaubt. Die Einzel-Frames und der Basisclip sind zu diesem
Zeitpunkt aber meist schon fertig in `<output-ordner>/_reel_tmp/` - nur der letzte
ffmpeg-Zusammensetz-Schritt fehlt. Prüfen und nachholen:

```bash
# Prüfen, ob Frames vollständig sind (Anzahl sollte ~ Videodauer * 24 sein)
ls _reel_tmp/frames | wc -l
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4

# Falls ja, Zusammensetzung manuell nachholen (DAUER = Videodauer in Sekunden):
ffmpeg -i _reel_tmp/base_clip.mp4 -framerate 24 -i _reel_tmp/frames/frame_%05d.png \
  -loop 1 -t DAUER -i assets/radlhias_logo_watermark.png \
  -filter_complex "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0[bg];[bg][2:v]overlay=(W-w)/2:140[vout_pre];[vout_pre]fade=t=out:st=DAUER-1:d=1:color=black[vout]" \
  -map "[vout]" -map 0:a -r 24 -pix_fmt yuv420p -c:v libx264 -crf 18 -c:a aac -b:a 192k \
  -movflags +faststart output.mp4 -y
```

Falls die Frames selbst unvollständig sind (Anzahl deutlich zu niedrig), das
Skript einfach erneut laufen lassen - es überschreibt `_reel_tmp/` sauber neu.
