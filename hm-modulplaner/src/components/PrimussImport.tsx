import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { PrimussImportData, PrimussModuleEntry } from '../types';
import { parseFile, parseTxtContent } from '../services/primussImportService';
import type { ImportedGradeEntry } from '../services/primussImportService';

const CONFIDENCE_BADGE: Record<string, string> = {
  hoch: 'badge-ok', mittel: 'badge-warn', niedrig: 'badge-blocked',
};

function entryToModuleEntry(e: ImportedGradeEntry): PrimussModuleEntry {
  return {
    module: e.moduleTitle,
    code: e.moduleCode ?? undefined,
    grade: e.grade ?? undefined,
    ects: e.ects ?? undefined,
    status: e.status === 'angemeldet' ? 'offen' : e.status,
    semester: e.semester ?? undefined,
    confidence: e.confidence,
    rawText: e.rawText,
  };
}

export default function PrimussImport() {
  const { primussImport, setPrimussImport, acceptPrimussImport, recalculate } = useApp();
  const [dragging, setDragging] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doImport = useCallback(async (file: File) => {
    setParsing(true);
    setParseError(null);
    try {
      const result = await parseFile(file);
      const imp: PrimussImportData = {
        fileName: file.name,
        fileType: result.detectedFormat,
        fileSize: file.size,
        importedAt: new Date().toISOString(),
        mode: result.detectedFormat === 'JSON' ? 'json'
          : result.detectedFormat === 'CSV' ? 'csv'
          : result.detectedFormat === 'PDF' ? 'pdf_manual'
          : result.detectedFormat === 'XLSX' ? 'csv'
          : 'text',
        modules: result.entries.map(entryToModuleEntry),
        rawContent: result.rawContent.slice(0, 4000),
        parseWarnings: result.parseWarnings,
        status: 'parsed',
      };
      setPrimussImport(imp);
    } catch (e) {
      setParseError(`Fehler: ${e}`);
    } finally {
      setParsing(false);
    }
  }, [setPrimussImport]);

  const handleFile = useCallback(async (f: File) => {
    await doImport(f);
  }, [doImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleTextParse = () => {
    if (!textInput.trim()) return;
    const result = parseTxtContent(textInput, 'Manuell eingegeben');
    const imp: PrimussImportData = {
      fileName: 'Manuell eingegeben',
      fileType: 'TXT',
      importedAt: new Date().toISOString(),
      mode: 'text',
      modules: result.entries.map(entryToModuleEntry),
      rawContent: textInput.slice(0, 4000),
      parseWarnings: result.parseWarnings,
      status: 'parsed',
    };
    setPrimussImport(imp);
  };

  const handleAccept = () => {
    acceptPrimussImport();
    recalculate();
  };

  const handleReject = () => {
    setPrimussImport(null);
    setTextInput('');
  };

  const updateEntry = (idx: number, field: keyof PrimussModuleEntry, value: string | number | undefined) => {
    if (!primussImport) return;
    const modules = primussImport.modules.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    setPrimussImport({ ...primussImport, modules });
  };

  return (
    <div className="page">
      <h1>PRIMUSS-Daten importieren</h1>
      <p className="source-note">
        Lade dein Notenblatt hoch oder füge den Text ein. Das System erkennt automatisch Module, Noten, ECTS und Status.
      </p>

      <div className="assumption-note">
        <strong>Datenschutz:</strong> Dateien werden nur im Browser verarbeitet und nicht an Server übertragen.
        Keine echten PRIMUSS-Dateien im Repository speichern.
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragging ? 'upload-zone-drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="upload-icon">⬆</div>
        <div>
          <strong>Datei hierher ziehen</strong> oder klicken zum Auswählen
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Unterstützt: JSON · CSV · XLSX · TXT · PDF (Textextraktion) · Bilder (manuell)
        </div>
        <input
          ref={fileRef} type="file"
          accept=".json,.csv,.tsv,.txt,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {parsing && <div className="info-box">⟳ Datei wird analysiert…</div>}
      {parseError && <div className="assumption-note" style={{ borderColor: '#dc2626' }}>{parseError}</div>}

      {/* Manuelle Texteingabe */}
      <h2>Oder: Text / Notenblatt einfügen</h2>
      <p className="source-note">
        Beispiele die erkannt werden:<br />
        <code>Mathematik I 6 ECTS 2,3 bestanden</code><br />
        <code>Physik, Note 3.0, 5 ECTS, bestanden</code><br />
        <code>Informatik Grundlagen 5 ECTS bestanden</code><br />
        <code>Werkstofftechnik nicht bestanden</code>
      </p>
      <textarea
        className="primuss-textarea"
        rows={8}
        placeholder="Notenblatt-Zeilen einfügen..."
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
      />
      <button className="btn-secondary" onClick={handleTextParse} disabled={!textInput.trim()}>
        Text analysieren
      </button>

      {/* Import-Vorschau */}
      {primussImport && primussImport.status !== 'rejected' && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Import-Vorschau</h2>
          <p className="source-note">
            Datei: <strong>{primussImport.fileName}</strong> ·
            Format: <strong>{primussImport.fileType}</strong> ·
            {primussImport.fileSize ? ` Größe: ${Math.round(primussImport.fileSize / 1024)} KB ·` : ''}
            {' '}{primussImport.modules.length} Einträge erkannt
            {primussImport.status === 'accepted' && <span className="badge badge-ok" style={{ marginLeft: 8 }}>✓ Importiert</span>}
          </p>

          {primussImport.parseWarnings.length > 0 && (
            <div className="assumption-note">
              {primussImport.parseWarnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Modul</th>
                <th>Code</th>
                <th>Note</th>
                <th>ECTS</th>
                <th>Status</th>
                <th>Konfidenz</th>
                <th>Warnungen</th>
                <th>Bearbeiten</th>
              </tr>
            </thead>
            <tbody>
              {primussImport.modules.map((m, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    {editIdx === i
                      ? <input type="text" value={m.module} onChange={e => updateEntry(i, 'module', e.target.value)} style={{ width: 160 }} />
                      : m.module}
                  </td>
                  <td>
                    {editIdx === i
                      ? <input type="text" value={m.code ?? ''} onChange={e => updateEntry(i, 'code', e.target.value || undefined)} style={{ width: 80 }} />
                      : <span className="badge badge-code">{m.code ?? '–'}</span>}
                  </td>
                  <td>
                    {editIdx === i
                      ? <input type="number" step="0.1" min="1" max="5" value={m.grade ?? ''} onChange={e => updateEntry(i, 'grade', e.target.value ? parseFloat(e.target.value) : undefined)} style={{ width: 60 }} />
                      : m.grade != null ? m.grade.toFixed(1) : '–'}
                  </td>
                  <td>
                    {editIdx === i
                      ? <input type="number" min="1" max="10" value={m.ects ?? ''} onChange={e => updateEntry(i, 'ects', e.target.value ? parseInt(e.target.value) : undefined)} style={{ width: 50 }} />
                      : m.ects ?? '–'}
                  </td>
                  <td>
                    {editIdx === i
                      ? (
                        <select value={m.status} onChange={e => updateEntry(i, 'status', e.target.value as PrimussModuleEntry['status'])}>
                          <option value="bestanden">bestanden</option>
                          <option value="nicht bestanden">nicht bestanden</option>
                          <option value="offen">offen</option>
                          <option value="unbekannt">unbekannt</option>
                        </select>
                      )
                      : <span className={`badge ${m.status === 'bestanden' ? 'badge-ok' : m.status === 'nicht bestanden' ? 'badge-blocked' : 'badge-warn'}`}>{m.status}</span>}
                  </td>
                  <td><span className={`badge ${CONFIDENCE_BADGE[m.confidence] ?? 'badge-code'}`}>{m.confidence}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {m.confidence === 'niedrig' ? '⚠ manuell prüfen' : '–'}
                  </td>
                  <td>
                    {editIdx === i
                      ? <button className="btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditIdx(null)}>✓</button>
                      : <button className="btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditIdx(i)}>✎</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="params-actions" style={{ marginTop: '1rem' }}>
            {primussImport.status !== 'accepted' ? (
              <>
                <button className="btn-primary" onClick={handleAccept}>
                  ✓ Import übernehmen ({primussImport.modules.filter(m => m.status === 'bestanden').length} bestandene Module)
                </button>
                <button className="btn-secondary" onClick={handleReject}>
                  Import verwerfen
                </button>
              </>
            ) : (
              <div className="info-box">
                ✓ Import wurde übernommen. Bestandene Module wurden zu deinem Profil hinzugefügt und die Szenarien wurden neu berechnet.
                <button className="btn-secondary" style={{ marginLeft: '1rem' }} onClick={handleReject}>
                  Neuen Import starten
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <strong>Unterstützte Formate im Detail:</strong>
        <ul>
          <li><strong>JSON</strong> – Array mit Feldern: module/title, code, grade, ects, status, semester</li>
          <li><strong>CSV</strong> – Spalten: Modul, Note, ECTS, Status (Trennzeichen: ; , Tab)</li>
          <li><strong>TXT</strong> – Zeilenweise, z. B. „Mathematik I 6 ECTS 2,3 bestanden"</li>
          <li><strong>XLSX/XLS</strong> – Erste Tabelle wird als CSV interpretiert</li>
          <li><strong>PDF</strong> – Textextraktion mit pdfjs-dist (Qualität abhängig vom PDF)</li>
          <li><strong>Bilder/Screenshots</strong> – OCR noch nicht zuverlässig implementiert → als TXT/CSV exportieren</li>
        </ul>
      </div>
    </div>
  );
}
