import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CalendarExport from './CalendarExport';
import type { Recommendation } from '../types';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const TYPE_COLOR: Record<string, string> = {
  'Pflichtmodul': '#4a90d9',
  'Pflichtmodul Studienrichtung TEC': '#2e7d32',
  'WPM': '#f57c00',
  'AW': '#7b1fa2',
  'Fakultät-13': '#7b1fa2',
};

function buildDayMap(modules: Recommendation[]): Record<string, Recommendation[]> {
  const map: Record<string, Recommendation[]> = {};
  DAYS.forEach(d => { map[d] = []; });
  for (const r of modules) {
    if (!r.day) continue;
    const day = DAYS.find(d => r.day.toLowerCase().includes(d.toLowerCase()));
    if (day) map[day].push(r);
  }
  return map;
}

export default function ScheduleView() {
  const { scenarios, selectedScenarioId, setSelectedScenario, planningParams, recalculate, isLoadingApi } = useApp();
  const [showExport, setShowExport] = useState(false);

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) ?? scenarios[0];
  const modules = activeScenario?.modules ?? [];
  const blockedDays = planningParams.blockedDays;
  const blockedSlots = planningParams.blockedTimeSlots ?? [];

  // Module filtern: gesperrte Tage + stundenweise Sperrzeiten
  const allowedModules = modules.filter(m => {
    if (!m.day) return true;
    if (blockedDays.some(b => m.day.toLowerCase().includes(b.toLowerCase()))) return false;
    // Stundenweise: aktive Sperrzeiten prüfen
    for (const slot of blockedSlots.filter(s => s.active)) {
      if (slot.day.toLowerCase() !== m.day.toLowerCase()) continue;
      if (!m.startTime || !m.endTime) continue;
      const mStart = parseInt(m.startTime.replace(':', ''));
      const mEnd   = parseInt(m.endTime.replace(':', ''));
      const sStart = parseInt(slot.startTime.replace(':', ''));
      const sEnd   = parseInt(slot.endTime.replace(':', ''));
      if (mStart < sEnd && mEnd > sStart) return false;
    }
    return true;
  });

  const blockedModules = modules.filter(m => !allowedModules.includes(m));
  const dayMap = buildDayMap(allowedModules);

  return (
    <div className="page">
      <h1>Stundenplan</h1>

      {/* Szenario-Auswahl */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {scenarios.map(sc => (
          <button key={sc.id}
            onClick={() => setSelectedScenario(sc.id)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              background: sc.id === activeScenario?.id ? '#1e3a8a' : '#e2e8f0',
              color: sc.id === activeScenario?.id ? '#fff' : '#374151',
            }}>
            {sc.scenarioId}: {sc.scenarioName}
          </button>
        ))}
        <button className="btn-secondary" style={{ fontSize: '0.75rem', marginLeft: 'auto' }} onClick={recalculate}>
          ⟳ Plan neu berechnen
        </button>
      </div>

      {/* Aktive Szenario-Info */}
      {activeScenario ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge-ok">{activeScenario.totalEcts} ECTS</span>
          <span className="badge badge-code">{allowedModules.length} Module</span>
          {activeScenario.usedDays.length > 0 && (
            <span className="badge badge-api">{activeScenario.usedDays.length} Studientage</span>
          )}
          {isLoadingApi && <span className="badge badge-warn">⟳ API lädt…</span>}
          {activeScenario.warnings.length > 0 && (
            <span className="badge badge-warn">{activeScenario.warnings.length} Warnungen</span>
          )}
        </div>
      ) : (
        <div className="info-box">Kein Szenario verfügbar. Bitte Planungsparameter prüfen.</div>
      )}

      {/* Gesperrte Module */}
      {blockedModules.length > 0 && (
        <div className="assumption-note" style={{ marginBottom: '0.75rem' }}>
          <strong>{blockedModules.length} Module entfernt (gesperrte Zeit):</strong>
          <span style={{ fontSize: '0.8rem' }}> {blockedModules.map(m => `${m.moduleTitle} (${m.day})`).join(', ')}</span>
        </div>
      )}

      {/* Stundenplan-Grid */}
      <div className="schedule-grid">
        {DAYS.map(day => {
          const isBlocked = blockedDays.some(b => day.toLowerCase().includes(b.toLowerCase()));
          const activeSlots = blockedSlots.filter(s => s.active && s.day.toLowerCase() === day.toLowerCase());
          const entries = dayMap[day] ?? [];

          return (
            <div key={day} className={`schedule-day ${isBlocked ? 'schedule-day-blocked' : ''}`}>
              <div className="schedule-day-header">
                {day}
                {isBlocked && <span className="blocked-label">gesperrt</span>}
                {!isBlocked && activeSlots.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#b45309', marginLeft: 4 }}>
                    teilw. gesperrt
                  </span>
                )}
              </div>
              <div className="schedule-day-body">
                {/* Aktive Sperrzeiten anzeigen */}
                {!isBlocked && activeSlots.map(s => (
                  <div key={s.id} style={{ background: '#fef9c3', border: '1px dashed #d97706', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: '#92400e', marginBottom: 4 }}>
                    {s.startTime}–{s.endTime} gesperrt ({s.reason})
                  </div>
                ))}

                {isBlocked ? (
                  <div className="schedule-entry" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.78rem' }}>
                    Ganztag gesperrt
                  </div>
                ) : entries.length === 0 ? (
                  <div className="schedule-empty">Kein Modul</div>
                ) : (
                  entries.map(r => (
                    <div key={r.id} className="schedule-entry"
                      style={{ borderLeft: `4px solid ${TYPE_COLOR[r.type] ?? '#888'}` }}>
                      <div className="entry-title">{r.moduleTitle}</div>
                      {(r.startTime || r.endTime) && (
                        <div className="entry-time">{r.startTime}{r.endTime ? `–${r.endTime}` : ''}</div>
                      )}
                      <div className="entry-type">{r.type}</div>
                      {r.ects > 0 && <div className="entry-ects">{r.ects} ECTS</div>}
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>{r.source}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Szenario-Warnungen */}
      {activeScenario?.warnings && activeScenario.warnings.length > 0 && (
        <div className="assumption-note" style={{ marginTop: '1rem' }}>
          {activeScenario.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}

      {/* Kalenderexport */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <button className="btn-secondary" onClick={() => setShowExport(v => !v)}>
          📅 {showExport ? 'Export schließen' : 'Kalenderexport (ICS)'}
        </button>
        {showExport && <div style={{ marginTop: '1rem' }}><CalendarExport /></div>}
      </div>
    </div>
  );
}
