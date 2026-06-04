# NINE AI Agent – Codespace Starter

Dieses Repository ist ein Starter-Projekt für den Workshop: **KI-Agent zur Optimierung von NINE**.

Ziel ist kein vollständiger Zugriff auf echte Hochschulsysteme, sondern ein klarer MVP:

- Studienstand erfassen
- offene Module erkennen
- passende Module empfehlen
- Fakultät-13-Termine berücksichtigen
- Überschneidungen im Stundenplan erkennen
- NINE-/Moodle-Hinweise ausgeben
- Empfehlungen nachvollziehbar begründen

## Was Codespaces von uns braucht

GitHub Codespaces braucht vor allem ein sauberes Repository mit:

1. einer klaren Projektstruktur,
2. einer Entwicklungsumgebung über `.devcontainer/devcontainer.json`,
3. Installations- und Startbefehlen,
4. Beispiel-Daten für den MVP,
5. API-Endpunkten für den Agenten,
6. einer `.env.example` für notwendige Secrets,
7. einer verständlichen README.

## Projektstart im Codespace

Im Codespace ausführen:

```bash
npm install
npm run dev
```

Danach öffnet Codespaces Port `3000`.

## Wichtige Dateien

```text
.devcontainer/devcontainer.json   Codespace-Konfiguration
server.js                         Backend + Agentenlogik für den MVP
public/index.html                 einfache Startseite / Demo-UI
data/modules.json                 Beispielmodule
data/faculty13.json               Beispieltermine Fakultät 13
.env.example                      Beispiel für Umgebungsvariablen
docs/projektbeschreibung.md       Projektlogik für Workshop / Lerntagebuch
docs/codex_prompt.md              Prompt für Codex / GitHub Copilot Coding Agent
```

## MVP-Funktion

Der Nutzer gibt ein:

- Studiengang
- Semester
- bestandene Module
- gewünschte ECTS
- gesperrte Zeiten, z. B. Arbeitstage

Der Agent gibt aus:

- empfohlene Module
- ECTS-Summe
- einfachen Stundenplan
- erkannte Überschneidungen
- Moodle-/NINE-Hinweise
- Begründung der Empfehlung

## Datenschutz-Abgrenzung

Im MVP werden keine Passwörter gespeichert und keine echten NINE- oder Moodle-Logins automatisiert. Der Agent arbeitet mit Mock-Daten und gibt nur Empfehlungen, Links und Handlungsschritte aus.
