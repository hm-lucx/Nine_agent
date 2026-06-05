export default function SprintDocumentation() {
  const sprints = [
    {
      id: 1,
      status: 'abgeschlossen',
      goal: 'Eine lauffähige Grundstruktur der App erstellen, die lokale Knowledge-Dateien einliest, die Datenquellen sichtbar macht und die wichtigsten Daten des Dummy-Studenten, bestandene Module, offene Module, Stundenplaninformationen und eine Beispiel-Empfehlung im Browser anzeigt.',
      result:
        'Die App zeigt Dashboard, bestandene Module, offene Module, Empfehlung, nicht belegbare Module, Stundenplan-Ansicht, JSON-Export, Datenquellenübersicht, Regelquellenübersicht und Sprint-Dokumentation auf Basis lokaler Knowledge-Daten.',
      deviation:
        'Die automatische Filterlogik für Montag/Freitag, Zeitkollisionen, Vorrückungsregeln und semesterweise Priorisierung ist in Schritt 1 noch nicht vollständig implementiert.',
      cause:
        'Zuerst muss geprüft werden, ob die lokalen Knowledge-Dateien korrekt eingebunden, ausgewertet und im Frontend sichtbar dargestellt werden können.',
      nextSprint:
        'Im nächsten Schritt wird aus den dargestellten Daten eine automatische Regel- und Filterlogik gebaut.',
    },
    {
      id: 2,
      status: 'abgeschlossen',
      goal: 'Automatische Filterlogik, PRIMUSS-Import, NINE API vorbereiten, Dashboard dynamisch.',
      result:
        'Regelbasierter Planner, PRIMUSS-Import (PDF/CSV/XLSX/TXT/JSON), Dummy-Profil Jonas Weber, NINE API Discovery Service, 4 Szenarien (A–D), offene Module aus NINE + Leistungen berechnet.',
      deviation: 'Semester 5–7 aus NINE API nur bei CORS-Freigabe; ohne Auth nur Modulkatalog, keine Termine.',
      cause: 'NINE API erfordert Auth für vollständige Termine. CORS blockiert Direktzugriff ohne Proxy.',
      nextSprint: 'NINE-Matching verbessern, Notenblatt-Reader ausbauen, Dashboard dynamisieren.',
    },
    {
      id: '3-nachbesserung',
      status: 'abgeschlossen',
      goal: 'Den HM Modulplaner weiter dynamisieren. Das Notenblatt soll als zentrale Quelle für persönliche Studierendendaten dienen, das Dashboard vollständig überschreiben, NINE-Matches trotz abweichender Modulnamen ermöglichen, stundenweise Sperrzeiten berücksichtigen und Szenarien direkt im Stundenplan auswählbar machen.',
      result:
        '✅ Notenblatt-Format „Notenblatt in Deutsch" wird gezielt unterstützt. ' +
        '✅ Stammdaten (Name, Geburtsdatum, Studiengang, Fachsem., ECTS, Schnitt) werden extrahiert. ' +
        '✅ Teilnote, Endnote, ECTS und Gewichtung je Modul werden erkannt. ' +
        '✅ Dashboard wird nach Import vollständig durch currentStudentProfile überschrieben. ' +
        '✅ NINE-Matching mit Alias-Mapping (moduleAliasService.ts) und Fuzzy-Levenshtein (stringSimilarity.ts). ' +
        '✅ Stundenweise Sperrzeiten (AvailabilityBlock) + AvailabilityManager.tsx UI. ' +
        '✅ Szenario-Tabs direkt im Stundenplan – Umschalten ohne Seitenwechsel. ' +
        '✅ Chatbot mit 10 Intents, Schreibfehlerkorrektur (fixTypos), Fuzzy-Modul-Matching. ' +
        '✅ gradeCalculationService.ts: gewichteter Schnitt, Mismatch-Warnung, ECTS-Split. ' +
        '✅ Build: 0 TypeScript-Fehler, 0 Warnungen.',
      deviation:
        'PDF-Format ist sehr uneinheitlich – nicht alle Notenblatt-Varianten werden zuverlässig erkannt. ' +
        'NINE-Matches für Semester 5–7 hängen von der API-Verfügbarkeit ab. ' +
        'Chatbot-Antworten sind regelbasiert; LLM-Anbindung zurückgestellt.',
      cause:
        'PDF-Texte variieren je nach PRIMUSS-Version und Druckeinstellungen. ' +
        'NINE API liefert für Sem. 5–7 nur bei Auth vollständige Termine. ' +
        'LLM-Anbindung bewusst zurückgestellt (Token-Kosten, externe Abhängigkeit).',
      nextSprint:
        'Notenblatt-Parser weiter trainieren. Alias-Mapping erweitern. NINE API mit Auth testen. ' +
        'Chatbot-Regeln erweitern. Echte Tests mit mehreren Notenblättern. iCal-Link mit Backend ermöglichen.',
    },
    {
      id: '4-nachbesserung',
      status: 'abgeschlossen',
      goal:
        'Den lokalen NINE-Agent auf Kursdetailseiten erweitern. ' +
        'Er soll Moodle-Links, Moodle-Zugangsschlüssel, Termine, Räume, Dozenten und Einschreibestatus ' +
        'aus einer NINE-Kursdetailseite (https://nine.hm.edu/Course/Details/...) extrahieren ' +
        'und sichere Handlungsempfehlungen erzeugen.',
      result:
        '✅ Kursdetail-Parser erstellt: agent-server/parsers/nineCourseDetailParser.ts ' +
        '| parseNineCourseDetailFromHtml(html, sourceUrl) extrahiert alle Kernfelder. ' +
        '✅ Typen definiert: ExtractedCourseDetail, MoodleResource, EnrollmentInfo, CourseAppointment, AgentAction ' +
        '(agent-server/types/courseDetail.ts + src/types/courseDetail.ts). ' +
        '✅ Moodle-Link-Erkennung: Ressourcen-Bereich ausgewertet, href extrahiert. ' +
        '✅ Zugangsschlüssel: erkannt, maskiert angezeigt (••••••••), accessKeyRawTransient nur im Speicher. ' +
        '✅ Terminextraktion: Datum, Wochentag, Uhrzeit von/bis, Raum, Dozent aus freiem Text. ' +
        '✅ Einschreibestatus: enrolled/not_enrolled/waitlist/closed/unknown per Text-Erkennung. ' +
        '✅ Playwright-Extraktion: agent-server/nineExtractor.ts | extractCourseDetailPage(page, url). ' +
        '✅ Fixture-Unterstützung: extractFromFixture(filename) für HTML-Testdateien. ' +
        '✅ Handlungsempfehlungen: actionPlanner.ts | createCourseDetailRecommendations() mit Zeitkonflikt-Prüfung. ' +
        '✅ Agent-Server-Endpunkte: POST /agent/extract-course-detail, POST /agent/parse-course-detail-html. ' +
        '✅ Frontend-Komponente: AgentCourseDetailResult.tsx – zeigt alle Felder + Aktionsbuttons. ' +
        '✅ AgentPanel erweitert: Tab „Kursdetail auslesen" mit URL-Eingabe + Ergebnis-Anzeige. ' +
        '✅ Sicherheitslogik: einfache Bestätigung, doppelte Bestätigung für High-Risk-Aktionen. ' +
        '✅ Kein Zugangsschlüssel in Logs, kein automatisches Eintragen/Austragen.',
      deviation:
        'Parser erkennt strukturierte NINE-Seiten gut, aber stark dynamische JavaScript-gerenderte Inhalte ' +
        'können ggf. nicht vollständig erfasst werden. ' +
        'Moodle-Zugangsschlüssel-Erkennung hängt von Textstruktur im Ressourcen-Bereich ab. ' +
        'Tatsächlicher Klick auf Eintragen/Austragen ist vorbereitet, aber als TODO markiert. ' +
        'Live-Extraktion erfordert laufenden Agent-Server (npm run agent).',
      cause:
        'Dynamische NINE-Oberfläche rendert teilweise per JavaScript nach DOM-Load. ' +
        'Kursdetailseiten haben kein einheitliches Layout über alle Kurse. ' +
        'Moodle-Zugangsschlüssel stehen in Freitext, nicht in strukturierten Feldern. ' +
        'Einschreibe-Aktionen brauchen Sicherheitslogik, die bewusst in mehrere Stufen aufgeteilt ist.',
      nextSprint:
        'Mehr Kursdetailseiten mit echten HTML-Fixtures testen. Parser-Regex robuster machen. ' +
        'Moodle-Handling erweitern (Token-basierter API-Zugriff). ' +
        'Tatsächliche Einschreibe-Aktion nach doppelter Bestätigung ausführbar machen. ' +
        'Alle extrahierten Kursdetails in Planung übernehmen (Szenario-Konfliktprüfung).',
    },
  ];

  return (
    <div className="page">
      <h1>Sprint-Dokumentation</h1>
      <p className="source-note">
        Projektstatus und Abweichungsanalyse nach Sprints.
      </p>

      {sprints.map((s) => (
        <div key={s.id} className={`sprint-card ${s.status === 'abgeschlossen' ? 'sprint-done' : 'sprint-planned'}`}>
          <div className="sprint-header">
            <span className="sprint-number">Sprint {s.id}</span>
            <span className={`badge ${s.status === 'abgeschlossen' ? 'badge-ok' : 'badge-cond'}`}>
              {s.status}
            </span>
          </div>

          <div className="sprint-row">
            <div className="sprint-label">Sprint-Ziel</div>
            <div className="sprint-value">{s.goal}</div>
          </div>

          <div className="sprint-row">
            <div className="sprint-label">Erreichtes Ergebnis</div>
            <div className="sprint-value">{s.result}</div>
          </div>

          <div className="sprint-row">
            <div className="sprint-label">Abweichung</div>
            <div className="sprint-value warn-text">{s.deviation}</div>
          </div>

          <div className="sprint-row">
            <div className="sprint-label">Ursache</div>
            <div className="sprint-value">{s.cause}</div>
          </div>

          <div className="sprint-row">
            <div className="sprint-label">Bedeutung für nächsten Sprint</div>
            <div className="sprint-value">{s.nextSprint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
