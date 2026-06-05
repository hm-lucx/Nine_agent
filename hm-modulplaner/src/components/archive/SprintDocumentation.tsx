export default function SprintDocumentation() {
  const sprints = [
    {
      id: 1,
      status: 'abgeschlossen',
      goal: 'Eine lauffähige Grundstruktur der App erstellen, die lokale Knowledge-Dateien einliest, die Datenquellen sichtbar macht und die wichtigsten Daten des Dummy-Studenten, bestandene Module, offene Module, Stundenplaninformationen und eine Beispiel-Empfehlung im Browser anzeigt.',
      result: 'Die App zeigt Dashboard, bestandene Module, offene Module, Empfehlung, nicht belegbare Module, Stundenplan-Ansicht, JSON-Export, Datenquellenübersicht, Regelquellenübersicht und Sprint-Dokumentation auf Basis lokaler Knowledge-Daten.',
      deviation: 'Die automatische Filterlogik für Montag/Freitag, Zeitkollisionen, Vorrückungsregeln und semesterweise Priorisierung ist in Schritt 1 noch nicht vollständig implementiert.',
      cause: 'Zuerst muss geprüft werden, ob die lokalen Knowledge-Dateien korrekt eingebunden, ausgewertet und im Frontend sichtbar dargestellt werden können.',
      nextSprint: 'Im nächsten Schritt wird aus den dargestellten Daten eine automatische Regel- und Filterlogik gebaut.',
    },
    {
      id: 2,
      status: 'zusammengeführt mit Sprint 3',
      goal: 'Automatische Filterlogik für gesperrte Arbeitstage, Zeitkollisionen, Vorrückungsregeln und semesterweise Priorisierung implementieren.',
      result: 'Grundlegende Regelprüfung im ruleEngine-Service implementiert. Vollautomatische Neuberechnung in Sprint 3 fortgesetzt.',
      deviation: 'Vollständige Automatik wurde mit den dynamischen Parametern in Sprint 3 kombiniert.',
      cause: 'Enger Zusammenhang zwischen Regellogik und dynamischen Planungsparametern.',
      nextSprint: 'Sprint 3 baut direkt auf dem ruleEngine-Service auf.',
    },
    {
      id: 3,
      status: 'abgeschlossen',
      goal: 'Den statischen Prototyp zu einem dynamischen Studienplanungsmodell erweitern. Nutzer sollen Arbeitstage, Arbeitszeiten, ECTS-Ziel, Studienstatus und weitere Planungsparameter manuell ändern können. Zusätzlich sollen PRIMUSS-Import und NINE-API-Anbindung vorbereitet werden.',
      result: 'Dynamischer AppContext (React Context + localStorage) implementiert. Planungsparameter-Formular mit gesperrten Tagen, Arbeitszeiten, ECTS-Ziel, Studienrichtung und Planungszielen gebaut. PRIMUSS-Import-Prototyp mit Datei-Upload (JSON/CSV/TXT/PDF), Textparser und Importvorschau. NINE-API-Service mit Mock-Modus und vollständiger TODO-Dokumentation. Noten und gewichteter Notendurchschnitt in bestandenen Modulen. Alle offenen Module bis Semester 7 (Sem 5–7: Platzhalter). Archiv & Nachweise als gebündelter Bereich.',
      deviation: 'Vollautomatische Neuberechnung der Empfehlung auf Basis geänderter Parameter noch nicht vollständig implementiert. NINE-API live nicht getestet (CORS/Auth ausstehend). Semester 5–7 nur Platzhalter – echte Modulstruktur muss aus Studienplan_WI_B(1).pdf manuell ergänzt werden.',
      cause: 'NINE-API: Auth-Schema und konkrete Endpoints müssen erst aus Swagger verifiziert werden. Semester 5–7: Keine gesicherten Daten in knowledge_base.json vorhanden. Automatische Neuberechnung: Komplexe Abhängigkeit zwischen Semestergruppen-Datenbankdaten und Planungsregeln.',
      nextSprint: 'Echte NINE-API-Endpoints testen und verifizieren. PRIMUSS-Parser verbessern (PDF/Word). Automatische vollständige Regelprüfung bei Parameteränderung. Echte Modulstruktur Sem 5–7 aus Studienplan_WI_B(1).pdf ergänzen.',
    },
    {
      id: 4,
      status: 'abgeschlossen',
      goal: 'Den HM Modulplaner von einem statischen Prototyp zu einem dynamischeren Planungssystem erweitern. Die App soll NINE API-Daten (v2) für aktuelle Modulangebote nutzen, PRIMUSS-/Notenblatt-Daten aus Uploads auslesen, Semester 1–7 berücksichtigen und vier Empfehlungsszenarien erzeugen.',
      result: `NINE API Service komplett auf v2-Endpoints umgestellt (GET /api/v2/semester, /organisers, /courses, /curricula, /rooms). Swagger-Analyse: echte Endpoints identifiziert und implementiert. Vier Empfehlungsszenarien (A: Standardplan, B: ECTS-optimiert, C: Entspannt, D: Rückstände) werden dynamisch aus NINE API + PRIMUSS + Planungsparametern berechnet (plannerService.ts). PRIMUSS-Import deutlich robuster: JSON, CSV, XLSX (via SheetJS), TXT, PDF (via pdfjs-dist), Bild-Hinweis. Import-Vorschau bearbeitbar. Nach Import werden Szenarien sofort neu berechnet. Dashboard zeigt Semesterstatus für alle 7 Semester dynamisch. Planungsparameter vereinfacht (Zertifikate-Option + Planungsziele entfernt). NotRecommendedTable dynamisch aus ruleEngine + planningParams. scheduleConflictService.ts neu implementiert. AppContext um NINE API-Daten, Szenarien, selectedScenarioId erweitert. NINE API-Daten werden beim App-Start automatisch geladen.`,
      deviation: `NINE API-Live-Modus: CORS-Blocker verhindert direkte Browser-Anfragen an nine.hm.edu. Daher wird weiterhin Mock-Modus als Standard verwendet. institutionId für echte /courses-Abfrage ist nicht öffentlich dokumentiert und muss manuell gesucht werden. Semester 5–7: Immer noch Platzhalter-Status – keine gesicherten Terminsdaten. OCR für Bilder noch nicht implementiert. PDF-Textextraktion funktioniert nur bei text-basierten PDFs.`,
      cause: `CORS: Browser-Sicherheitsrichtlinien blockieren direkte Cross-Origin-Anfragen. Institution-ID: nicht in öffentlicher Swagger-Doku. Sem 5–7: Keine vollständige Terminsdatenbank im knowledge-Ordner. OCR: tesseract.js wäre zu groß und instabil für diesen Prototyp.`,
      nextSprint: `CORS-Proxy einrichten oder HM-intern testen. institutionId aus /organisers-Endpoint extrahieren. Semester 5–7 mit echten Termindaten aus NINE API füllen. PDF-Textextraktion weiter verbessern. Empfehlungsszenarien validieren. Mehr Vorrückungsregeln aus 09_wib_aktuell_spo.pdf ergänzen.`,
    },
    {
      id: 5,
      status: 'abgeschlossen',
      goal: 'Die App von statischen Dummy-Daten auf eine dynamische Datenpipeline umstellen: NINE API für Modulangebot und Termine, PRIMUSS-/Notenblatt-Import oder manuelle Eingabe für bestandene Module und Noten, daraus dynamische offene Module und mehrere Empfehlungsszenarien berechnen.',
      result: `Live-Test aller NINE API Endpoints (2026-06-05): GET /api/v2/semester → 35 Semester gelistet. GET /api/v2/organisers → 17 Fakultäten, WI = "FK 09". GET /api/v2/modules/WI/{1-7}/SoSe%202026 → alle 7 Stages liefern echte Modullisten (Sem1: G1/G3/G5/G8/G10/G12, Sem2: G2/G4/G6/G7/G9/G11/G13 usw.). G3 Technische Mechanik hat echte Terminplanung (Mi 12:30–16:00, Raum R 0.056, Prof. Anzinger). GET /api/v2/courses?institutionId=FK%2009 → leere Liste. Neue Dienste: nineApiDiscoveryService.ts (systematischer Diagnose-Prozess für alle Endpoints). Neue Komponente NineApiDiagnostics.tsx mit Endpoint-Tabelle, Rohdaten-Vorschau, Modul-Listen nach Stage. Normalisierungsfunktion normalizeNineModule() für flexible Response-Normalisierung. StudentPerformanceImport.tsx mit 3 Tabs: Upload, Textliste (inkl. Demo-Notenblatt), Manuell. performanceMatchingService.ts: Matching via exakter Code, Name-Normalisierung, Levenshtein-Ähnlichkeit. OpenModules.tsx: Offene Module dynamisch aus NINE-API-Modulen minus bestandenen Modulen berechnet. DataSourceStatus.tsx: Transparente Übersicht aller Datenquellen mit Prioritäten. AppContext: dataSourceMode (live_nine/partial_nine/local_fallback/manual_only) im State. nineReport (NineDiscoveryReport) als primärer API-State. Automatische Szenarioberechnung wenn nineReport sich ändert.`,
      deviation: `GET /api/v2/courses?institutionId=FK%2009 gibt leere Liste zurück – Kursdetails nur über /modules/{curriculum}/{stage}/{semester} verfügbar. Die meisten Module haben courses:[] – echte Terminplanung nur für wenige Module im SoSe 2026. NINE Modul-Codes (G1=Mathe1, G3=TM, G12=Informatik) weichen von unseren Demo-Codes ab – Matching nur über Namen möglich.`,
      cause: `NINE API organisiert Kurse primär über den /modules Endpoint, nicht /courses. Terminplanung in der API ist nicht vollständig für alle Semester hinterlegt – viele Veranstaltungen haben noch keine eingetragenen Kursdaten. Demo-Daten wurden mit vereinfachten Codes erstellt, die nicht der echten HM-Modulstruktur entsprechen.`,
      nextSprint: `Backend-Proxy für NINE API einrichten um echte Auth-geschützte Endpoints zu testen. Demo-Daten (dummy_student.json) auf echte NINE Modulcodes anpassen. Weitere Semester (WiSe 2026) testen. PDF-Text-Parsing für echte Notenblatts verbessern. Mehr Vorrückungsregeln aus Prüfungsordnung ergänzen.`,
    },
  ];

  return (
    <div className="page">
      <h1>Sprint-Dokumentation</h1>
      <p className="source-note">Projektstatus und Abweichungsanalyse nach Sprints.</p>

      {sprints.map((s) => (
        <div key={s.id} className={`sprint-card ${s.status === 'abgeschlossen' ? 'sprint-done' : s.status.includes('geplant') ? 'sprint-planned' : 'sprint-planned'}`}>
          <div className="sprint-header">
            <span className="sprint-number">Sprint {s.id}</span>
            <span className={`badge ${s.status === 'abgeschlossen' ? 'badge-ok' : 'badge-cond'}`}>{s.status}</span>
          </div>
          <div className="sprint-row"><div className="sprint-label">Sprint-Ziel</div><div className="sprint-value">{s.goal}</div></div>
          <div className="sprint-row"><div className="sprint-label">Erreichtes Ergebnis</div><div className="sprint-value">{s.result}</div></div>
          <div className="sprint-row"><div className="sprint-label">Abweichung</div><div className="sprint-value warn-text">{s.deviation}</div></div>
          <div className="sprint-row"><div className="sprint-label">Ursache</div><div className="sprint-value">{s.cause}</div></div>
          <div className="sprint-row"><div className="sprint-label">Bedeutung für nächsten Sprint</div><div className="sprint-value">{s.nextSprint}</div></div>
        </div>
      ))}
    </div>
  );
}
