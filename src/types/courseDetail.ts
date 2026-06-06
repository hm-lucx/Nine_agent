/**
 * Kursdetail-Typen (Frontend-Seite)
 * Gespiegelt von agent-server/types/courseDetail.ts
 * Kein accessKeyRawTransient auf der Client-Seite!
 */

export interface MoodleResource {
  label: string;
  url: string;
  accessKeyMasked: string | null;
  hasAccessKey: boolean;
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

export interface CourseAppointment {
  date: string | null;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  lecturer: string | null;
  sourceText: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

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

export type AgentActionType =
  | 'OPEN_COURSE_PAGE' | 'OPEN_MOODLE_LINK' | 'COPY_MOODLE_ACCESS_KEY'
  | 'PREPARE_ENROLLMENT' | 'EXECUTE_ENROLLMENT'
  | 'PREPARE_UNENROLLMENT' | 'EXECUTE_UNENROLLMENT'
  | 'EXTRACT_ALL_DATES' | 'NO_ACTION';

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
  requiresDoubleConfirmation?: boolean;
  status: ActionStatus;
  warningText?: string;
}

export interface ExtractedCourseDetail {
  source: 'NINE_COURSE_DETAIL';
  sourceUrl: string;
  courseId: string | null;
  extractedAt: string;
  courseTitle: string | null;
  moduleName: string | null;
  moduleTag: string | null;
  curriculumPath: string | null;
  courseGroup: string | null;
  resources: MoodleResource[];
  moodle: MoodleResource | null;
  appointments: CourseAppointment[];
  nextAppointment: CourseAppointment | null;
  allAppointmentsLink: string | null;
  lecturer: string | null;
  room: string | null;
  enrollment: EnrollmentInfo;
  availableActions: AgentAction[];
  rawText: string;
  warnings: string[];
  confidence: 'hoch' | 'mittel' | 'niedrig';
}

export interface CourseDetailApiResponse {
  ok: boolean;
  courseDetail?: ExtractedCourseDetail;
  actions?: AgentAction[];
  warnings?: string[];
  error?: string;
}
