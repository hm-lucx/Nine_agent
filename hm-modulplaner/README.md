# HM Modulplaner – Sprint 4 Nachbesserung

Lokaler Prototyp eines Studienplanungs-Assistenten für Wirtschaftsingenieurwesen (Bachelor) an der Hochschule München (HM), Studienrichtung Industrielle Technik (TEC).

---

## Aktueller Stand: Sprint 4 Nachbesserung (Juni 2026)

### Neue Features Sprint 4 – NINE Kursdetail-Agent

| Feature | Status | Beschreibung |
|---------|--------|-------------|
| Kursdetail-Parser | ✅ | `nineCourseDetailParser.ts` – parst HTML/Text einer NINE-Kursdetailseite |
| Moodle-Link-Erkennung | ✅ | Extrahiert href aus Ressourcen-Bereich |
| Zugangsschlüssel maskiert | ✅ | `accessKeyMasked` für UI, `accessKeyRawTransient` nur im Speicher |
| Terminextraktion | ✅ | Datum, Wochentag, Uhrzeit, Raum, Dozent aus freiem Text |
| Einschreibestatus | ✅ | enrolled / not_enrolled / waitlist / closed / unknown |
| Playwright-Extraktion | ✅ | `extractCourseDetailPage(page, url)` in `nineExtractor.ts` |
| Fixture-Unterstützung | ✅ | `agent/fixtures/` – HTML-Dateien als Testdaten |
| Handlungsempfehlungen | ✅ | `actionPlanner.ts` mit Zeitkonflikt-Prüfung |
| Agent-Endpunkte | ✅ | `POST /agent/extract-course-detail`, `POST /agent/parse-course-detail-html` |
| Frontend-Komponente | ✅ | `AgentCourseDetailResult.tsx` – zeigt alle Felder + Aktionen |
| Tab im AgentPanel | ✅ | „Kursdetail auslesen" mit URL-Eingabe |
| Sicherheitslogik | ✅ | Einfache + doppelte Bestätigung für High-Risk-Aktionen |
| Kein Auto-Eintragen | ✅ | Einschreibung nur vorbereitet, nie automatisch ausgeführt |

### Neue Features Sprint 3 Nachbesserung (weiterhin aktiv)

| Feature | Status | Beschreibung |
|---------|--------|-------------|
| Notenblatt „Notenblatt in Deutsch" | ✅ | Stammdaten + Noten + Gewichtung (Primärformat) |
| PDF-Reader Stammdaten | ✅ | Name, Geburtsdatum, Studiengang, Fachsem., ECTS, Schnitt |
| PDF-Reader Notenbestandteile | ✅ | Teilnote, Endnote, ECTS, Gewichtung je Modul |
| Dashboard durch Upload | ✅ | Kein Dummy bei importiertem Profil |
| NINE-Matching Aliase + Fuzzy | ✅ | `moduleAliasService.ts` + `stringSimilarity.ts` |
| Stundenweise Sperrzeiten | ✅ | `AvailabilityBlock` + `AvailabilityManager.tsx` |
| Szenario-Tabs im Stundenplan | ✅ | Direktes Umschalten ohne Seitenwechsel |
| Chatbot: 10 Intents + Typo-Toleranz | ✅ | Schreibfehlerkorrektur, Fuzzy-Matching |
| `gradeCalculationService.ts` | ✅ | Gewichteter Schnitt, ECTS-Split, Mismatch-Warnung |
| GitHub/.gitignore | ✅ | `.env.local`, Notenblätter ignoriert |
| `docs/open-issues.md` | ✅ | Technisch priorisierte Issue-Liste |
| Studentenprofil-Zentralisierung | ✅ | `studentProfileService.ts`, `ProfileSourceType` |
| Dashboard dynamisch | ✅ | Profil-Badge: Demo / Importiert / Manuell |
| Arbeitstage konsequent | ✅ | stundenweise Prüfung in `availabilityService.ts` |
| ScheduleView mit Szenarien | ✅ | Gesperrte Module entfernt, Slots sichtbar |
| iCal / ICS Export | ✅ | `icalService.ts` + `CalendarExport.tsx` |
| Chatbot (regelbasiert) | ✅ | `chatbotService.ts` + `StudentChatbot.tsx` |
| Eigener KI-Agent | ⏸ | Bewusst zurückgestellt |

