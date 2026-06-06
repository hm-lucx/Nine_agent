import { useApp } from '../context/AppContext';
import type { NineDataMode } from '../types/nineApi';

const MODE_META: Record<NineDataMode, { cls: string; icon: string; label: string; desc: string }> = {
  live_nine:      { cls: 'badge-ok',      icon: '●', label: 'Live NINE API', desc: 'Alle Moduldaten kommen direkt aus der NINE API' },
  partial_nine:   { cls: 'badge-warn',    icon: '◑', label: 'NINE API teilweise', desc: 'Teildaten aus NINE API, Rest aus lokalem Fallback' },
  local_fallback: { cls: 'badge-code',    icon: '○', label: 'Lokaler Fallback', desc: 'NINE API nicht geladen – lokale Knowledge-Daten als Basis' },
  manual_only:    { cls: 'badge-blocked', icon: '✎', label: 'Nur Manuell', desc: 'Keine API-Daten, nur manuelle Eingaben' },
};

export default function DataSourceStatus() {
  const { dataSourceMode, nineReport, primussImport, planningParams, apiStatus, lastPlannerUpdate, isLoadingApi, reloadNineData } = useApp();
  const meta = MODE_META[dataSourceMode] ?? MODE_META.local_fallback;

  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '–';

  return (
    <div className="page">
      <h1>Datenquellen & Status</h1>
      <p className="source-note">Transparenzübersicht: Woher kommen die aktuellen Daten?</p>

      {/* Aktueller Modus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fff', borderRadius: 10, border: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
        <div>
          <div style={{ fontWeight: 700 }}>
            <span className={`badge ${meta.cls}`}>{meta.label}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{meta.desc}</div>
        </div>
        {isLoadingApi && <span className="badge badge-api" style={{ marginLeft: 'auto' }}>⟳ API lädt…</span>}
      </div>

      <div className="card-grid">
        {/* NINE API */}
        <div className="card">
          <div className="card-label">NINE API</div>
          <div className="card-value">
            <span className={`badge ${nineReport && nineReport.totalModules > 0 ? 'badge-ok' : 'badge-code'}`}>
              {nineReport && nineReport.totalModules > 0
                ? `✓ ${nineReport.totalModules} Module geladen`
                : 'Nicht geladen'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {nineReport?.testedAt ? `Stand: ${fmtDate(nineReport.testedAt)}` : '–'}
          </div>
        </div>

        {/* Verbindung */}
        <div className="card">
          <div className="card-label">Verbindung</div>
          <div className="card-value">
            <span className={`badge ${apiStatus.connected ? 'badge-ok' : nineReport?.corsBlocked ? 'badge-blocked' : 'badge-code'}`}>
              {apiStatus.connected ? '✓ Verbunden' : nineReport?.corsBlocked ? '⊗ CORS blockiert' : '○ Nicht getestet'}
            </span>
          </div>
        </div>

        {/* PRIMUSS */}
        <div className="card">
          <div className="card-label">PRIMUSS / Notenblatt</div>
          <div className="card-value">
            <span className={`badge ${primussImport?.status === 'accepted' ? 'badge-ok' : primussImport?.status === 'parsed' ? 'badge-warn' : 'badge-code'}`}>
              {primussImport?.status === 'accepted' ? `✓ ${primussImport.modules.length} Module importiert`
                : primussImport?.status === 'parsed' ? `Vorschau (${primussImport.modules.length} Einträge)`
                : 'Nicht importiert'}
            </span>
          </div>
        </div>

        {/* Planungsparameter */}
        <div className="card">
          <div className="card-label">Planungsparameter</div>
          <div className="card-value">
            <span className={`badge ${planningParams.dataLabel === 'manuell' ? 'badge-api' : 'badge-code'}`}>
              {planningParams.dataLabel}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {planningParams.blockedDays.join(', ') || 'Keine gesperrten Tage'}
          </div>
        </div>

        {/* Letzter Update */}
        <div className="card">
          <div className="card-label">Letzter Planer-Update</div>
          <div className="card-value" style={{ fontSize: '0.85rem' }}>{fmtDate(lastPlannerUpdate)}</div>
        </div>

        {/* Module mit Terminen */}
        <div className="card">
          <div className="card-label">Module mit Terminen</div>
          <div className="card-value highlight">{nineReport?.modulesWithSchedule ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            von {nineReport?.totalModules ?? 0} geladenen Modulen
          </div>
        </div>
      </div>

      {/* Datenquellen-Tabelle */}
      <h2>Datenquellen-Übersicht</h2>
      <table>
        <thead>
          <tr><th>Quelle</th><th>Verwendung</th><th>Status</th><th>Badge</th><th>Priorität</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>NINE API</strong><br /><span style={{ fontSize: '0.75rem' }}>nine.hm.edu/api/v2</span></td>
            <td>Modulangebote, Termine, Wochentage, Räume, Dozenten</td>
            <td>{nineReport?.totalModules ? `${nineReport.totalModules} Module für ${nineReport.results.find(r => r.status === 'ok')?.endpoint ?? '–'}` : 'Nicht geladen'}</td>
            <td><span className={`badge ${nineReport?.totalModules ? 'badge-ok' : 'badge-code'}`}>NINE API</span></td>
            <td>1 (höchste)</td>
          </tr>
          <tr>
            <td><strong>PRIMUSS / Notenblatt</strong><br /><span style={{ fontSize: '0.75rem' }}>Upload / Text / Manuell</span></td>
            <td>Bestandene Module, Noten, ECTS, Status, Fehlversuche</td>
            <td>{primussImport?.status === 'accepted' ? `${primussImport.modules.filter(m => m.status === 'bestanden').length} bestandene Module` : 'Nicht importiert'}</td>
            <td><span className={`badge ${primussImport?.status === 'accepted' ? 'badge-ok' : 'badge-warn'}`}>PRIMUSS</span></td>
            <td>2</td>
          </tr>
          <tr>
            <td><strong>Manuell / Planungsparameter</strong></td>
            <td>Gesperrte Tage, Arbeitszeiten, ECTS-Ziel, Studienrichtung</td>
            <td>{planningParams.dataLabel}</td>
            <td><span className="badge badge-api">Manuell</span></td>
            <td>3</td>
          </tr>
          <tr>
            <td><strong>Lokale Knowledge-Daten</strong><br /><span style={{ fontSize: '0.75rem' }}>/inhalte – rules.json, knowledge_base.json</span></td>
            <td>Vorrückungsregeln, Studienstruktur, Fallback</td>
            <td>Immer verfügbar</td>
            <td><span className="badge badge-code">Lokal</span></td>
            <td>4</td>
          </tr>
          <tr>
            <td><strong>Demo-Daten</strong><br /><span style={{ fontSize: '0.75rem' }}>dummy_student.json</span></td>
            <td>Entwicklungsfallback – Jonas Weber (fiktiv)</td>
            <td>Immer verfügbar (Fallback)</td>
            <td><span className="badge badge-code">Demo</span></td>
            <td>5 (niedrigste)</td>
          </tr>
        </tbody>
      </table>

      <div className="params-actions" style={{ marginTop: '1.5rem' }}>
        <button className="btn-primary" onClick={() => reloadNineData()} disabled={isLoadingApi}>
          {isLoadingApi ? '⟳ Lädt…' : '⟳ NINE API neu laden'}
        </button>
      </div>

      {nineReport?.corsBlocked && (
        <div className="assumption-note" style={{ marginTop: '1rem', borderColor: '#dc2626' }}>
          <strong>CORS-Problem erkannt.</strong> Direkte Browser-Anfragen zu nine.hm.edu werden blockiert.
          Lösungen: (1) HM-Netz verwenden, (2) lokalen Proxy einrichten, (3) Mock-Modus.
        </div>
      )}
    </div>
  );
}
