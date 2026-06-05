import { getSources } from '../services/knowledgeService';

const statusClass: Record<string, string> = {
  'gelesen': 'badge-ok',
  'teilweise gelesen': 'badge-warn',
  'nicht lesbar': 'badge-blocked',
  'manuell zu prüfen': 'badge-cond',
  'gefunden': 'badge-code',
};

const confClass: Record<string, string> = {
  'hoch': 'badge-ok',
  'mittel': 'badge-warn',
  'niedrig': 'badge-blocked',
  'manuell zu prüfen': 'badge-cond',
};

export default function KnowledgeSources() {
  const sources = getSources();

  return (
    <div className="page">
      <h1>Knowledge- und Datenquellenübersicht</h1>
      <p className="source-note">
        Ordner: <strong>inhalte/</strong> – Alle gefundenen Dateien mit ihrem Auslesestatus.
      </p>
      <p>
        Diese Übersicht zeigt transparent, welche Dateien gefunden wurden, was ausgelesen werden
        konnte und was manuell geprüft werden muss. Die App erfindet keine Daten.
      </p>

      <table>
        <thead>
          <tr>
            <th>Dateiname</th>
            <th>Typ</th>
            <th>Zweck / Rolle</th>
            <th>Priorität</th>
            <th>Status</th>
            <th>Konfidenz</th>
            <th>Erkannte Inhalte</th>
            <th>Hinweise</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>{s.fileName}</strong>
              </td>
              <td>
                <span className="badge badge-code">{s.fileType}</span>
              </td>
              <td>{s.purpose}</td>
              <td>{s.priority}</td>
              <td>
                <span className={`badge ${statusClass[s.status] ?? 'badge-code'}`}>
                  {s.status}
                </span>
              </td>
              <td>
                <span className={`badge ${confClass[s.confidence] ?? 'badge-code'}`}>
                  {s.confidence}
                </span>
              </td>
              <td>
                <ul className="info-list">
                  {s.extractedInformation.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </td>
              <td>{s.notes ?? '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-box">
        <strong>Erklärung der Dateistatuse:</strong>
        <ul>
          <li>
            <span className="badge badge-ok">gelesen</span> – Vollständig maschinenlesbar,
            alle Inhalte in der App verarbeitet
          </li>
          <li>
            <span className="badge badge-warn">teilweise gelesen</span> – Kerninhalte in JSON
            übernommen; vollständiger Originaltext oder eingebettete Bilder nicht auslesbar
          </li>
          <li>
            <span className="badge badge-cond">manuell zu prüfen</span> – Datei wurde
            gefunden, konnte aber nicht automatisch ausgelesen werden
          </li>
        </ul>
      </div>
    </div>
  );
}
