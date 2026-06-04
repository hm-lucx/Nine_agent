import { getRecommendedModules } from '../services/knowledgeService';
import { useApp } from '../context/AppContext';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const typeColors: Record<string, string> = {
  'Pflichtmodul': '#4a90d9',
  'Pflichtmodul Studienrichtung TEC': '#2e7d32',
  'WPM': '#f57c00',
  'AW': '#7b1fa2',
};

export default function ScheduleView() {
  const recs = getRecommendedModules();
  const { planningParams: { blockedDays } } = useApp();
  const student = { blockedDays };

  const dayMap: Record<string, typeof recs> = {};
  for (const day of DAYS) {
    dayMap[day] = [];
  }
  for (const r of recs) {
    const days = r.day.split('/').map((d) => d.trim());
    for (const day of days) {
      const matched = DAYS.find((d) => day.toLowerCase().includes(d.toLowerCase()));
      if (matched) {
        if (!dayMap[matched]) dayMap[matched] = [];
        dayMap[matched].push(r);
      }
    }
  }

  return (
    <div className="page">
      <h1>Stundenplan-Ansicht</h1>
      <p className="source-note">
        Quelle: <strong>recommended_schedule_example.json</strong> +{' '}
        <strong>knowledge_base.json</strong> (Konfidenz: hoch für Termine Di–Do, bedingt für Sa/So)
      </p>

      <div className="schedule-grid">
        {DAYS.map((day) => {
          const isBlocked = student.blockedDays.some((b) =>
            day.toLowerCase().includes(b.toLowerCase())
          );
          const entries = dayMap[day] ?? [];

          return (
            <div
              key={day}
              className={`schedule-day ${isBlocked ? 'schedule-day-blocked' : ''}`}
            >
              <div className="schedule-day-header">
                {day}
                {isBlocked && (
                  <span className="blocked-label">gesperrt (Arbeit)</span>
                )}
              </div>
              <div className="schedule-day-body">
                {entries.length === 0 ? (
                  <div className="schedule-empty">
                    {isBlocked ? '🔒 Arbeitstag' : '–'}
                  </div>
                ) : (
                  entries.map((e) => (
                    <div
                      key={e.id}
                      className="schedule-entry"
                      style={{ borderLeftColor: typeColors[e.type] ?? '#888' }}
                    >
                      <div className="sched-title">{e.moduleTitle}</div>
                      <div className="sched-time">{e.timeRaw}</div>
                      <div className="sched-type" style={{ color: typeColors[e.type] ?? '#888' }}>
                        {e.type}
                      </div>
                      <div className="sched-ects">{e.ects} ECTS</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="info-box" style={{ marginTop: '1.5rem' }}>
        <strong>Hinweise:</strong>
        <ul>
          <li>Montag und Freitag sind für Jonas gesperrte Arbeitstage.</li>
          <li>Termine für Sa/So stammen aus <em>knowledge_base.json</em> (Blockveranstaltungen – Konfidenz: hoch).</li>
          <li>Alle Zeiten stammen aus strukturierten JSON-Daten. Bitte <strong>Datenbank_Semestergruppen_TEC.pdf</strong> für finale Verifikation prüfen (manuell zu prüfen).</li>
        </ul>
      </div>
    </div>
  );
}