### Datenschutz & Sicherheit

- `.env.local` immer in `.gitignore` – **niemals committen**
- Keine echten Zugangsdaten in `.env.example`
- Keine Notenblätter / privaten PDFs im Repository
- Keine sensiblen Daten in `console.log`

### Umgebungsvariablen (.env.local)

```
VITE_NINE_API_BASE_URL=https://nine.hm.edu
VITE_NINE_API_MODE=live
VITE_NINE_CURRICULUM=WI
VITE_NINE_TERM=SoSe 2026
VITE_NINE_USERNAME=          # Nicht committen!
VITE_NINE_PASSWORD=          # Nicht committen!
VITE_NINE_TOKEN=             # Nicht committen!
VITE_NINE_API_ORGANISER=FK 09
```

### Startbefehle

```bash
cd hm-modulplaner
npm install
npm run dev        # http://localhost:5173 – React-App
npm run agent      # http://127.0.0.1:3001 – Playwright-Agent-Server (eigenes Terminal)
npm run build      # Produktions-Build
```

### NINE Kursdetail-Agent – Verwendung

1. Agent-Server starten: `npm run agent` (eigenes Terminal)
2. React-App starten: `npm run dev`
3. Im Reiter **„NINE-Agent"** auf Tab **„Kursdetail auslesen"** klicken
4. NINE-Kursdetail-URL eingeben, z. B.:
   ```
   https://nine.hm.edu/Course/Details/994e2469-61fb-f011-9223-0050568f928d
   ```
5. **„Kursdetail auslesen"** klicken
6. Agent öffnet Chromium (sichtbar), lädt die Seite, extrahiert Daten

**Was wird extrahiert:**
- Kurstitel, Modul, Gruppe, Einordnung
- Moodle-Link (falls vorhanden)
- Moodle-Zugangsschlüssel (nur maskiert: `••••••••••`)
- Nächster Termin: Datum, Uhrzeit, Raum, Dozent
- Einschreibestatus: eingetragen / nicht eingetragen / Warteliste
- Handlungsempfehlungen mit Risikoklassifizierung

**Sicherheitshinweise:**
- Moodle-Zugangsschlüssel wird **nie geloggt**
- Zugangsschlüssel wird **nicht in localStorage gespeichert**
- Zugangsschlüssel wird **nicht in JSON-Exports** geschrieben
- Einschreibung wird **nie automatisch ausgeführt** – immer Bestätigung nötig
- Austragen (High-Risk) erfordert **doppelte Bestätigung**
- Agent-Server ist **nur auf localhost:3001** erreichbar

### HTML-Fixtures (für Tests ohne Live-Session)

Lege HTML-Dateien in `agent-server/fixtures/` ab:
```
agent-server/fixtures/nine-course-detail-example.html
```

Dann über API testen:
```bash
curl -X POST http://127.0.0.1:3001/agent/parse-course-detail-html \
  -H "Content-Type: application/json" \
  -d '{"html": "<html>...</html>", "sourceUrl": "https://nine.hm.edu/..."}'
```

### GitHub-Verbindung

Das Projekt hat ein lokales Git-Repository. Noch kein Remote zu GitHub konfiguriert.
So richtest du ein GitHub-Remote ein:

```bash
# 1. Repository auf github.com anlegen (ohne README)
# 2. Remote hinzufügen:
git remote add origin https://github.com/DEIN-NUTZER/hm-modulplaner.git
# 3. Ersten Commit:
git add hm-modulplaner/
git commit -m "Initial commit: HM Modulplaner Sprint 3"
git push -u origin main
```

**Achtung:** Niemals `.env.local` committen!

## Aktueller Stand: Sprint 5 (Juni 2026)

### Live-getestete NINE API Erkenntnisse (2026-06-05)

