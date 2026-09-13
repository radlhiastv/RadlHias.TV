# Große Rohvideos ins Sandbox holen (über Chat-Upload-Limit)

Mathias' Rohvideos liegen oft über dem Chat-Upload-Limit (~30MB). Diese Session
sitzt in einer isolierten Sandbox mit Netzwerk-Proxy - ein direkter Link zu
`drive.google.com` funktioniert dort NICHT (wird vom Egress-Proxy geblockt).

## Ablauf

1. Mathias legt das Video in einen Google-Drive-Ordner und gibt ihn frei
   (Freigabe reicht rein organisatorisch, der eigentliche Zugriff läuft aber
   über die Composio-Verbindung, nicht über den öffentlichen Link).
2. Google-Drive-Verbindung prüfen/herstellen:
   ```
   COMPOSIO_MANAGE_CONNECTIONS(toolkits=[{name:"googledrive", action:"list"}])
   ```
   Keine aktive Verbindung? `action:"add"` aufrufen, den zurückgegebenen
   `redirect_url`-Link an Mathias schicken, ihn dort mit seinem Google-Konto
   autorisieren lassen, danach erneut `action:"list"` prüfen.
   **Wichtig:** War die erste Autorisierung mit zu engen Scopes (z.B.
   `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` beim späteren Dateizugriff), die
   Verbindung mit `action:"remove"` löschen und mit `action:"add"` neu anlegen -
   beim zweiten Anlauf fragt Google in der Regel die vollen Rechte ab.
3. Datei(en) im Ordner finden:
   ```
   COMPOSIO_MULTI_EXECUTE_TOOL(tools=[{tool_slug:"GOOGLEDRIVE_FIND_FILE",
     arguments:{folder_id:"<ordner-id-aus-dem-freigabelink>",
                fields:"files(id,name,mimeType,size,modifiedTime)"}}])
   ```
4. Datei herunterladen (liefert eine 1h gültige Cloudflare-R2-URL):
   ```
   COMPOSIO_MULTI_EXECUTE_TOOL(tools=[{tool_slug:"GOOGLEDRIVE_DOWNLOAD_FILE",
     arguments:{fileId:"<id-aus-schritt-3>"}}], sync_response_to_workbench:true)
   ```
5. Die `downloaded_file_content.s3url` aus der Antwort direkt mit `curl` in den
   Scratchpad-Ordner laden (kein weiterer Egress-Block, da Cloudflare R2 nicht
   auf der Sperrliste steht):
   ```bash
   curl -sS -o <scratchpad>/video.mp4 "<s3url>"
   ```

## Ausgabe zurückschicken

Das fertige Reel ist ebenfalls oft >30MB. Vor `SendUserFile` komprimieren:
```bash
ffmpeg -y -i in.mp4 -c:v libx264 -crf 26 -preset slow -b:v 4200k -maxrate 4600k \
  -bufsize 6000k -c:a aac -b:a 128k out_compressed.mp4
```
Das drückt ein ~75MB-Reel zuverlässig auf ~15-16MB, ohne dass der Qualitätsverlust
auf Instagram (das ohnehin nochmal komprimiert) auffällt.
