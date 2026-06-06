import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { runDiscovery, flattenModules, defaultCurriculum, defaultTerm, apiBaseUrl } from '../services/nineApiDiscoveryService';
import type { DiagnosticResult, NineDataMode } from '../types/nineApi';

const STATUS_META: Record<string, { cls: string; icon: string; label: string }> = {
  ok:      { cls: 'badge-ok',      icon: '✓', label: 'OK' },
  empty:   { cls: 'badge-warn',    icon: '○', label: 'Leer' },
  error:   { cls: 'badge-blocked', icon: '✗', label: 'Fehler' },
  cors:    { cls: 'badge-blocked', icon: '⊗', label: 'CORS blockiert' },
  auth:    { cls: 'badge-blocked', icon: '🔒', label: 'Auth nötig' },
  pending: { cls: 'badge-code',    icon: '…', label: 'Ausstehend' },
  skipped: { cls: 'badge-code',    icon: '–', label: 'Übersprungen' },
};

const MODE_META: Record<NineDataMode, { cls: string; label: string }> = {
  live_nine:      { cls: 'badge-ok',      label: 'Live NINE API' },
  partial_nine:   { cls: 'badge-warn',    label: 'NINE API teilweise verfügbar' },
  local_fallback: { cls: 'badge-blocked', label: 'Fallback lokale Daten' },
  manual_only:    { cls: 'badge-code',    label: 'Manuell' },
};

