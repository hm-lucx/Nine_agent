// ── Basis-Typen ─────────────────────────────────────────────────────────────
export type ModuleType = 'Pflichtmodul' | 'WPM' | 'AW' | 'Fakultät-13' | 'Zertifikat' | 'Pflichtmodul Studienrichtung TEC';
export type SourceConfidence = 'hoch' | 'mittel' | 'niedrig' | 'manuell zu prüfen';
export type AvailabilityStatus = true | false | 'conditional';
export type FileStatus = 'gefunden' | 'gelesen' | 'teilweise gelesen' | 'nicht lesbar' | 'manuell zu prüfen';
export type DataLabel = 'Demo' | 'lokal' | 'importiert' | 'API' | 'manuell' | 'unsicher' | 'Quelle prüfen';
export type ModuleStatus = 'offen' | 'bestanden' | 'geplant' | 'aktuell empfohlen' | 'gesperrt' | 'nicht angeboten' | 'Daten fehlen';
export type PlanningGoal =
  | 'schnell_fertig'
  | 'realistisch'
  | 'entspannt'
  | 'notenschnitt'
  | 'wpm_einbauen'
  | 'aw_einbauen'
  | 'zertifikat_einbauen';

// ── Module ───────────────────────────────────────────────────────────────────
export interface Module {
  id: string;
  moduleCode: string;
  title: string;
  type: ModuleType;
  semester: number | null;
  ects: number;
  sws?: number;
  source: string;
  sourceConfidence: SourceConfidence;
  dataLabel?: DataLabel;
  notes?: string;
}

// ── Stundenplan ──────────────────────────────────────────────────────────────
export interface ScheduleEntry {
  id: string;
  moduleCode: string;
  moduleTitle: string;
  type: ModuleType;
  semester: number | null;
  group?: string;
  day: string;
  startTime?: string;
  endTime?: string;
  timeRaw?: string;
  room?: string;
  lecturer?: string;
  availableForDummy: AvailabilityStatus;
  blockedReason?: string;
  source: string;
  sourceConfidence: SourceConfidence;
  notes?: string;
}

// ── Student ──────────────────────────────────────────────────────────────────
export interface PassedModule {
  code: string;
  module: string;
  semester: number;
  ects: number;
  grade?: number;          // z. B. 1.7, 2.3 – optional
  attemptCount?: number;   // Anzahl Prüfungsantritte
  passedDate?: string;     // z. B. "WiSe 2024/25"
  status: string;
  source?: string;
  dataLabel?: DataLabel;
}

export interface OpenModule {
  code: string;
  module: string;
  semester: number;
  ects: number;
  type?: ModuleType;
  status?: ModuleStatus;
  currentlyAvailable?: boolean | 'conditional';
  blockedReason?: string;
  source?: string;
}

export interface ProgressionStatus {
  semester_1_completed: boolean;
  semester_2_completed: boolean;
  semester_3_allowed: boolean;
  semester_4_allowed: boolean;
  semester_4_block_reason?: string;
}

export interface StudentProfile {
  name: string;
  matriculationNumber: string;
  studyProgram: string;
  specialization: string;
  semesterContext: string;
  passedModules: PassedModule[];
  openModules: OpenModule[];
  completedEcts: number;
  blockedDays: string[];
  progressionStatus: ProgressionStatus;
  goals?: string[];
  notes?: string;
}

// ── Planungsparameter ────────────────────────────────────────────────────────
export interface WorkingHours {
  start: string;   // "09:00"
  end: string;     // "17:00"
}

export interface AvailabilityBlock {
  id: string;
  day: string;           // "Montag" etc.
  startTime: string;     // "08:00"
  endTime: string;       // "13:00"
  reason: 'Arbeit' | 'privat' | 'Pendeln' | 'sonstiges';
  active: boolean;
}

export interface PlanningParams {
  blockedDays: string[];
  workingHours: Record<string, WorkingHours>;  // day -> hours
  blockedTimeSlots: AvailabilityBlock[];        // stundenweise Sperrzeiten
  targetEcts: number;
  maxEcts: number;
  currentSemester: number;
  specialization: string;
  semesterContext: string;
  goals: PlanningGoal[];
  includeWPM: boolean;
  includeAW: boolean;
  /** @deprecated Sprint 4: Zertifikate-Option wurde entfernt */
  includeCertificates?: boolean;
  dataLabel: DataLabel;
}

// ── Regeln ───────────────────────────────────────────────────────────────────
export interface Rule {
  id: string;
  title: string;
  ruleType: string;
  description: string;
  affectedSemester?: number[];
  affectedModules?: string[];
  source: string;
  priority: number;
  confidence: SourceConfidence;
  notes?: string;
}

// ── Empfehlung ───────────────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  moduleCode: string;
  moduleTitle: string;
  type: ModuleType;
  semester: number | null;
  group?: string;
  day: string;
  startTime?: string;
  endTime?: string;
  timeRaw?: string;
  ects: number;
  reason: string;
  source: string;
  warnings?: string[];
}

export interface NotRecommendedModule {
  id: string;
  moduleCode: string;
  moduleTitle: string;
  reason: string;
  affectedRule?: string;
  source: string;
  severity: 'gesperrt' | 'Warnung' | 'bedingt möglich';
}

// ── Datenquellen ─────────────────────────────────────────────────────────────
export interface SourceEntry {
  id: string;
  fileName: string;
  fileType: 'JSON' | 'Markdown' | 'PDF' | 'Word' | 'Bild' | 'Text';
  purpose: string;
  extractedInformation: string[];
  priority: number;
  status: FileStatus;
  confidence: SourceConfidence;
  notes?: string;
}

// ── PRIMUSS Import ───────────────────────────────────────────────────────────
export interface PrimussModuleEntry {
  module: string;
  code?: string;
  grade?: number;
  ects?: number;
  status: 'bestanden' | 'nicht bestanden' | 'offen' | 'unbekannt';
  semester?: number;
  confidence: SourceConfidence;
  rawText?: string;
}

export interface PrimussImportData {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  importedAt: string;
  mode: 'json' | 'csv' | 'text' | 'pdf_manual' | 'word_manual' | 'image_manual';
  modules: PrimussModuleEntry[];
  rawContent?: string;
  parseWarnings: string[];
  status: 'pending' | 'parsed' | 'accepted' | 'rejected';
}

// ── NINE API ─────────────────────────────────────────────────────────────────
export interface NineApiConfig {
  baseUrl: string;
  token?: string;
  mode: 'live' | 'mock' | 'not_configured';
}

export interface NineApiStatus {
  mode: NineApiConfig['mode'];
  baseUrl: string;
  authConfigured: boolean;
  lastChecked?: string;
  lastError?: string;
  connected: boolean;
}

// ── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  group?: string;
}
