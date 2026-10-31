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

## Rezeptsuche

Im Tab **Gerichte** nach Rezeptnamen, Untertiteln oder Zutaten suchen.
Mehrere Begriffe werden kombiniert, z. B. **Hähnchen Reis**. Großschreibung,
Umlaute und vorhandene Zutaten-Aliase werden berücksichtigt. Das Kreuz im
Suchfeld oder Escape leert die Suche; die Filter gelten zusätzlich.
Die Suche verändert deine JSON nicht.

## Zutaten & Vorrat

Das Suchfeld filtert Zutaten nach Namen oder Kategorie; auch mehrere Begriffe
und Zutaten-Aliase sind möglich. **Neue Zutat** öffnet den Eingabedialog.
Tippe auf eine Zutatenzeile, um den Vorrat umzuschalten: hellgrün bedeutet
vorhanden, weiß bedeutet nicht vorhanden. Die **drei Punkte** öffnen die
Zutatendetails mit Bearbeitung und Löschen. Bei Verwendung in Rezepten fragt
die App vor dem Löschen nach.

Rezeptnamen in den Zutatendetails öffnen das Rezept im Tab **Gerichte**.
Zutatennamen im Rezept öffnen die Zutatendetails im Tab **Vorrat**.
Die Häkchen der Einkaufsliste markieren weiterhin gekaufte Zutaten.

## Rückgängig, Kategorien und Alternativen

Über den Pfeil neben dem Dateistatus, den Hinweis **Rückgängig** oder Strg+Z
außerhalb von Eingabefeldern lassen sich die letzten 30 Datenänderungen
zurücknehmen. Dazu gehören Vorrat, Planung, Bearbeitung und Löschen mit allen
Verweisen. Nach einem JSON-Import beginnt der Verlauf neu. Er wird nur für die
aktuelle Sitzung gehalten. Eine bereits heruntergeladene JSON wird dadurch
nicht überschrieben; speichere den gewünschten Stand erneut.

Vorratskategorien lassen sich über ihre Überschrift einklappen. Bei der Suche
werden Treffer automatisch aufgeklappt. Diese Ansichtseinstellung verändert
die JSON nicht. Auf kleinen Bildschirmen erscheint bei geplanten Gerichten
eine aufklappbare Auswahlleiste oberhalb der Navigation.

Über **Vorrat → Austauschbar** oder die Zutatendetails legst du Gruppen mit
mindestens zwei Zutaten an, z. B. Zitrone/Limette oder ausgewählte Käsesorten.
Eine vorhandene Zutat deckt alle Zutaten ihrer Gruppe beim Matching ab.
Einkauf und Best Value rechnen mit diesen Gruppen; die Einkaufsliste nennt
auch mögliche Alternativen und vermeidet doppelte Gruppeneinträge.
Der tatsächliche Vorrat bleibt für jede Zutat einzeln markierbar.
Jede Zutat kann einer Gruppe angehören. Gruppen gelten für alle Rezepte.

Gruppen werden als optionales Feld ingredientGroups in der JSON gespeichert.
Bisherige Dateien bleiben ladbar und starten ohne definierte Gruppen.

## Funktionstests

Im Projektordner: node tests/interaction.test.cjs.
Die Tests prüfen Datenänderungen, Rückgängig, Verknüpfungen, Suche, Gruppen,
Einkauf, Best Value und JSON-Kompatibilität ohne zusätzliche Abhängigkeiten.

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
