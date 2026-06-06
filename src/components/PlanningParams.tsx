import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const ALL_DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function PlanningParams() {
  const { planningParams, updatePlanningParams, resetToDemo, isModified, lastPlannerUpdate, recalculate } = useApp();
  const [local, setLocal] = useState({ ...planningParams });
  const [saved, setSaved] = useState(false);

  // Bei externen Änderungen (z. B. Reset) lokalen State synchronisieren
  useEffect(() => { setLocal({ ...planningParams }); }, [planningParams]);

  const toggleDay = (day: string) => {
    const next = local.blockedDays.includes(day)
      ? local.blockedDays.filter(d => d !== day)
      : [...local.blockedDays, day];
    setLocal(p => ({ ...p, blockedDays: next }));
  };

  const handleApply = () => {
    updatePlanningParams({ ...local, dataLabel: 'manuell' });
    recalculate();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetToDemo();
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '–';

  return (
    <div className="page">
      <h1>Planungsparameter</h1>
      <p className="source-note">
        Änderungen werden im Browser-State gespeichert (localStorage).{' '}
        {isModified && <span className="badge badge-warn">Angepasst</span>}
        {lastPlannerUpdate && (
          <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
            Letzte Neuberechnung: {fmtDate(lastPlannerUpdate)}
          </span>
        )}
      </p>

      <div className="params-grid">
        {/* Gesperrte Tage */}
        <div className="params-card">
          <h3>Gesperrte Wochentage</h3>
          <p className="params-hint">Module an diesen Tagen werden nicht in Szenarien empfohlen.</p>
          <div className="day-checks">
            {ALL_DAYS.map(day => (
              <label key={day} className="day-check-label">
                <input
                  type="checkbox"
                  checked={local.blockedDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {day}
                {local.blockedDays.includes(day) && (
                  <span className="badge badge-blocked" style={{ marginLeft: 6, fontSize: '0.65rem' }}>gesperrt</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Arbeitszeiten */}
        <div className="params-card">
          <h3>Arbeitszeiten (gesperrte Tage)</h3>
          <p className="params-hint">Legt fest, wann du arbeitest – Überschneidungen werden in den Szenarien ausgeblendet.</p>
          {local.blockedDays.map(day => (
            <div key={day} className="worktime-row">
              <span className="worktime-day">{day}</span>
              <input
                type="time"
                value={local.workingHours[day]?.start ?? '08:00'}
                onChange={e => setLocal(p => ({
                  ...p,
                  workingHours: {
                    ...p.workingHours,
                    [day]: { ...p.workingHours[day] ?? { start: '08:00', end: '18:00' }, start: e.target.value },
                  },
                }))}
              />
              <span>bis</span>
              <input
                type="time"
                value={local.workingHours[day]?.end ?? '18:00'}
                onChange={e => setLocal(p => ({
                  ...p,
                  workingHours: {
                    ...p.workingHours,
                    [day]: { ...p.workingHours[day] ?? { start: '08:00', end: '18:00' }, end: e.target.value },
                  },
                }))}
              />
            </div>
          ))}
          {local.blockedDays.length === 0 && <p className="params-hint">Keine gesperrten Tage gewählt.</p>}
        </div>

        {/* ECTS-Ziel */}
        <div className="params-card">
          <h3>ECTS-Ziel</h3>
          <div className="ects-row">
            <label>
              Ziel-ECTS pro Semester
              <input
                type="number" min={5} max={40}
                value={local.targetEcts}
                onChange={e => setLocal(p => ({ ...p, targetEcts: Number(e.target.value) }))}
              />
            </label>
            <label>
              Maximale ECTS
              <input
                type="number" min={local.targetEcts} max={45}
                value={local.maxEcts}
                onChange={e => setLocal(p => ({ ...p, maxEcts: Number(e.target.value) }))}
              />
            </label>
          </div>
        </div>

        {/* Studienstatus */}
        <div className="params-card">
          <h3>Studienstatus</h3>
          <div className="ects-row">
            <label>
              Fachsemester
              <input
                type="number" min={1} max={7}
                value={local.currentSemester}
                onChange={e => setLocal(p => ({ ...p, currentSemester: Number(e.target.value) }))}
              />
            </label>
            <label>
              Semesterkontext
              <select
                value={local.semesterContext}
                onChange={e => setLocal(p => ({ ...p, semesterContext: e.target.value }))}
              >
                <option>SoSe 2026</option>
                <option>WiSe 2026/27</option>
                <option>SoSe 2027</option>
                <option>WiSe 2027/28</option>
                <option>SoSe 2028</option>
              </select>
            </label>
          </div>
          <label style={{ marginTop: '0.75rem', display: 'block' }}>
            Studienrichtung
            <select
              value={local.specialization}
              onChange={e => setLocal(p => ({ ...p, specialization: e.target.value }))}
            >
              <option>Industrielle Technik / TEC</option>
              <option>Biomedizintechnik / BIO</option>
              <option>Sonstige</option>
            </select>
          </label>
        </div>

        {/* Moduloptionen */}
        <div className="params-card">
          <h3>Moduloptionen</h3>
          <label className="day-check-label">
            <input
              type="checkbox" checked={local.includeWPM}
              onChange={e => setLocal(p => ({ ...p, includeWPM: e.target.checked }))}
            />
            WPM einplanen
          </label>
          <label className="day-check-label">
            <input
              type="checkbox" checked={local.includeAW}
              onChange={e => setLocal(p => ({ ...p, includeAW: e.target.checked }))}
            />
            AW / Fakultät-13-Fächer einplanen
          </label>
        </div>
      </div>

      <div className="params-actions">
        <button className="btn-primary" onClick={handleApply}>
          {saved ? '✓ Plan aktualisiert' : 'Plan aktualisieren'}
        </button>
        <button className="btn-secondary" onClick={handleReset}>
          Zurücksetzen auf Demo-Student
        </button>
      </div>

      <div className="assumption-note" style={{ marginTop: '1.5rem' }}>
        <strong>Sprint 4:</strong> Nach „Plan aktualisieren" werden alle 4 Empfehlungsszenarien
        sofort neu berechnet. Daten werden im Browser gespeichert – keine Serverübertragung.
        Zertifikate-Option und Planungsziele wurden in Sprint 4 entfernt (waren redundant zu Szenarien).
      </div>
    </div>
  );
}
