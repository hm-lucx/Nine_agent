import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { StudentProfile, PlanningParams, PrimussImportData, NineApiStatus, PassedModule } from '../types';
import { student as dummyStudent } from '../data/student';
import type { NineDiscoveryReport, NineDataMode } from '../types/nineApi';
import { runDiscovery, flattenModules } from '../services/nineApiDiscoveryService';
import type { ScenarioRecommendation } from '../services/plannerService';
import { generateScenarios } from '../services/plannerService';
import type { ProfileSourceType } from '../services/studentProfileService';
import type { ExtractedStudentMeta } from '../services/pdfGradeReaderService';
import type { GradeStats } from '../services/gradeCalculationService';

const STORAGE_KEY = 'hm_modulplaner_state_v6';

interface AppState {
  student: StudentProfile;
  planningParams: PlanningParams;
  primussImport: PrimussImportData | null;
  profileSourceType: ProfileSourceType;  // demo | primuss_import | manual | mixed
  importedMeta: ExtractedStudentMeta | null;   // Stammdaten aus Notenblatt
  importedGradeStats: GradeStats | null;       // Notenstatistik nach Import
  apiStatus: NineApiStatus;
  nineReport: NineDiscoveryReport | null;
  scenarios: ScenarioRecommendation[];
  selectedScenarioId: string;
  lastPlannerUpdate: string | null;
  lastProfileUpdate: string | null;
  dataSourceMode: NineDataMode;
  isModified: boolean;
  isLoadingApi: boolean;
}

interface AppContextValue extends AppState {
  updatePlanningParams: (params: Partial<PlanningParams>) => void;
  resetToDemo: () => void;
  setPrimussImport: (data: PrimussImportData | null) => void;
  acceptPrimussImport: (meta?: ExtractedStudentMeta | null, stats?: GradeStats | null) => void;
  setApiStatus: (s: NineApiStatus) => void;
  updatePassedModules: (modules: PassedModule[]) => void;
  setProfileSourceType: (type: ProfileSourceType) => void;
  setSelectedScenario: (id: string) => void;
  setNineReport: (report: NineDiscoveryReport) => void;
  reloadNineData: () => Promise<void>;
  recalculate: () => void;
}

export const defaultPlanningParams: PlanningParams = {
  blockedDays: ['Montag', 'Freitag'],
  workingHours: {
    Montag:  { start: '08:00', end: '18:00' },
    Freitag: { start: '08:00', end: '18:00' },
  },
  blockedTimeSlots: [
    { id: 'default-mo', day: 'Montag',  startTime: '08:00', endTime: '18:00', reason: 'Arbeit', active: true },
    { id: 'default-fr', day: 'Freitag', startTime: '08:00', endTime: '18:00', reason: 'Arbeit', active: true },
  ],
  targetEcts: 30,
  maxEcts: 35,
  currentSemester: 3,
  specialization: 'Industrielle Technik / TEC',
  semesterContext: 'SoSe 2026',
  goals: ['realistisch'],
  includeWPM: true,
  includeAW: true,
  dataLabel: 'Demo',
};

const defaultApiStatus: NineApiStatus = {
  mode: 'not_configured',
  baseUrl: import.meta.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu',
  authConfigured: !!import.meta.env.VITE_NINE_API_TOKEN,
  connected: false,
};

function buildInitialState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppState>;
      return {
        student: parsed.student ?? dummyStudent,
        planningParams: parsed.planningParams ?? defaultPlanningParams,
        primussImport: parsed.primussImport ?? null,
        profileSourceType: parsed.profileSourceType ?? 'demo',
        importedMeta: parsed.importedMeta ?? null,
        importedGradeStats: parsed.importedGradeStats ?? null,
        apiStatus: defaultApiStatus,
        nineReport: null,
        scenarios: [],
        selectedScenarioId: 'scenario-a',
        lastPlannerUpdate: null,
        lastProfileUpdate: parsed.lastProfileUpdate ?? null,
        dataSourceMode: 'local_fallback',
        isModified: parsed.isModified ?? false,
        isLoadingApi: false,
      };
    }
  } catch { /* ignore */ }
  return {
    student: dummyStudent,
    planningParams: defaultPlanningParams,
    primussImport: null,
    profileSourceType: 'demo',
    importedMeta: null,
    importedGradeStats: null,
    apiStatus: defaultApiStatus,
    nineReport: null,
    scenarios: [],
    selectedScenarioId: 'scenario-a',
    lastPlannerUpdate: null,
    lastProfileUpdate: null,
    dataSourceMode: 'local_fallback',
    isModified: false,
    isLoadingApi: false,
  };
}