| Endpoint | Status | Ergebnis |
|----------|--------|----------|
| `GET /api/v2/semester` | ✅ Öffentlich | 35 Semester verfügbar |
| `GET /api/v2/organisers` | ✅ Öffentlich | 17 Fakultäten, WI = "FK 09" |
| `GET /api/v2/modules/WI/1/SoSe%202026` | ✅ Öffentlich | 6 Module für Stage 1 |
| `GET /api/v2/modules/WI/2–7/SoSe%202026` | ✅ Öffentlich | Alle Stages liefern echte Modullisten |
| `GET /api/v2/courses?institutionId=FK%2009` | ⚠️ Leer | Gibt leere Liste zurück |

**Wichtig:** Die Module-Endpoints liefern echte Modullisten für alle 7 Stages. Die meisten Module haben `courses: []` – echte Terminplanung ist nur für wenige Module hinterlegt (z. B. G3 Technische Mechanik: Mi 12:30–16:00, R 0.056, Prof. Anzinger).

### Datenquellen-Hierarchie

| Priorität | Quelle | Verwendung |
|-----------|--------|-----------|
| **1** | **NINE API** (live) | Modulkatalog Stages 1–7, Terminplanung wo verfügbar |
| **2** | **PRIMUSS-Upload** | Bestandene Module, Noten, ECTS, Status |
| **3** | **Manuell** | Korrekturen, fehlende Daten |
| **4** | **Lokale Knowledge-Daten** | Vorrückungsregeln, Studienstruktur, Fallback |
| **5** | **Demo-Daten** | Nur Entwicklungsfallback (Jonas Weber) |

### Datenmodus (dynamisch)

Die App zeigt immer welche Datenquelle aktiv ist:
- `live_nine` – NINE API erfolgreich geladen
- `partial_nine` – Teildaten aus API, Rest Fallback
- `local_fallback` – NINE API nicht verfügbar
- `manual_only` – Nur manuelle Eingaben

---

---

## Features (Sprint 5)

### Neu in Sprint 5

- **NINE API Diagnose** (`NineApiDiagnostics.tsx`): Systematischer Test aller Endpoints mit Status, HTTP-Code, Dauer, Rohdaten-Vorschau, Modul-Listen nach Stage
- **nineApiDiscoveryService.ts**: Echter API-Test mit `fetchStage()`, `fetchAllStages()`, `runDiscovery()`, Normalisierung via `normalizeNineModule()`
- **Meine Leistungen** (`StudentPerformanceImport.tsx`): 3-Tab-Import (Upload / Textliste / Manuell), Demo-Notenblatt (Jonas Weber), NINE-Matching-Anzeige in Vorschau
- **performanceMatchingService.ts**: Matching via exakter Code, Name-Normalisierung, Levenshtein-Ähnlichkeit
- **Offene Module dynamisch** (`OpenModules.tsx`): Berechnet aus NINE-Modulen minus bestandenen Modulen, zeigt NINE-Termindaten wo verfügbar
- **DataSourceStatus.tsx**: Transparente Übersicht aller Datenquellen mit Prioritäten und aktuellem Modus
- **Datenmodus-Badge** in Sidebar: Zeigt immer `live_nine / partial_nine / local_fallback / manual_only`
- **`types/nineApi.ts`**: Typen für NINE API (Raw + normalisiert)

### Vorhandene Features (Sprint 1–4)

## Features (Sprint 4)

### Dashboard
- Semesterstatus für **alle 7 Semester** (1–7) dynamisch berechnet
- Status: abgeschlossen · teilweise · aktuell belegbar · offen · gesperrt · Daten fehlen
- Berechnung aus: Modulstruktur, bestandenen Modulen, Vorrückungsregeln, NINE API
- Aktives Szenario direkt sichtbar (ECTS, Module, Studientage)
- NINE API Status-Karten

### Empfehlungsszenarien (4 Szenarien)
| Szenario | Beschreibung |
|----------|-------------|
| **A – Standardplan** | Regelkonform, Semesterprioriät, WPM + AW optional |
| **B – ECTS-optimiert** | Möglichst nah am ECTS-Maximum |
| **C – Entspannt** | Weniger Module, max. 2/Tag, max. 4 Studientage |
| **D – Rückstände** | Nur Pflichtmodule, niedrigste Semester zuerst |