function DiagRow({ d }: { d: DiagnosticResult }) {
  const [showRaw, setShowRaw] = useState(false);
  const m = STATUS_META[d.status] ?? STATUS_META.pending;
  return (
    <>
      <tr>
        <td><code style={{ fontSize: '0.78rem' }}>{d.endpoint}</code></td>
        <td><span className={`badge ${m.cls}`}>{m.icon} {m.label}</span></td>
        <td>{d.httpCode ?? '–'}</td>
        <td>{d.durationMs} ms</td>
        <td>{d.itemCount}</td>
        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {d.errorMessage ?? '–'}
        </td>
        <td>
          {d.rawPreview && (
            <button className="btn-secondary" style={{ padding: '1px 6px', fontSize: '0.72rem' }}
              onClick={() => setShowRaw(v => !v)}>
              {showRaw ? 'hide' : 'raw'}
            </button>
          )}
        </td>
      </tr>
      {showRaw && d.rawPreview && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <pre style={{ margin: 0, padding: '0.5rem', background: '#1a1a2e', color: '#a5d6a7', fontSize: '0.72rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
              {d.rawPreview}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function NineApiDiagnostics() {
  const { nineReport, setNineReport, isLoadingApi } = useApp();
  const [running, setRunning] = useState(false);
  const [curriculum, setCurriculum] = useState(defaultCurriculum);
  const [term, setTerm] = useState(defaultTerm);

  const handleRun = async () => {
    setRunning(true);
    try {
      const report = await runDiscovery(curriculum, term);
      setNineReport(report);
    } finally {
      setRunning(false);
    }
  };

  const allModules = nineReport ? flattenModules(nineReport) : [];
  const withSchedule = allModules.filter(m => m.hasSchedule);

  return (
    <div className="page">
      <h1>NINE API Diagnose</h1>
      <p className="source-note">
        Swagger: <a href="https://nine.hm.edu/swagger/ui/index" target="_blank" rel="noopener noreferrer">https://nine.hm.edu/swagger/ui/index</a>
        &nbsp;· Base: <code>{apiBaseUrl}</code>
      </p>

      {/* Konfiguration */}
      <div className="params-grid" style={{ marginBottom: '1rem' }}>
        <div className="params-card">
          <h3>Test-Parameter</h3>
          <div className="ects-row">
            <label>
              Curriculum (z. B. WI)
              <input type="text" value={curriculum} onChange={e => setCurriculum(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #c5cae9', borderRadius: 4 }} />
            </label>
            <label>
              Semester (z. B. SoSe 2026)
              <input type="text" value={term} onChange={e => setTerm(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #c5cae9', borderRadius: 4 }} />
            </label>
          </div>
        </div>
      </div>

      <div className="params-actions">
        <button className="btn-primary" onClick={handleRun} disabled={running || isLoadingApi}>
          {running ? '⟳ Diagnose läuft…' : '▶ Diagnose starten'}
        </button>
      </div>

      {/* Übersicht */}
      {nineReport && (
        <>
          <h2 style={{ marginTop: '1.5rem' }}>Ergebnis</h2>
          <div className="card-grid">
            <div className="card">
              <div className="card-label">Datenmodus</div>
              <div className="card-value">
                <span className={`badge ${MODE_META[nineReport.dataMode]?.cls ?? 'badge-code'}`}>
                  {MODE_META[nineReport.dataMode]?.label ?? nineReport.dataMode}
                </span>
              </div>
            </div>
            <div className="card">
              <div className="card-label">CORS</div>
              <div className="card-value">
                <span className={`badge ${nineReport.corsBlocked ? 'badge-blocked' : 'badge-ok'}`}>
                  {nineReport.corsBlocked ? '⊗ CORS blockiert' : '✓ Kein CORS-Problem'}
                </span>
              </div>
            </div>
            <div className="card">
              <div className="card-label">Module (gesamt)</div>
              <div className="card-value highlight">{nineReport.totalModules}</div>
            </div>
            <div className="card">
              <div className="card-label">Mit Terminplanung</div>
              <div className="card-value highlight">{nineReport.modulesWithSchedule}</div>
            </div>
            <div className="card">
              <div className="card-label">Semester in API</div>
              <div className="card-value">{nineReport.semesters.length}</div>
            </div>
            <div className="card">
              <div className="card-label">Organisationen</div>
              <div className="card-value">{nineReport.organisers.length}</div>
            </div>
            <div className="card">
              <div className="card-label">Diagnose gestartet</div>
              <div className="card-value" style={{ fontSize: '0.8rem' }}>
                {new Date(nineReport.testedAt).toLocaleString('de-DE')}
              </div>
            </div>
          </div>

          <div className={`assumption-note ${nineReport.corsBlocked ? '' : 'info-box'}`} style={{ marginTop: '0.75rem', borderColor: nineReport.corsBlocked ? '#dc2626' : undefined }}>
            {nineReport.summary}
            {nineReport.corsBlocked && (
              <span> <strong>Lösung:</strong> lokalen Proxy einrichten oder direkt im HM-Netz testen.</span>
            )}
          </div>

          {/* Endpoint-Tabelle */}
          <h2>Getestete Endpoints</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>HTTP</th>
                  <th>Dauer</th>
                  <th>Einträge</th>
                  <th>Fehler</th>
                  <th>Raw</th>
                </tr>
              </thead>
              <tbody>
                {nineReport.results.map((d, i) => <DiagRow key={i} d={d} />)}
              </tbody>
            </table>
          </div>

          {/* Module mit Terminen */}
          {withSchedule.length > 0 && (
            <>
              <h2>Module mit Terminplanung ({withSchedule.length})</h2>
              <table>
                <thead>
                  <tr><th>Stage</th><th>Tag</th><th>Modul</th><th>Kurs</th><th>Wochentag</th><th>Uhrzeit</th><th>Raum</th><th>Dozent</th></tr>
                </thead>
                <tbody>
                  {withSchedule.map(m =>
                    m.courses.flatMap(c =>
                      c.appointments.map((a, ai) => (
                        <tr key={`${m.id}-${c.id}-${ai}`}>
                          <td>{m.stage}</td>
                          <td><span className="badge badge-pflicht">{m.moduleTag}</span></td>
                          <td>{m.moduleName}</td>
                          <td>{c.courseName}</td>
                          <td>{a.dayDe}</td>
                          <td>{a.startTime}–{a.endTime}</td>
                          <td>{a.room ?? '–'}</td>
                          <td style={{ fontSize: '0.8rem' }}>{a.lecturer ?? '–'}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* Alle Module nach Stage */}
          <h2>Geladene Module nach Stage</h2>
          {[1, 2, 3, 4, 5, 6, 7].map(stage => {
            const mods = nineReport.modulesByStage[stage] ?? [];
            if (mods.length === 0) return null;
            // Dedupliziere nach moduleTag
            const seen = new Set<string>();
            const unique = mods.filter(m => {
              if (seen.has(m.moduleTag)) return false;
              seen.add(m.moduleTag);
              return true;
            });
            return (
              <details key={stage} style={{ marginBottom: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '0.4rem 0' }}>
                  Stage {stage} – {unique.length} Module
                  {mods.some(m => m.hasSchedule) && <span className="badge badge-ok" style={{ marginLeft: 8 }}>mit Terminen</span>}
                </summary>
                <table style={{ marginTop: '0.5rem' }}>
                  <thead>
                    <tr><th>Tag</th><th>Modulname</th><th>SubjectTag</th><th>SubjectName</th><th>Kurse</th><th>Termine</th></tr>
                  </thead>
                  <tbody>
                    {unique.map(m => (
                      <tr key={m.id}>
                        <td><span className="badge badge-code">{m.moduleTag}</span></td>
                        <td>{m.moduleName}</td>
                        <td><code style={{ fontSize: '0.75rem' }}>{m.subjectTag}</code></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.subjectName || '–'}</td>
                        <td>{m.courses.length}</td>
                        <td>
                          {m.hasSchedule
                            ? <span className="badge badge-ok">{m.courses.reduce((s, c) => s + c.appointments.length, 0)} Termine</span>
                            : <span className="badge badge-code">–</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            );
          })}

          {/* Semester-Liste */}
          {nineReport.semesters.length > 0 && (
            <>
              <h2>Verfügbare Semester in API</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nineReport.semesters.slice(0, 10).map(s => (
                  <span key={s.semester_Id} className="badge badge-code">{s.semester_Id}</span>
                ))}
                {nineReport.semesters.length > 10 && (
                  <span className="badge badge-code">+{nineReport.semesters.length - 10} weitere</span>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!nineReport && !running && (
        <div className="info-box" style={{ marginTop: '1rem' }}>
          Noch keine Diagnose durchgeführt. Klicke „Diagnose starten" um alle NINE API Endpoints zu testen.
          <br /><strong>Wichtig:</strong> Im Browser kann CORS die direkten Anfragen blockieren. In diesem Fall wird der konkrete Fehler angezeigt.
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <strong>Konfiguration (.env.local):</strong>
        <pre style={{ fontSize: '0.8rem', margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>
{`VITE_NINE_API_BASE_URL=https://nine.hm.edu
VITE_NINE_API_MODE=live
VITE_NINE_CURRICULUM=WI
VITE_NINE_TERM=SoSe 2026
VITE_NINE_API_TOKEN=     # nur falls Auth benötigt`}
        </pre>
        <p style={{ marginTop: '0.5rem' }}><strong>CORS-Hinweis:</strong> Öffentliche GET-Endpoints der NINE API sind CORS-freigegeben. Falls Probleme auftreten, im HM-Netz oder mit lokalem Proxy testen.</p>
      </div>
    </div>
  );
}
