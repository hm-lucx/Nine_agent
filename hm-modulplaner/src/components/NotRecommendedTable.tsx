import { useApp } from '../context/AppContext';
import { getNotRecommendedModules as staticNotRec } from '../services/knowledgeService';
import { checkProgressionRules } from '../services/ruleEngine';
import { scheduleEntries } from '../data/schedule';
import { rules } from '../data/rules';
import type { NotRecommendedModule } from '../types';

const severityClass: Record<string, string> = {
  gesperrt: 'badge-blocked',
  Warnung: 'badge-warn',
  'bedingt möglich': 'badge-cond',
};

export default function NotRecommendedTable() {
  const { student, planningParams } = useApp();
  const passedCodes = new Set(student.passedModules.map(m => m.code));
  const { sem3Allowed, sem4Allowed, reasons } = checkProgressionRules(student, rules);

  // Dynamisch: statische Liste + dynamische Regeln
  const staticItems = staticNotRec();
  const dynamic: NotRecommendedModule[] = [];

  // Gesperrte Tage aus planningParams
  for (const entry of scheduleEntries) {
    if (passedCodes.has(entry.moduleCode)) continue;
    const isBlocked = planningParams.blockedDays.some(d => entry.day.toLowerCase().includes(d.toLowerCase()));
    if (isBlocked && entry.availableForDummy !== false) {
      // Nur hinzufügen wenn nicht schon in statischer Liste
      if (!staticItems.some(s => s.moduleCode === entry.moduleCode)) {
        dynamic.push({
          id: `dyn-day-${entry.id}`,
          moduleCode: entry.moduleCode,
          moduleTitle: entry.moduleTitle,
          reason: `Termin am ${entry.day} – gesperrter Arbeitstag (aus Planungsparametern).`,
          affectedRule: 'R6 – Gesperrte Arbeitstage',
          source: 'planningParams + ' + entry.source,
          severity: 'gesperrt',
        });
      }
    }
  }

  // Vorrückungsregeln
  if (!sem3Allowed) {
    dynamic.push({
      id: 'dyn-sem3',
      moduleCode: 'SEM3-ALL',
      moduleTitle: 'Alle Module des 3. Semesters',
      reason: `Vorrückungsregel nicht erfüllt: ${reasons.join('; ')}`,
      affectedRule: 'R2 – Vorrückung ins 3. Semester',
      source: 'rules.json / ruleEngine',
      severity: 'gesperrt',
    });
  }
  if (!sem4Allowed) {
    dynamic.push({
      id: 'dyn-sem4',
      moduleCode: 'SEM4-ALL',
      moduleTitle: 'Alle Module des 4. Semesters',
      reason: `Vorrückungsregel nicht erfüllt: ${reasons.join('; ')}`,
      affectedRule: 'R2 – Vorrückung ins 4. Semester',
      source: 'rules.json / ruleEngine',
      severity: 'gesperrt',
    });
  }

  // Sem 5–7: keine Termindaten
  dynamic.push({
    id: 'dyn-sem57',
    moduleCode: 'SEM5-7',
    moduleTitle: 'Module Semester 5–7',
    reason: 'Keine gesicherten Termindaten in lokaler Knowledge-Basis. NINE API-Abfrage erforderlich.',
    affectedRule: 'Datenbasis',
    source: 'Studienplan_WI_B(1).pdf – unvollständig',
    severity: 'Warnung',
  });

  const allItems = [
    ...staticItems.filter(s => !dynamic.some(d => d.moduleCode === s.moduleCode)),
    ...dynamic,
  ];

  return (
    <div className="page">
      <h1>Nicht belegbare Module</h1>
      <p className="source-note">
        Dynamisch berechnet aus: Planungsparametern (gesperrte Tage) · Vorrückungsregeln · knowledge_base.json · rules.json
      </p>
      <p className="assumption-note">
        Gesperrte Tage (aktuelle Planungsparameter): <strong>{planningParams.blockedDays.join(', ') || 'keine'}</strong>
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
          {allItems.map((m) => (
            <tr key={m.id}>
              <td>{m.moduleTitle}</td>
              <td><span className="badge badge-code">{m.moduleCode}</span></td>
              <td>{m.reason}</td>
              <td>{m.affectedRule ?? '–'}</td>
              <td style={{ fontSize: '0.8rem' }}>{m.source}</td>
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
          <li><span className="badge badge-blocked">gesperrt</span> – Modul kann definitiv nicht belegt werden</li>
          <li><span className="badge badge-cond">bedingt möglich</span> – Modul könnte bei angepasstem Stundenplan belegbar sein</li>
          <li><span className="badge badge-warn">Warnung</span> – Hinweis auf mögliche Einschränkung oder fehlende Daten</li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Hinweis:</strong> Die Liste wird dynamisch aus den aktuellen Planungsparametern berechnet.
          Änderungen an gesperrten Tagen wirken sich sofort auf diese Liste aus.
        </p>
      </div>
    </div>
  );
}
