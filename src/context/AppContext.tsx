import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { StudentProfile, PlanningParams, PrimussImportData, NineApiStatus, PassedModule } from '../types';
import { student as dummyStudent } from '../data/student';

const STORAGE_KEY = 'hm_modulplaner_state';

interface AppState {
  student: StudentProfile;
  planningParams: PlanningParams;
  primussImport: PrimussImportData | null;
  apiStatus: NineApiStatus;
  isModified: boolean;
}

interface AppContextValue extends AppState {
  updatePlanningParams: (params: Partial<PlanningParams>) => void;
  resetToDemo: () => void;
  setPrimussImport: (data: PrimussImportData | null) => void;
  acceptPrimussImport: () => void;
  setApiStatus: (s: NineApiStatus) => void;
  updatePassedModules: (modules: PassedModule[]) => void;
}

const defaultPlanningParams: PlanningParams = {
  blockedDays: ['Montag', 'Freitag'],
  workingHours: {
    Montag:  { start: '08:00', end: '18:00' },
    Freitag: { start: '08:00', end: '18:00' },
  },
  targetEcts: 30,
  maxEcts: 35,
  currentSemester: 3,
  specialization: 'Industrielle Technik / TEC',
  semesterContext: 'SoSe 2026',
  goals: ['realistisch'],
  includeWPM: true,
  includeAW: true,
  includeCertificates: false,
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
        apiStatus: defaultApiStatus,
        isModified: parsed.isModified ?? false,
      };
    }
  } catch { /* ignore */ }
  return {
    student: dummyStudent,
    planningParams: defaultPlanningParams,
    primussImport: null,
    apiStatus: defaultApiStatus,
    isModified: false,
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
        isModified: state.isModified,
      }));
    } catch { /* ignore storage errors */ }
  }, [state]);

  const updatePlanningParams = (params: Partial<PlanningParams>) => {
    setState(prev => ({
      ...prev,
      planningParams: { ...prev.planningParams, ...params },
      student: { ...prev.student, blockedDays: params.blockedDays ?? prev.student.blockedDays },
      isModified: true,
    }));
  };

  const resetToDemo = () => {
    setState({
      student: dummyStudent,
      planningParams: { ...defaultPlanningParams, dataLabel: 'Demo' },
      primussImport: null,
      apiStatus: defaultApiStatus,
      isModified: false,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const setPrimussImport = (data: PrimussImportData | null) => {
    setState(prev => ({ ...prev, primussImport: data }));
  };

  const acceptPrimussImport = () => {
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
    setState(prev => ({
      ...prev,
      student: {
        ...prev.student,
        passedModules: [
          ...prev.student.passedModules,
          ...newPassed.filter(n => !prev.student.passedModules.some(p => p.code === n.code)),
        ],
      },
      primussImport: { ...imp, status: 'accepted' },
      isModified: true,
      planningParams: { ...prev.planningParams, dataLabel: 'importiert' },
    }));
  };

  const setApiStatus = (s: NineApiStatus) => {
    setState(prev => ({ ...prev, apiStatus: s }));
  };

  const updatePassedModules = (modules: PassedModule[]) => {
    const totalEcts = modules.reduce((s, m) => s + m.ects, 0);
    setState(prev => ({
      ...prev,
      student: { ...prev.student, passedModules: modules, completedEcts: totalEcts },
      isModified: true,
    }));
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
