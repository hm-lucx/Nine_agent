/**
 * NINE / hamSTER API Service – v2
 *
 * Swagger: https://nine.hm.edu/swagger/ui/index  (Docs: /swagger/docs/v2)
 * API Base: https://nine.hm.edu/api/v2
 *
 * Konfiguration via .env.local:
 *   VITE_NINE_API_BASE_URL     – Standard: https://nine.hm.edu
 *   VITE_NINE_API_INSTITUTION  – Institution-ID (z. B. HM-ID aus /api/v2/organisers)
 *   VITE_NINE_API_ORGANISER    – Organiser-ID (aus /api/v2/organisers)
 *   VITE_NINE_API_TOKEN        – Bearer-Token nach Login
 *   VITE_NINE_API_MODE         – "live" | "mock" (Standard: mock)
 *
 * CORS-Hinweis: Direkte Browser-Anfragen zu nine.hm.edu können durch
 * CORS-Richtlinien blockiert werden. Bei Bedarf lokalen Proxy einrichten.
 *
 * Auth: POST /api/v2/account/login  body: { userName, password }
 *       Einige GET-Endpunkte sind öffentlich (semester, organisers, rooms).
 *       Kurse und Module benötigen institutionId als Query-Parameter.
 */

import type { NineApiStatus } from '../types';

const BASE  = (import.meta.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu').replace(/\/$/, '');
const TOKEN = import.meta.env.VITE_NINE_API_TOKEN ?? '';
const MODE  = import.meta.env.VITE_NINE_API_MODE ?? 'mock';
const INST  = import.meta.env.VITE_NINE_API_INSTITUTION ?? '';
const ORG   = import.meta.env.VITE_NINE_API_ORGANISER ?? '';

export const isMockMode     = MODE !== 'live';
export const apiBaseUrl     = BASE;
export const authConfigured = !!TOKEN;

// ── Typen (aus Swagger v2) ────────────────────────────────────────────────────
export interface NineSemesterDto {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface NineOrganiserDto {
  id: string;
  shortName?: string;
  name?: string;
}

export interface NineCourseApiContract {
  courseId?: string;
  externalId?: string;
  institutionId?: string;
  organiserId?: string;
  semesterId?: string;
  code?: string;
  title?: string;
  description?: string;
  cohorts?: NineCourseCohortContract[];
  sequences?: unknown[];
  teachings?: NineCourseTeachingContract[];
  dates?: NineCourseDateContract[];
}

export interface NineCourseCohortContract {
  cohortId?: string;
  name?: string;
  count?: number;
}

export interface NineCourseTeachingContract {
  lecturerId?: string;
  firstName?: string;
  lastName?: string;
}

export interface NineCourseDateContract {
  start?: string;
  end?: string;
  room?: string;
  roomNumber?: string;
}

export interface NineCurriculumApiContract {
  id?: string;
  institutionId?: string;
  organiserId?: string;
  curriculumId?: string;
  version?: string;
  name?: string;
  shortName?: string;
}

export interface NineModuleApiContract {
  id?: string;
  code?: string;
  name?: string;
  shortName?: string;
  ects?: number;
  semester?: number;
}

// ── Normalisiertes Format für die App ────────────────────────────────────────
export interface NineModule {
  id: string;
  code: string;
  title: string;
  ects: number;
  semester?: number;
  source: 'api';
  dataLabel: 'API';
}

export interface NineCourse {
  id: string;
  code?: string;
  title: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  lecturer?: string;
  semesterId?: string;
  source: 'api';
}

export interface NineApiData {
  semesters: NineSemesterDto[];
  organisers: NineOrganiserDto[];
  courses: NineCourse[];
  modules: NineModule[];
  lastFetched: string;
  mode: 'live' | 'mock';
  corsBlocked: boolean;
  error?: string;
}

// ── Mock-Daten (für Fallback) ─────────────────────────────────────────────────
const MOCK_SEMESTERS: NineSemesterDto[] = [
  { id: 'sose2026', name: 'SoSe 2026', startDate: '2026-03-01', endDate: '2026-08-31' },
  { id: 'wise2526', name: 'WiSe 2025/26', startDate: '2025-10-01', endDate: '2026-02-28' },
];

const MOCK_ORGANISERS: NineOrganiserDto[] = [
  { id: 'hm-wi', shortName: 'WI', name: 'Wirtschaftsingenieurwesen (Mock)' },
];

const MOCK_COURSES: NineCourse[] = [
  { id: 'mc-physik',    code: 'G4',     title: 'Physik (Mock)',                        day: 'Donnerstag', startTime: '11:45', endTime: '15:00', source: 'api' },
  { id: 'mc-vwl',      code: 'G13',    title: 'Volkswirtschaftslehre (Mock)',          day: 'Donnerstag', startTime: '16:00', endTime: '19:30', source: 'api' },
  { id: 'mc-entech',   code: 'TEC-ET', title: 'Energietechnik (Mock)',                 day: 'Dienstag',   startTime: '08:45', endTime: '12:00', source: 'api' },
  { id: 'mc-vut',      code: 'TEC-VUT',title: 'Verfahrens- und Umwelttechnik (Mock)', day: 'Mittwoch',   startTime: '08:15', endTime: '11:30', source: 'api' },
  { id: 'mc-wpm-sp',   code: 'WPM-SP', title: 'WPM Fachsprache B Spanisch (Mock)',    day: 'Mittwoch',   startTime: '13:30', endTime: '16:45', source: 'api' },
];

const MOCK_MODULES: NineModule[] = [
  { id: 'm-g4',     code: 'G4',     title: 'Physik (Mock)',                        ects: 5, semester: 2, source: 'api', dataLabel: 'API' },
  { id: 'm-g13',    code: 'G13',    title: 'Volkswirtschaftslehre (Mock)',          ects: 4, semester: 2, source: 'api', dataLabel: 'API' },
  { id: 'm-tecet',  code: 'TEC-ET', title: 'Energietechnik (Mock)',                 ects: 4, semester: 3, source: 'api', dataLabel: 'API' },
  { id: 'm-tecvut', code: 'TEC-VUT',title: 'Verfahrens- und Umwelttechnik (Mock)', ects: 4, semester: 3, source: 'api', dataLabel: 'API' },
];

// ── HTTP-Client ───────────────────────────────────────────────────────────────
function buildHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
    // no credentials – public endpoints
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`NINE API ${resp.status} ${resp.statusText} – ${url.pathname}: ${body.slice(0, 200)}`);
  }
  return resp.json() as Promise<T>;
}

