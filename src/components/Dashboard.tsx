import { useApp } from '../context/AppContext';
import { flattenModules } from '../services/nineApiDiscoveryService';

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function calcWeightedAvg(mods: { ects: number; grade?: number }[]) {
  const g = mods.filter(m => m.grade != null && m.ects > 0);
  if (!g.length) return null;
  const sum = g.reduce((s, m) => s + m.grade! * m.ects, 0);
  const ects = g.reduce((s, m) => s + m.ects, 0);
  return ects > 0 ? Math.round(sum / ects * 100) / 100 : null;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function DataCard({ label, value, highlight, badge }: {
  label: string; value: string | number | null | undefined;
  highlight?: boolean; badge?: { text: string; cls: string };
}) {
  const display = value === null || value === undefined || value === '' ? 'Nicht erkannt' : String(value);
  const isUnknown = display === 'Nicht erkannt';
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      {badge ? (
        <div className="card-value"><span className={`badge ${badge.cls}`}>{badge.text}</span></div>
      ) : (
        <div className={`card-value ${highlight ? 'highlight' : ''} ${isUnknown ? 'source-note' : ''}`}
          style={isUnknown ? { fontStyle: 'italic', color: '#94a3b8' } : {}}>
          {display}
        </div>
      )}
    </div>
  );
}

