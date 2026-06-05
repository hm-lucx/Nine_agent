/**
 * NINE API Discovery Service – Sprint 5
 *
 * Testet systematisch alle relevanten NINE-API-Endpunkte und
 * normalisiert die Rohdaten in ein einheitliches Format.
 *
 * Live getestete Erkenntnisse (2026-06-05):
 *  ✅ GET /api/v2/semester          – öffentlich, keine Auth
 *  ✅ GET /api/v2/organisers        – öffentlich, WI = "FK 09"
 *  ✅ GET /api/v2/modules/WI/{1-7}/{semester} – liefert echte Modullisten
 *  ⚠️  courses[] meist leer – nur Modulkatalog, Terminplanung nur bei manchen
 *  ❌ GET /api/v2/courses?institutionId=FK%2009 – gibt leere Liste zurück
 *
 * CORS-Status: Öffentliche GET-Endpoints sind CORS-fähig (kein Auth nötig).
 */

import type {
  NineRawSemester, NineRawOrganiser, NineRawModule,
  NormalizedModuleOffering, NormalizedCourseOffering, NormalizedAppointment,
  DiagnosticResult, NineDiscoveryReport, DiagStatus, NineDataMode,
} from '../types/nineApi';

const BASE = (import.meta.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu').replace(/\/$/, '');
const CURRICULUM = import.meta.env.VITE_NINE_CURRICULUM ?? 'WI';
const TERM = import.meta.env.VITE_NINE_TERM ?? 'SoSe 2026';
const TOKEN = import.meta.env.VITE_NINE_API_TOKEN ?? '';
const MODE = import.meta.env.VITE_NINE_API_MODE ?? 'live';

export { BASE as apiBaseUrl, CURRICULUM as defaultCurriculum, TERM as defaultTerm, TOKEN, MODE };

function buildHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`;
  return h;
}

async function probeFetch(path: string, params?: Record<string, string>): Promise<{
  ok: boolean; status: number; body: string; durationMs: number;
}> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const t0 = Date.now();
  try {
    const resp = await fetch(url.toString(), { headers: buildHeaders() });
    const body = await resp.text();
    return { ok: resp.ok, status: resp.status, body, durationMs: Date.now() - t0 };
  } catch (e) {
    const msg = String(e);
    const isCors = msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network');
    return { ok: false, status: isCors ? -999 : -1, body: msg, durationMs: Date.now() - t0 };
  }
}

function diagStatus(ok: boolean, status: number, body: string): DiagStatus {
  if (ok) return body === '[]' || body === 'null' || body === '' ? 'empty' : 'ok';
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'error';
  if (status === -999) return 'cors';
  return 'error';
}

function makeDiag(
  endpoint: string, path: string, result: Awaited<ReturnType<typeof probeFetch>>,
  count = 0,
): DiagnosticResult {
  const url = `${BASE}${path}`;
  const ds = diagStatus(result.ok, result.status, result.body);
  return {
    endpoint,
    url,
    status: ds,
    httpCode: result.status > 0 ? result.status : null,
    durationMs: result.durationMs,
    itemCount: count,
    errorMessage: ds !== 'ok' && ds !== 'empty' ? result.body.slice(0, 300) : null,
    rawPreview: result.body.slice(0, 500),
    testedAt: new Date().toISOString(),
  };
}

// ── Wochentag Englisch → Deutsch ─────────────────────────────────────────────
const DAY_MAP: Record<string, string> = {
  Monday: 'Montag', Tuesday: 'Dienstag', Wednesday: 'Mittwoch',
  Thursday: 'Donnerstag', Friday: 'Freitag', Saturday: 'Samstag', Sunday: 'Sonntag',
};

function normTime(t: string): string {
  return t?.slice(0, 5) ?? '';  // "12:30:00" → "12:30"
}

function normalizeCourse(c: import('../types/nineApi').NineRawCourse): NormalizedCourseOffering {
  const lecturers = c.lecturer?.map(l => `${l.title ? l.title + ' ' : ''}${l.firstName} ${l.lastName}`.trim()) ?? [];
  const rooms = c.locations?.map(l => l.number).filter(Boolean) ?? [];
  const appointments: NormalizedAppointment[] = (c.appointments ?? []).map(a => ({
    dayEn: a.dayOfWeekName,
    dayDe: DAY_MAP[a.dayOfWeekName] ?? a.dayOfWeekName,
    startTime: normTime(a.timeBegin),
    endTime: normTime(a.timeEnd),
    room: rooms[0],
    lecturer: lecturers[0],
    raw: a,
  }));
  return {
    id: c.id,
    courseName: c.name,
    shortName: c.shortName,
    lecturers,
    rooms,
    appointments,
    ects: c.ects ?? 0,
    sws: c.sws ?? 0,
    raw: c,
  };
}

function guessModuleType(m: NineRawModule, stage: number): NormalizedModuleOffering['moduleType'] {
  const tag = m.moduleTag?.toUpperCase() ?? '';
  const name = m.moduleName?.toLowerCase() ?? '';
  if (name.includes('wpm') || tag.startsWith('WPM')) return 'WPM';
  if (name.includes('allgemeinwissenschaft') || name.includes('aw ') || tag.startsWith('AW')) return 'AW';
  if (stage >= 1 && stage <= 7) return 'Pflichtmodul';
  return 'unbekannt';
}

export function normalizeNineModule(
  raw: NineRawModule, stage: number, curriculum: string, term: string,
): NormalizedModuleOffering {
  const courses = (raw.courses ?? []).map(normalizeCourse);
  const hasSchedule = courses.some(c => c.appointments.length > 0);
  return {
    id: `${curriculum}-${stage}-${raw.moduleTag}-${raw.subjectTag}`,
    source: 'NINE_API',
    curriculum,
    stage,
    term,
    moduleTag: raw.moduleTag,
    moduleName: raw.moduleName,
    subjectTag: raw.subjectTag,
    subjectName: raw.subjectName ?? '',
    moduleType: guessModuleType(raw, stage),
    hasSchedule,
    courses,
    raw,
  };
}

// ── Einzelner Stage laden ─────────────────────────────────────────────────────
export async function fetchStage(
  stage: number,
  curriculum = CURRICULUM,
  term = TERM,
): Promise<{ modules: NormalizedModuleOffering[]; diag: DiagnosticResult }> {
  const path = `/api/v2/modules/${encodeURIComponent(curriculum)}/${stage}/${encodeURIComponent(term)}`;
  const r = await probeFetch(path);
  let modules: NormalizedModuleOffering[] = [];
  if (r.ok && r.body && r.body !== '[]') {
    try {
      const raw: NineRawModule[] = JSON.parse(r.body);
      modules = raw.map(m => normalizeNineModule(m, stage, curriculum, term));
    } catch { /* ignore parse error */ }
  }
  return { modules, diag: makeDiag(`modules/${curriculum}/${stage}`, path, r, modules.length) };
}

// ── Alle Stages 1–7 laden ─────────────────────────────────────────────────────
export async function fetchAllStages(
  curriculum = CURRICULUM,
  term = TERM,
  stages = [1, 2, 3, 4, 5, 6, 7],
): Promise<{ modulesByStage: Record<number, NormalizedModuleOffering[]>; diags: DiagnosticResult[] }> {
  const results = await Promise.all(stages.map(s => fetchStage(s, curriculum, term)));
  const modulesByStage: Record<number, NormalizedModuleOffering[]> = {};
  const diags: DiagnosticResult[] = [];
  results.forEach((r, i) => {
    modulesByStage[stages[i]] = r.modules;
    diags.push(r.diag);
  });
  return { modulesByStage, diags };
}

// ── Vollständige Diagnose ─────────────────────────────────────────────────────
export async function runDiscovery(
  curriculum = CURRICULUM,
  term = TERM,
): Promise<NineDiscoveryReport> {
  const t = new Date().toISOString();
  const diags: DiagnosticResult[] = [];
  let semesters: NineRawSemester[] = [];
  let organisers: NineRawOrganiser[] = [];
  let corsBlocked = false;

  // Test: /semester
  const semR = await probeFetch('/api/v2/semester');
  if (semR.ok) {
    try { semesters = JSON.parse(semR.body); } catch { /* ignore */ }
  }
  const semDiag = makeDiag('semester', '/api/v2/semester', semR, semesters.length);
  diags.push(semDiag);
  if (semDiag.status === 'cors') corsBlocked = true;

  // Test: /organisers
  const orgR = await probeFetch('/api/v2/organisers');
  if (orgR.ok) {
    try { organisers = JSON.parse(orgR.body); } catch { /* ignore */ }
  }
  diags.push(makeDiag('organisers', '/api/v2/organisers', orgR, organisers.length));

  // Test: /courses (mit FK 09)
  const crsR = await probeFetch('/api/v2/courses', { institutionId: 'FK 09', semesterId: term });
  let crsCount = 0;
  if (crsR.ok) { try { crsCount = JSON.parse(crsR.body).length; } catch { /* ignore */ } }
  diags.push(makeDiag('courses?institutionId=FK 09', '/api/v2/courses', crsR, crsCount));

  // Module Stages 1–7
  const { modulesByStage, diags: stageDiags } = await fetchAllStages(curriculum, term);
  diags.push(...stageDiags);

  const allModules = Object.values(modulesByStage).flat();
  const withSchedule = allModules.filter(m => m.hasSchedule).length;
  const anyOk = diags.some(d => d.status === 'ok');
  const dataMode: NineDataMode = corsBlocked ? 'local_fallback'
    : !anyOk ? 'local_fallback'
    : allModules.length > 0 ? 'live_nine' : 'partial_nine';

  const summary = corsBlocked
    ? 'CORS blockiert direkte Browser-Anfragen. Alle Endpoints getestet, Ergebnisse sichtbar im UI.'
    : `${allModules.length} Module aus Stages 1–7 geladen, ${withSchedule} mit Terminplanung.`;

  return {
    testedAt: t,
    baseUrl: BASE,
    results: diags,
    semesters,
    organisers,
    modulesByStage,
    dataMode,
    totalModules: allModules.length,
    modulesWithSchedule: withSchedule,
    corsBlocked,
    summary,
  };
}

// ── Flache Module-Liste ───────────────────────────────────────────────────────
export function flattenModules(report: NineDiscoveryReport): NormalizedModuleOffering[] {
  return Object.values(report.modulesByStage).flat();
}
