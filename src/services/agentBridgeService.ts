/**
 * Agent Bridge Service – Sprint 3 Nachbesserung
 *
 * Verbindung zwischen React-App und lokalem Agent-Server (Port 3001).
 * Nur lokale Verbindungen – kein externer Server.
 *
 * Sicherheit:
 * - Zugangsdaten nur in Request-Body (nie in URL oder localStorage)
 * - Keine persistente Speicherung von Credentials
 */

export const AGENT_BASE_URL = 'http://127.0.0.1:3001';

export interface AgentLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface AgentScheduleEntry {
  moduleCode: string;
  moduleName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
  group: string;
  semester: number;
  moodleCourseUrl?: string;
}

export interface AgentResult {
  success: boolean;
  error?: string;
  schedule: AgentScheduleEntry[];
  modules: Array<{ code: string; name: string; semester: number; ects?: number }>;
  moodleCourses: Array<{ name: string; url: string; courseId: string }>;
  logs: AgentLogEntry[];
  screenshot?: string;
}

export interface AgentStatus {
  running: boolean;
  logs: AgentLogEntry[];
  result: AgentResult | null;
  hasResult: boolean;
}

export interface AgentHealth {
  status: 'ok' | 'unreachable';
  agentRunning?: boolean;
  port?: number;
  version?: string;
  error?: string;
}

// ── Verbindungstest ───────────────────────────────────────────────────────────

export async function checkAgentHealth(): Promise<AgentHealth> {
  try {
    const resp = await fetch(`${AGENT_BASE_URL}/agent/health`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return { status: 'unreachable', error: `HTTP ${resp.status}` };
    return await resp.json() as AgentHealth;
  } catch (e) {
    return { status: 'unreachable', error: 'Agent-Server nicht erreichbar. Starte ihn mit: npm run agent' };
  }
}

// ── NINE-Agent starten ────────────────────────────────────────────────────────

export interface RunAgentOptions {
  username: string;
  password: string;
  baseUrl?: string;
  curriculum?: string;
  semester?: string;
}

export async function startNineAgent(options: RunAgentOptions): Promise<{ status: string; message: string }> {
  const resp = await fetch(`${AGENT_BASE_URL}/agent/nine/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),  // Credentials nur im Body, nicht in URL
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText })) as { error: string };
    throw new Error(err.error ?? resp.statusText);
  }
  return resp.json() as Promise<{ status: string; message: string }>;
}

// ── Status abrufen (Polling) ──────────────────────────────────────────────────

export async function getAgentStatus(): Promise<AgentStatus> {
  const resp = await fetch(`${AGENT_BASE_URL}/agent/nine/status`);
  if (!resp.ok) throw new Error(`Status-Abruf fehlgeschlagen: ${resp.status}`);
  return resp.json() as Promise<AgentStatus>;
}

// ── Ergebnis abrufen ─────────────────────────────────────────────────────────

export async function getAgentResult(): Promise<AgentResult> {
  const resp = await fetch(`${AGENT_BASE_URL}/agent/nine/result`);
  if (!resp.ok) throw new Error(`Kein Ergebnis verfügbar.`);
  return resp.json() as Promise<AgentResult>;
}

// ── Agent stoppen ─────────────────────────────────────────────────────────────

export async function stopAgent(): Promise<void> {
  await fetch(`${AGENT_BASE_URL}/agent/nine/stop`, { method: 'POST' }).catch(() => {});
}
