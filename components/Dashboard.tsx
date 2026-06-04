import { useApp } from '../context/AppContext';

function calcWeightedAvg(modules: { ects: number; grade?: number }[]) {
  const g = modules.filter(m => m.grade != null);
  if (!g.length) return null;
  const sum = g.reduce((s, m) => s + m.grade! * m.ects, 0);
  const ects = g.reduce((s, m) => s + m.ects, 0);
  return ects > 0 ? Math.round(sum / ects * 100) / 100 : null;
}

export default function Dashboard() {
  const { student, planningParams, isModified } = useApp();
  const { progressionStatus: ps } = student;
  const avg = calcWeightedAvg(student.passedModules);

  const semStatus = [
    { sem: '1. Semester', ok: ps.semester_1_completed, label: ps.semester_1_completed ? 'Abgeschlossen' : 'Offen' },
    { sem: '2. Semester', ok: ps.semester_2_completed, label: ps.semester_2_completed ? 'Abgeschlossen' : 'Noch offen' },
    { sem: '3. Semester', ok: ps.semester_3_allowed, label: ps.semester_3_allowed ? 'Erlaubt' : 'Gesperrt' },
    { sem: '4. Semester', ok: ps.semester_4_allowed, label: ps.semester_4_allowed ? 'Erlaubt' : `Gesperrt – ${ps.semester_4_block_reason ?? ''}` },
  ];

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="source-note">
        Quelle: <strong>dummy_student.json / AppContext</strong> · Konfidenz: hoch
        {isModified && <span className="badge badge-warn" style={{ marginLeft: 8 }}>Parameter angepasst</span>}
        {planningParams.dataLabel === 'Demo' && <span className="badge badge-cond" style={{ marginLeft: 8 }}>Demo-Daten</span>}
      </p>

      {/* Studentendaten */}
      <div className="card-grid">
        <div className="card"><div className="card-label">Name</div><div className="card-value">{student.name}</div></div>
        <div className="card"><div className="card-label">Matrikelnummer</div><div className="card-value">{student.matriculationNumber}</div></div>
        <div className="card"><div className="card-label">Studiengang</div><div className="card-value">{student.studyProgram}</div></div>
        <div className="card"><div className="card-label">Studienrichtung</div><div className="card-value">{planningParams.specialization}</div></div>
        <div className="card"><div className="card-label">Semesterkontext</div><div className="card-value">{planningParams.semesterContext}</div></div>
        <div className="card">
          <div className="card-label">Bestandene ECTS</div>
          <div className="card-value highlight">{student.completedEcts} ECTS</div>
        </div>
        <div className="card">
          <div className="card-label">Gesperrte Arbeitstage</div>
          <div className="card-value blocked">{planningParams.blockedDays.join(', ') || '–'}</div>
        </div>
        <div className="card">
          <div className="card-label">Ziel-ECTS / Semester</div>
          <div className="card-value highlight">{planningParams.targetEcts} ECTS</div>
        </div>
      </div>

      {/* Notenübersicht */}
      <h2>Notenübersicht</h2>
      <p className="assumption-note">
        Demo-Noten. Ersetzt keine offizielle PRIMUSS-Berechnung.
      </p>
      <div className="card-grid">
        <div className="card">
          <div className="card-label">Bestandene Module</div>
          <div className="card-value highlight">{student.passedModules.length}</div>
        </div>
        <div className="card">
          <div className="card-label">Gewichteter Notenschnitt</div>
          <div className="card-value highlight">{avg != null ? avg.toFixed(2) : '–'}</div>
        </div>
        <div className="card">
          <div className="card-label">Benotete ECTS</div>
          <div className="card-value">{student.passedModules.filter(m => m.grade != null).reduce((s, m) => s + m.ects, 0)}</div>
        </div>
        <div className="card">
          <div className="card-label">Offene Module (Sem 2)</div>
          <div className="card-value blocked">{student.openModules.length} Module</div>
        </div>
      </div>

      {/* Semesterstatus */}
      <h2>Semesterstatus</h2>
      <div className="sem-status-grid">
        {semStatus.map(s => (
          <div key={s.sem} className={`sem-card ${s.ok ? 'sem-ok' : 'sem-blocked'}`}>
            <div className="sem-name">{s.sem}</div>
            <div className="sem-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vorrückungsregeln */}
      <h2>Vorrückungsregelstatus</h2>
      <table>
        <thead>
          <tr><th>Regel</th><th>Bedingung</th><th>Aktueller Wert</th><th>Erfüllt?</th><th>Quelle</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>3. Semester erlaubt</td>
            <td>Mathematik I bestanden + mind. 8 weitere Module aus Sem 1–2</td>
            <td>{student.passedModules.filter(m => m.semester <= 2).length} Module bestanden</td>
            <td className={ps.semester_3_allowed ? 'status-ok' : 'status-blocked'}>{ps.semester_3_allowed ? '✓ Ja' : '✗ Nein'}</td>
            <td>rules.json / 09_wib_aktuell_spo.pdf</td>
          </tr>
          <tr>
            <td>4. Semester erlaubt</td>
            <td>Alle Module Sem 1–2 bestanden</td>
            <td>{student.openModules.length} offene Module</td>
            <td className={ps.semester_4_allowed ? 'status-ok' : 'status-blocked'}>{ps.semester_4_allowed ? '✓ Ja' : '✗ Nein'}</td>
            <td>rules.json / 09_wib_aktuell_spo.pdf</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
