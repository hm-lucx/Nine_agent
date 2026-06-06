/**
 * NINE Kursdetail-Typen – Sprint 4 Nachbesserung
 *
 * Sicherheit:
 *  - accessKeyRawTransient: NUR im Arbeitsspeicher, NIEMALS loggen/persistieren
 *  - Moodle-Aktionen nur nach expliziter Bestätigung
 */

// ── Moodle-Ressource ──────────────────────────────────────────────────────────

export interface MoodleResource {
  label: string;
  url: string;
  /** Maskiert für UI-Anzeige: "••••••••••" */
  accessKeyMasked: string | null;
  /**
   * Roher Schlüssel – NUR transient im Speicher!
   * Nicht serialisieren, nicht loggen, nicht in localStorage.
   */
  accessKeyRawTransient?: string;
  hasAccessKey: boolean;
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

// ── Termin ────────────────────────────────────────────────────────────────────

export interface CourseAppointment {
  date: string | null;        // "11.06.2026"
  day: string | null;         // "Mittwoch"
  startTime: string | null;   // "08:15"
  endTime: string | null;     // "11:30"
  room: string | null;
  lecturer: string | null;
  sourceText: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

// ── Einschreibestatus ─────────────────────────────────────────────────────────

export type EnrollmentStatusCode = 'not_enrolled' | 'enrolled' | 'waitlist' | 'closed' | 'unknown';

export interface EnrollmentInfo {
  status: EnrollmentStatusCode;
  statusText: string | null;
  actionButtonText: string | null;
  canEnroll: boolean;
  canUnenroll: boolean;
  requiresConfirmation: boolean;
  capacityText: string | null;
  allocationText: string | null;
}

// ── Agenten-Aktion ────────────────────────────────────────────────────────────

export type AgentActionType =
  | 'OPEN_COURSE_PAGE'
  | 'OPEN_MOODLE_LINK'
  | 'COPY_MOODLE_ACCESS_KEY'
  | 'PREPARE_ENROLLMENT'
  | 'EXECUTE_ENROLLMENT'
  | 'PREPARE_UNENROLLMENT'
  | 'EXECUTE_UNENROLLMENT'
  | 'EXTRACT_ALL_DATES'
  | 'NO_ACTION';

export type RiskLevel = 'low' | 'medium' | 'high';
export type ActionStatus = 'proposed' | 'confirmed' | 'executed' | 'failed' | 'cancelled';

export interface AgentAction {
  id: string;
  type: AgentActionType;
  title: string;
  description: string;
  targetUrl?: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  requiresDoubleConfirmation?: boolean;    // für High-Risk (Eintragen/Austragen)
  status: ActionStatus;
  warningText?: string;
}

// ── Extrahiertes Kursdetail ───────────────────────────────────────────────────

export interface ExtractedCourseDetail {
  source: 'NINE_COURSE_DETAIL';
  sourceUrl: string;
  courseId: string | null;
  extractedAt: string;                    // ISO-Timestamp

  courseTitle: string | null;
  moduleName: string | null;
  moduleTag: string | null;
  curriculumPath: string | null;          // z. B. "WI > 3. Semester"
  courseGroup: string | null;

  resources: MoodleResource[];
  moodle: MoodleResource | null;          // erstes erkanntes Moodle-Element

  appointments: CourseAppointment[];
  nextAppointment: CourseAppointment | null;
  allAppointmentsLink: string | null;

  lecturer: string | null;
  room: string | null;

  enrollment: EnrollmentInfo;
  availableActions: AgentAction[];

  rawText: string;                        // für Debugging (kein Passwort enthalten)
  warnings: string[];
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

// ── Serialisierbare Version (ohne transiente Secrets) ─────────────────────────

export type SafeCourseDetail = Omit<ExtractedCourseDetail, 'resources' | 'moodle'> & {
  resources: Omit<MoodleResource, 'accessKeyRawTransient'>[];
  moodle: Omit<MoodleResource, 'accessKeyRawTransient'> | null;
};

/** Entfernt accessKeyRawTransient vor JSON-Serialisierung */
export function toSafeCourseDetail(detail: ExtractedCourseDetail): SafeCourseDetail {
  const sanitize = (r: MoodleResource): Omit<MoodleResource, 'accessKeyRawTransient'> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessKeyRawTransient: _, ...safe } = r;
    return safe;
  };
  return {
    ...detail,
    resources: detail.resources.map(sanitize),
    moodle: detail.moodle ? sanitize(detail.moodle) : null,
  };
}
