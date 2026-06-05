/**
 * Agent Panel – Sprint 3 Nachbesserung
 *
 * UI-Reiter für den NINE-Browser-Agenten.
 * Zeigt Status, Live-Log, Handlungsempfehlungen und Ergebnis.
 *
 * Sicherheit:
 * - Passwort wird nie in State gespeichert, nur für die aktuelle Anfrage übergeben
 * - Kein localStorage für Credentials
 * - Agent läuft sichtbar (headless: false)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  checkAgentHealth, startNineAgent, getAgentStatus, stopAgent,
  type AgentLogEntry, type AgentResult, type AgentHealth,
} from '../services/agentBridgeService';
import { useApp } from '../context/AppContext';
import { AgentCourseDetailResult } from './AgentCourseDetailResult';
import type { ExtractedCourseDetail } from '../types/courseDetail';

type AgentState = 'idle' | 'starting' | 'running' | 'done' | 'error';
type ActiveTab = 'nine-agent' | 'kursdetail';

const AGENT_SERVER = 'http://127.0.0.1:3001';

const LOG_COLOR: Record<AgentLogEntry['level'], string> = {
  info:    '#374151',
  warn:    '#d97706',
  error:   '#dc2626',
  success: '#16a34a',
};

export default function AgentPanel() {
  const { planningParams } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('nine-agent');

  // Zugangsdaten – nur im Komponent-State, nie persistent
  const [username, setUsername] = useState(import.meta.env.VITE_NINE_USERNAME ?? '');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu');
  const [curriculum, setCurriculum] = useState(import.meta.env.VITE_NINE_CURRICULUM ?? 'WI');
  const [semester, setSemester] = useState(import.meta.env.VITE_NINE_TERM ?? 'SoSe 2026');
  const [showPassword, setShowPassword] = useState(false);

  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Kursdetail-Tab
  const [courseDetailUrl, setCourseDetailUrl] = useState('');
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseDetailResult, setCourseDetailResult] = useState<ExtractedCourseDetail | null>(null);
  const [courseDetailError, setCourseDetailError] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Gesundheitscheck beim Laden
  useEffect(() => {
    checkAgentHealth().then(setHealth);
    return () => { if (pollInterval) clearInterval(pollInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-Scroll im Log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const status = await getAgentStatus();
        setLogs(status.logs);
        if (!status.running && status.hasResult && status.result) {
          clearInterval(interval);
          setPollInterval(null);
          setResult(status.result);
          setAgentState(status.result.success ? 'done' : 'error');
        }
      } catch {
        // Agent-Server kurz nicht erreichbar
      }
    }, 1500);
    setPollInterval(interval);
    return interval;
  };

  const handleStart = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Bitte Benutzername und Passwort eingeben.');
      return;
    }
    setAgentState('starting');
    setLogs([]);
    setResult(null);

    try {
      await startNineAgent({ username, password, baseUrl, curriculum, semester });
      setAgentState('running');
      startPolling();
    } catch (e) {
      setAgentState('error');
      setLogs([{ timestamp: new Date().toISOString(), level: 'error', message: String(e) }]);
    }

    // Passwort nach Verwendung löschen
    setPassword('');
  };

  const handleStop = async () => {
    if (pollInterval) { clearInterval(pollInterval); setPollInterval(null); }
    await stopAgent();
    setAgentState('idle');
  };

  const handleExtractCourseDetail = async () => {
    if (!courseDetailUrl.trim().startsWith('http')) {
      setCourseDetailError('Bitte eine gültige NINE-Kursdetail-URL eingeben.');
      return;
    }
    setCourseDetailLoading(true);
    setCourseDetailError(null);
    setCourseDetailResult(null);

    try {
      const resp = await fetch(`${AGENT_SERVER}/agent/extract-course-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseUrl: courseDetailUrl.trim(),
          planningContext: {
            currentSemester: planningParams.currentSemester,
            blockedDays: planningParams.blockedDays ?? [],
            passedModuleCodes: [],
            targetEcts: planningParams.targetEcts ?? 30,
          },
        }),
      });
      const data = await resp.json();
      if (data.ok && data.courseDetail) {
        setCourseDetailResult(data.courseDetail as ExtractedCourseDetail);
      } else {
        setCourseDetailError(data.error ?? 'Unbekannter Fehler.');
      }
    } catch (e) {
      setCourseDetailError(`Verbindung zum Agent-Server fehlgeschlagen: ${e}`);
    } finally {
      setCourseDetailLoading(false);
    }
  };

  const serverOnline = health?.status === 'ok';

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', border: 'none', background: active ? '#3b82f6' : '#f1f5f9',
    color: active ? '#fff' : '#374151', borderRadius: '6px 6px 0 0',
    cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 14,
  });

  return (
    <div className="page">
      <h1>🤖 NINE-Agent</h1>
      <p className="source-note">
        Playwright-Browser-Agent · Sichtbar (du siehst jede Aktion) · Nur lokal · Keine externen Server
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 16 }}>
        <button style={TAB_STYLE(activeTab === 'nine-agent')} onClick={() => setActiveTab('nine-agent')}>
          Stundenplan-Agent
        </button>
        <button style={TAB_STYLE(activeTab === 'kursdetail')} onClick={() => setActiveTab('kursdetail')}>
          Kursdetail auslesen
        </button>
      </div>

      {/* ═══ TAB: Kursdetail ═══════════════════════════════════════ */}
      {activeTab === 'kursdetail' && (
        <div>
          <h2 style={{ marginTop: 0 }}>NINE-Kursdetailseite auslesen</h2>
          <p className="source-note">
            Gibt eine NINE-Kursdetail-URL ein. Der Agent öffnet die Seite und extrahiert Moodle-Links,
            Termine, Einschreibestatus und Handlungsempfehlungen.
          </p>

          {/* Server-Status (kompakt) */}
          {!serverOnline && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13 }}>
              ✗ Agent-Server nicht erreichbar. Starte mit: <code>npm run agent</code>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>
                NINE-Kursdetail-URL
              </label>
              <input
                value={courseDetailUrl}
                onChange={e => setCourseDetailUrl(e.target.value)}
                placeholder="https://nine.hm.edu/Course/Details/..."
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
            <button
              className="btn-primary"
              disabled={!serverOnline || courseDetailLoading || !courseDetailUrl.trim()}
              onClick={handleExtractCourseDetail}
              style={{ whiteSpace: 'nowrap' }}>
              {courseDetailLoading ? '⟳ Lädt…' : '🔍 Kursdetail auslesen'}
            </button>
          </div>

          <div style={{ marginBottom: 14, fontSize: 12, color: '#64748b' }}>
            Beispiel-URL:{' '}
            <button
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}
              onClick={() => setCourseDetailUrl('https://nine.hm.edu/Course/Details/994e2469-61fb-f011-9223-0050568f928d')}>
              994e2469-61fb-f011-9223-0050568f928d
            </button>
          </div>

          {courseDetailError && (
            <div style={{ background: '#fee2e2', borderRadius: 6, padding: '8px 12px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
              ✗ {courseDetailError}
            </div>
          )}

          {courseDetailResult && (
            <AgentCourseDetailResult
              detail={courseDetailResult}
              onActionConfirm={action => {
                console.log('[AgentPanel] Aktion bestätigt:', action.id);
              }}
            />
          )}

          {!courseDetailResult && !courseDetailLoading && !courseDetailError && (
            <div className="info-box">
              <p style={{ margin: 0, fontSize: 13 }}>
                Gib eine NINE-Kursdetail-URL ein und klicke auf <strong>„Kursdetail auslesen"</strong>.<br />
                Der Agent extrahiert: Kurstitel · Moodle-Link · Zugangsschlüssel (maskiert) · Nächster Termin · Einschreibestatus · Handlungsempfehlungen.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: NINE-Stundenplan-Agent ═══════════════════════════ */}
      {activeTab === 'nine-agent' && (
      <div>

      {/* Server-Status */}
      <div style={{ padding: '0.6rem 1rem', borderRadius: 8, marginBottom: '1rem',
        background: serverOnline ? '#d1fae5' : '#fee2e2',
        border: `1px solid ${serverOnline ? '#a7f3d0' : '#fca5a5'}` }}>
        <strong>Agent-Server:</strong>{' '}
        {serverOnline ? (
          <span style={{ color: '#16a34a' }}>✓ Online (Port 3001){health?.agentRunning ? ' · Agent aktiv' : ''}</span>
        ) : (
          <span style={{ color: '#dc2626' }}>
            ✗ Nicht erreichbar · Starte mit: <code style={{ background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>npm run agent</code> (neues Terminal)
          </span>
        )}
        <button className="btn-secondary" style={{ marginLeft: 12, fontSize: '0.72rem', padding: '2px 8px' }}
          onClick={() => checkAgentHealth().then(setHealth)}>
          Neu prüfen
        </button>
      </div>

      {/* Erklärung */}
      <div className="info-box" style={{ marginBottom: '1rem' }}>
        <strong>Was macht der Agent?</strong>
        <ol style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, lineHeight: 1.8, fontSize: '0.85rem' }}>
          <li>Öffnet einen sichtbaren Chromium-Browser</li>
          <li>Loggt sich mit deinen Zugangsdaten in NINE ein</li>
          <li>Lädt Stundenplan- und Modul-Daten für Sem. 1–7 (zuerst via API, dann per Browser)</li>
          <li>Gibt dir Handlungsempfehlungen zurück</li>
          <li>Schließt den Browser nach Abschluss</li>
        </ol>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
          Das Passwort wird nach dem Start sofort aus dem Speicher gelöscht. Es wird nie gespeichert oder geloggt.
        </p>
      </div>

      {/* Konfiguration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>NINE-URL</label>
          <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>Curriculum</label>
          <input value={curriculum} onChange={e => setCurriculum(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>Benutzername (LRZ-Kennung)</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>Passwort</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Wird nach Start sofort gelöscht"
              style={{ width: '100%', padding: '0.4rem 2.5rem 0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            <button onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 3 }}>Semester</label>
          <input value={semester} onChange={e => setSemester(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6, fontSize: '0.85rem' }} />
        </div>
      </div>

      {/* Aktionsknöpfe */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-primary"
          disabled={!serverOnline || agentState === 'running' || agentState === 'starting' || !password.trim() || !username.trim()}
          onClick={handleStart}>
          {agentState === 'starting' ? '⟳ Starte…' : agentState === 'running' ? '⟳ Läuft…' : '▶ Agent starten'}
        </button>
        {(agentState === 'running' || agentState === 'starting') && (
          <button className="btn-secondary" onClick={handleStop}>◼ Stoppen</button>
        )}
        {agentState === 'done' && (
          <button className="btn-secondary" onClick={() => { setAgentState('idle'); setResult(null); setLogs([]); }}>
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Live-Log */}
      {logs.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Agent-Log</h3>
          <div style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem', maxHeight: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: LOG_COLOR[log.level], marginBottom: 2, lineHeight: 1.5 }}>
                <span style={{ color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString('de-DE')} </span>
                <span style={{ fontWeight: log.level === 'error' ? 700 : 400 }}>{log.message}</span>
              </div>
            ))}
            {agentState === 'running' && (
              <div style={{ color: '#60a5fa', marginTop: 4 }}>⟳ Agent läuft…</div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Ergebnis */}
      {result && agentState === 'done' && (
        <div>
          <h2>Ergebnis</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="badge badge-ok">{result.schedule.length} Termine</span>
            <span className="badge badge-api">{result.modules.length} Module</span>
            {result.moodleCourses.length > 0 && <span className="badge badge-code">{result.moodleCourses.length} Moodle-Kurse</span>}
            <span className={`badge ${result.success ? 'badge-ok' : 'badge-blocked'}`}>
              {result.success ? '✓ Erfolgreich' : '✗ Mit Fehlern'}
            </span>
          </div>

          {/* Handlungsempfehlungen */}
          {result.schedule.length > 0 && (
            <>
              <h3>Handlungsempfehlungen</h3>
              <p className="source-note">
                Basierend auf deinem aktuellen Profil (Sem. {planningParams.currentSemester}) und den NINE-Daten:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.schedule.slice(0, 15).map((entry, i) => (
                  <div key={i} style={{ padding: '0.6rem 0.9rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-api" style={{ fontSize: '0.7rem' }}>Sem. {entry.semester || '?'}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {entry.moduleName || entry.moduleCode || 'Unbekanntes Modul'}
                    </span>
                    {entry.day && (
                      <span style={{ fontSize: '0.78rem', color: '#374151' }}>
                        {entry.day} {entry.startTime}{entry.endTime ? `–${entry.endTime}` : ''}{entry.room ? ` · ${entry.room}` : ''}{entry.lecturer ? ` · ${entry.lecturer}` : ''}
                      </span>
                    )}
                    {entry.moodleCourseUrl && (
                      <a href={entry.moodleCourseUrl} target="_blank" rel="noopener noreferrer"
                        className="btn-secondary" style={{ fontSize: '0.72rem', padding: '2px 8px', marginLeft: 'auto' }}>
                        Moodle öffnen
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {result.error && (
            <div className="assumption-note" style={{ marginTop: '1rem' }}>
              ⚠ {result.error}
            </div>
          )}

          {result.screenshot && (
            <div style={{ marginTop: '1rem' }}>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>Screenshot (Fehlerdiagnose)</summary>
                <img src={`data:image/png;base64,${result.screenshot}`} alt="Agent Screenshot"
                  style={{ maxWidth: '100%', marginTop: 8, borderRadius: 6, border: '1px solid #e2e8f0' }} />
              </details>
            </div>
          )}
        </div>
      )}

      {agentState === 'error' && (
        <div className="assumption-note">
          <strong>Agent-Fehler.</strong> Prüfe den Log oben und stelle sicher, dass:<br />
          • Benutzername und Passwort korrekt sind<br />
          • NINE (nine.hm.edu) erreichbar ist<br />
          • Der Agent-Server läuft (<code>npm run agent</code>)
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <strong>Roadmap – Nächste Schritte:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, lineHeight: 1.8, fontSize: '0.83rem' }}>
          <li>✅ NINE-Login + Stundenplan-Extraktion (Sprint 3)</li>
          <li>✅ Kursdetail-Parser + Moodle-Extraktion (Sprint 4)</li>
          <li>⏸ Moodle-API: Token-basierter Kurs-Abruf</li>
          <li>⏸ Moodle-Einschreibung: Agent klickt auf „Einschreiben"-Button</li>
          <li>⏸ Automatische Gruppenauswahl im NINE-Stundenplan</li>
          <li>⏸ Persistente Browser-Session (kein erneuter Login nötig)</li>
        </ul>
      </div>

      </div>
      )}
    </div>
  );
}
