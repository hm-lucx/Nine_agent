import { useState } from 'react';
import JsonExport from './JsonExport';
import KnowledgeSources from './KnowledgeSources';
import RuleSources from './RuleSources';
import SprintDocumentation from './SprintDocumentation';
import NineApiStatus from '../NineApiStatus';

type SubPage = 'sprint' | 'json' | 'knowledge' | 'rules' | 'api';

const tabs: { id: SubPage; label: string }[] = [
  { id: 'sprint',    label: 'Sprint-Dokumentation' },
  { id: 'json',      label: 'JSON Export' },
  { id: 'knowledge', label: 'Datenquellen' },
  { id: 'rules',     label: 'Regelquellen' },
  { id: 'api',       label: 'NINE API Status' },
];

export default function ArchivePage() {
  const [active, setActive] = useState<SubPage>('sprint');

  return (
    <div className="page">
      <h1>Archiv &amp; Nachweise</h1>
      <p className="source-note">
        Dokumentation, Datenquellen, Regelquellen, JSON-Export und API-Status für die
        Prüfungsleistung und Nachvollziehbarkeit.
      </p>

      <div className="archive-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`archive-tab ${active === t.id ? 'archive-tab-active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="archive-body">
        {active === 'sprint'    && <SprintDocumentation />}
        {active === 'json'      && <JsonExport />}
        {active === 'knowledge' && <KnowledgeSources />}
        {active === 'rules'     && <RuleSources />}
        {active === 'api'       && <NineApiStatus />}
      </div>
    </div>
  );
}
