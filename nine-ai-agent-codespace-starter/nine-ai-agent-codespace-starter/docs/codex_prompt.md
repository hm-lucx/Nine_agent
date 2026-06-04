# Prompt für Codex / GitHub Copilot Coding Agent

Wir bauen einen MVP für einen KI-Agenten zur Optimierung von NINE, dem Studien- und Stundenplantool der Hochschule München.

## Ziel des MVP

Der Nutzer soll seinen Studienstand eingeben können. Das System soll offene Module erkennen, sinnvolle Module für das nächste Semester empfehlen, Fakultät-13-Termine berücksichtigen, einen einfachen Stundenplan erzeugen und Überschneidungen erkennen.

## Bitte arbeite an folgenden Punkten

1. Prüfe die vorhandene Projektstruktur.
2. Verbessere die Lesbarkeit des Codes in `server.js`.
3. Ergänze eine sauberere Konfliktprüfung für Termine.
4. Ergänze Beispieltests für die Planungslogik.
5. Verbessere die Startseite in `public/index.html`, ohne Logos der Hochschule zu verwenden.
6. Erhalte die Datenschutz-Abgrenzung: keine Passwortspeicherung, keine automatische NINE-/Moodle-Anmeldung.
7. Schreibe klare Kommentare, damit das Team den Code im Workshop erklären kann.

## Fachliche Anforderungen

Der Agent soll:

- bestandene Module berücksichtigen,
- Voraussetzungen prüfen,
- ECTS-Ziel einhalten,
- Pflichtmodule priorisieren,
- Fakultät-13-Angebote automatisch einplanen,
- Überschneidungen erkennen,
- Alternativen und nächste Schritte ausgeben,
- Empfehlungen nachvollziehbar begründen.

## Nicht Bestandteil des MVP

- echter NINE-Login,
- echter Moodle-Login,
- automatische Kursanmeldung,
- Speicherung von Passwörtern,
- vollständige Unterstützung aller Studiengänge.
