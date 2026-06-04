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
      status: 'geplant',
      goal: 'Automatische Filterlogik für gesperrte Arbeitstage, Zeitkollisionen, Vorrückungsregeln und semesterweise Priorisierung implementieren.',
      result:
        'Die App soll aus dummy_student.json, rules.json und knowledge_base.json automatisch eine regelkonforme Belegungsempfehlung erzeugen.',
      deviation: 'Noch offen – Sprint 2 startet nach erfolgreichem Sprint 1.',
      cause: 'Noch offen.',
      nextSprint: 'Noch offen.',
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
