/**
 * NINE Extractor – Sprint 4 Nachbesserung
 *
 * Playwright-basierte Extraktion von NINE-Kursdetailseiten.
 * Nutzt nineCourseDetailParser für die Analyse.
 *
 * Sicherheit:
 * - Keine sensiblen Daten (Passwörter, Schlüssel) in Logs
 * - Screenshots nur für Fehlerdiagnose, nie mit sensiblen Inhalten
 * - Keine automatischen Schreibaktionen
 */

import type { Page } from 'playwright';
import { parseNineCourseDetailFromHtml } from './parsers/nineCourseDetailParser.js';
import type { ExtractedCourseDetail } from './types/courseDetail.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ── Aus Playwright-Seite extrahieren ──────────────────────────────────────────

export async function extractCourseDetailPage(
  page: Page,
  courseUrl: string,
): Promise<ExtractedCourseDetail> {
  console.log(`[Extractor] Navigiere zu Kursdetailseite…`);
  // KEINE URL geloggt wenn sie Tokens enthält

  try {
    await page.goto(courseUrl, { timeout: 30_000, waitUntil: 'domcontentloaded' });

    // Warten auf wichtige Bereiche
    await Promise.race([
      page.waitForSelector('h1', { timeout: 8_000 }),
      page.waitForSelector('.course-title', { timeout: 8_000 }),
      page.waitForTimeout(4_000),
    ]).catch(() => {});

    // Sicherstellen, dass dynamischer Content geladen ist
    await page.waitForTimeout(1500);

    const html = await page.content();
    console.log(`[Extractor] HTML geladen: ${html.length} Zeichen`);

    const result = parseNineCourseDetailFromHtml(html, courseUrl);
    console.log(`[Extractor] Extrahiert: ${result.courseTitle ?? 'kein Titel'} | Konfidenz: ${result.confidence}`);
    // Moodle-Schlüssel wird NICHT geloggt

    return result;

  } catch (e) {
    console.error(`[Extractor] Fehler beim Laden der Kursdetailseite: ${e}`);

    // Fehler-Screenshot (kein sensiblen Inhalte)
    try {
      await page.screenshot({ path: resolve(__dirname, '../debug-screenshot.png') }).catch(() => {});
    } catch { /* ignore */ }

    return parseNineCourseDetailFromHtml('', courseUrl);
  }
}

// ── Aus HTML-Fixture (Testdatei) ──────────────────────────────────────────────

export function extractFromFixture(fixtureFileName: string, sourceUrl = ''): ExtractedCourseDetail {
  const fixturePath = resolve(__dirname, 'fixtures', fixtureFileName);
  if (!existsSync(fixturePath)) {
    console.warn(`[Extractor] Fixture nicht gefunden: ${fixturePath}`);
    return parseNineCourseDetailFromHtml('', sourceUrl);
  }
  const html = readFileSync(fixturePath, 'utf-8');
  console.log(`[Extractor] Fixture geladen: ${fixtureFileName} (${html.length} Zeichen)`);
  return parseNineCourseDetailFromHtml(html, sourceUrl);
}

// ── Aus HTML-String (aus API-Request) ────────────────────────────────────────

export function extractFromHtmlString(html: string, sourceUrl = ''): ExtractedCourseDetail {
  return parseNineCourseDetailFromHtml(html, sourceUrl);
}
