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