const BADGE_FOR_SOURCE: Record<string, { label: string; cls: string; bg: string }> = {
  demo:           { label: 'Demo-Profil (Jonas Weber)', cls: 'badge-code', bg: '#fef3c7' },
  primuss_import: { label: 'Importiertes Profil', cls: 'badge-ok', bg: '#d1fae5' },
  manual:         { label: 'Manuell eingegeben', cls: 'badge-api', bg: '#dbeafe' },
  mixed:          { label: 'Gemischtes Profil', cls: 'badge-warn', bg: '#fce7f3' },
};

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    student, planningParams, isModified, nineReport, lastPlannerUpdate,
    lastProfileUpdate, profileSourceType, apiStatus, isLoadingApi,
    scenarios, importedMeta, importedGradeStats, resetToDemo,
  } = useApp();

  const isDemo = profileSourceType === 'demo';
  const src = BADGE_FOR_SOURCE[profileSourceType] ?? BADGE_FOR_SOURCE.demo;
  const avg = calcWeightedAvg(student.passedModules);
  const activeScenario = scenarios.find(s => s.id === 'scenario-a') ?? scenarios[0];
  const nineModules = nineReport ? flattenModules(nineReport) : [];

  // NINE-Daten je Stage
  const nineByStage = new Map<number, number>();
  for (const m of nineModules) {
    nineByStage.set(m.stage, (nineByStage.get(m.stage) ?? 0) + 1);
  }
  const passedBySem = new Map<number, number>();
  for (const m of student.passedModules) {
    if (m.semester) passedBySem.set(m.semester, (passedBySem.get(m.semester) ?? 0) + 1);
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {/* Profil-Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', background: src.bg, borderRadius: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span className={`badge ${src.cls}`}>{src.label}</span>
        {isDemo && (
          <span style={{ fontSize: '0.8rem', color: '#92400e' }}>
            Lade ein Notenblatt hoch oder gib Leistungen ein, um ein echtes Profil zu erstellen.
          </span>
        )}
        {!isDemo && lastProfileUpdate && (
          <span style={{ fontSize: '0.78rem', color: '#065f46' }}>
            Aktualisiert: {fmtDate(lastProfileUpdate)}
          </span>
        )}
        {isModified && <span className="badge badge-warn" style={{ marginLeft: 4 }}>Angepasst</span>}
        {isLoadingApi && <span className="badge badge-api">⟳ API lädt…</span>}
        {!isDemo && (
          <button className="btn-secondary" style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '2px 8px' }}
            onClick={resetToDemo}>
            Demo laden
          </button>
        )}
      </div>

      {/* Stammdaten (aus Notenblatt oder Demo) */}
      <h2>Studentendaten</h2>
      <div className="card-grid">
        <DataCard label="Name" value={isDemo ? student.name : (importedMeta?.name ?? null)} />
        <DataCard label="Geburtsdatum" value={isDemo ? null : (importedMeta?.birthDate ?? null)} />
        <DataCard label="Geburtsort" value={isDemo ? null : (importedMeta?.birthPlace ?? null)} />
        <DataCard label="Studiengang" value={student.studyProgram} />
        <DataCard label="Studienrichtung" value={planningParams.specialization} />
        <DataCard label="Fachsemester" value={isDemo ? planningParams.currentSemester : (importedMeta?.currentSemester ?? planningParams.currentSemester)} />
        <DataCard label="Studiengruppe" value={isDemo ? null : (importedMeta?.studyGroup ?? null)} />
        <DataCard label="Matrikelnummer" value={isDemo ? student.matriculationNumber : (importedMeta?.matriculationNumber ?? null)} />
        <DataCard label="Semesterkontext" value={planningParams.semesterContext} />
        <DataCard label="Gesperrte Tage" value={planningParams.blockedDays.join(', ') || '–'} />
      </div>

      {/* ECTS & Noten */}
      <h2>ECTS & Noten</h2>
      <div className="card-grid">
        <DataCard label="Bestandene ECTS" value={`${student.completedEcts} ECTS`} highlight />
        <DataCard label="Ziel-ECTS / Sem." value={`${planningParams.targetEcts} ECTS`} highlight />
        <DataCard label="Bestandene Module" value={student.passedModules.length} highlight />
        <DataCard label="Benotete ECTS" value={`${importedGradeStats?.gradedEcts ?? student.passedModules.filter(m=>m.grade!=null).reduce((s,m)=>s+m.ects,0)} ECTS`} />
        <DataCard label="Unbenotete ECTS" value={`${importedGradeStats?.ungradedEcts ?? 0} ECTS`} />
        <div className="card">
          <div className="card-label">Berechneter Schnitt</div>
          <div className={`card-value highlight`}>{avg != null ? avg.toFixed(2) : '–'}</div>
        </div>
        {importedGradeStats?.importedAverage && (
          <div className="card">
            <div className="card-label">Importierter Schnitt</div>
            <div className="card-value highlight">{importedGradeStats.importedAverage.toFixed(2)}</div>
          </div>
        )}
        {!isDemo && (
          <DataCard label="Praxissemester" value={
            importedMeta?.internshipDone === true ? `Ja${importedMeta.internshipLocation ? ` (${importedMeta.internshipLocation})` : ''}`
            : importedMeta?.internshipDone === false ? 'Nein'
            : null
          } />
        )}
      </div>

      {importedGradeStats?.mismatchWarning && (
        <div className="assumption-note">⚠ {importedGradeStats.mismatchWarning}</div>
      )}
      {importedMeta?.warnings.map((w, i) => (
        <div key={i} className="assumption-note">⚠ {w}</div>
      ))}

      {/* Aktives Szenario */}
      {activeScenario && (
        <>
          <h2>Aktives Szenario – {activeScenario.scenarioName}</h2>
          <div className="card-grid">
            <DataCard label="Empfohlene Module" value={activeScenario.modules.length} highlight />
            <DataCard label="Empfohlene ECTS" value={`${activeScenario.totalEcts} ECTS`} highlight />
            <DataCard label="Studientage" value={activeScenario.usedDays.join(', ') || '–'} />
            <DataCard label="Warnungen" value={activeScenario.warnings.length} />
            <DataCard label="Plan aktualisiert" value={fmtDate(lastPlannerUpdate)} />
            <div className="card">
              <div className="card-label">Datenquelle</div>
              <div className="card-value">
                <span className={`badge ${activeScenario.dataSource === 'api' ? 'badge-ok' : activeScenario.dataSource === 'mixed' ? 'badge-warn' : 'badge-code'}`}>
                  {activeScenario.dataSource === 'api' ? 'NINE API (live)' : activeScenario.dataSource === 'mixed' ? 'API + lokal' : 'Lokal (Fallback)'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Semesterstatus 1–7 */}
      <h2>Semesterstatus (Semester 1–7)</h2>
      <p className="source-note">
        {nineReport ? `NINE API: ${nineReport.totalModules} Module geladen.` : 'NINE API nicht geladen – Lokal-Fallback aktiv.'}
        {' '}Bestandene Module aus {isDemo ? 'Demo-Profil' : 'importiertem Profil'}.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5, 6, 7].map(sem => {
          const nineCount = nineByStage.get(sem) ?? 0;
          const passedCount = passedBySem.get(sem) ?? 0;
          const hasNine = nineCount > 0;
          const status = passedCount > 0 && passedCount >= nineCount && nineCount > 0 ? 'abgeschlossen'
            : passedCount > 0 ? 'teilweise'
            : !hasNine ? (nineReport ? 'api-leer' : 'kein-api')
            : 'offen';
          const statusInfo = {
            abgeschlossen: { cls: 'sem-done', icon: '✓', label: 'Abgeschlossen' },
            teilweise:     { cls: 'sem-partial', icon: '◑', label: 'Teilweise' },
            offen:         { cls: 'sem-open', icon: '○', label: 'Offen' },
            'api-leer':    { cls: 'sem-nodata', icon: '!', label: 'API leer' },
            'kein-api':    { cls: 'sem-nodata', icon: '?', label: 'API nicht geladen' },
          }[status] ?? { cls: 'sem-open', icon: '?', label: '?' };
          return (
            <div key={sem} className={`sem-card ${statusInfo.cls}`} title={hasNine ? `${nineCount} Module in NINE, ${passedCount} bestanden` : 'Keine NINE-Daten'}>
              <div className="sem-name">Sem. {sem}</div>
              <div className="sem-icon">{statusInfo.icon}</div>
              <div className="sem-label">{statusInfo.label}</div>
              <div className="sem-progress">
                {hasNine ? `${passedCount}/${nineCount}` : sem >= 5 ? <span style={{ color: '#f59e0b' }}>API prüfen</span> : '–'}
              </div>
              <div className="sem-source" style={{ fontSize: '0.65rem' }}>
                {hasNine ? 'NINE' : 'kein Angebot'}
              </div>
            </div>
          );
        })}
      </div>

      {/* NINE API Status */}
      <h2>NINE API</h2>
      <div className="card-grid">
        <div className="card">
          <div className="card-label">Verbindung</div>
          <div className="card-value">
            <span className={`badge ${apiStatus.connected ? 'badge-ok' : 'badge-blocked'}`}>
              {apiStatus.connected ? '✓ Verbunden' : '✗ Nicht verbunden'}
            </span>
          </div>
        </div>
        <DataCard label="Geladene Module" value={nineReport?.totalModules ?? 0} />
        <DataCard label="Module mit Terminen" value={nineReport?.modulesWithSchedule ?? 0} />
        <DataCard label="Letzte Diagnose" value={nineReport ? fmtDate(nineReport.testedAt) : null} />
      </div>
    </div>
  );
}
