/**
 * NINE API v2 – Typen
 * Basis: https://nine.hm.edu/swagger/docs/v2
 * Live getestet: 2026-06-05
 *
 * Wichtige Erkenntnisse:
 *  - GET /api/v2/modules/{curriculum}/{stage}/{semester} funktioniert öffentlich ohne Auth
 *  - curriculum = "WI" (Wirtschaftsingenieurwesen)
 *  - stage = 1–7 (Studiensemester)
 *  - semester = "SoSe 2026" | "WiSe 2025" usw.
 *  - courses[] = Veranstaltungen mit Appointments (Wochentag/Uhrzeit/Raum/Dozent)
 *  - Viele Module haben leere courses[] – nur Modulkatalog, keine Terminplanung
 */

// ── Rohe API-Typen (exakt wie die API antwortet) ─────────────────────────────

export interface NineRawSemester {
  semester_Id: string;
  begin: string;
  end: string;
}

export interface NineRawOrganiser {
  organiser_Id: string;
  name: string;
}

export interface NineRawLocation {
  number: string;
  building: string;
  campus: string;
  description: string | null;
  name: string | null;
  shortName: string | null;
}

export interface NineRawLecturer {
  title: string;
  firstName: string;
  lastName: string;
  faculty: string | null;
  shortName: string | null;
  id?: string;
  actions?: { title: string; href: string }[];
}

export interface NineRawAppointment {
  dayOfWeekName: string;  // "Monday", "Wednesday", etc. – Englisch!
  timeBegin: string;       // "12:30:00"
  timeEnd: string;         // "16:00:00"
}

export interface NineRawCourse {
  id: string;
  description: string | null;
  category: string | null;
  department: string | null;
  level: string | null;
  ects: number;
  sws: number;
  usCredits: number;
  locations: NineRawLocation[];
  lecturer: NineRawLecturer[];
  appointments: NineRawAppointment[];
  modules: unknown | null;
  dates: unknown | null;
  name: string;
  shortName: string;
  actions?: { title: string; href: string }[];
}

export interface NineRawModule {
  moduleTag: string;       // z. B. "G3", "B1", "PPQM"
  moduleName: string;      // z. B. "Technische Mechanik"
  subjectTag: string;      // z. B. "TM", "Mathe1 Vorl"
  subjectName: string;     // z. B. "Vorlesung", ""
  courses: NineRawCourse[];
  exams: unknown[];
}

// ── Normalisierte Typen (für die App) ────────────────────────────────────────

export type NineModuleType = 'Pflichtmodul' | 'WPM' | 'AW' | 'unbekannt';
export type NineDataMode = 'live_nine' | 'partial_nine' | 'local_fallback' | 'manual_only';

export interface NormalizedAppointment {
  dayDe: string;           // "Mittwoch"
  dayEn: string;           // "Wednesday"
  startTime: string;       // "12:30"
  endTime: string;         // "16:00"
  room?: string;
  lecturer?: string;
  raw: NineRawAppointment;
}

export interface NormalizedCourseOffering {
  id: string;
  courseName: string;
  shortName: string;
  lecturers: string[];     // "Prof. Dr. Muster"
  rooms: string[];         // ["R 0.056"]
  appointments: NormalizedAppointment[];
  ects: number;
  sws: number;
  raw: NineRawCourse;
}

export interface NormalizedModuleOffering {
  id: string;              // "${curriculum}-${stage}-${moduleTag}-${subjectTag}"
  source: 'NINE_API';
  curriculum: string;      // "WI"
  stage: number;           // 1–7
  term: string;            // "SoSe 2026"
  moduleTag: string;       // "G3"
  moduleName: string;      // "Technische Mechanik"
  subjectTag: string;      // "TM"
  subjectName: string;     // ""
  moduleType: NineModuleType;
  hasSchedule: boolean;    // true wenn courses.length > 0 und appointments.length > 0
  courses: NormalizedCourseOffering[];
  raw: NineRawModule;
}

// ── Diagnose-Typen ────────────────────────────────────────────────────────────

export type DiagStatus = 'ok' | 'error' | 'cors' | 'auth' | 'empty' | 'pending' | 'skipped';

export interface DiagnosticResult {
  endpoint: string;
  url: string;
  status: DiagStatus;
  httpCode: number | null;
  durationMs: number;
  itemCount: number;
  errorMessage: string | null;
  rawPreview: string | null;
  testedAt: string;
}

export interface NineDiscoveryReport {
  testedAt: string;
  baseUrl: string;
  results: DiagnosticResult[];
  semesters: NineRawSemester[];
  organisers: NineRawOrganiser[];
  modulesByStage: Record<number, NormalizedModuleOffering[]>;
  dataMode: NineDataMode;
  totalModules: number;
  modulesWithSchedule: number;
  corsBlocked: boolean;
  summary: string;
}
