/**
 * Student Performance Import – Sprint 3 Nachbesserung
 *
 * 3-Tab-UI: Notenblatt hochladen | Textliste | Manuell
 * Unterstützt: PDF, CSV, XLSX, TXT, JSON
 * Primärformat: „Notenblatt in Deutsch" (HM PRIMUSS)
 *
 * Datenschutz: kein Server-Upload, alles im Browser.
 */

import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { PrimussImportData, PrimussModuleEntry } from '../types';
import { parseFile, parseTxtContent } from '../services/primussImportService';
import type { ImportedGradeEntry } from '../services/primussImportService';
import { extractStudentMeta } from '../services/pdfGradeReaderService';
import { calcGradeStats } from '../services/gradeCalculationService';
import { flattenModules } from '../services/nineApiDiscoveryService';
import { matchAllPerformances } from '../services/performanceMatchingService';

type Tab = 'upload' | 'text' | 'manual';

const EXAMPLE_TEXT = `Jonas Weber
Bachelor Wirtschaftsingenieurwesen – Industrielle Technik / TEC
Fachsemester 3

Mathematik I; 6 ECTS; Note 2,3; bestanden
Betriebswirtschaftslehre I; 5 ECTS; Note 1,7; bestanden
Informatik; 5 ECTS; Note 2,0; bestanden
Technische Mechanik I; 5 ECTS; Note 3,0; bestanden
Chemie und Werkstoffe; 4 ECTS; Note 2,0; bestanden
Mathematik II; 6 ECTS; Note 3,7; bestanden
Volkswirtschaftslehre; 4 ECTS; Note 2,0; bestanden
Physik; 5 ECTS; Note 5,0; nicht bestanden
Werkstofftechnik; 4 ECTS; offen`;

const CONFIDENCE_STYLE: Record<string, { color: string; label: string }> = {
  hoch:          { color: '#16a34a', label: '✓ hoch' },
  mittel:        { color: '#d97706', label: '~ mittel' },
  niedrig:       { color: '#dc2626', label: '✗ niedrig' },
  'nicht gefunden': { color: '#94a3b8', label: '? kein Match' },
};

