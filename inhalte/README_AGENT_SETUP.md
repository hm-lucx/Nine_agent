# WI-Agent Knowledge Pack

Dieses Paket enthält alles, was ein externer KI-Agent braucht, um mit der bisher aufgebauten Datenbasis zu arbeiten.

## Enthaltene Dateien

- `agent_system_prompt.md`
  - Der wichtigste Prompt für den Agenten.
  - Als System Prompt, Developer Prompt oder Knowledge Instruction in deinem Tool verwenden.

- `knowledge_base.json`
  - Strukturierte Datenbasis mit:
    - Quellenhierarchie
    - Vorrückungsregeln
    - Dummy-Student
    - bestandenen Modulen
    - offenen Modulen
    - Modulverfügbarkeiten aus der Master-Datei
    - WPM/AW-Regeln
    - Beispielbelegung

- `dummy_student.json`
  - Nur der aktuelle Dummy-Student.

- `rules.json`
  - Nur die harten Regeln, falls dein Tool Regeln getrennt speichern kann.

- `recommended_schedule_example.json`
  - Beispiel einer aktuellen Belegung mit ca. 30 ECTS unter Beachtung:
    - Montag und Freitag gesperrt
    - semesterweise abschließen
    - WPM allgemein freigegeben
    - AW allgemein freigegeben
    - 4. Semester aktuell gesperrt

- `source_manifest.md`
  - Übersicht über die Originalquellen und wofür sie verwendet werden.

- `USAGE_EXAMPLES.md`
  - Beispielanfragen an den Agenten.

- Optional im ZIP enthalten:
  - `Studienplan_WI_B(1).pdf`
  - `09_wib_aktuell_spo.pdf`
  - `Datenbank_Semestergruppen_TEC.pdf`

## Empfohlene Nutzung in einem anderen KI-Tool

1. Lade die drei Original-PDFs hoch.
2. Lade zusätzlich `knowledge_base.json` hoch.
3. Füge den Inhalt von `agent_system_prompt.md` als System-/Instruction-Prompt ein.
4. Teste den Agenten mit einer Anfrage wie:

   „Empfiehl Jonas Weber eine regelkonforme Modulbelegung für SoSe 2026 mit ca. 30 ECTS. Montag und Freitag sind gesperrt. Bitte semesterweise abschließen.“

## Wichtigste Projektprämissen

- Master-Datei ist maßgeblich für tatsächliche Verfügbarkeit und Termine.
- SPO ist maßgeblich für Vorrückungsregeln.
- Studienplan ist maßgeblich für Modulstruktur und ECTS.
- WPM sind im Projekt allgemein freigegeben.
- AW sind allgemein freigegeben, zählen aber nicht fürs Vorrücken.
- Immer versuchen, Semester nach Semester abzuschließen.
- Beim Dummy sind Montag und Freitag gesperrt.
