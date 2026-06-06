import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ScenarioRecommendation } from '../services/plannerService';

const TYPE_BADGE: Record<string, string> = {
  'Pflichtmodul': 'badge-pflicht',
  'Pflichtmodul Studienrichtung TEC': 'badge-tec',
  'WPM': 'badge-wpm',
  'AW': 'badge-aw',
  'Fakultät-13': 'badge-aw',
};

const SCENARIO_COLORS: Record<string, string> = {
  'scenario-a': '#2563eb',
  'scenario-b': '#16a34a',
  'scenario-c': '#9333ea',
  'scenario-d': '#dc2626',
};

function ScenarioCard({
  scenario, active, onSelect,
}: {
  scenario: ScenarioRecommendation;
  active: boolean;
  onSelect: () => void;
}) {
  const color = SCENARIO_COLORS[scenario.id] ?? '#555';
  return (
    <div
      className={`scenario-card ${active ? 'scenario-card-active' : ''}`}
      style={{ borderColor: active ? color : undefined }}
    >
      <div className="scenario-card-header" style={{ background: active ? color : undefined }}>
        <span className="scenario-badge">Szenario {scenario.scenarioId}</span>
        <span className="scenario-title">{scenario.scenarioName}</span>
        {active && <span className="scenario-active-badge">aktiv</span>}
      </div>
      <div className="scenario-card-body">
        <p className="scenario-desc">{scenario.scenarioDescription}</p>
        <div className="scenario-stats">
          <span><strong>{scenario.totalEcts}</strong> ECTS</span>
          <span><strong>{scenario.modules.length}</strong> Module</span>
          <span><strong>{scenario.usedDays.length}</strong> Studientage</span>
          {scenario.warnings.length > 0 && (
            <span className="badge badge-warn">{scenario.warnings.length} Warnung{scenario.warnings.length > 1 ? 'en' : ''}</span>
          )}
        </div>
        <p className="scenario-rationale">{scenario.scenarioRationale}</p>
        <div className="scenario-days">
          {scenario.usedDays.map(d => (
            <span key={d} className="badge badge-day">{d}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`badge ${scenario.dataSource === 'api' ? 'badge-ok' : scenario.dataSource === 'mixed' ? 'badge-warn' : 'badge-code'}`}>
            {scenario.dataSource === 'api' ? 'NINE API' : scenario.dataSource === 'mixed' ? 'API + lokal' : 'lokal'}
          </span>
          {!active && (
            <button className="btn-secondary" style={{ padding: '0.2rem 0.75rem', fontSize: '0.8rem' }} onClick={onSelect}>
              Dieses Szenario übernehmen
            </button>
          )}
          {active && <span className="badge badge-ok">✓ Ausgewählt</span>}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationTable() {
  const { scenarios, selectedScenarioId, setSelectedScenario, planningParams, lastPlannerUpdate, isLoadingApi } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>('scenario-a');

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '–';

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) ?? scenarios[0];

  if (scenarios.length === 0) {
    return (
      <div className="page">
        <h1>Empfehlungsszenarien</h1>
        <div className="info-box">
          {isLoadingApi
            ? '⟳ Lade Daten… Szenarien werden berechnet.'
            : 'Noch keine Szenarien berechnet. Bitte Planungsparameter prüfen und „Plan aktualisieren" klicken.'}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Empfehlungsszenarien</h1>
      <p className="source-note">
        Berechnet aus: NINE API · PRIMUSS/Dummy-Daten · Planungsparameter · Vorrückungsregeln<br />
        Gesperrte Tage: <strong>{planningParams.blockedDays.join(', ') || 'keine'}</strong> ·
        Ziel-ECTS: <strong>{planningParams.targetEcts}</strong> · Max-ECTS: <strong>{planningParams.maxEcts}</strong> ·
        Plan aktualisiert: <strong>{fmtDate(lastPlannerUpdate)}</strong>
        {isLoadingApi && <span className="badge badge-api" style={{ marginLeft: 8 }}>⟳ API lädt…</span>}
      </p>

      {/* Szenario-Karten */}
      <div className="scenario-cards-grid">
        {scenarios.map(s => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            active={s.id === selectedScenarioId}
            onSelect={() => setSelectedScenario(s.id)}
          />
        ))}
      </div>

      {/* Detail-Ansicht */}
      <h2 style={{ marginTop: '2rem' }}>Detailansicht der Szenarien</h2>
      <div className="scenario-tabs">
        {scenarios.map(s => (
          <button
            key={s.id}
            className={`scenario-tab ${expandedId === s.id ? 'active' : ''}`}
            style={{ borderBottomColor: expandedId === s.id ? (SCENARIO_COLORS[s.id] ?? '#555') : undefined }}
            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
          >
            Szenario {s.scenarioId}: {s.scenarioName}
          </button>
        ))}
      </div>

      {scenarios.map(s => {
        if (expandedId !== s.id) return null;
        return (
          <div key={s.id} className="scenario-detail">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Szenario {s.scenarioId}: {s.scenarioName}</h3>
              <span className="badge badge-code">{s.totalEcts} ECTS</span>
              <span className="badge badge-code">{s.modules.length} Module</span>
              <span className="badge badge-code">{s.usedDays.length} Tage</span>
              {s.id !== selectedScenarioId && (
                <button className="btn-primary" style={{ padding: '0.25rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setSelectedScenario(s.id)}>
                  Übernehmen
                </button>
              )}
              {s.id === selectedScenarioId && <span className="badge badge-ok">✓ Aktives Szenario</span>}
            </div>

            {s.warnings.length > 0 && (
              <div className="assumption-note">
                {s.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}
            {s.conflicts.length > 0 && (
              <div className="assumption-note" style={{ borderColor: '#dc2626' }}>
                {s.conflicts.map((c, i) => <div key={i}>⚡ {c}</div>)}
              </div>
            )}

            <table>
              <thead>
                <tr>
                  <th>Modul</th>
                  <th>Typ</th>
                  <th>Sem.</th>
                  <th>Tag</th>
                  <th>Uhrzeit</th>
                  <th>ECTS</th>
                  <th>Begründung</th>
                  <th>Quelle</th>
                  <th>Hinweise</th>
                </tr>
              </thead>
              <tbody>
                {s.modules.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.moduleTitle}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.moduleCode}</span></td>
                    <td><span className={`badge ${TYPE_BADGE[m.type] ?? 'badge-code'}`}>{m.type}</span></td>
                    <td>{m.semester ?? '–'}</td>
                    <td>{m.day}</td>
                    <td>{m.timeRaw ?? '–'}</td>
                    <td><strong>{m.ects}</strong></td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>{m.reason}</td>
                    <td style={{ fontSize: '0.75rem' }}>{m.source}</td>
                    <td>
                      {m.warnings && m.warnings.length > 0
                        ? <span className="badge badge-warn">{m.warnings.join('; ')}</span>
                        : <span className="badge badge-ok">–</span>}
                    </td>
                  </tr>
                ))}
                {s.modules.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Keine Module in diesem Szenario (alle Tage gesperrt oder keine verfügbaren Module).</td></tr>
                )}
              </tbody>
              {s.modules.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5}><strong>Gesamt</strong></td>
                    <td><strong>{s.totalEcts} ECTS</strong></td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        );
      })}

      {/* Aktives Szenario – warum andere Module nicht enthalten */}
      {activeScenario && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Nicht enthaltene Module (aktives Szenario)</h2>
          <p className="source-note">
            Warum wurden Module aus dem aktiven Szenario „{activeScenario.scenarioName}" ausgeschlossen?
          </p>
          <div className="info-box">
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {planningParams.blockedDays.length > 0 && (
                <li>Module an gesperrten Tagen ({planningParams.blockedDays.join(', ')}) wurden ausgeblendet.</li>
              )}
              <li>Module mit Zeitkollisionen wurden ausgeschlossen.</li>
              <li>Module, die Vorrückungsregeln verletzen (z. B. Sem. 4 bei nicht erfüllter Bedingung), wurden ausgeschlossen.</li>
              <li>Module aus Semester 5–7 sind in der lokalen Datenbasis noch nicht terminiert (Quelle prüfen).</li>
              <li>ECTS-Maximum von {planningParams.maxEcts} ECTS wurde beachtet.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