export default function StudentPerformanceImport() {
  const { nineReport, setPrimussImport, acceptPrimussImport, recalculate, resetToDemo } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawText, setRawText] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [detectedMeta, setDetectedMeta] = useState<ReturnType<typeof extractStudentMeta> | null>(null);
  const [gradeStats, setGradeStats] = useState<ReturnType<typeof calcGradeStats> | null>(null);
  const [editedEntries, setEditedEntries] = useState<ImportedGradeEntry[]>([]);
  const [imported, setImported] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Manuell
  const [manTitle, setManTitle] = useState('');
  const [manGrade, setManGrade] = useState('');
  const [manEcts, setManEcts] = useState('');
  const [manStatus, setManStatus] = useState<ImportedGradeEntry['status']>('bestanden');

  const fileRef = useRef<HTMLInputElement>(null);
  const nineModules = nineReport ? flattenModules(nineReport) : [];

  const processEntries = useCallback((rawContent: string, newEntries: ImportedGradeEntry[]) => {
    const meta = extractStudentMeta(rawContent);
    const stats = calcGradeStats(newEntries, meta.averageGrade);
    setRawText(rawContent);
    setEditedEntries([...newEntries]);
    setDetectedMeta(meta);
    setGradeStats(stats);
    setImported(false);
    setError(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setImporting(true);
    setError(null);
    try {
      const result = await parseFile(file);
      if (result.parseWarnings.length > 0 && result.entries.length === 0) {
        setError(result.parseWarnings.join('\n'));
      }
      processEntries(result.rawContent, result.entries as ImportedGradeEntry[]);
    } catch (e) {
      setError(`Fehler beim Lesen: ${e}`);
    } finally {
      setImporting(false);
    }
  }, [processEntries]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleTextImport = () => {
    if (!textInput.trim()) return;
    const result = parseTxtContent(textInput, 'Textliste');
    processEntries(textInput, result.entries as ImportedGradeEntry[]);
  };

  const addManual = () => {
    if (!manTitle.trim()) return;
    const entry: ImportedGradeEntry = {
      moduleCode: null, moduleTitle: manTitle.trim(),
      semester: null, ects: manEcts ? parseInt(manEcts) : null,
      grade: manGrade ? parseFloat(manGrade.replace(',', '.')) : null,
      status: manStatus, source: 'manuell', confidence: 'hoch',
      rawText: `${manTitle} – manuell`, needsManualReview: false, warnings: [],
    };
    const updated = [...editedEntries, entry];
    setEditedEntries(updated);
    if (!detectedMeta) setDetectedMeta(extractStudentMeta(''));
    setGradeStats(calcGradeStats(updated, null));
    setManTitle(''); setManGrade(''); setManEcts('');
  };

  const removeEntry = (idx: number) => {
    const updated = editedEntries.filter((_, i) => i !== idx);
    setEditedEntries(updated);
    setGradeStats(calcGradeStats(updated, detectedMeta?.averageGrade ?? null));
  };

  const resetImport = () => {
    setEditedEntries([]);
    setDetectedMeta(null);
    setGradeStats(null);
    setRawText('');
    setImported(false);
  };

  const handleAccept = () => {
    const mods: PrimussModuleEntry[] = editedEntries.map(e => ({
      module: e.moduleTitle,
      code: e.moduleCode ?? undefined,
      grade: e.grade ?? undefined,
      ects: e.ects ?? undefined,
      status: e.status === 'bestanden' ? 'bestanden'
        : e.status === 'nicht bestanden' ? 'nicht bestanden'
        : e.status === 'angemeldet' ? 'offen'
        : e.status === 'offen' ? 'offen' : 'unbekannt',
      semester: e.semester ?? undefined,
      confidence: e.confidence,
      rawText: e.rawText,
    }));
    const importData: PrimussImportData = {
      fileName: 'Import',
      fileType: 'gemischt',
      importedAt: new Date().toISOString(),
      mode: 'text',
      modules: mods,
      rawContent: rawText || textInput,
      parseWarnings: [],
      status: 'pending',
    };
    setPrimussImport(importData);
    acceptPrimussImport(detectedMeta, gradeStats);
    recalculate();
    setImported(true);
  };

  const matches = editedEntries.length > 0 && nineModules.length > 0
    ? matchAllPerformances(editedEntries, nineModules)
    : null;

  return (
    <div className="page">
      <h1>Meine Leistungen</h1>
      <p className="source-note">
        Importiere dein Notenblatt (PDF, CSV, XLSX, TXT, JSON) oder gib Leistungen manuell ein.
        Alle Daten werden nur lokal im Browser gespeichert.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
        {([['upload','📄 Hochladen'], ['text','📝 Textliste'], ['manual','✏️ Manuell']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '0.4rem 0.9rem', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === id ? '3px solid #1e3a8a' : '3px solid transparent',
              fontWeight: activeTab === id ? 700 : 400, color: activeTab === id ? '#1e3a8a' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Hochladen */}
      {activeTab === 'upload' && (
        <div>
          <div className="info-box" style={{ marginBottom: '0.75rem' }}>
            <strong>Primärformat:</strong> „Notenblatt in Deutsch" (HM PRIMUSS-Export) · Auch unterstützt: CSV, XLSX, TXT, JSON
          </div>
          <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{ cursor: 'pointer', padding: '2rem', textAlign: 'center', border: '2px dashed #c5cae9', borderRadius: 12, background: '#f8fafc' }}
          >
            {importing ? 'Lade...' : '📁 PDF, CSV, XLSX, TXT oder JSON hierher ziehen oder klicken'}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.txt,.json" hidden
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {error && <div className="assumption-note" style={{ marginTop: 8 }}>⚠ {error}</div>}
        </div>
      )}

      {/* Tab: Textliste */}
      {activeTab === 'text' && (
        <div>
          <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="Notenblatt-Text hier einfügen..."
            rows={10} style={{ width: '100%', padding: '0.5rem', border: '1px solid #c5cae9', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.82rem' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={handleTextImport}>Text analysieren</button>
            <button className="btn-secondary" onClick={() => setTextInput(EXAMPLE_TEXT)}>Beispiel laden</button>
          </div>
        </div>
      )}

      {/* Tab: Manuell */}
      {activeTab === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Modulname</label>
            <input value={manTitle} onChange={e => setManTitle(e.target.value)}
              placeholder="z. B. Mathematik I" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Note</label>
            <input value={manGrade} onChange={e => setManGrade(e.target.value)}
              placeholder="2,3" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>ECTS</label>
            <input value={manEcts} onChange={e => setManEcts(e.target.value)}
              placeholder="5" type="number" style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #c5cae9', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</label>
            <select value={manStatus} onChange={e => setManStatus(e.target.value as ImportedGradeEntry['status'])}
              style={{ width: '100%', padding: '0.4rem', border: '1px solid #c5cae9', borderRadius: 6 }}>
              <option value="bestanden">bestanden</option>
              <option value="nicht bestanden">nicht bestanden</option>
              <option value="offen">offen</option>
              <option value="angemeldet">angemeldet</option>
            </select>
          </div>
          <button className="btn-primary" onClick={addManual} disabled={!manTitle.trim()}>+</button>
        </div>
      )}

      {/* Erkannte Stammdaten */}
      {detectedMeta && (
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <strong>Erkannte Stammdaten</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.82rem' }}>
            {[
              ['Name', detectedMeta.name],
              ['Geburtsdatum', detectedMeta.birthDate],
              ['Geburtsort', detectedMeta.birthPlace],
              ['Studiengang', detectedMeta.studyProgram],
              ['Studienrichtung', detectedMeta.specialization],
              ['Fachsemester', detectedMeta.currentSemester],
              ['Matrikelnummer', detectedMeta.matriculationNumber],
              ['Gesamtschnitt', detectedMeta.averageGrade?.toFixed(2)],
              ['ECTS gesamt', detectedMeta.completedEcts],
            ].map(([k, v]) => v != null && (
              <span key={String(k)} style={{ background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
                <strong>{k}:</strong> {String(v)}
              </span>
            ))}
          </div>
          {detectedMeta.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 4 }}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Rohtext */}
      {rawText && (
        <div style={{ marginTop: '0.75rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => setShowRaw(v => !v)}>
            {showRaw ? '▲ Rohtext ausblenden' : '▼ Rohtext anzeigen'}
          </button>
          {showRaw && (
            <pre style={{ marginTop: 8, padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.72rem', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {rawText.slice(0, 3000)}{rawText.length > 3000 ? '\n… (abgeschnitten)' : ''}
            </pre>
          )}
        </div>
      )}

      {/* Statistik */}
      {gradeStats && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', fontSize: '0.85rem' }}>
          <span className="badge badge-ok">{gradeStats.passedCount} bestanden</span>
          {gradeStats.failedCount > 0 && <span className="badge badge-blocked">{gradeStats.failedCount} nicht bestanden</span>}
          {gradeStats.openCount > 0 && <span className="badge badge-warn">{gradeStats.openCount} offen</span>}
          <span className="badge badge-code">{gradeStats.totalEcts} ECTS</span>
          {gradeStats.calculatedAverage && <span className="badge badge-api">Ø {gradeStats.calculatedAverage.toFixed(2)}</span>}
          {gradeStats.mismatchWarning && <span className="badge badge-warn">⚠ Schnitt weicht ab</span>}
        </div>
      )}

      {/* Importvorschau */}
      {editedEntries.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Importvorschau ({editedEntries.length} Module)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Modulname</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>ECTS</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Note</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Konfidenz</th>
                  {matches && <th style={{ padding: '6px 8px', textAlign: 'left' }}>NINE-Match</th>}
                  <th style={{ padding: '6px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {editedEntries.map((e, i) => {
                  const match = matches?.[i];
                  const cs = CONFIDENCE_STYLE[e.confidence] ?? CONFIDENCE_STYLE.niedrig;
                  const ms = match ? (CONFIDENCE_STYLE[match.matchConfidence] ?? CONFIDENCE_STYLE.niedrig) : null;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 8px' }}>{e.moduleTitle}</td>
                      <td style={{ padding: '5px 8px' }}>{e.ects ?? '–'}</td>
                      <td style={{ padding: '5px 8px' }}>{e.grade != null ? e.grade.toFixed(1) : '–'}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ color: e.status === 'bestanden' ? '#16a34a' : e.status === 'nicht bestanden' ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', color: cs.color, fontWeight: 600 }}>{cs.label}</td>
                      {matches && ms && (
                        <td style={{ padding: '5px 8px', fontSize: '0.78rem' }}>
                          {match?.matchedModule ? (
                            <span style={{ color: ms.color }}>{match.matchedModule.moduleName} ({ms.label})</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Kein Match</span>
                          )}
                          {match?.needsManualReview && <span className="badge badge-warn" style={{ marginLeft: 4, fontSize: '0.65rem' }}>prüfen</span>}
                        </td>
                      )}
                      <td style={{ padding: '5px 8px' }}>
                        <button onClick={() => removeEntry(i)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Aktionen */}
      {editedEntries.length > 0 && (
        <div className="params-actions" style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleAccept}>
            {imported ? '✓ Importiert!' : '✓ Import übernehmen'}
          </button>
          <button className="btn-secondary" onClick={resetImport}>
            Import verwerfen
          </button>
          <button className="btn-secondary" onClick={resetToDemo}>
            Demo-Profil zurücksetzen
          </button>
        </div>
      )}

      {imported && (
        <div className="info-box" style={{ marginTop: '0.75rem' }}>
          ✓ Profil importiert. Dashboard, Noten und Empfehlungen wurden aktualisiert.
          Die Datenquelle wurde auf „Importiertes Profil" geändert.
        </div>
      )}
    </div>
  );
}