Jedes Szenario zeigt: Module, Typ, Semester, Tag, Uhrzeit, ECTS, Begründung, Warnungen, Quelle.

### Planungsparameter (vereinfacht)
- Gesperrte Wochentage
- Arbeitszeiten (pro gesperrtem Tag)
- Ziel-ECTS und maximale ECTS
- Fachsemester und Semesterkontext
- Studienrichtung
- WPM und AW ein-/ausblenden
- **Entfernt:** Zertifikate-Option, Planungsziele (ersetzt durch Szenarien)

### PRIMUSS-Import (robuster)
- **JSON** – vollständig strukturiert
- **CSV** – Spalten: Modul, Note, ECTS, Status
- **XLSX/XLS** – via SheetJS
- **TXT** – zeilenweise, typische Notenblatt-Formate
- **PDF** – Textextraktion via pdfjs-dist
- **Bilder/Screenshots** – Hinweis (OCR noch nicht implementiert)

Erkannte Formate:
```
Mathematik I 6 ECTS 2,3 bestanden
Physik, Note 3.0, 5 ECTS, bestanden
Grundlagen BWL 5 1,7 BE
Werkstofftechnik nicht bestanden
```

Import-Vorschau ist bearbeitbar. Nach Import: Szenarien werden sofort neu berechnet.

### NINE API (v2)
Swagger: `https://nine.hm.edu/swagger/ui/index`

Implementierte Endpoints:
- `GET /api/v2/semester` – Semester-Liste
- `GET /api/v2/organisers` – Organisationen/Fakultäten
- `GET /api/v2/courses?institutionId=&semesterId=` – Lehrveranstaltungen
- `GET /api/v2/curricula?institutionId=` – Studiengänge
- `GET /api/v2/rooms` – Räume
- `GET /api/v2/modules/{curriculum}/{stage}/{semester}` – Module

**CORS-Status (Sprint 5):** Öffentliche GET-Endpoints sind CORS-fähig! Die App lädt Moduldaten direkt beim Start.
Primärer Endpoint: `GET /api/v2/modules/WI/{stage}/SoSe%202026` – Stage 1–7 funktioniert ohne Auth.

**Bekannte Einschränkung:** `/api/v2/courses?institutionId=FK%2009` gibt leere Liste zurück. Kursdaten kommen aus dem modules-Endpoint.

### Dynamische Planungslogik
- `plannerService.ts` – 4 Szenarien aus NINE + PRIMUSS + Regeln + Params
- `scheduleConflictService.ts` – Zeitkollisionsprüfung
- `ruleEngine.ts` – Vorrückungsregeln
- Szenarien werden automatisch neu berechnet bei: Parameteränderung, PRIMUSS-Import, API-Reload

---

## Installation und Start

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
# → http://localhost:5173