// Hilfsfunktion: NineDiscoveryReport → NineApiData (für plannerService)
function buildNineApiData(nineModules: ReturnType<typeof flattenModules>, report: NineDiscoveryReport | null) {
  if (!nineModules || !report) return null;
  return {
    courses: nineModules.flatMap(m => m.courses.map(c => ({
      id: c.id,
      code: m.moduleTag,
      title: m.moduleName,
      day: c.appointments[0]?.dayDe,
      startTime: c.appointments[0]?.startTime,
      endTime: c.appointments[0]?.endTime,
      room: c.rooms[0],
      lecturer: c.lecturers[0],
      source: 'api' as const,
    }))),
    modules: nineModules.map(m => ({
      id: m.id, code: m.moduleTag, title: m.moduleName, ects: 0, semester: m.stage, source: 'api' as const, dataLabel: 'API' as const,
    })),
    semesters: report.semesters.map(s => ({ id: s.semester_Id, name: s.semester_Id })),
    organisers: report.organisers.map(o => ({ id: o.organiser_Id, name: o.name })),
    lastFetched: report.testedAt,
    mode: (report.corsBlocked ? 'mock' : 'live') as 'live' | 'mock',
    corsBlocked: report.corsBlocked,
    error: report.corsBlocked ? 'CORS blockiert' : undefined,
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        student: state.student,
        planningParams: state.planningParams,
        primussImport: state.primussImport,
        profileSourceType: state.profileSourceType,
        importedMeta: state.importedMeta,
        importedGradeStats: state.importedGradeStats,
        lastProfileUpdate: state.lastProfileUpdate,
        isModified: state.isModified,
      }));
    } catch { /* ignore */ }
  }, [state.student, state.planningParams, state.primussImport, state.profileSourceType, state.importedMeta, state.importedGradeStats, state.lastProfileUpdate, state.isModified]);

  // Szenarien auto-neu berechnen
  useEffect(() => {
    const nineData = state.nineReport ? buildNineApiData(flattenModules(state.nineReport), state.nineReport) : null;
    const scenarios = generateScenarios(state.student, state.planningParams, nineData);
    setState(prev => ({ ...prev, scenarios, lastPlannerUpdate: new Date().toISOString() }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.student, state.planningParams, state.nineReport]);

  const recalculate = useCallback(() => {
    setState(prev => {
      const nineData = prev.nineReport ? buildNineApiData(flattenModules(prev.nineReport), prev.nineReport) : null;
      const scenarios = generateScenarios(prev.student, prev.planningParams, nineData);
      return { ...prev, scenarios, lastPlannerUpdate: new Date().toISOString() };
    });
  }, []);

  const reloadNineData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingApi: true }));
    try {
      const report = await runDiscovery(
        import.meta.env.VITE_NINE_CURRICULUM ?? 'WI',
        import.meta.env.VITE_NINE_TERM ?? 'SoSe 2026',
      );
      const mode = report.dataMode;
      const newStatus: NineApiStatus = {
        mode: report.corsBlocked ? 'not_configured' : report.totalModules > 0 ? 'live' : 'mock',
        baseUrl: report.baseUrl,
        authConfigured: !!import.meta.env.VITE_NINE_API_TOKEN,
        connected: !report.corsBlocked && report.totalModules > 0,
        lastChecked: report.testedAt,
      };
      setState(prev => ({ ...prev, nineReport: report, apiStatus: newStatus, dataSourceMode: mode, isLoadingApi: false }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoadingApi: false,
        apiStatus: { ...prev.apiStatus, connected: false, lastError: String(e), lastChecked: new Date().toISOString() },
      }));
    }
  }, []);

  const setNineReport = useCallback((report: NineDiscoveryReport) => {
    const mode = report.dataMode;
    const newStatus: NineApiStatus = {
      mode: report.corsBlocked ? 'not_configured' : report.totalModules > 0 ? 'live' : 'mock',
      baseUrl: report.baseUrl,
      authConfigured: !!import.meta.env.VITE_NINE_API_TOKEN,
      connected: !report.corsBlocked && report.totalModules > 0,
      lastChecked: report.testedAt,
    };
    setState(prev => ({ ...prev, nineReport: report, apiStatus: newStatus, dataSourceMode: mode }));
  }, []);

  const updatePlanningParams = (params: Partial<PlanningParams>) => {
    setState(prev => ({
      ...prev,
      planningParams: { ...prev.planningParams, ...params },
      student: { ...prev.student, blockedDays: params.blockedDays ?? prev.student.blockedDays },
      isModified: true,
    }));
  };

  const resetToDemo = () => {
    setState(prev => ({
      ...prev,
      student: dummyStudent,
      planningParams: { ...defaultPlanningParams, dataLabel: 'Demo' },
      primussImport: null,
      profileSourceType: 'demo',
      importedMeta: null,
      importedGradeStats: null,
      lastProfileUpdate: null,
      apiStatus: defaultApiStatus,
      isModified: false,
      dataSourceMode: prev.nineReport ? prev.dataSourceMode : 'local_fallback',
    }));
    localStorage.removeItem(STORAGE_KEY);
  };

  const setPrimussImport = (data: PrimussImportData | null) => {
    setState(prev => ({ ...prev, primussImport: data }));
  };

  const acceptPrimussImport = (meta?: ExtractedStudentMeta | null, stats?: GradeStats | null) => {
    const imp = state.primussImport;
    if (!imp) return;
    const newPassed: PassedModule[] = imp.modules
      .filter(m => m.status === 'bestanden')
      .map((m, i) => ({
        code: m.code ?? `IMP-${i + 1}`,
        module: m.module,
        semester: m.semester ?? 0,
        ects: m.ects ?? 0,
        grade: m.grade,
        status: 'bestanden',
        source: `PRIMUSS Import: ${imp.fileName ?? 'Text'}`,
        dataLabel: 'importiert' as const,
      }));
    const totalEcts = stats?.totalEcts ?? newPassed.reduce((s, m) => s + m.ects, 0);
    // Studentenprofil mit erkannten Stammdaten überschreiben
    setState(prev => ({
      ...prev,
      student: {
        ...prev.student,
        name: meta?.name ?? prev.student.name,
        studyProgram: meta?.studyProgram ?? prev.student.studyProgram,
        specialization: meta?.specialization ?? prev.student.specialization,
        passedModules: newPassed,
        completedEcts: totalEcts,
      },
      primussImport: { ...imp, status: 'accepted' },
      importedMeta: meta ?? null,
      importedGradeStats: stats ?? null,
      profileSourceType: prev.profileSourceType === 'demo' ? 'primuss_import' : 'mixed',
      lastProfileUpdate: new Date().toISOString(),
      isModified: true,
      planningParams: {
        ...prev.planningParams,
        dataLabel: 'importiert',
        currentSemester: meta?.currentSemester ?? prev.planningParams.currentSemester,
        specialization: meta?.specialization ?? prev.planningParams.specialization,
      },
    }));
  };

  const setProfileSourceType = (type: ProfileSourceType) => {
    setState(prev => ({ ...prev, profileSourceType: type }));
  };

  const setApiStatus = (s: NineApiStatus) => {
    setState(prev => ({ ...prev, apiStatus: s }));
  };

  const updatePassedModules = (modules: PassedModule[]) => {
    const totalEcts = modules.reduce((s, m) => s + m.ects, 0);
    setState(prev => ({
      ...prev,
      student: { ...prev.student, passedModules: modules, completedEcts: totalEcts },
      profileSourceType: prev.profileSourceType === 'demo' ? 'manual' : 'mixed',
      lastProfileUpdate: new Date().toISOString(),
      isModified: true,
    }));
  };

  const setSelectedScenario = (id: string) => {
    setState(prev => ({ ...prev, selectedScenarioId: id }));
  };

    return (
    <AppContext.Provider value={{
      ...state,
      updatePlanningParams,
      resetToDemo,
      setPrimussImport,
      acceptPrimussImport,
      setApiStatus,
      updatePassedModules,
      setProfileSourceType,
      setSelectedScenario,
      setNineReport,
      reloadNineData,
      recalculate,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