// ── Öffentliche Endpunkte (kein Auth nötig) ──────────────────────────────────

/** GET /api/v2/semester – Liste aller Semester */
export async function fetchSemesters(): Promise<NineSemesterDto[]> {
  if (isMockMode) return MOCK_SEMESTERS;
  return get<NineSemesterDto[]>('/api/v2/semester');
}

/** GET /api/v2/organisers – Liste aller Organisationen/Fakultäten */
export async function fetchOrganisers(): Promise<NineOrganiserDto[]> {
  if (isMockMode) return MOCK_ORGANISERS;
  return get<NineOrganiserDto[]>('/api/v2/organisers');
}

/** GET /api/v2/rooms – Alle Räume */
export async function fetchRooms(): Promise<unknown[]> {
  if (isMockMode) return [{ id: 'r1', number: 'R1.001' }];
  return get<unknown[]>('/api/v2/rooms');
}

// ── Endpunkte mit institutionId ───────────────────────────────────────────────

/**
 * GET /api/v2/courses?institutionId=&organiserId=&semesterId=
 * Lädt Lehrveranstaltungen für ein Semester.
 * institutionId ist Pflicht – aus VITE_NINE_API_INSTITUTION oder Organiser-Response.
 */
export async function fetchCourses(semesterId?: string): Promise<NineCourse[]> {
  if (isMockMode) return MOCK_COURSES;
  if (!INST) throw new Error('VITE_NINE_API_INSTITUTION nicht konfiguriert. Bitte .env.local prüfen.');
  const params: Record<string, string> = { institutionId: INST };
  if (ORG) params.organiserId = ORG;
  if (semesterId) params.semesterId = semesterId;
  const raw = await get<NineCourseApiContract[]>('/api/v2/courses', params);
  return raw.map(c => ({
    id: c.courseId ?? c.externalId ?? Math.random().toString(36).slice(2),
    code: c.code,
    title: c.title ?? '(kein Titel)',
    day: extractDay(c.dates),
    startTime: extractTime(c.dates, 'start'),
    endTime: extractTime(c.dates, 'end'),
    room: c.dates?.[0]?.roomNumber,
    lecturer: c.teachings?.[0] ? `${c.teachings[0].lastName ?? ''} ${c.teachings[0].firstName ?? ''}`.trim() : undefined,
    semesterId: c.semesterId,
    source: 'api' as const,
  }));
}

