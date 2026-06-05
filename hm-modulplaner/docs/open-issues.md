# HM Modulplaner – Offene Issues

Stand: Sprint 3 (Juni 2026) · Automatisch aus Codeanalyse + Sprint-Review generiert.

---

## Legende

| Status | Bedeutung |
|--------|-----------|
| 🔴 offen | Noch nicht begonnen |
| 🟡 in Bearbeitung | Aktuell aktiv |
| 🟢 gelöst | Abgeschlossen |
| ⏸ zurückgestellt | Bewusst verschoben |

---

## Issues

### 1 – Stundenplan zu statisch

| Feld | Wert |
|------|------|
| **Problem** | ScheduleView zeigt Module immer gleich. Gesperrte Tage werden rot markiert, aber nicht entfernt. |
| **Bereich** | `ScheduleView.tsx`, `plannerService.ts` |
| **Ursache** | ScheduleView nutzt statische `scheduleEntries` aus `data/schedule.ts`, nicht das aktive Szenario |
| **Lösung** | ScheduleView erhält als Prop die Module des aktiven Szenarios; gesperrte-Tage-Module werden aus der Anzeige entfernt |
| **Priorität** | P1 – kritisch |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |
| **Nächster Schritt** | `ScheduleView` auf Szenario-Module umstellen |

---

### 2 – Szenarien verändern Stundenplan nicht wirklich

| Feld | Wert |
|------|------|
| **Problem** | Szenario A–D erzeugen unterschiedliche Modullisten, aber ScheduleView zeigt immer denselben Plan |
| **Bereich** | `RecommendationTable.tsx`, `ScheduleView.tsx` |
| **Ursache** | Kein Binding zwischen `selectedScenarioId` und ScheduleView |
| **Lösung** | ScheduleView liest aktives Szenario aus AppContext und rendert nur dessen Module |
| **Priorität** | P1 – kritisch |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 3 – Arbeitstage nicht konsequent angewendet

| Feld | Wert |
|------|------|
| **Problem** | Arbeitstage beeinflussen die Filterlogik nicht vollständig; Module auf gesperrten Tagen bleiben im Plan |
| **Bereich** | `plannerService.ts`, `scheduleConflictService.ts` |
| **Ursache** | `filterByBlockedDays` filtert bereits, aber wenn ein Modul keinen Wochentag hat (day = undefined), wird es nicht gefiltert |
| **Lösung** | Module ohne Wochentag als „Termin unbekannt" behandeln; explizit warnen |
| **Priorität** | P1 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 4 – API-Daten nicht konsequent genutzt (Semester 5–7)

| Feld | Wert |
|------|------|
| **Problem** | Semester 5–7 werden als „Daten fehlen" markiert, obwohl NINE API sie liefert |
| **Bereich** | `data/modules.ts`, `OpenModules.tsx`, `Dashboard.tsx` |
| **Ursache** | Lokale `modules.ts` hat für Sem 5–7 nur Platzhalter; NINE-API-Daten werden nicht in lokale Fallback-Liste übertragen |
| **Lösung** | NINE-API-Daten haben Vorrang; `OpenModules.tsx` verwendet primär `nineReport.modulesByStage` |
| **Priorität** | P1 |
| **Status** | 🟢 gelöst in Sprint 5 (nineApiDiscoveryService lädt Stage 1–7) |

---

### 5 – Dashboard hängt an Dummy Jonas Weber

| Feld | Wert |
|------|------|
| **Problem** | Dashboard ist direkt auf `student` (dummy_student.json) verdrahtet |
| **Bereich** | `Dashboard.tsx`, `AppContext.tsx` |
| **Ursache** | Kein `currentStudentProfile`-Konzept mit sourceType |
| **Lösung** | `studentProfileService.ts` einführen; Dashboard aus `currentStudentProfile` rendern; Demo-Badge anzeigen |
| **Priorität** | P1 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 6 – PDF-Reader unzuverlässig

| Feld | Wert |
|------|------|
| **Problem** | PDF-Text-Extraktion mit `pdfjs-dist` funktioniert nur bei textbasierten PDFs; gescannte PDFs ergeben leere Strings |
| **Bereich** | `primussImportService.ts` |
| **Ursache** | Kein OCR implementiert; pdfjs liefert nur Text aus Text-Layer |
| **Lösung** | Extrahierten Rohtext als Vorschau zeigen; bei leerem Text klare Meldung; Nutzer auf Texteingabe hinweisen |
| **Priorität** | P2 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 7 – „Meine Leistungen" aktualisiert Dashboard nicht sauber

| Feld | Wert |
|------|------|
| **Problem** | Nach Import-Übernahme werden Szenarien neu berechnet, aber Dashboard noch nicht vollständig aktualisiert |
| **Bereich** | `StudentPerformanceImport.tsx`, `Dashboard.tsx`, `AppContext.tsx` |
| **Ursache** | `acceptPrimussImport` fügt Module hinzu, aber `currentStudentProfile.sourceType` bleibt `demo` |
| **Lösung** | `sourceType` nach Import auf `primuss_import` setzen; Dashboard-Badge entsprechend umschalten |
| **Priorität** | P1 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 8 – iCal-Export fehlt

| Feld | Wert |
|------|------|
| **Problem** | Kein Kalenderexport für gewähltes Szenario |
| **Bereich** | neu: `icalService.ts`, `CalendarExport.tsx` |
| **Ursache** | Noch nicht implementiert |
| **Lösung** | ICS-Datei clientseitig erzeugen; Download-Button; Hinweis: dauerhafter Link benötigt Backend |
| **Priorität** | P2 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 9 – Chatbot fehlt

| Feld | Wert |
|------|------|
| **Problem** | Kein Interaktionsweg für Student zum Eingeben von Arbeitstagen, bestandenen Modulen per Sprache |
| **Bereich** | neu: `chatbotService.ts`, `StudentChatbot.tsx` |
| **Ursache** | Noch nicht implementiert |
| **Lösung** | Regelbasierter Chatbot; NLP-Erweiterung später möglich |
| **Priorität** | P2 |
| **Status** | 🟡 in Bearbeitung (Sprint 3) |

---

### 10 – Eigener KI-Agent zurückgestellt

| Feld | Wert |
|------|------|
| **Problem** | – |
| **Bereich** | – |
| **Ursache** | Zu komplex; Kernfunktionen müssen erst stabil sein |
| **Lösung** | Chatbot als einfache Interaktionsschicht; Agent-Architektur vorbereiten |
| **Priorität** | ⏸ zurückgestellt |
| **Status** | ⏸ zurückgestellt |

---

### 11 – PRIMUSS-Matching unvollständig

| Feld | Wert |
|------|------|
| **Problem** | Demo-Codes (G1–G13) stimmen nicht mit echten NINE-Codes überein |
| **Bereich** | `performanceMatchingService.ts` |
| **Ursache** | Echte NINE Struktur: G1=Mathe1, G3=TM, G12=Informatik – Demo-Codes abweichend |
| **Lösung** | Name-basiertes Matching verbessern; Alias-Map erweitern |
| **Priorität** | P2 |
| **Status** | 🟡 teilweise gelöst in Sprint 5 (Levenshtein-Matching vorhanden) |

---

## Prioritäten-Übersicht

| P | Issues |
|---|--------|
| P1 – kritisch | #1 #2 #3 #5 #7 |
| P2 – wichtig | #6 #8 #9 #11 |
| ⏸ zurückgestellt | #10 |
| ✅ gelöst | #4 |
