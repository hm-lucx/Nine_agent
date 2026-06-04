import { useApp } from '../context/AppContext';

function calcWeightedAverage(modules: { ects: number; grade?: number }[]): number | null {
  const graded = modules.filter(m => m.grade != null && m.grade > 0);
  if (graded.length === 0) return null;
  const sumWeighted = graded.reduce((s, m) => s + (m.grade! * m.ects), 0);
  const sumEcts = graded.reduce((s, m) => s + m.ects, 0);
  return sumEcts > 0 ? Math.round((sumWeighted / sumEcts) * 100) / 100 : null;
}

const labelClass: Record<string, string> = {
  Demo: 'badge-warn',
  lokal: 'badge-code',
  importiert: 'badge-ok',
  manuell: 'badge-cond',
};

export default function PassedModulesTable() {
  const { student } = useApp();
  const passed = student.passedModules;

  const avg = calcWeightedAverage(passed);
  const gradedEcts = passed.filter(m => m.grade != null).reduce((s, m) => s + m.ects, 0);
  const ungradedEcts = passed.filter(m => m.grade == null).reduce((s, m) => s + m.ects, 0);

  return (
    <div className="page">
      <h1>Bestandene Module</h1>
      <p className="source-note">
        Quelle: <strong>dummy_student.json / AppContext</strong> · Noten sind Demo-Werte.
        <span className="badge badge-warn" style={{ marginLeft: 8 }}>Demo</span>
      </p>
      <p className="assumption-note">
        Berechnung basiert auf importierten/lokalen Demo-Daten und ersetzt keine offizielle PRIMUSS-Berechnung.
      </p>

      {/* Zusammenfassung */}
      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label">Bestandene Module</div>
          <div className="card-value highlight">{passed.length}</div>
        </div>
        <div className="card">
          <div className="card-label">Bestandene ECTS</div>
          <div className="card-value highlight">{student.completedEcts}</div>
        </div>
        <div className="card">
          <div className="card-label">Gewichteter Notenschnitt</div>
          <div className="card-value highlight">
            {avg != null ? avg.toFixed(2) : '–'}
            {avg == null && <span className="badge badge-warn" style={{ marginLeft: 6 }}>keine Noten</span>}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Benotete ECTS</div>
          <div className="card-value">{gradedEcts}</div>
        </div>
        <div className="card">
          <div className="card-label">Unbenotete ECTS</div>
          <div className="card-value">{ungradedEcts}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Modul</th>
            <th>Code</th>
            <th>Semester</th>
            <th>ECTS</th>
            <th>Note</th>
            <th>Versuch</th>
            <th>Gewichtung</th>
            <th>Status</th>
            <th>Datenquelle</th>
          </tr>
        </thead>
        <tbody>
          {passed.map((m, i) => {
            const weighted = m.grade != null
              ? `${(m.grade * m.ects).toFixed(1)} Pkt`
              : '–';
            return (
              <tr key={m.code}>
                <td>{i + 1}</td>
                <td>{m.module}</td>
                <td><span className="badge badge-code">{m.code}</span></td>
                <td>{m.semester}</td>
                <td>{m.ects}</td>
                <td>
                  {m.grade != null
                    ? <strong>{m.grade.toFixed(1)}</strong>
                    : <span className="badge badge-cond">keine Note</span>}
                </td>
                <td>{m.attemptCount ?? '–'}</td>
                <td>{weighted}</td>
                <td><span className="badge badge-ok">{m.status}</span></td>
                <td>
                  <span className={`badge ${labelClass[m.dataLabel ?? ''] ?? 'badge-code'}`}>
                    {m.dataLabel ?? 'lokal'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        {avg != null && (
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Gesamt</strong></td>
              <td>–</td>
              <td><strong>{student.completedEcts}</strong></td>
              <td><strong>{avg.toFixed(2)}</strong></td>
              <td colSpan={4} style={{ color: '#546e7a', fontSize: '0.78rem' }}>
                Gewichteter Durchschnitt über {gradedEcts} ECTS
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
