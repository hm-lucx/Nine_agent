import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { PrimussImportData, PrimussModuleEntry } from '../types';

const SUPPORTED_FORMATS = ['JSON', 'CSV', 'TXT (Textkopie)', 'PDF (manuell)', 'Word (manuell)', 'Bild/Screenshot (manuell)'];

function parseTextToPrimuss(text: string): { modules: PrimussModuleEntry[]; warnings: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const modules: PrimussModuleEntry[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    // Pattern: "Modulname, Note X,Y, N ECTS, bestanden/nicht bestanden"
    const gradeMatch = line.match(/(\d+[,.]?\d*)\s*ECTS/i);
    const noteMatch  = line.match(/Note\s+(\d+[,.]?\d+)/i);
    const noteMatch2 = line.match(/\b([1-4][,.]?\d?)\b/);
    const statusMatch = /(bestanden|nicht bestanden|offen)/i.exec(line);

    const ects  = gradeMatch  ? parseFloat(gradeMatch[1].replace(',', '.'))  : undefined;
    const grade = noteMatch   ? parseFloat(noteMatch[1].replace(',', '.'))
                : noteMatch2  ? parseFloat(noteMatch2[1].replace(',', '.'))  : undefined;
    const status = statusMatch
      ? (statusMatch[1].toLowerCase() as PrimussModuleEntry['status'])
      : 'unbekannt';

    // Modulname: alles vor dem ersten Komma
    const namePart = line.split(',')[0].trim();
    if (namePart.length < 3) {
      warnings.push(`Zeile konnte nicht geparst werden: "${line}"`);
      continue;
    }

    modules.push({
      module: namePart,
      grade,
      ects,
      status,
      confidence: (grade != null && ects != null) ? 'hoch' : 'mittel',
      rawText: line,
    });
  }
  return { modules, warnings };
}

