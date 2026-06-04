import { getNotRecommendedModules } from '../services/knowledgeService';

const severityClass: Record<string, string> = {
  gesperrt: 'badge-blocked',
  Warnung: 'badge-warn',
  'bedingt möglich': 'badge-cond',
};

export default function NotRecommendedTable() {
  const items = getNotRecommendedModules();

  return (
    <div className="page">
      <h1>Nicht belegbare Module</h1>
      <p className="source-note">
        Quelle: <strong>knowledge_base.json</strong> + <strong>dummy_student.json</strong> +{' '}
        <strong>rules.json</strong> (Konfidenz: hoch)
      </p>

      <table>
        <thead>
          <tr>
            <th>Modul</th>
            <th>Code</th>
            <th>Grund</th>
            <th>Betroffene Regel</th>
            <th>Quelle</th>
            <th>Schweregrad</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id}>
              <td>{m.moduleTitle}</td>
              <td>
                <span className="badge badge-code">{m.moduleCode}</span>
              </td>
              <td>{m.reason}</td>
              <td>{m.affectedRule ?? '–'}</td>
              <td>{m.source}</td>
              <td>
                <span className={`badge ${severityClass[m.severity] ?? 'badge-warn'}`}>
                  {m.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-box">
        <strong>Legende:</strong>
        <ul>
          <li>
            <span className="badge badge-blocked">gesperrt</span> – Modul kann definitiv nicht
            belegt werden (gesperrter Tag, fehlende Voraussetzung, Vorrückungsregel)
          </li>
          <li>
            <span className="badge badge-cond">bedingt möglich</span> – Modul könnte bei angepasstem
            Stundenplan oder alternativer Gruppe belegbar sein · manuelle Prüfung erforderlich
          </li>
          <li>
            <span className="badge badge-warn">Warnung</span> – Hinweis auf mögliche Einschränkung
          </li>
        </ul>
      </div>
    </div>
  );
}
