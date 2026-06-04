# HM Modulplaner – Studienplanungs-Prototyp

Lokaler Prototyp eines KI-gestützten Studienplanungs-Agenten für den Bachelor Wirtschaftsingenieurwesen (WIB), Studienrichtung TEC, an der Hochschule München.

---

## Start

```bash
cd hm-modulplaner
npm install
npm run dev
```

Öffnet sich unter: **http://localhost:5173** (oder 5174 wenn belegt)

### Voraussetzungen

- Node.js >= 18 (getestet mit Node.js 24 LTS)
- npm >= 9

---

## Was wurde in Sprint 3 verbessert?

| Bereich | Sprint 1 | Sprint 3 |
|---|---|---|
| Planungsparameter | Statisch (Dummy-Daten) | Dynamisch editierbar per Formular |
| Gesperrte Tage | Fest: Mo/Fr | Frei wählbar + Arbeitszeiten |
| Bestandene Module | Tabelle ohne Noten | Mit Noten, Durchschnitt, Versuchsanzahl |
| Offene Module | Nur Sem 2 | Alle Semester bis 7 mit Filter + Gruppierung |
| PRIMUSS-Import | – | Datei-Upload (JSON/CSV/TXT) + Textparser |
| NINE-API | – | Service-Schicht mit Mock-Modus |
| State-Management | Keine | React Context + localStorage |
| Navigation | Flach (10 Items) | Gruppiert (4 Sektionen + Archiv-Tab) |
| Sprint-Doku | Sprint 1–2 | Sprint 1–3 |

---

## Dynamische Planungsparameter

Unter **Planungsparameter** kann der Nutzer ändern:
- Gesperrte Wochentage (Checkboxen)
- Arbeitszeiten pro gesperrtem Tag
- Ziel-ECTS und maximale ECTS pro Semester
- Fachsemester, Semesterkontext, Studienrichtung
- WPM/AW/Zertifikat-Optionen
- Planungsziele (schnell, realistisch, entspannt usw.)

Änderungen werden in localStorage gespeichert und beim Reload beibehalten.
„Zurücksetzen" stellt den Dummy-Studenten wieder her.

---

## PRIMUSS-Import-Prototyp

