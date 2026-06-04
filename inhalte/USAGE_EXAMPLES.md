# Usage Examples für den KI-Agenten

## Beispiel 1: Belegung vorschlagen

User:
Empfiehl Jonas Weber eine regelkonforme Modulbelegung für SoSe 2026 mit ca. 30 ECTS. Montag und Freitag sind gesperrt. Bitte semesterweise abschließen.

Expected Agent Behavior:
- Prüfe bestandene Module.
- Prüfe niedrigstes offenes Semester.
- Priorisiere offene Module aus Semester 2.
- Prüfe Vorrückungsregel für Semester 3.
- Sperre 4. Semester.
- Nutze WPM/AW nur ergänzend.
- Prüfe Kollisionen.
- Gib Tabelle und JSON aus.

## Beispiel 2: Warum ist ein Modul gesperrt?

User:
Warum darf Jonas Marketing nicht belegen?

Expected Agent Behavior:
- Marketing ist ein Modul des 4. Semesters.
- Jonas darf aktuell keine 4.-Semester-Module belegen.
- Grund: Es fehlen noch mehrere Module aus Semester 1-2.
- Die 4.-Semester-Ausnahme greift nur, wenn maximal ein Modul fehlt und dieses zweimal angetreten wurde.

## Beispiel 3: WPM prüfen

User:
Kann Jonas Digital Marketing Basics belegen?

Expected Agent Behavior:
- WPM sind allgemein freigegeben.
- In Master-Datei angeboten: Dienstag 11:45-14:15.
- Prüfe Kollisionen mit aktueller Belegung.
- Wenn Energietechnik Dienstag 08:45-12:00 belegt ist, gibt es eine Teilkollision von 11:45-12:00.
- Empfehlung abhängig vom aktuellen Plan.

## Beispiel 4: AW prüfen

User:
Kann Jonas Human Factors Engineering als AW belegen?

Expected Agent Behavior:
- AW allgemein freigegeben.
- In Master/AW-Daten sichtbar: Dienstag 13:30-16:45.
- Montag/Freitag nicht betroffen.
- Prüfe Kollisionen.
- AW zählt nicht für Vorrücken.
