import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './components/Dashboard';
import PassedModulesTable from './components/PassedModulesTable';
import OpenModulesTable from './components/OpenModulesTable';
import RecommendationTable from './components/RecommendationTable';
import NotRecommendedTable from './components/NotRecommendedTable';
import ScheduleView from './components/ScheduleView';
import PlanningParams from './components/PlanningParams';
import PrimussImport from './components/PrimussImport';
import NineApiStatus from './components/NineApiStatus';
import ArchivePage from './components/archive/ArchivePage';
import './App.css';

interface NavSection {
  label: string;
  items: { id: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Übersicht',
    items: [
      { id: 'dashboard',       label: 'Dashboard' },
      { id: 'planning-params', label: 'Planungsparameter' },
    ],
  },
  {
    label: 'Module',
    items: [
      { id: 'passed',          label: 'Bestandene Module' },
      { id: 'open',            label: 'Offene Module (Sem 1–7)' },
      { id: 'recommendation',  label: 'Empfehlung' },
      { id: 'not-recommended', label: 'Nicht belegbar' },
      { id: 'schedule',        label: 'Stundenplan' },
    ],
  },
  {
    label: 'Daten & Import',
    items: [
      { id: 'primuss',         label: 'PRIMUSS Import' },
      { id: 'api-status',      label: 'NINE API Status' },
    ],
  },
  {
    label: 'Archiv & Nachweise',
    items: [
      { id: 'archive',         label: 'Archiv & Nachweise' },
    ],
  },
];

function renderPage(active: string) {
  switch (active) {
    case 'dashboard':       return <Dashboard />;
    case 'planning-params': return <PlanningParams />;
    case 'passed':          return <PassedModulesTable />;
    case 'open':            return <OpenModulesTable />;
    case 'recommendation':  return <RecommendationTable />;
    case 'not-recommended': return <NotRecommendedTable />;
    case 'schedule':        return <ScheduleView />;
    case 'primuss':         return <PrimussImport />;
    case 'api-status':      return <NineApiStatus />;
    case 'archive':         return <ArchivePage />;
    default:                return <Dashboard />;
  }
}

function AppShell() {
  const [active, setActive] = useState<string>('dashboard');

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
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-note">Prototyp Sprint 3</div>
          <div className="footer-note">Keine Login-Funktion</div>
          <div className="footer-note">Daten aus /inhalte</div>
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