function parseCsvToPrimuss(text: string): { modules: PrimussModuleEntry[]; warnings: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const modules: PrimussModuleEntry[] = [];
  const warnings: string[] = [];
  if (lines.length === 0) return { modules, warnings };

  const header = lines[0].toLowerCase().split(';').map(h => h.trim());
  const colModule = header.findIndex(h => h.includes('modul') || h.includes('lv'));
  const colGrade  = header.findIndex(h => h.includes('note') || h.includes('grade'));
  const colEcts   = header.findIndex(h => h.includes('ects') || h.includes('lp'));
  const colStatus = header.findIndex(h => h.includes('status') || h.includes('ergebnis'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map(c => c.trim().replace(/"/g, ''));
    const moduleName = colModule >= 0 ? cols[colModule] : cols[0];
    if (!moduleName || moduleName.length < 2) continue;

    const grade  = colGrade >= 0  ? parseFloat(cols[colGrade].replace(',', '.'))  : undefined;
    const ects   = colEcts >= 0   ? parseFloat(cols[colEcts].replace(',', '.'))   : undefined;
    const rawStatus = colStatus >= 0 ? cols[colStatus].toLowerCase() : '';
    const status: PrimussModuleEntry['status'] =
      rawStatus.includes('bestand') ? 'bestanden' :
      rawStatus.includes('nicht')   ? 'nicht bestanden' : 'unbekannt';

    modules.push({ module: moduleName, grade: isNaN(grade!) ? undefined : grade, ects: isNaN(ects!) ? undefined : ects, status, confidence: 'mittel', rawText: lines[i] });
  }

  if (colModule < 0) warnings.push('Keine Modulname-Spalte erkannt. Erste Spalte wurde verwendet.');
  return { modules, warnings };
}

function parseJsonToPrimuss(text: string): { modules: PrimussModuleEntry[]; warnings: string[] } {
  const warnings: string[] = [];
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : (data.modules ?? data.passed_modules ?? []);
    const modules: PrimussModuleEntry[] = arr.map((m: Record<string, unknown>) => ({
      module: String(m.module ?? m.title ?? m.name ?? ''),
      code: m.code != null ? String(m.code) : undefined,
      grade: m.grade != null ? Number(m.grade) : undefined,
      ects: m.ects != null ? Number(m.ects) : undefined,
      semester: m.semester != null ? Number(m.semester) : undefined,
      status: String(m.status ?? 'unbekannt').toLowerCase() as PrimussModuleEntry['status'],
      confidence: 'hoch' as const,
      rawText: JSON.stringify(m),
    }));
    return { modules, warnings };
  } catch (e) {
    warnings.push(`JSON-Parse-Fehler: ${String(e)}`);
    return { modules: [], warnings };
  }
}

export default function PrimussImport() {
  const { primussImport, setPrimussImport, acceptPrimussImport } = useApp();
  const [textInput, setTextInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isParseable = ['json', 'csv', 'txt'].includes(ext);

    if (!isParseable) {
      const data: PrimussImportData = {
        fileName: file.name,
        fileType: file.type || ext,
        fileSize: file.size,
        importedAt: new Date().toISOString(),
        mode: ext === 'pdf' ? 'pdf_manual' : ext === 'docx' ? 'word_manual' : 'image_manual',
        modules: [],
        parseWarnings: [`${ext.toUpperCase()}-Dateien können nicht automatisch ausgelesen werden. Manuelle Auswertung / späterer Parser erforderlich.`],
        status: 'parsed',
      };
      setPrimussImport(data);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      let parsed: { modules: PrimussModuleEntry[]; warnings: string[] };
      let mode: PrimussImportData['mode'] = 'text';

      if (ext === 'json')      { parsed = parseJsonToPrimuss(content); mode = 'json'; }
      else if (ext === 'csv')  { parsed = parseCsvToPrimuss(content);  mode = 'csv';  }
      else                     { parsed = parseTextToPrimuss(content);  mode = 'text'; }

      setPrimussImport({
        fileName: file.name,
        fileType: file.type || ext,
        fileSize: file.size,
        importedAt: new Date().toISOString(),
        mode,
        modules: parsed.modules,
        rawContent: content.slice(0, 2000),
        parseWarnings: parsed.warnings,
        status: 'parsed',
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTextParse = () => {
    if (!textInput.trim()) return;
    const parsed = parseTextToPrimuss(textInput);
    setPrimussImport({
      importedAt: new Date().toISOString(),
      mode: 'text',
      modules: parsed.modules,
      rawContent: textInput.slice(0, 2000),
      parseWarnings: parsed.warnings,
      status: 'parsed',
    });
  };

  const statusColor = primussImport?.status === 'accepted' ? 'badge-ok'
    : primussImport?.status === 'rejected' ? 'badge-blocked'
    : primussImport?.status === 'parsed'   ? 'badge-warn' : 'badge-code';

  return (
    <div className="page">
      <h1>PRIMUSS-Daten importieren</h1>
      <p className="source-note">
        Keine sensiblen Daten werden an Server übertragen. Alles bleibt im Browser (localStorage).
      </p>

      {/* Unterstützte Formate */}
      <div className="info-box" style={{ marginBottom: '1.25rem' }}>
        <strong>Unterstützte Formate:</strong>{' '}
        {SUPPORTED_FORMATS.map(f => (
          <span key={f} className="badge badge-code" style={{ marginRight: 4 }}>{f}</span>
        ))}
      </div>

      {/* Datei-Upload */}
      <div
        className={`upload-zone ${dragOver ? 'upload-zone-active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          accept=".json,.csv,.txt,.pdf,.docx,.png,.jpg"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div className="upload-icon">📂</div>
        <div className="upload-label">Datei hierher ziehen oder klicken zum Auswählen</div>
        <div className="upload-hint">JSON, CSV, TXT, PDF, Word, Bild</div>
      </div>

      {/* Texteingabe */}
      <h2 style={{ marginTop: '1.5rem' }}>Oder: Text aus PRIMUSS einfügen</h2>
      <p style={{ fontSize: '0.82rem', color: '#546e7a', marginBottom: '0.5rem' }}>
        Beispiel: „Mathematik I, Note 2,3, 5 ECTS, bestanden"
      </p>
      <textarea
        className="primuss-textarea"
        rows={6}
        placeholder={'Mathematik I, Note 2,3, 5 ECTS, bestanden\nElektrotechnik, Note 3,0, 5 ECTS, bestanden\nPhysik, 5 ECTS, offen'}
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
      />
      <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleTextParse}>
        Text parsen
      </button>

      {/* Importvorschau */}
      {primussImport && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2>Importvorschau</h2>
          <div className="card-grid" style={{ marginBottom: '1rem' }}>
            {primussImport.fileName && (
              <div className="card"><div className="card-label">Dateiname</div><div className="card-value">{primussImport.fileName}</div></div>
            )}
            <div className="card"><div className="card-label">Modus</div><div className="card-value">{primussImport.mode}</div></div>
            <div className="card">
              <div className="card-label">Status</div>
              <div className="card-value">
                <span className={`badge ${statusColor}`}>{primussImport.status}</span>
              </div>
            </div>
            <div className="card"><div className="card-label">Erkannte Module</div><div className="card-value highlight">{primussImport.modules.length}</div></div>
          </div>

          {primussImport.parseWarnings.length > 0 && (
            <div className="assumption-note">
              <strong>Parser-Warnungen:</strong>
              <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.2rem' }}>
                {primussImport.parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {primussImport.modules.length > 0 ? (
            <table style={{ marginTop: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Modul</th><th>Code</th><th>Note</th><th>ECTS</th>
                  <th>Semester</th><th>Status</th><th>Konfidenz</th><th>Rohtext</th>
                </tr>
              </thead>
              <tbody>
                {primussImport.modules.map((m, i) => (
                  <tr key={i}>
                    <td>{m.module}</td>
                    <td>{m.code ?? '–'}</td>
                    <td>{m.grade != null ? m.grade.toFixed(1) : <span className="badge badge-cond">–</span>}</td>
                    <td>{m.ects ?? <span className="badge badge-cond">–</span>}</td>
                    <td>{m.semester ?? '–'}</td>
                    <td><span className={`badge ${m.status === 'bestanden' ? 'badge-ok' : m.status === 'nicht bestanden' ? 'badge-blocked' : 'badge-warn'}`}>{m.status}</span></td>
                    <td><span className={`badge ${m.confidence === 'hoch' ? 'badge-ok' : 'badge-warn'}`}>{m.confidence}</span></td>
                    <td style={{ fontSize: '0.72rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.rawText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="assumption-note">
              Keine Module erkannt. Bei PDF/Word/Bild ist manuelle Auswertung erforderlich.
            </div>
          )}

          <div className="params-actions" style={{ marginTop: '1rem' }}>
            {primussImport.modules.filter(m => m.status === 'bestanden').length > 0 && primussImport.status !== 'accepted' && (
              <button className="btn-primary" onClick={acceptPrimussImport}>
                Import übernehmen ({primussImport.modules.filter(m => m.status === 'bestanden').length} bestandene Module)
              </button>
            )}
            <button className="btn-secondary" onClick={() => setPrimussImport(null)}>
              Import verwerfen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