/**
 * GET /api/v2/curricula?institutionId=
 * Studiengänge / Prüfungsordnungen
 */
export async function fetchCurricula(): Promise<NineCurriculumApiContract[]> {
  if (isMockMode) return [{ id: 'wi-b', name: 'Bachelor Wirtschaftsingenieurwesen (Mock)', institutionId: INST }];
  if (!INST) throw new Error('VITE_NINE_API_INSTITUTION nicht konfiguriert.');
  return get<NineCurriculumApiContract[]>('/api/v2/curricula', { institutionId: INST });
}

/**
 * GET /api/v2/modules/{curriculum}/{stage}/{semester}
 * Module eines Studiengangs und Semesters
 * stage: z. B. "B" für Bachelor
 */
export async function fetchModulesBySemester(curriculum: string, stage: string, semester: number): Promise<NineModuleApiContract[]> {
  if (isMockMode) return MOCK_MODULES.map(m => ({ id: m.id, code: m.code, name: m.title, ects: m.ects, semester: m.semester }));
  return get<NineModuleApiContract[]>(`/api/v2/modules/${encodeURIComponent(curriculum)}/${encodeURIComponent(stage)}/${semester}`);
}

// ── Verbindungstest ───────────────────────────────────────────────────────────

export async function testNineConnection(): Promise<NineApiStatus & { corsBlocked: boolean }> {
  if (isMockMode) {
    return { mode: 'mock', baseUrl: BASE, authConfigured: !!TOKEN, lastChecked: new Date().toISOString(), connected: true, corsBlocked: false };
  }
  try {
    await get<unknown[]>('/api/v2/semester');
    return { mode: 'live', baseUrl: BASE, authConfigured: !!TOKEN, lastChecked: new Date().toISOString(), connected: true, corsBlocked: false };
  } catch (err) {
    const msg = String(err);
    const corsBlocked = msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network');
    return { mode: 'live', baseUrl: BASE, authConfigured: !!TOKEN, lastChecked: new Date().toISOString(), connected: false, lastError: msg, corsBlocked };
  }
}

/**
 * Alles auf einmal laden – für den Planner
 */
export async function loadAllNineData(semesterId?: string): Promise<NineApiData> {
  if (isMockMode) {
    return {
      semesters: MOCK_SEMESTERS,
      organisers: MOCK_ORGANISERS,
      courses: MOCK_COURSES,
      modules: MOCK_MODULES,
      lastFetched: new Date().toISOString(),
      mode: 'mock',
      corsBlocked: false,
    };
  }
  try {
    const [semesters, organisers, courses] = await Promise.all([
      fetchSemesters(),
      fetchOrganisers(),
      fetchCourses(semesterId),
    ]);
    return { semesters, organisers, courses, modules: [], lastFetched: new Date().toISOString(), mode: 'live', corsBlocked: false };
  } catch (err) {
    const msg = String(err);
    const corsBlocked = msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network');
    return {
      semesters: MOCK_SEMESTERS,
      organisers: MOCK_ORGANISERS,
      courses: MOCK_COURSES,
      modules: MOCK_MODULES,
      lastFetched: new Date().toISOString(),
      mode: 'mock',
      corsBlocked,
      error: msg,
    };
  }
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
const DAYS_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function extractDay(dates?: NineCourseDateContract[]): string | undefined {
  if (!dates || dates.length === 0) return undefined;
  const d = new Date(dates[0].start ?? '');
  if (isNaN(d.getTime())) return undefined;
  return DAYS_DE[d.getDay()];
}

function extractTime(dates?: NineCourseDateContract[], which: 'start' | 'end' = 'start'): string | undefined {
  if (!dates || dates.length === 0) return undefined;
  const raw = which === 'start' ? dates[0].start : dates[0].end;
  if (!raw) return undefined;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
