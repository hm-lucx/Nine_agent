import { getRecommendedModules } from '../services/knowledgeService';
import { useApp } from '../context/AppContext';

const typeColors: Record<string, string> = {
  'Pflichtmodul': 'badge-pflicht',
  'Pflichtmodul Studienrichtung TEC': 'badge-tec',
  'WPM': 'badge-wpm',
  'AW': 'badge-aw',
};

export default function RecommendationTable() {
  const { planningParams, isModified } = useApp();
  const allRecs = getRecommendedModules();
  // Dynamisch: gesperrte Tage aus planningParams berücksichtigen
  const recs = allRecs.filter(r =>
    !planningParams.blockedDays.some(d => r.day.toLowerCase().includes(d.toLowerCase()))
  );
  const totalEcts = recs.reduce((s, r) => s + r.ects, 0);
  const removedCount = allRecs.length - recs.length;

  return (
    <div className="page">
      <h1>Empfehlung – SoSe 2026</h1>
      <p className="source-note">
        Quelle: <strong>recommended_schedule_example.json</strong> +{' '}
        <strong>knowledge_base.json</strong> (Konfidenz: hoch)
      </p>
      {isModified && removedCount > 0 && (
        <div className="assumption-note">
          {removedCount} Module aus der Beispiel-Empfehlung wurden aufgrund deiner gesperrten Tage ausgeblendet.
        </div>
      )}
      <p>
        Gesamte empfohlene ECTS: <strong className="highlight">{totalEcts} ECTS</strong>
        {totalEcts < 30 && (
          <span className="warn-inline">
            {' '}(Ziel ca. 30 ECTS – 2 offene Module am Montag nicht belegbar; manuelle Nachprüfung erforderlich)
          </span>
        )}
      </p>

      <div className="assumption-note">
        Sprint 1: Empfehlung basiert auf <strong>recommended_schedule_example.json</strong>.
        Automatische Regelprüfung folgt in Sprint 2.
      </div>

      <table>
        <thead>
          <tr>
            <th>Modul</th>
            <th>Typ</th>
            <th>Semester</th>
            <th>Gruppe</th>
            <th>Tag</th>
            <th>Uhrzeit</th>
            <th>ECTS</th>
            <th>Begründung</th>
            <th>Quelle</th>
            <th>Hinweise</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.moduleTitle}</strong>
              </td>
              <td>
                <span className={`badge ${typeColors[r.type] ?? 'badge-code'}`}>
                  {r.type}
                </span>
              </td>
              <td>{r.semester ?? '–'}</td>
              <td>{r.group ?? '–'}</td>
              <td>{r.day}</td>
              <td>{r.timeRaw ?? '–'}</td>
              <td>
                <strong>{r.ects}</strong>
              </td>
              <td>{r.reason}</td>
              <td>{r.source}</td>
              <td>
                {r.warnings && r.warnings.length > 0 ? (
                  <span className="badge badge-warn">{r.warnings.join('; ')}</span>
                ) : (
                  <span className="badge badge-ok">keine</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
