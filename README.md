# Meal Match

Eine komplett statische PWA. Jeder neue Start ist leer. Deine Daten stammen aus
manuell geladenen JSON-Dateien und werden vollständig als JSON exportiert.
Es gibt kein Backend, keinen Login und keinen automatischen Geräte-Sync.

## GitHub Pages

Die Dateien direkt im Repository-Hauptverzeichnis ablegen und unter
**Settings → Pages → Deploy from a branch → main → /(root)** veröffentlichen.
Die Icons bleiben im Unterordner `icons`. Kein Build erforderlich.

Persönliche Meal-Match-JSONs gehören auf dein Gerät; lade sie in der App über
**JSON laden**, nicht ins Repository.

## iPhone

Die Pages-Adresse in Safari öffnen, **Teilen → Zu Home-Bildschirm hinzufügen**
auswählen und **Als Web-App öffnen** aktivieren, falls angezeigt. Beim ersten
Start über das App-Symbol kurz online bleiben. Die Oberfläche kann danach aus
dem App-Cache starten; iOS kann diesen Cache später entfernen.

## Daten

**JSON laden** ersetzt den gesamten aktuellen Stand nach Validierung.
**Speichern** erzeugt die vollständige JSON und ist ohne Änderungen deaktiviert.
Auf unterstützten iPhones öffnet es das Teilen-Menü für **In Dateien sichern**;
**Download** erzeugt immer den normalen Datei-Download. Der geladene Dateiname
bleibt erhalten. Bestehende Dateien werden manuell ersetzt.

Jeder neue Seitenstart und jedes App-Update beginnt leer. Importiere die
neueste JSON wieder. Ungespeicherte Daten werden nicht automatisch gesichert.

## Einrichtungshinweise

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [iPhone-Web-App](https://support.apple.com/de-de/guide/iphone/iphea86e5236/ios)
