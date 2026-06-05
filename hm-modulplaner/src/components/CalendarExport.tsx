import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateICS, downloadICS } from '../services/icalService';

export default function CalendarExport() {
  const { scenarios, selectedScenarioId, planningParams } = useApp();
  const [exported, setExported] = useState(false);

  const scenario = scenarios.find(s => s.id === selectedScenarioId) ?? scenarios[0];

  if (!scenario) {
    return (
      <div className="info-box">
        Kein Szenario ausgewählt. Bitte zuerst im Reiter „Empfehlungsszenarien" ein Szenario wählen.
      </div>
    );
  }

  const handleExport = () => {
    const result = generateICS(scenario.modules, scenario.scenarioName, planningParams.semesterContext);
    const filename = `hm-modulplaner-${scenario.scenarioId}-${planningParams.semesterContext.replace(/\s/g, '-')}.ics`;
    downloadICS(result.icsContent, filename);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const preview = generateICS(scenario.modules, scenario.scenarioName, planningParams.semesterContext);

  return (
    <div>
      <h3>Kalenderexport für Szenario {scenario.scenarioId}: {scenario.scenarioName}</h3>
      <p className="source-note">
        {preview.eventCount} Veranstaltungen können exportiert werden.
        {!preview.hasRealDates && <span className="badge badge-warn" style={{ marginLeft: 8 }}>Demo-Datum</span>}
      </p>
      {preview.warnings.length > 0 && (
        <div className="assumption-note">
          {preview.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
      <div className="info-box" style={{ marginTop: '0.75rem' }}>
        <strong>Hinweis:</strong> Es wird eine <code>.ics</code>-Datei heruntergeladen, die du in Kalender-Apps (Google, Apple, Outlook) importieren kannst.
        <br />
        Ein dauerhaft abonnierbarer iCal-Link benötigt einen Server und ist ohne Backend nicht möglich.
      </div>
      <div className="params-actions" style={{ marginTop: '0.75rem' }}>
        <button className="btn-primary" onClick={handleExport} disabled={preview.eventCount === 0}>
          {exported ? '✓ Datei heruntergeladen!' : `📅 ICS herunterladen (${preview.eventCount} Termine)`}
        </button>
      </div>
    </div>
  );
}
