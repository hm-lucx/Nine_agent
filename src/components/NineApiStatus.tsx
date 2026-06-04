import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  testNineConnection,
  fetchModules,
  isMockMode,
  apiBaseUrl,
  authConfigured,
  type NineModule,
} from '../services/nineApiService';

export default function NineApiStatus() {
  const { apiStatus, setApiStatus } = useApp();
  const [testing, setTesting] = useState(false);
  const [mockModules, setMockModules] = useState<NineModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    const result = await testNineConnection();
    setApiStatus(result);
    setTesting(false);
  };

  const handleFetchModules = async () => {
    setLoadingModules(true);
    const mods = await fetchModules();
    setMockModules(mods);
    setLoadingModules(false);
  };

  const modeColor = isMockMode ? 'badge-warn' : apiStatus.connected ? 'badge-ok' : 'badge-blocked';
  const modeLabel = isMockMode ? 'Mock-Modus (keine echten Daten)' : apiStatus.connected ? 'Live API' : 'Live API – nicht verbunden';

  return (
    <div className="page">
      <h1>NINE API Status</h1>
      <p className="source-note">
        Swagger UI:{' '}
        <a href="https://nine.hm.edu/swagger/ui/index" target="_blank" rel="noopener noreferrer">
          https://nine.hm.edu/swagger/ui/index
        </a>
        {' '}· Konfiguration über <code>.env.local</code>
      </p>

      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label">API Base URL</div>
          <div className="card-value" style={{ fontSize: '0.82rem' }}>{apiBaseUrl}</div>
        </div>
        <div className="card">
          <div className="card-label">Modus</div>
          <div className="card-value">
            <span className={`badge ${modeColor}`}>{modeLabel}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Auth konfiguriert</div>
          <div className="card-value">
            <span className={`badge ${authConfigured ? 'badge-ok' : 'badge-warn'}`}>
              {authConfigured ? 'Ja (Token vorhanden)' : 'Nein (kein Token)'}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Verbindung</div>
          <div className="card-value">
            <span className={`badge ${apiStatus.connected ? 'badge-ok' : 'badge-warn'}`}>
              {apiStatus.connected ? '✓ Verbunden' : 'Nicht geprüft'}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Letzter Abruf</div>
          <div className="card-value" style={{ fontSize: '0.82rem' }}>
            {apiStatus.lastChecked ? new Date(apiStatus.lastChecked).toLocaleString('de-DE') : '–'}
          </div>
        </div>
      </div>

      {apiStatus.lastError && (
        <div className="assumption-note">
          <strong>Fehler:</strong> {apiStatus.lastError}
        </div>
      )}

      <div className="params-actions" style={{ marginBottom: '1.5rem' }}>
        <button className="btn-primary" onClick={handleTest} disabled={testing}>
          {testing ? 'Teste Verbindung…' : 'API-Verbindung testen'}
        </button>
        <button className="btn-secondary" onClick={handleFetchModules} disabled={loadingModules}>
          {loadingModules ? 'Lade Module…' : 'Module abrufen (Test)'}
        </button>
      </div>

      {/* Verfügbare Endpunkte (geplant) */}
      <h2>Geplante API-Funktionen</h2>
      <table>
        <thead>
          <tr><th>Funktion</th><th>Endpoint (TODO)</th><th>Beschreibung</th><th>Status</th></tr>
        </thead>
        <tbody>
          {[
            ['testNineConnection()', '/api/v1/ping', 'Verbindungstest', 'TODO: Endpoint prüfen'],
            ['fetchModules()', '/api/v1/modules', 'Alle Module abrufen', 'TODO: Endpoint prüfen'],
            ['fetchCurricula()', '/api/v1/curricula', 'Studiengänge abrufen', 'TODO: Endpoint prüfen'],
            ['fetchCourses()', '/api/v1/courses', 'Veranstaltungen abrufen', 'TODO: Endpoint prüfen'],
            ['fetchScheduleEntries()', '/api/v1/schedule', 'Stundenplaneinträge', 'TODO: Endpoint prüfen'],
            ['fetchRooms()', '/api/v1/rooms', 'Räume abrufen', 'TODO: Endpoint prüfen'],
            ['fetchStudyPrograms()', '/api/v1/studyprograms', 'Studienprogramme', 'TODO: Endpoint prüfen'],
          ].map(([fn, ep, desc, status]) => (
            <tr key={fn}>
              <td><code>{fn}</code></td>
              <td><code style={{ color: '#7b1fa2' }}>{ep}</code></td>
              <td>{desc}</td>
              <td><span className="badge badge-warn">{status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mock-Module */}
      {mockModules.length > 0 && (
        <>
          <h2 style={{ marginTop: '1.5rem' }}>Zuletzt abgerufene Module ({isMockMode ? 'Mock' : 'Live'})</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Code</th><th>Titel</th><th>ECTS</th><th>Semester</th></tr>
            </thead>
            <tbody>
              {mockModules.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td><span className="badge badge-code">{m.code}</span></td>
                  <td>{m.title}</td>
                  <td>{m.ects}</td>
                  <td>{m.semester ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="info-box" style={{ marginTop: '1.5rem' }}>
        <strong>Konfiguration:</strong> Erstelle <code>.env.local</code> auf Basis von{' '}
        <code>.env.example</code> und trage <code>VITE_NINE_API_BASE_URL</code> und optionalen{' '}
        <code>VITE_NINE_API_TOKEN</code> ein. Setze <code>VITE_NINE_API_MOCK=false</code> für echte Aufrufe.
        <br /><br />
        <strong>CORS-Hinweis:</strong> Direkte Browser-Aufrufe zu <code>nine.hm.edu</code> können durch
        CORS-Richtlinien blockiert werden. Falls nötig, ist ein lokaler Proxy-Server erforderlich.
      </div>
    </div>
  );
}
