import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { modules as allModules } from '../data/modules';
import { scheduleEntries } from '../data/schedule';

type FilterMode = 'all' | 'lowest' | 'pflicht' | 'wpm' | 'aw' | 'blocked' | 'nodata';

const STATUS_BADGE: Record<string, string> = {
  offen: 'badge-warn',
  bestanden: 'badge-ok',
  geplant: 'badge-cond',
  'aktuell empfohlen': 'badge-ok',
  gesperrt: 'badge-blocked',
  'nicht angeboten': 'badge-blocked',
  'Daten fehlen': 'badge-cond',
};

const TYPE_BADGE: Record<string, string> = {
  'Pflichtmodul': 'badge-pflicht',
  'Pflichtmodul Studienrichtung TEC': 'badge-tec',
  'WPM': 'badge-wpm',
  'AW': 'badge-aw',
};

export default function OpenModulesTable() {
  const { student } = useApp();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [groupBySem, setGroupBySem] = useState(true);

  const passedCodes = new Set(student.passedModules.map(m => m.code));

  // alle Module bis Sem 7 die noch nicht bestanden sind
  const allOpen = allModules
    .filter(m => m.semester !== null && !passedCodes.has(m.moduleCode))
    .map(m => {
      const sched = scheduleEntries.find(s => s.moduleCode === m.moduleCode && s.availableForDummy === true);
      const blockedSched = scheduleEntries.find(s => s.moduleCode === m.moduleCode && s.availableForDummy === false);
      const openEntry = student.openModules.find(o => o.code === m.moduleCode);

      let status: string = 'offen';
      let currentlyAvailable: boolean | 'conditional' = false;
      let blockedReason = '';

      if (m.sourceConfidence === 'manuell zu prüfen') {
        status = 'Daten fehlen';
      } else if ((m.semester ?? 0) >= 4 && !student.progressionStatus.semester_4_allowed) {
        status = 'gesperrt';
        blockedReason = 'Vorrückungsregel: 4. Semester gesperrt';
      } else if (sched) {
        status = 'offen';
        currentlyAvailable = true;
      } else if (blockedSched) {
        status = 'offen';
        currentlyAvailable = false;
        blockedReason = blockedSched.blockedReason ?? 'Nicht verfügbar';
      } else if (openEntry) {
        status = openEntry.status ?? 'offen';
        currentlyAvailable = openEntry.currentlyAvailable ?? false;
        blockedReason = openEntry.blockedReason ?? '';
      }

      return { ...m, status, currentlyAvailable, blockedReason };
    });

  const lowestSem = allOpen.filter(m => m.semester !== null && m.status !== 'Daten fehlen')
    .reduce((min, m) => Math.min(min, m.semester!), 99);

  const filtered = allOpen.filter(m => {
    if (filter === 'lowest')  return m.semester === lowestSem;
    if (filter === 'pflicht') return m.type === 'Pflichtmodul' || m.type === 'Pflichtmodul Studienrichtung TEC';
    if (filter === 'wpm')     return m.type === 'WPM';
    if (filter === 'aw')      return m.type === 'AW' || m.type === 'Fakultät-13';
    if (filter === 'blocked') return m.status === 'gesperrt' || m.currentlyAvailable === false;
    if (filter === 'nodata')  return m.status === 'Daten fehlen';
    return true;
  });

  const semesters = [...new Set(filtered.map(m => m.semester))].sort((a, b) => (a ?? 99) - (b ?? 99));

  const renderRows = (items: typeof filtered) =>
    items.map(m => (
      <tr key={m.id}>
        <td>{m.semester ?? '–'}</td>
        <td><span className="badge badge-code">{m.moduleCode}</span></td>
        <td>{m.title}</td>
        <td><span className={`badge ${TYPE_BADGE[m.type] ?? 'badge-code'}`}>{m.type}</span></td>
        <td>{m.ects > 0 ? m.ects : <span className="badge badge-cond">?</span>}</td>
        <td><span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-code'}`}>{m.status}</span></td>
        <td>
          {m.status === 'Daten fehlen' ? (
            <span className="badge badge-cond">Daten fehlen</span>
          ) : m.currentlyAvailable === true ? (
            <span className="badge badge-ok">Ja</span>
          ) : m.currentlyAvailable === 'conditional' ? (
            <span className="badge badge-warn">Bedingt</span>
          ) : (
            <span className="badge badge-blocked">Nein</span>
          )}
        </td>
        <td style={{ fontSize: '0.78rem' }}>{m.blockedReason || '–'}</td>
        <td style={{ fontSize: '0.75rem' }}>{m.source}</td>
      </tr>
    ));

  return (
    <div className="page">
      <h1>Offene Module – Übersicht bis Semester 7</h1>
      <p className="source-note">
        Quellen: <strong>knowledge_base.json</strong> · <strong>dummy_student.json</strong> ·{' '}
        <strong>Studienplan_WI_B(1).pdf (Sem 5–7: manuell zu prüfen)</strong>
      </p>

      <div className="filter-bar">
        {([
          ['all',     'Alle anzeigen'],
          ['lowest',  `Nur niedrigstes (Sem ${lowestSem})`],
          ['pflicht', 'Nur Pflichtmodule'],
          ['wpm',     'Nur WPM'],
          ['aw',      'Nur AW/Fak-13'],
          ['blocked', 'Nur nicht belegbar'],
          ['nodata',  'Nur Daten fehlen'],
        ] as [FilterMode, string][]).map(([val, label]) => (
          <button
            key={val}
            className={`filter-btn ${filter === val ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
        <label className="filter-toggle">
          <input type="checkbox" checked={groupBySem} onChange={e => setGroupBySem(e.target.checked)} />
          Nach Semester gruppieren
        </label>
      </div>

      {groupBySem ? (
        semesters.map(sem => {
          const rows = filtered.filter(m => m.semester === sem);
          return (
            <div key={sem} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginTop: '1rem' }}>
                {sem === null ? 'WPM / AW' : `Semester ${sem}`}
                {sem !== null && sem >= 5 && (
                  <span className="badge badge-cond" style={{ marginLeft: 8 }}>Daten fehlen – manuell prüfen</span>
                )}
                <span className="badge badge-code" style={{ marginLeft: 8 }}>{rows.length} Module</span>
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Sem.</th><th>Code</th><th>Modul</th><th>Typ</th>
                    <th>ECTS</th><th>Status</th><th>Belegbar?</th><th>Grund</th><th>Quelle</th>
                  </tr>
                </thead>
                <tbody>{renderRows(rows)}</tbody>
              </table>
            </div>
          );
        })
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sem.</th><th>Code</th><th>Modul</th><th>Typ</th>
              <th>ECTS</th><th>Status</th><th>Belegbar?</th><th>Grund</th><th>Quelle</th>
            </tr>
          </thead>
          <tbody>{renderRows(filtered)}</tbody>
        </table>
      )}

      <div className="info-box">
        <strong>Hinweis:</strong> Module der Semester 5–7 basieren auf Platzhaltern.
        Echte Modulstruktur bitte in <em>Studienplan_WI_B(1).pdf</em> prüfen.
      </div>
    </div>
  );
}
