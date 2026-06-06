/**
 * PRIMUSS Import Service
 *
 * Unterstützte Formate: JSON, CSV, TXT, XLSX, PDF (Text-Extraktion)
 * Bilder/Screenshots: OCR noch nicht zuverlässig – als "manuell prüfen" markiert.
 *
 * DATENSCHUTZ:
 *  - Keine echten Dateien ins Repository speichern.
 *  - Importierte Daten nur im Browser-State (kein Server-Upload).
 *  - Keine sensiblen Daten in console.log.
 */

export interface ImportedGradeEntry {
  moduleCode: string | null;
  moduleTitle: string;
  grade: number | null;
  ects: number | null;
  status: 'bestanden' | 'nicht bestanden' | 'angemeldet' | 'offen' | 'unbekannt';
  attemptCount?: number | null;
  semester: number | null;
  sourceFileName?: string;
  source?: string;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  rawText: string;
  needsManualReview?: boolean;
  matchedNineModuleId?: string;
  warnings: string[];
}

export interface ParseResult {
  entries: ImportedGradeEntry[];
  parseWarnings: string[];
  rawContent: string;
  detectedFormat: string;
}

// ── Modul-Zuordnung aus bekannten Codes ──────────────────────────────────────
const KNOWN_MODULES: Array<{ code: string; title: string; ects: number }> = [
  { code: 'G1',  title: 'Mathematik I',          ects: 6 },
  { code: 'G2',  title: 'Betriebswirtschaftslehre I', ects: 5 },
  { code: 'G3',  title: 'Informatik',             ects: 5 },
  { code: 'G4',  title: 'Physik',                 ects: 5 },
  { code: 'G5',  title: 'Mathematik II',          ects: 6 },
  { code: 'G6',  title: 'Werkstofftechnik',       ects: 4 },
  { code: 'G7',  title: 'Betriebswirtschaftslehre II', ects: 5 },
  { code: 'G8',  title: 'Elektrotechnik',         ects: 5 },
  { code: 'G9',  title: 'Maschinenelemente',       ects: 5 },
  { code: 'G10', title: 'Wirtschaftsinformatik',   ects: 5 },
  { code: 'G11', title: 'Statistik',               ects: 5 },
  { code: 'G12', title: 'Technische Mechanik I',   ects: 5 },
  { code: 'G13', title: 'Volkswirtschaftslehre',   ects: 4 },
  { code: 'TEC-ET',  title: 'Energietechnik',       ects: 4 },
  { code: 'TEC-VUT', title: 'Verfahrens- und Umwelttechnik', ects: 4 },
  { code: 'TEC-DA',  title: 'Datenanalyse',         ects: 4 },
  { code: 'TEC-IS',  title: 'Informationssysteme TEC', ects: 4 },
  { code: 'TEC-KR',  title: 'Kostenrechnung',        ects: 4 },
  { code: 'TEC-GFT', title: 'Grundlagen der Fertigungstechnik', ects: 4 },
  { code: 'TEC-ME2', title: 'Maschinenelemente 2',   ects: 5 },
];

function lookupModule(text: string): { code: string | null; ects: number | null } {
  const t = text.toLowerCase();
  for (const m of KNOWN_MODULES) {
    if (t.includes(m.title.toLowerCase()) || t.includes(m.code.toLowerCase())) {
      return { code: m.code, ects: m.ects };
    }
  }
  return { code: null, ects: null };
}

function parseGrade(raw: string): number | null {
  const cleaned = raw.replace(',', '.');
  const match = cleaned.match(/\b([1-5]\.[0-9])\b/);
  if (match) {
    const g = parseFloat(match[1]);
    return g >= 1.0 && g <= 5.0 ? g : null;
  }
  if (/\b1\.0\b/.test(cleaned)) return 1.0;
  return null;
}

function parseEcts(raw: string): number | null {
  const match = raw.match(/(\d+)\s*(?:ects|cp|lp)/i);
  if (match) return parseInt(match[1], 10);
  const standalone = raw.match(/\b(\d{1,2})\b/);
  if (standalone) {
    const n = parseInt(standalone[1], 10);
    if (n >= 1 && n <= 10) return n;
  }
  return null;
}

function parseStatus(raw: string): ImportedGradeEntry['status'] {
  const t = raw.toLowerCase();
  if (/bestanden|passed|be\b|b\b/.test(t)) return 'bestanden';
  if (/nicht bestanden|failed|nb\b|nx\b/.test(t)) return 'nicht bestanden';
  if (/angemeldet|registered/.test(t)) return 'angemeldet';
  if (/offen|open/.test(t)) return 'offen';
  return 'unbekannt';
}

