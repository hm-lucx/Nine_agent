/**
 * HM Modulplaner – Agent Server
 *
 * Lokaler Express-Server (Port 3001) als Brücke zwischen
 * React-App und Playwright-Agenten.
 *
 * Starten mit: npm run agent
 *
 * Sicherheit:
 * - Nur auf localhost erreichbar (kein externes Netzwerk)
 * - Zugangsdaten nur in Request-Body (Session) oder .env.local
 * - Keine Zugangsdaten in Logs oder Responses
 */

import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { NineAgent } from './nineAgent.js';
import type { AgentLogEntry, NineAgentResult } from './nineAgent.js';
import { extractCourseDetailPage, extractFromHtmlString, extractFromFixture } from './nineExtractor.js';
import { createCourseDetailRecommendations } from './actionPlanner.js';
import { toSafeCourseDetail } from './types/courseDetail.js';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// .env.local aus dem Projekt-Root laden
const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenvConfig({ path: resolve(__dirname, '..', '.env.local') });
dotenvConfig({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = 3001;

// Nur localhost-Anfragen erlauben
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] }));
app.use(express.json({ limit: '1mb' }));

// Aktiver Agent (singleton – nur ein Agent gleichzeitig)
let activeAgent: NineAgent | null = null;
let latestResult: NineAgentResult | null = null;
const liveLog: AgentLogEntry[] = [];

// ── Gesundheitscheck ──────────────────────────────────────────────────────────

app.get('/agent/health', (_req, res) => {
  res.json({
    status: 'ok',
    agentRunning: activeAgent !== null,
    port: PORT,
    version: '1.0.0-sprint3',
  });
});

// ── Agent starten ─────────────────────────────────────────────────────────────

app.post('/agent/nine/run', async (req, res) => {
  if (activeAgent) {
    res.status(409).json({ error: 'Agent läuft bereits. Bitte erst abwarten oder stoppen.' });
    return;
  }

  const {
    username,
    password,
    baseUrl = process.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu',
    curriculum = process.env.VITE_NINE_CURRICULUM ?? 'WI',
    semester = process.env.VITE_NINE_TERM ?? 'SoSe 2026',
  } = req.body as Record<string, string>;

  if (!username || !password) {
    res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich.' });
    return;
  }

  liveLog.length = 0;
  latestResult = null;

  activeAgent = new NineAgent((entry: AgentLogEntry) => {
    liveLog.push(entry);
  });

  // Asynchron ausführen – sofort Antwort senden
  res.json({ status: 'started', message: 'Agent gestartet. Polling unter /agent/nine/status.' });

  try {
    latestResult = await activeAgent.run(username, password, baseUrl, curriculum, semester);
  } catch (e) {
    latestResult = {
      success: false, error: String(e),
      schedule: [], modules: [], moodleCourses: [], logs: liveLog,
    };
  } finally {
    activeAgent = null;
  }
});

// ── Status / Live-Log abrufen ─────────────────────────────────────────────────

app.get('/agent/nine/status', (_req, res) => {
  res.json({
    running: activeAgent !== null,
    logs: liveLog.slice(-50),       // Letzte 50 Log-Einträge
    result: latestResult,
    hasResult: latestResult !== null,
  });
});

// ── Agent stoppen ─────────────────────────────────────────────────────────────

app.post('/agent/nine/stop', (_req, res) => {
  if (!activeAgent) {
    res.json({ status: 'idle', message: 'Kein Agent aktiv.' });
    return;
  }
  activeAgent.close();
  activeAgent = null;
  res.json({ status: 'stopped' });
});

// ── Letztes Ergebnis abrufen ──────────────────────────────────────────────────

app.get('/agent/nine/result', (_req, res) => {
  if (!latestResult) {
    res.status(404).json({ error: 'Kein Ergebnis vorhanden. Agent zuerst ausführen.' });
    return;
  }
  res.json(latestResult);
});

// ── Kursdetail aus Live-URL extrahieren ───────────────────────────────────────

app.post('/agent/extract-course-detail', async (req, res) => {
  const { courseUrl, planningContext } = req.body as {
    courseUrl?: string;
    planningContext?: {
      currentSemester?: number;
      blockedDays?: string[];
      passedModuleCodes?: string[];
      targetEcts?: number;
    };
  };

  if (!courseUrl || !courseUrl.startsWith('http')) {
    res.status(400).json({ ok: false, error: 'courseUrl fehlt oder ungültig.' });
    return;
  }

  console.log(`[CourseDetail] Extrahiere: ${courseUrl}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const courseDetail = await extractCourseDetailPage(page, courseUrl);

    const ctx = {
      currentSemester: planningContext?.currentSemester ?? 1,
      blockedDays: planningContext?.blockedDays ?? [],
      passedModuleCodes: planningContext?.passedModuleCodes ?? [],
      targetEcts: planningContext?.targetEcts ?? 30,
    };

    const actionsWithPlanning = createCourseDetailRecommendations(courseDetail, ctx);
    const safeDetail = toSafeCourseDetail({ ...courseDetail, availableActions: actionsWithPlanning });

    res.json({
      ok: true,
      courseDetail: safeDetail,
      actions: actionsWithPlanning,
      warnings: courseDetail.warnings,
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[CourseDetail] Fehler: ${msg}`);
    res.status(500).json({ ok: false, error: msg });
  } finally {
    browser?.close().catch(() => {});
  }
});

// ── Kursdetail aus HTML-String parsen ─────────────────────────────────────────

app.post('/agent/parse-course-detail-html', (req, res) => {
  const { html, sourceUrl, planningContext } = req.body as {
    html?: string;
    sourceUrl?: string;
    planningContext?: {
      currentSemester?: number;
      blockedDays?: string[];
      passedModuleCodes?: string[];
      targetEcts?: number;
    };
  };

  if (!html || html.length < 50) {
    res.status(400).json({ ok: false, error: 'html-Body fehlt oder zu kurz.' });
    return;
  }

  const courseDetail = extractFromHtmlString(html, sourceUrl ?? '');

  const ctx = {
    currentSemester: planningContext?.currentSemester ?? 1,
    blockedDays: planningContext?.blockedDays ?? [],
    passedModuleCodes: planningContext?.passedModuleCodes ?? [],
    targetEcts: planningContext?.targetEcts ?? 30,
  };

  const actionsWithPlanning = createCourseDetailRecommendations(courseDetail, ctx);
  const safeDetail = toSafeCourseDetail({ ...courseDetail, availableActions: actionsWithPlanning });

  res.json({
    ok: true,
    courseDetail: safeDetail,
    actions: actionsWithPlanning,
    warnings: courseDetail.warnings,
  });
});

// ── Kursdetail aus Fixture parsen ─────────────────────────────────────────────

app.post('/agent/parse-course-detail-fixture', (req, res) => {
  const { fixtureFileName, sourceUrl } = req.body as { fixtureFileName?: string; sourceUrl?: string };
  if (!fixtureFileName) {
    res.status(400).json({ ok: false, error: 'fixtureFileName fehlt.' });
    return;
  }
  const courseDetail = extractFromFixture(fixtureFileName, sourceUrl ?? '');
  const safeDetail = toSafeCourseDetail(courseDetail);
  res.json({ ok: true, courseDetail: safeDetail, warnings: courseDetail.warnings });
});

// ── Server starten ────────────────────────────────────────────────────────────

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[AgentServer] Läuft auf http://127.0.0.1:${PORT}`);
  console.log(`[AgentServer] Nur für localhost-Verbindungen erreichbar.`);
  console.log(`[AgentServer] Stopp: Ctrl+C`);
});