# Produktions-Build
npm run build
```

### Umgebungsvariablen (.env.local)

```env
VITE_NINE_API_BASE_URL=https://nine.hm.edu
VITE_NINE_API_MODE=mock          # "live" für echte API
VITE_NINE_API_INSTITUTION=       # Aus /api/v2/organisers
VITE_NINE_API_ORGANISER=         # Optional
VITE_NINE_API_TOKEN=             # Bearer-Token nach Login
```

Vorlage: `.env.example` – Nie in Git committen!

---

## Datenschutz-Hinweise

- **Keine PRIMUSS-Dateien ins Repository speichern.**
- Importierte Daten werden nur im Browser (localStorage) gespeichert – kein Server-Upload.
- Keine Matrikelnummern oder personenbezogene Daten loggen.
- Demo-Daten aus `dummy_student.json` sind frei erfunden.
- NINE API Token nur in `.env.local` speichern.

---

## Technische Struktur (Sprint 4)

```
src/
  context/
    AppContext.tsx          # Globaler State (Student, Params, NINE-Daten, Szenarien)
  services/
    nineApiService.ts       # NINE API v2 (echte Endpoints + Mock)
    plannerService.ts       # 4 Szenarien berechnen
    scheduleConflictService.ts  # Zeitkollisionen prüfen
    ruleEngine.ts           # Vorrückungsregeln
    primussImportService.ts # Import-Pipeline (JSON/CSV/XLSX/TXT/PDF)
    knowledgeService.ts     # Zugriff auf statische Daten
  components/
    Dashboard.tsx           # Semesterstatus 1-7, Szenarien-Summary
    PlanningParams.tsx      # Vereinfachtes Parameterformular
    RecommendationTable.tsx # 4 Szenarien + Detail-Tabellen
    NotRecommendedTable.tsx # Dynamisch aus ruleEngine + planningParams
    OpenModulesTable.tsx    # Alle offenen Module bis Sem 7
    PassedModulesTable.tsx  # Noten, Durchschnitt
    PrimussImport.tsx       # Import UI (Upload + Text + Vorschau)
    NineApiStatus.tsx       # API Status + echte Endpoints
    ScheduleView.tsx        # Stundenplan
    archive/
      ArchivePage.tsx       # Sprint-Doku, JSON-Export, Quellen, API-Status
      SprintDocumentation.tsx
      JsonExport.tsx
      KnowledgeSources.tsx
      RuleSources.tsx
  data/
    student.ts    modules.ts    schedule.ts
    rules.ts      sources.ts    recommendation.ts
  types.ts
```

---

## Bekannte Einschränkungen

| Bereich | Status |
|---------|--------|
| NINE API live | CORS blockiert direkte Browser-Anfragen – Mock-Modus als Standard |
| NINE API institutionId | Nicht öffentlich dokumentiert – muss manuell aus /organisers ermittelt werden |
| Semester 5–7 | Keine gesicherten Termindaten – als „Daten fehlen / Quelle prüfen" markiert |
| PDF-Import | Funktioniert nur bei text-basierten PDFs (nicht bei gescannten) |
| OCR | Bilder/Screenshots: noch nicht implementiert (tesseract.js wäre Option) |
| Vorrückungsregeln 5–7 | Aus 09_wib_aktuell_spo.pdf noch nicht vollständig extrahiert |

---

## Knowledge-Ordner (/inhalte)

| Datei | Verwendung |
|-------|-----------|
| `knowledge_base.json` | Modulkatalog, Semestergruppen, Termine |
| `dummy_student.json` | Demo-Studentenprofil |
| `rules.json` | Vorrückungsregeln |
| `recommended_schedule_example.json` | Beispiel-Empfehlung (Fallback) |
| `09_wib_aktuell_spo.pdf` | Prüfungsordnung (Vorrückungsregeln) |
| `Datenbank_Semestergruppen_TEC.pdf` | Modulverfügbarkeit, Termine |
| `Studienplan_WI_B(1).pdf` | Modulstruktur, ECTS, Semesterzuordnung |

---

## Nächste Schritte (Sprint 5)

- CORS-Proxy für NINE API einrichten (HM-intern oder lokaler Proxy)
- institutionId aus `/api/v2/organisers` automatisch ermitteln
- Semester 5–7 mit echten Termindaten aus NINE API füllen
- PDF-Import für gescannte PDFs verbessern
- Mehr Vorrückungsregeln aus SPO ergänzen
- Empfehlungsszenarien mit echten API-Daten validieren
- Manuelles Editieren von Modulen in offener Module-Tabelle

---

## Sprint-Verlauf

| Sprint | Status | Highlight |
|--------|--------|-----------|
| Sprint 1 | ✓ abgeschlossen | Grundstruktur, Knowledge-Analyse, statische Anzeige |
| Sprint 2 | → Sprint 3 | Regellogik in Sprint 3 integriert |
| Sprint 3 | ✓ abgeschlossen | Dynamischer AppContext, PRIMUSS-Prototyp, NINE API Vorbereitung |
| Sprint 4 | ✓ abgeschlossen | 4 Szenarien, NINE API v2, robuster Import, Sem 1–7 Dashboard |