function parseLine(line: string, sourceFileName: string): ImportedGradeEntry | null {
  const trimmed = line.trim();
  if (trimmed.length < 3) return null;

  const grade = parseGrade(trimmed);
  const status = parseStatus(trimmed);
  const ectsRaw = parseEcts(trimmed);
  const { code, ects: lookupEcts } = lookupModule(trimmed);

  const moduleTitle = extractTitle(trimmed);
  if (!moduleTitle) return null;

  const warnings: string[] = [];
  let confidence: ImportedGradeEntry['confidence'] = 'hoch';

  if (!code) {
    warnings.push('Kein bekannter Modulcode erkannt – manuell prüfen');
    confidence = 'niedrig';
  }
  if (grade === null && status === 'unbekannt') {
    warnings.push('Weder Note noch Status erkennbar');
    confidence = 'niedrig';
  }
  if (grade !== null && confidence !== 'niedrig') confidence = 'hoch';
  else if (confidence !== 'niedrig') confidence = 'mittel';

  return {
    moduleCode: code,
    moduleTitle,
    grade,
    ects: ectsRaw ?? lookupEcts,
    status,
    attemptCount: null,
    semester: null,
    sourceFileName,
    confidence,
    rawText: trimmed,
    warnings,
  };
}

function extractTitle(text: string): string {
  // Entferne bekannte Trailing-Infos: Note, ECTS, Status
  let t = text
    .replace(/[,;]?\s*\d+[,.]?\d*\s*(?:ECTS|CP|LP)/gi, '')
    .replace(/[,;]?\s*[1-5][.,]\d\s*/g, '')
    .replace(/[,;]?\s*(?:bestanden|nicht bestanden|BE|NB|passed|failed|angemeldet|offen)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length < 3) return '';
  return t.slice(0, 80);
}

// ── Format-Parser ─────────────────────────────────────────────────────────────

export function parseTxtContent(text: string, fileName: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const entries: ImportedGradeEntry[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    const entry = parseLine(line, fileName);
    if (entry) entries.push(entry);
  }
  if (entries.length === 0) warnings.push('Keine Module erkannt. Bitte Textformat prüfen.');
  return { entries, parseWarnings: warnings, rawContent: text, detectedFormat: 'TXT' };
}

export function parseCsvContent(text: string, fileName: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const entries: ImportedGradeEntry[] = [];
  const warnings: string[] = [];
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(/[;,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
    if (i === 0) {
      headers = cols.map(c => c.toLowerCase());
      continue;
    }
    if (cols.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });

    const titleKey = headers.find(h => /modul|name|titel|subject/i.test(h)) ?? headers[0];
    const gradeKey = headers.find(h => /note|grade|mark|bewertung/i.test(h)) ?? '';
    const ectsKey  = headers.find(h => /ects|cp|lp|credits/i.test(h)) ?? '';
    const statusKey = headers.find(h => /status|ergebnis|result/i.test(h)) ?? '';
    const codeKey  = headers.find(h => /code|nr|id|kürzel/i.test(h)) ?? '';

    const title = row[titleKey] ?? '';
    if (!title) continue;

    const gradeRaw = row[gradeKey] ?? '';
    const ectsRaw  = row[ectsKey] ?? '';
    const status   = parseStatus(row[statusKey] ?? '');
    const grade    = parseGrade(gradeRaw);
    const ects     = ectsRaw ? parseInt(ectsRaw, 10) : null;
    const codeFromRow = row[codeKey] || null;
    const { code: lookupCode, ects: lookupEcts } = lookupModule(title);

    entries.push({
      moduleCode: codeFromRow ?? lookupCode,
      moduleTitle: title.slice(0, 80),
      grade,
      ects: ects ?? lookupEcts,
      status: status !== 'unbekannt' ? status : (grade !== null && grade <= 4.0 ? 'bestanden' : 'unbekannt'),
      attemptCount: null,
      semester: null,
      sourceFileName: fileName,
      confidence: codeFromRow || lookupCode ? 'hoch' : 'mittel',
      rawText: lines[i],
      warnings: codeFromRow || lookupCode ? [] : ['Modulcode nicht erkannt'],
    });
  }

  if (entries.length === 0) warnings.push('Keine Module in CSV erkannt. Bitte Spaltenüberschriften prüfen (Modul, Note, ECTS, Status).');
  return { entries, parseWarnings: warnings, rawContent: text, detectedFormat: 'CSV' };
}

