/**
 * NINE / hamSTER API Service
 *
 * Swagger UI: https://nine.hm.edu/swagger/ui/index
 *
 * Konfiguration über .env.local:
 *   VITE_NINE_API_BASE_URL  – Basis-URL (Standard: https://nine.hm.edu)
 *   VITE_NINE_API_TOKEN     – Bearer Token (optional)
 *   VITE_NINE_API_MOCK      – "true" = Mock-Modus, kein echter API-Aufruf
 *
 * TODO: Konkrete Endpoints und Auth-Schema aus Swagger prüfen.
 * Aktuell sind alle fetch()-Aufrufe mit TODO-Kommentaren versehen.
 */

import type { NineApiStatus } from '../types';

const BASE_URL = import.meta.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu';
const TOKEN    = import.meta.env.VITE_NINE_API_TOKEN ?? '';
const MOCK     = import.meta.env.VITE_NINE_API_MOCK !== 'false'; // default: mock

// ── Typ-Definitionen (Platzhalter) ────────────────────────────────────────────
export interface NineModule {
  id: string;
  code: string;
  title: string;
  ects: number;
  semester?: number;
  source: 'api';
}

export interface NineCourse {
  id: string;
  title: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  lecturer?: string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
}

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const resp = await fetch(url, { headers: headers() });
  if (!resp.ok) throw new Error(`NINE API ${resp.status}: ${resp.statusText} – ${url}`);
  return resp.json() as Promise<T>;
}

// ── Mock-Daten ────────────────────────────────────────────────────────────────
const MOCK_MODULES: NineModule[] = [
  { id: 'mock-1', code: 'G1',  title: 'Mathematik I (Mock)',    ects: 6,  semester: 1, source: 'api' },
  { id: 'mock-2', code: 'G4',  title: 'Physik (Mock)',          ects: 5,  semester: 2, source: 'api' },
  { id: 'mock-3', code: 'TEC-ET', title: 'Energietechnik (Mock)', ects: 4, semester: 3, source: 'api' },
];

const MOCK_COURSES: NineCourse[] = [
  { id: 'mc-1', title: 'Physik Vorlesung (Mock)',       day: 'Donnerstag', startTime: '11:45', endTime: '15:00' },
  { id: 'mc-2', title: 'Energietechnik Vorlesung (Mock)', day: 'Dienstag',  startTime: '08:45', endTime: '12:00' },
];

// ── Öffentliche API-Funktionen ────────────────────────────────────────────────

/**
 * Verbindung testen.
 * TODO: Korrekten Ping-/Health-Endpoint aus Swagger prüfen.
 */
export async function testNineConnection(): Promise<NineApiStatus> {
  if (MOCK) {
    return {
      mode: 'mock',
      baseUrl: BASE_URL,
      authConfigured: !!TOKEN,
      lastChecked: new Date().toISOString(),
      connected: true,
    };
  }
  try {
    // TODO: Richtigen Health-/Ping-Endpoint eintragen
    await apiFetch<unknown>('/api/v1/ping');
    return {
      mode: 'live',
      baseUrl: BASE_URL,
      authConfigured: !!TOKEN,
      lastChecked: new Date().toISOString(),
      connected: true,
    };
  } catch (err) {
    return {
      mode: 'live',
      baseUrl: BASE_URL,
      authConfigured: !!TOKEN,
      lastChecked: new Date().toISOString(),
      connected: false,
      lastError: String(err),
    };
  }
}

/**
 * Module abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 * Mögliche Endpoints: /api/v1/modules, /api/v1/curricula/modules, ...
 */
export async function fetchModules(): Promise<NineModule[]> {
  if (MOCK) return MOCK_MODULES;
  // TODO: Endpoint bestätigen
  return apiFetch<NineModule[]>('/api/v1/modules');
}

/**
 * Veranstaltungen / Kurse abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 */
export async function fetchCourses(): Promise<NineCourse[]> {
  if (MOCK) return MOCK_COURSES;
  // TODO: Endpoint bestätigen
  return apiFetch<NineCourse[]>('/api/v1/courses');
}

/**
 * Studiengänge / Curricula abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 */
export async function fetchCurricula(): Promise<unknown[]> {
  if (MOCK) return [{ id: 'mock-wi', title: 'Bachelor Wirtschaftsingenieurwesen (Mock)' }];
  // TODO: Endpoint bestätigen
  return apiFetch<unknown[]>('/api/v1/curricula');
}

/**
 * Stundenplaneinträge abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 */
export async function fetchScheduleEntries(): Promise<NineCourse[]> {
  if (MOCK) return MOCK_COURSES;
  // TODO: Endpoint bestätigen
  return apiFetch<NineCourse[]>('/api/v1/schedule');
}

/**
 * Räume abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 */
export async function fetchRooms(): Promise<unknown[]> {
  if (MOCK) return [{ id: 'r1', name: 'R1.001 (Mock)' }];
  // TODO: Endpoint bestätigen
  return apiFetch<unknown[]>('/api/v1/rooms');
}

/**
 * Studienprogramme abrufen.
 * TODO: Korrekten Endpoint aus Swagger prüfen.
 */
export async function fetchStudyPrograms(): Promise<unknown[]> {
  if (MOCK) return [{ id: 'wi', name: 'Wirtschaftsingenieurwesen (Mock)' }];
  // TODO: Endpoint bestätigen
  return apiFetch<unknown[]>('/api/v1/studyprograms');
}

export const isMockMode = MOCK;
export const apiBaseUrl  = BASE_URL;
export const authConfigured = !!TOKEN;
