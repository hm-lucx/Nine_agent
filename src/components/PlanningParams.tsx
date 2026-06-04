import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { PlanningGoal } from '../types';

const ALL_DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const GOAL_OPTIONS: { value: PlanningGoal; label: string }[] = [
  { value: 'schnell_fertig',    label: 'Möglichst schnell fertig werden' },
  { value: 'realistisch',       label: 'Realistischer Plan' },
  { value: 'entspannt',         label: 'Entspannter Stundenplan' },
  { value: 'notenschnitt',      label: 'Notenschnitt verbessern' },
  { value: 'wpm_einbauen',      label: 'WPM einbauen' },
  { value: 'aw_einbauen',       label: 'AW/Fakultät-13-Fach einbauen' },
  { value: 'zertifikat_einbauen', label: 'Zertifikat einbauen' },
];

export default function PlanningParams() {
  const { planningParams, updatePlanningParams, resetToDemo, isModified } = useApp();
  const [local, setLocal] = useState({ ...planningParams });
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: string) => {
    const next = local.blockedDays.includes(day)
      ? local.blockedDays.filter(d => d !== day)
      : [...local.blockedDays, day];
    setLocal(p => ({ ...p, blockedDays: next }));
  };

  const toggleGoal = (g: PlanningGoal) => {
    const next = local.goals.includes(g)
      ? local.goals.filter(x => x !== g)
      : [...local.goals, g];
    setLocal(p => ({ ...p, goals: next }));
  };

  const handleApply = () => {
    updatePlanningParams({ ...local, dataLabel: 'manuell' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetToDemo();
    setLocal({ ...planningParams });
  };

  return (
    <div className="page">
      <h1>Planungsparameter</h1>
      <p className="source-note">
        Änderungen werden im Browser-State gespeichert (localStorage).
        {isModified && <span className="badge badge-warn" style={{ marginLeft: 8 }}>Angepasst</span>}
      </p>

      <div className="params-grid">
        {/* Gesperrte Tage */}
        <div className="params-card">
          <h3>Gesperrte Wochentage</h3>
          <p className="params-hint">Module an diesen Tagen werden nicht empfohlen.</p>
          <div className="day-checks">
            {ALL_DAYS.map(day => (
              <label key={day} className="day-check-label">
                <input
                  type="checkbox"
                  checked={local.blockedDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        {/* Arbeitszeiten */}
        <div className="params-card">
          <h3>Arbeitszeiten</h3>
          <p className="params-hint">Gesperrte Tage mit Uhrzeiten (optional).</p>
          {local.blockedDays.map(day => (
            <div key={day} className="worktime-row">
              <span className="worktime-day">{day}</span>
              <input
                type="time"
                value={local.workingHours[day]?.start ?? '08:00'}
                onChange={e => setLocal(p => ({
                  ...p,
                  workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day] ?? { start: '08:00', end: '18:00' }, start: e.target.value } }
                }))}
              />
              <span>bis</span>
              <input
                type="time"
                value={local.workingHours[day]?.end ?? '18:00'}
                onChange={e => setLocal(p => ({
                  ...p,
                  workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day] ?? { start: '08:00', end: '18:00' }, end: e.target.value } }
                }))}
              />
            </div>
          ))}
          {local.blockedDays.length === 0 && <p className="params-hint">Keine gesperrten Tage.</p>}
        </div>

        {/* ECTS-Ziel */}
        <div className="params-card">
          <h3>ECTS-Ziel</h3>
          <div className="ects-row">
            <label>
              Ziel-ECTS pro Semester
              <input
                type="number"
                min={5} max={40}
                value={local.targetEcts}
                onChange={e => setLocal(p => ({ ...p, targetEcts: Number(e.target.value) }))}
              />
            </label>
            <label>
              Maximale ECTS
              <input
                type="number"
                min={local.targetEcts} max={45}
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
                type="number"
                min={1} max={7}
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

        {/* Module-Optionen */}
        <div className="params-card">
          <h3>Moduloptionen</h3>
          <label className="day-check-label">
            <input type="checkbox" checked={local.includeWPM}
              onChange={e => setLocal(p => ({ ...p, includeWPM: e.target.checked }))} />
            WPM einplanen
          </label>
          <label className="day-check-label">
            <input type="checkbox" checked={local.includeAW}
              onChange={e => setLocal(p => ({ ...p, includeAW: e.target.checked }))} />
            AW/Fakultät-13-Fächer einplanen
          </label>
          <label className="day-check-label">
            <input type="checkbox" checked={local.includeCertificates}
              onChange={e => setLocal(p => ({ ...p, includeCertificates: e.target.checked }))} />
            Zertifikate einplanen
          </label>
        </div>

        {/* Planungsziele */}
        <div className="params-card">
          <h3>Planungsziele</h3>
          <div className="day-checks">
            {GOAL_OPTIONS.map(g => (
              <label key={g.value} className="day-check-label">
                <input
                  type="checkbox"
                  checked={local.goals.includes(g.value)}
                  onChange={() => toggleGoal(g.value)}
                />
                {g.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="params-actions">
        <button className="btn-primary" onClick={handleApply}>
          {saved ? '✓ Plan aktualisiert' : 'Plan aktualisieren'}
        </button>
        <button className="btn-secondary" onClick={handleReset}>
          Zurücksetzen auf Dummy-Student
        </button>
      </div>

      <div className="assumption-note" style={{ marginTop: '1.5rem' }}>
        <strong>Sprint-3-Hinweis:</strong> Die Empfehlung berücksichtigt Änderungen an gesperrten
        Tagen sofort. Vollautomatische Neuberechnung aller Randbedingungen folgt in Sprint 4.
        Daten werden im Browser (localStorage) gespeichert – keine Serverübertragung.
      </div>
    </div>
  );
}