Unter **PRIMUSS Import**:
- JSON-Dateien: vollständig geparst
- CSV-Dateien: Spalten Modul, Note, ECTS, Status erkannt
- TXT/Textfenster: Zeilenweiser Parser (z. B. „Mathematik I, Note 2,3, 5 ECTS, bestanden")
- PDF/Word/Bilder: Als Datei erkannt → manuell zu prüfen
- Importvorschau mit Konfidenz
- „Import übernehmen" übernimmt bestandene Module in AppContext

**Wichtig:** Keine Daten verlassen den Browser. Kein Server-Upload.

---

## NINE-API-Vorbereitung

Datei: `src/services/nineApiService.ts`

### Konfiguration

1. `.env.example` zu `.env.local` kopieren
2. Werte eintragen:

```env
VITE_NINE_API_BASE_URL=https://nine.hm.edu
VITE_NINE_API_TOKEN=dein-token
VITE_NINE_API_MOCK=false
```

3. `npm run dev` neu starten

### Aktueller Stand

- Standard-Modus: **Mock** (keine echten Aufrufe)
- Swagger: https://nine.hm.edu/swagger/ui/index
- Konkrete Endpoints: `TODO` – aus Swagger verifizieren
- CORS: Direkte Browser-Aufrufe können blockiert werden → ggf. Proxy nötig

Implementierte Funktionen (alle mit Mock-Fallback):
`testNineConnection()`, `fetchModules()`, `fetchCurricula()`,
`fetchCourses()`, `fetchScheduleEntries()`, `fetchRooms()`, `fetchStudyPrograms()`

---

## Semester 5–7

Module der Semester 5–7 sind als **Platzhalter** eingetragen:
- `Daten fehlen / Quelle prüfen`
- Echte Modulstruktur muss aus `Studienplan_WI_B(1).pdf` manuell ergänzt werden
- In der UI unter **Offene Module** sichtbar, mit Hinweis

---

## Noten und Durchschnittsberechnung

- Bestandene Module haben Demo-Noten (Beispielwerte)
- Gewichteter Notendurchschnitt nach ECTS
- Fehlende Noten werden aus Berechnung ausgeschlossen
- Hinweis: „ersetzt keine offizielle PRIMUSS-Berechnung"

---

## Archiv & Nachweise

Unter **Archiv & Nachweise** (Tab-Navigation) gebündelt:
- Sprint-Dokumentation (Sprint 1–3)
- JSON Export
- Datenquellen
- Regelquellen
- NINE API Status

---

## Knowledge-Ordner (`/inhalte`)

| Datei | Typ | Status |
|---|---|---|
| `knowledge_base.json` | JSON | gelesen |
| `dummy_student.json` | JSON | gelesen |
| `rules.json` | JSON | gelesen |
| `recommended_schedule_example.json` | JSON | gelesen |
| `agent_system_prompt.md` | Markdown | gelesen |
| `source_manifest.md` | Markdown | gelesen |
| `README_AGENT_SETUP.md` | Markdown | gelesen |
| `Studienplan_WI_B(1).pdf` | PDF | teilweise gelesen |
| `09_wib_aktuell_spo.pdf` | PDF | teilweise gelesen |
| `Datenbank_Semestergruppen_TEC.pdf` | PDF | teilweise gelesen |
| `Datenbank_Semestergruppen_TEC.docx` | Word | manuell zu prüfen |

---

## Technische Struktur

```
src/
├── context/AppContext.tsx       # Dynamischer State (React Context + localStorage)
├── types.ts                     # TypeScript-Interfaces (erweitert)
├── App.tsx                      # Navigation (gruppiert, 4 Sektionen)
├── App.css                      # Styling
├── data/                        # Statische Basisdaten
│   ├── student.ts               # Dummy-Student mit Noten
│   ├── modules.ts               # Modulkatalog bis Sem 7
│   ├── schedule.ts, rules.ts, sources.ts, recommendation.ts
├── services/
│   ├── knowledgeService.ts      # Datenzugriff
│   ├── ruleEngine.ts            # Regelprüfung
│   └── nineApiService.ts        # NINE-API (Mock + Live)
└── components/
    ├── Dashboard.tsx            # Mit Notenübersicht, dynamisch
    ├── PlanningParams.tsx       # Editierbares Formular
    ├── PassedModulesTable.tsx   # Mit Noten + Durchschnitt
    ├── OpenModulesTable.tsx     # Sem 1–7, Filter, Gruppierung
    ├── RecommendationTable.tsx  # Dynamisch nach gesperrten Tagen
    ├── ScheduleView.tsx         # Dynamisch
    ├── NotRecommendedTable.tsx
    ├── PrimussImport.tsx        # Datei-Upload + Parser
    ├── NineApiStatus.tsx        # API-Status + Testen
    └── archive/
        ├── ArchivePage.tsx      # Tab-Navigation (Archiv)
        ├── SprintDocumentation.tsx (Sprint 1–3)
        ├── JsonExport.tsx
        ├── KnowledgeSources.tsx
        └── RuleSources.tsx
```

---

## Bekannte Grenzen

- Semester 5–7: Nur Platzhalter, echte Daten fehlen
- NINE-API: Endpoints nicht verifiziert, Mock-Standard
- PRIMUSS: PDF/Word/Bilder nicht automatisch auslesbar
- Empfehlung: Noch teilweise auf Beispieldaten basierend (Sprint 3)
- Vollautomatische Regelprüfung bei Parameteränderung: Sprint 4

---

## Nächste Schritte (Sprint 4)

- NINE-API: Echte Endpoints aus Swagger verifizieren
- PRIMUSS: PDF-Parser verbessern
- Vollständige automatische Neuberechnung der Empfehlung
- Semester 5–7: Echte Modulstruktur ergänzen
- Datenkonflikte (PDF vs. JSON) dokumentieren

---

## Sprint-Dokumentation

### Sprint 1 – abgeschlossen
Lauffähige Grundstruktur. Knowledge-Dateien eingebunden. Alle 10 Bereiche sichtbar.

### Sprint 2 – zusammengeführt mit Sprint 3
Grundlegende Regellogik (ruleEngine.ts) implementiert.

### Sprint 3 – abgeschlossen
Dynamischer State (AppContext + localStorage). Planungsparameter-Formular.
PRIMUSS-Import-Prototyp. NINE-API-Service mit Mock. Noten + Durchschnitt.
Offene Module bis Sem 7. Archiv & Nachweise. Navigation neu strukturiert.