export function parseJsonContent(text: string, fileName: string): ParseResult {
  const warnings: string[] = [];
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : (parsed.modules ?? parsed.entries ?? [parsed]);
    const entries: ImportedGradeEntry[] = arr.map((item: Record<string, unknown>, i: number) => {
      const grade = item.grade != null ? parseFloat(String(item.grade).replace(',', '.')) : null;
      const status = parseStatus(String(item.status ?? item.ergebnis ?? ''));
      return {
        moduleCode: String(item.code ?? item.moduleCode ?? item.nr ?? '').trim() || null,
        moduleTitle: String(item.module ?? item.title ?? item.moduleTitle ?? item.name ?? `Modul ${i + 1}`).slice(0, 80),
        grade: grade != null && !isNaN(grade) ? grade : null,
        ects: item.ects != null ? Number(item.ects) : null,
        status: status !== 'unbekannt' ? status : (grade !== null && grade <= 4.0 ? 'bestanden' : 'unbekannt'),
        attemptCount: item.attemptCount != null ? Number(item.attemptCount) : null,
        semester: item.semester != null ? Number(item.semester) : null,
        sourceFileName: fileName,
        confidence: 'hoch' as const,
        rawText: JSON.stringify(item),
        warnings: [],
      };
    });
    return { entries, parseWarnings: warnings, rawContent: text, detectedFormat: 'JSON' };
  } catch (e) {
    return { entries: [], parseWarnings: [`JSON-Fehler: ${e}`], rawContent: text, detectedFormat: 'JSON' };
  }
}

export async function parseXlsxContent(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const csv: string = XLSX.utils.sheet_to_csv(ws);
    const result = parseCsvContent(csv, fileName);
    return { ...result, detectedFormat: 'XLSX' };
  } catch (e) {
    return { entries: [], parseWarnings: [`XLSX-Fehler: ${e}`], rawContent: '', detectedFormat: 'XLSX' };
  }
}

export async function parsePdfContent(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  const { parseGradesFromText } = await import('./pdfGradeReaderService');
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((it: unknown) => (it as { str?: string }).str ?? '').join(' ') + '\n';
    }

    if (!fullText.trim()) {
      return {
        entries: [],
        parseWarnings: ['Dieses PDF enthält vermutlich nur Bilder oder gescannte Seiten. Dafür wird OCR benötigt. Bitte Notenblatt als TXT oder CSV exportieren oder Text manuell einfügen.'],
        rawContent: fullText,
        detectedFormat: 'PDF (gescannt)',
      };
    }

    // Verbesserter Parser aus pdfGradeReaderService
    const entries = parseGradesFromText(fullText).map(e => ({ ...e, sourceFileName: fileName }));
    const warnings: string[] = [];
    if (entries.length === 0) {
      warnings.push('Keine Notenblatt-Zeilen erkannt. Bitte Text manuell einfügen oder CSV/TXT verwenden.');
    }
    return { entries, parseWarnings: warnings, rawContent: fullText, detectedFormat: 'PDF' };
  } catch (e) {
    return {
      entries: [],
      parseWarnings: [`PDF-Textextraktion fehlgeschlagen: ${e}. Bitte als TXT oder CSV exportieren und erneut hochladen.`],
      rawContent: '',
      detectedFormat: 'PDF',
    };
  }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const warnings: string[] = [];

  if (name.endsWith('.json')) {
    const text = await file.text();
    return parseJsonContent(text, file.name);
  }
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    const text = await file.text();
    return parseCsvContent(text, file.name);
  }
  if (name.endsWith('.txt')) {
    const text = await file.text();
    return parseTxtContent(text, file.name);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    return parseXlsxContent(buf, file.name);
  }
  if (name.endsWith('.pdf')) {
    const buf = await file.arrayBuffer();
    return parsePdfContent(buf, file.name);
  }
  if (/\.(png|jpg|jpeg|webp|bmp|tiff?)$/i.test(name)) {
    warnings.push('OCR für Bilder/Screenshots ist noch nicht vollständig implementiert. Bitte Notenblatt als CSV, TXT oder PDF exportieren.');
    return { entries: [], parseWarnings: warnings, rawContent: '', detectedFormat: 'Bild/Screenshot' };
  }

  // Fallback: als Text lesen
  try {
    const text = await file.text();
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      return parseJsonContent(text, file.name);
    }
    if (text.includes(';') || text.includes('\t')) {
      return parseCsvContent(text, file.name);
    }
    return parseTxtContent(text, file.name);
  } catch {
    return { entries: [], parseWarnings: ['Datei konnte nicht gelesen werden.'], rawContent: '', detectedFormat: 'Unbekannt' };
  }
}
