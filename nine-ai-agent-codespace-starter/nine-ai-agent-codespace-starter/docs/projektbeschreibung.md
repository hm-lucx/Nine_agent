# Projektbeschreibung: KI-Agent zur Optimierung von NINE

## Ausgangsproblem

Studierende müssen Informationen aus NINE, Moodle, Modulkatalog und Fakultät-13-Seiten selbst zusammensuchen. Dadurch entstehen hoher organisatorischer Aufwand, unklare Modulprioritäten und mögliche Überschneidungen im Stundenplan.

## Ziel

Das Ziel ist ein KI-Agent, der Studierende bei der individuellen Studien- und Stundenplanung unterstützt. Der Agent analysiert den Studienstand, erkennt offene Module, empfiehlt sinnvolle Kombinationen, berücksichtigt Fakultät-13-Termine und gibt konkrete nächste Schritte für NINE und Moodle aus.

## MVP

Im ersten Prototyp arbeiten wir mit strukturierten Mock-Daten. Der Nutzer gibt bestandene Module und ein ECTS-Ziel ein. Das System erstellt daraus eine Modul- und Stundenplanempfehlung.

Der MVP umfasst:

1. Eingabe des Studienstands
2. Analyse offener Module
3. Prüfung von Voraussetzungen
4. Empfehlung passender Module
5. Erstellung eines Stundenplans
6. Prüfung auf Überschneidungen
7. Ausgabe von NINE-/Moodle-Hinweisen
8. Begründung der Empfehlung

## Technische Architektur

- Frontend: einfache HTML-Demo im Ordner `public`
- Backend: Node.js mit Express in `server.js`
- Daten: JSON-Dateien in `data`
- Codespace: `.devcontainer/devcontainer.json`
- Spätere KI-Integration: OpenAI API oder Agenten-Workflow über eigene Tools

## Datenschutz und Abgrenzung

Der MVP speichert keine Passwörter und führt keine automatische Anmeldung in NINE oder Moodle durch. Der Agent gibt Empfehlungen, Links und nächste Schritte aus. Verbindliche Studienentscheidungen bleiben beim Studierenden.

## Risiken

- NINE/Moodle haben möglicherweise keine offene API.
- Fakultät-13-Daten können unstrukturiert oder wechselhaft sein.
- KI darf nicht ohne Datenbasis halluzinieren.
- Automatische Einschreibung wäre nur mit offizieller Schnittstelle und Zustimmung sinnvoll.

## Projektwert

Der Mehrwert liegt darin, dass Studierende weniger manuell suchen müssen, bessere Modulentscheidungen treffen können und frühzeitig Überschneidungen erkennen.
