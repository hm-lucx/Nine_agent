import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import PassedModulesTable from './components/PassedModulesTable';
import OpenModules from './components/OpenModules';
import RecommendationTable from './components/RecommendationTable';
import NotRecommendedTable from './components/NotRecommendedTable';
import ScheduleView from './components/ScheduleView';
import PlanningParams from './components/PlanningParams';
import StudentPerformanceImport from './components/StudentPerformanceImport';
import NineApiDiagnostics from './components/NineApiDiagnostics';
import DataSourceStatus from './components/DataSourceStatus';
import StudentChatbot from './components/StudentChatbot';
import AvailabilityManager from './components/AvailabilityManager';
import AgentPanel from './components/AgentPanel';
import ArchivePage from './components/archive/ArchivePage';
import type { NineDataMode } from './types/nineApi';
import './App.css';

interface NavSection {
  label: string;
  items: { id: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Übersicht',
    items: [
      { id: 'dashboard',        label: 'Dashboard' },
      { id: 'planning-params',  label: 'Planungsparameter' },
      { id: 'data-sources',     label: 'Datenquellen & Status' },
    ],
  },
  {
    label: 'Module',
    items: [
      { id: 'passed',           label: 'Bestandene Module' },
      { id: 'open',             label: 'Offene Module' },
      { id: 'recommendation',   label: 'Empfehlungsszenarien' },
      { id: 'not-recommended',  label: 'Nicht belegbar' },
      { id: 'schedule',         label: 'Stundenplan' },
    ],
  },
  {
    label: 'Daten & Import',
    items: [
      { id: 'performance',    label: 'Meine Leistungen' },
      { id: 'availability',   label: 'Verfügbarkeit' },
      { id: 'chatbot',        label: 'Assistent (Chat)' },
      { id: 'nine-diagnostics', label: 'NINE API Diagnose' },
    ],
  },
  {
    label: '🤖 Agent',
    items: [
      { id: 'agent', label: 'NINE-Agent (Playwright)' },
    ],
  },
  {
    label: 'Archiv & Nachweise',
    items: [
      { id: 'archive',          label: 'Archiv & Nachweise' },
    ],
  },
];

const MODE_BADGE: Record<NineDataMode, { cls: string; label: string }> = {
  live_nine:      { cls: 'badge-ok',   label: 'API live' },
  partial_nine:   { cls: 'badge-warn', label: 'API teilweise' },
  local_fallback: { cls: 'badge-code', label: 'Fallback' },
  manual_only:    { cls: 'badge-code', label: 'Manuell' },
};

function renderPage(active: string) {
  switch (active) {
    case 'dashboard':        return <Dashboard />;
    case 'planning-params':  return <PlanningParams />;
    case 'data-sources':     return <DataSourceStatus />;
    case 'passed':           return <PassedModulesTable />;
    case 'open':             return <OpenModules />;
    case 'recommendation':   return <RecommendationTable />;
    case 'not-recommended':  return <NotRecommendedTable />;
    case 'schedule':         return <ScheduleView />;
    case 'performance':      return <StudentPerformanceImport />;
    case 'availability':     return <AvailabilityManager />;
    case 'agent':            return <AgentPanel />;
    case 'chatbot':          return <StudentChatbot />;
    case 'nine-diagnostics': return <NineApiDiagnostics />;
    case 'archive':          return <ArchivePage />;
    default:                 return <Dashboard />;
  }
}

function AppShell() {
  const [active, setActive] = useState<string>('dashboard');
  const { reloadNineData, isLoadingApi, dataSourceMode, scenarios, nineReport } = useApp();
  const modeMeta = MODE_BADGE[dataSourceMode] ?? MODE_BADGE.local_fallback;

  // NINE API-Daten beim Start laden
  useEffect(() => {
    reloadNineData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">HM Modulplaner</div>
          <div className="brand-sub">WI Bachelor · TEC · SoSe 2026</div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(sec => (
            <div key={sec.label} className="nav-section">
              <div className="nav-section-label">{sec.label}</div>
              {sec.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${active === item.id ? 'nav-item-active' : ''}`}
                  onClick={() => setActive(item.id)}
                >
                  {item.label}
                  {item.id === 'recommendation' && scenarios.length > 0 && (
                    <span style={{ marginLeft: 4, fontSize: '0.68rem', opacity: 0.8 }}>({scenarios.length})</span>
                  )}
                  {item.id === 'nine-diagnostics' && nineReport && (
                    <span className={`badge ${nineReport.totalModules > 0 ? 'badge-ok' : 'badge-warn'}`} style={{ marginLeft: 4, fontSize: '0.6rem', padding: '1px 5px' }}>
                      {nineReport.totalModules > 0 ? `${nineReport.totalModules}` : '!'}
                    </span>
                  )}
                  {item.id === 'nine-diagnostics' && !nineReport && isLoadingApi && (
                    <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>⟳</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-note">Prototyp Sprint 5</div>
          <div className="footer-note" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className={`badge ${modeMeta.cls}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
              {modeMeta.label}
            </span>
            {isLoadingApi && <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>⟳</span>}
          </div>
          <div className="footer-note">NINE API + /inhalte</div>
        </div>
      </aside>

      <main className="main-content">
        {renderPage(active)}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
