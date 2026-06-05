import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { flattenModules } from '../services/nineApiDiscoveryService';
import { computeOpenModules } from '../services/performanceMatchingService';
import { modules as localModules } from '../data/modules';
import { normalizeModuleName } from '../utils/stringSimilarity';

type FilterMode = 'all' | 'offen' | 'bestanden' | 'blocked' | 'no_schedule';

export default function OpenModules() {
  const { nineReport, student, planningParams } = useApp();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [groupByStage, setGroupByStage] = useState(true);

  const nineModules = nineReport ? flattenModules(nineReport) : [];

  const passedCodes = useMemo(() => new Set(student.passedModules.map(m => m.code?.toUpperCase())), [student.passedModules]);
  const passedTitles = useMemo(() => new Set(student.passedModules.map(m => normalizeModuleName(m.module))), [student.passedModules]);

  const entries = useMemo(() => {
    if (nineModules.length > 0) {
      return computeOpenModules(nineModules, passedCodes, passedTitles, planningParams);
    }
    // Fallback: lokale Module
    return localModules.map(m => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nineModule: {
        id: m.id, moduleTag: m.moduleCode, moduleName: m.title, subjectTag: '',
        subjectName: '', moduleType: m.type, stage: m.semester ?? 0,
        curriculum: 'WI', term: planningParams.semesterContext,
        courses: [], exams: [], raw: {} as any, source: 'NINE_API' as const, hasSchedule: false,
      } as Parameters<typeof computeOpenModules>[0][0],
      status: passedCodes.has(m.moduleCode.toUpperCase()) ? 'bestanden' as const : 'offen' as const,
      reasons: ['Fallback: lokale Daten'],
    }));
  }, [nineModules, passedCodes, passedTitles, planningParams]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'offen':       return entries.filter(e => e.status === 'offen');
      case 'bestanden':   return entries.filter(e => e.status === 'bestanden');
      case 'blocked':     return entries.filter(e => e.status === 'blocked');
      case 'no_schedule': return entries.filter(e => e.status === 'no_schedule');
      default:            return entries;
    }
  }, [entries, filter]);

  // Gruppierung nach Stage
  const groups = useMemo(() => {
    if (!groupByStage) return { 0: filtered };
    const g: Record<number, typeof filtered> = {};
    for (const e of filtered) {
      const stage = e.nineModule.stage;
      if (!g[stage]) g[stage] = [];
      g[stage].push(e);
    }
    return g;
  }, [filtered, groupByStage]);

  const counts = {
    offen: entries.filter(e => e.status === 'offen').length,
    bestanden: entries.filter(e => e.status === 'bestanden').length,
    blocked: entries.filter(e => e.status === 'blocked').length,
    no_schedule: entries.filter(e => e.status === 'no_schedule').length,
  };

  const statusBadge: Record<string, string> = {
    offen: 'badge-warn', bestanden: 'badge-ok', blocked: 'badge-blocked', no_schedule: 'badge-code',
  };
  const statusLabel: Record<string, string> = {
    offen: 'offen', bestanden: 'bestanden', blocked: 'gesperrt (Arbeitstag)', no_schedule: 'kein Termin',
  };

  return (
    <div className="page">
      <h1>Offene Module</h1>
      <p className="source-note">
        {nineModules.length > 0
          ? `NINE API: ${nineModules.length} Module geladen (Sem. 1–7). Bestandene Module aus aktuellem Profil abgezogen.`
          : 'NINE API nicht geladen – Lokal-Fallback aktiv.'}
      </p>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {(['all', 'offen', 'bestanden', 'blocked', 'no_schedule'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '3px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: filter === f ? 700 : 400,
              background: filter === f ? '#1e3a8a' : '#e2e8f0', color: filter === f ? '#fff' : '#374151' }}>
            {f === 'all' ? `Alle (${entries.length})` : f === 'offen' ? `Offen (${counts.offen})` : f === 'bestanden' ? `Bestanden (${counts.bestanden})` : f === 'blocked' ? `Gesperrt (${counts.blocked})` : `Kein Termin (${counts.no_schedule})`}
          </button>
        ))}
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
          <input type="checkbox" checked={groupByStage} onChange={e => setGroupByStage(e.target.checked)} />
          Nach Semester gruppieren
        </label>
      </div>

      {/* Liste */}
      {Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b)).map(([stage, items]) => (
        <div key={stage} style={{ marginBottom: '1rem' }}>
          {groupByStage && <h3 style={{ marginBottom: '0.4rem', color: '#1e3a8a', fontSize: '0.95rem' }}>Semester {stage === '0' ? '?' : stage}</h3>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((e, i) => {
              const m = e.nineModule;
              const firstAppt = m.courses[0]?.appointments[0];
              return (
                <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusBadge[e.status]}`} style={{ fontSize: '0.7rem' }}>{statusLabel[e.status]}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.moduleName}</span>
                  {m.moduleTag && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.moduleTag}</span>}
                  {firstAppt && (
                    <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                      {firstAppt.dayDe ?? ''} {firstAppt.startTime ?? ''}{firstAppt.endTime ? `–${firstAppt.endTime}` : ''}
                      {firstAppt.room ? `, ${firstAppt.room}` : ''}
                      {firstAppt.lecturer ? `, ${firstAppt.lecturer}` : ''}
                    </span>
                  )}
                  {e.reasons.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#d97706' }}>{e.reasons.join(' / ')}</span>
                  )}
                  <span className="badge badge-code" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>
                    {nineModules.length > 0 ? 'NINE' : 'lokal'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="info-box">Keine Module in dieser Filteransicht.</div>
      )}
    </div>
  );
}
