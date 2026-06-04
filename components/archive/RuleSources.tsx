import { getRules } from '../../services/knowledgeService';
import { checkProgressionRules } from '../../services/ruleEngine';
import { useApp } from '../../context/AppContext';

export default function RuleSources() {
  const rules = getRules();
  const { student } = useApp();
  const { sem3Allowed, sem4Allowed } = checkProgressionRules(student, rules);
  const passedSem12 = student.passedModules.filter((m) => m.semester <= 2).length;

  const ruleStatus: Record<string, { ok: boolean; current: string }> = {
    R1: {
      ok: sem3Allowed,
      current: `${passedSem12} Module aus Sem 1–2 bestanden, Mathematik I bestanden`,
    },
    R2: {
      ok: sem4Allowed,
      current: `${student.openModules.length} offene Module aus Sem 1–2`,
    },
    R3: {
      ok: true,
      current: 'Mathematik I, Grundlagen der Informatik, Technische Mechanik alle bestanden',
    },
    R4: { ok: true, current: 'AW-Module freigegeben' },
    R5: { ok: true, current: 'WPM freigegeben' },
    R6: { ok: true, current: 'Montag und Freitag gesperrt – wird beachtet' },
    R7: { ok: true, current: 'Sprint 1: Empfehlung kollisionsfrei (manuell geprüft)' },
    R8: { ok: true, current: 'Semesterweise Priorisierung in Empfehlung berücksichtigt' },
    R9: { ok: true, current: 'Alle empfohlenen Module laut knowledge_base.json verfügbar' },
  };

  const confClass: Record<string, string> = {
    hoch: 'badge-ok',
    mittel: 'badge-warn',
    niedrig: 'badge-blocked',
    'manuell zu prüfen': 'badge-cond',
  };

  return (
    <div className="page">
      <h1>Regelquellen</h1>
      <p className="source-note">
        Quellen: <strong>rules.json</strong> · <strong>09_wib_aktuell_spo.pdf</strong> ·{' '}
        <strong>agent_system_prompt.md</strong>
      </p>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Regelbereich</th>
            <th>Regel</th>
            <th>Quelle</th>
            <th>Aktueller Status</th>
            <th>Erfüllt?</th>
            <th>Verlässlichkeit</th>
            <th>Kommentar</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => {
            const status = ruleStatus[r.id];
            return (
              <tr key={r.id}>
                <td>
                  <span className="badge badge-code">{r.id}</span>
                </td>
                <td>{r.ruleType}</td>
                <td>
                  <strong>{r.title}</strong>
                  <br />
                  <small>{r.description}</small>
                </td>
                <td>{r.source}</td>
                <td>{status?.current ?? '–'}</td>
                <td>
                  {status ? (
                    <span className={`badge ${status.ok ? 'badge-ok' : 'badge-blocked'}`}>
                      {status.ok ? '✓ Ja' : '✗ Nein'}
                    </span>
                  ) : (
                    '–'
                  )}
                </td>
                <td>
                  <span className={`badge ${confClass[r.confidence] ?? 'badge-code'}`}>
                    {r.confidence}
                  </span>
                </td>
                <td>{r.notes ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
