import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { testNineConnection, isMockMode, apiBaseUrl, authConfigured } from '../services/nineApiService';

export default function NineApiStatus() {
  const { apiStatus, setApiStatus, nineReport, reloadNineData, isLoadingApi } = useApp();
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testNineConnection();
      setApiStatus({ mode: result.mode, baseUrl: result.baseUrl, authConfigured: result.authConfigured, lastChecked: result.lastChecked, connected: result.connected, lastError: result.lastError });
    } finally {
      setTesting(false);
    }
  };

  const handleReload = async () => {
    await reloadNineData();
  };

  const modeLabel = isMockMode ? 'Mock (keine echten API-Aufrufe)' : 'Live (echte API)';
  const modeClass = isMockMode ? 'badge-warn' : 'badge-ok';

  return (
    <div className="page">
      <h1>NINE API Status</h1>
      <p className="source-note">
        Swagger: <a href="https://nine.hm.edu/swagger/ui/index" target="_blank" rel="noopener noreferrer">https://nine.hm.edu/swagger/ui/index</a> ·
        Docs: <code>GET https://nine.hm.edu/swagger/docs/v2</code>
      </p>

      {/* Status-Karten */}
      <div className="card-grid">
        <div className="card">
          <div className="card-label">Base URL</div>
          <div className="card-value" style={{ fontSize: '0.85rem' }}>{apiBaseUrl}</div>
        </div>
        <div className="card">
          <div className="card-label">Modus</div>
          <div className="card-value"><span className={`badge ${modeClass}`}>{modeLabel}</span></div>
        </div>
        <div className="card">
          <div className="card-label">Auth-Token</div>
          <div className="card-value">
            <span className={`badge ${authConfigured ? 'badge-ok' : 'badge-warn'}`}>
              {authConfigured ? '✓ Konfiguriert (VITE_NINE_API_TOKEN)' : '✗ Nicht gesetzt'}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Verbindung</div>
          <div className="card-value">
            <span className={`badge ${apiStatus.connected ? 'badge-ok' : 'badge-blocked'}`}>
              {apiStatus.connected ? '✓ Verbunden' : '✗ Nicht verbunden'}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Letzter Check</div>
          <div className="card-value" style={{ fontSize: '0.85rem' }}>
            {apiStatus.lastChecked ? new Date(apiStatus.lastChecked).toLocaleString('de-DE') : '–'}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Geladene Module</div>
          <div className="card-value highlight">{nineReport?.totalModules ?? 0}</div>
        </div>
        <div className="card">
          <div className="card-label">Semester in API</div>
          <div className="card-value">{nineReport?.semesters.length ?? 0}</div>
        </div>
        <div className="card">
          <div className="card-label">Organisationen</div>
          <div className="card-value">{nineReport?.organisers.map(o => o.name).slice(0, 3).join(', ') || '–'}</div>
        </div>
      </div>

      {/* Fehlermeldung */}
      {(apiStatus.lastError || nineReport?.corsBlocked) && (
        <div className="assumption-note" style={{ borderColor: '#dc2626', marginTop: '1rem' }}>
          <strong>Fehler:</strong> {apiStatus.lastError ?? '–'}<br />
          {nineReport?.corsBlocked && (
            <span>
              <strong>CORS-Blocker erkannt:</strong> Direkte Browser-Anfragen zu nine.hm.edu werden blockiert.
              Lösungsoptionen: (1) Lokalen Proxy einrichten, (2) Browser-CORS-Extension für Entwicklung,
              (3) Mock-Modus verwenden (<code>VITE_NINE_API_MODE=mock</code>).
            </span>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="params-actions" style={{ marginTop: '1.5rem' }}>
        <button className="btn-primary" onClick={handleTest} disabled={testing}>
          {testing ? '⟳ Teste Verbindung…' : 'API-Verbindung testen'}
        </button>
        <button className="btn-secondary" onClick={handleReload} disabled={isLoadingApi}>
          {isLoadingApi ? '⟳ Lade Modulangebote…' : '⟳ Modulangebote neu laden'}
        </button>
      </div>

      {/* NINE API v2 Endpoints */}
      <h2 style={{ marginTop: '2rem' }}>Implementierte Endpunkte (v2)</h2>
      <table>
        <thead>
          <tr><th>Endpoint</th><th>Beschreibung</th><th>Auth</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET /api/v2/semester</code></td>
            <td>Liste aller Semester</td>
            <td>–</td>
            <td><span className="badge badge-ok">✓ implementiert</span></td>
          </tr>
          <tr>
            <td><code>GET /api/v2/organisers</code></td>
            <td>Liste aller Organisationen/Fakultäten</td>
            <td>–</td>
            <td><span className="badge badge-ok">✓ implementiert</span></td>
          </tr>
          <tr>
            <td><code>GET /api/v2/courses?institutionId=&amp;semesterId=</code></td>
            <td>Lehrveranstaltungen (institutionId erforderlich)</td>
            <td>VITE_NINE_API_INSTITUTION</td>
            <td><span className="badge badge-warn">✓ implementiert (INST-ID benötigt)</span></td>
          </tr>
          <tr>
            <td><code>GET /api/v2/curricula?institutionId=</code></td>
            <td>Studiengänge / Prüfungsordnungen</td>
            <td>VITE_NINE_API_INSTITUTION</td>
            <td><span className="badge badge-warn">✓ implementiert (INST-ID benötigt)</span></td>
          </tr>
          <tr>
            <td><code>GET /api/v2/rooms</code></td>
            <td>Alle Räume</td>
            <td>–</td>
            <td><span className="badge badge-ok">✓ implementiert</span></td>
          </tr>
          <tr>
            <td><code>GET /api/v2/modules/{'{curriculum}/{stage}/{semester}'}</code></td>
            <td>Module nach Studiengang und Semester</td>
            <td>–</td>
            <td><span className="badge badge-warn">✓ implementiert (Parameter nötig)</span></td>
          </tr>
          <tr>
            <td><code>POST /api/v2/account/login</code></td>
            <td>Anmeldung (Token-Erstellung)</td>
            <td>userName + password</td>
            <td><span className="badge badge-code">vorbereitet (kein Klartext-Auth)</span></td>
          </tr>
        </tbody>
      </table>

      {/* Geladene Module */}
      {nineReport && nineReport.totalModules > 0 && (
        <>
          <h2>Geladene Module</h2>
          <p className="source-note">
            Modus: <span className={`badge ${nineReport.corsBlocked ? 'badge-blocked' : 'badge-ok'}`}>{nineReport.corsBlocked ? 'CORS blockiert' : 'live'}</span>
            &nbsp;· {nineReport.totalModules} Module, {nineReport.modulesWithSchedule} mit Terminen
          </p>
          <table>
            <thead>
              <tr><th>Stage</th><th>Tag</th><th>Modul</th><th>Mit Terminen</th></tr>
            </thead>
            <tbody>
              {Object.entries(nineReport.modulesByStage).flatMap(([stage, mods]) => {
                const seen = new Set<string>();
                return mods.filter(m => { if (seen.has(m.moduleTag)) return false; seen.add(m.moduleTag); return true; })
                  .map(m => (
                  <tr key={m.id}>
                    <td>{stage}</td>
                    <td><span className="badge badge-code">{m.moduleTag}</span></td>
                    <td>{m.moduleName}</td>
                    <td>{m.hasSchedule ? <span className="badge badge-ok">✓</span> : '–'}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <strong>Konfiguration (.env.local):</strong>
        <pre style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
{`VITE_NINE_API_BASE_URL=https://nine.hm.edu
VITE_NINE_API_MODE=mock          # "live" für echte API
VITE_NINE_API_INSTITUTION=       # Institution-ID aus /api/v2/organisers
VITE_NINE_API_ORGANISER=         # Organiser-ID (optional)
VITE_NINE_API_TOKEN=             # Bearer-Token (nach Login)`}
        </pre>
        <strong>CORS-Hinweis:</strong> Im Browser-Modus können Anfragen zu nine.hm.edu durch
        CORS-Richtlinien blockiert werden. Bei CORS-Fehler Mock-Modus verwenden.
      </div>
    </div>
  );
}
