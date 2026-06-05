/**
 * NINE Agent – Playwright Browser-Automatisierung
 *
 * Loggt sich in NINE ein und extrahiert Stundenplan-Daten.
 * Läuft sichtbar (headless: false) damit der Nutzer sieht, was passiert.
 *
 * Sicherheit:
 * - Zugangsdaten IMMER aus Umgebungsvariablen oder Session (nie gespeichert)
 * - Keine Zugangsdaten in Logs
 * - Nur Lese-Aktionen (kein automatisches Einschreiben ohne explizite Freigabe)
 */

import { chromium, type Browser, type Page } from 'playwright';

export interface AgentLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface NineScheduleEntry {
  moduleCode: string;
  moduleName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
  group: string;
  semester: number;
  moodleCourseUrl?: string;
  moodleCourseId?: string;
}

export interface NineAgentResult {
  success: boolean;
  error?: string;
  schedule: NineScheduleEntry[];
  modules: Array<{ code: string; name: string; semester: number; ects?: number }>;
  moodleCourses: Array<{ name: string; url: string; courseId: string }>;
  logs: AgentLogEntry[];
  screenshot?: string;   // base64 PNG – für Fehlerdiagnose
}

export class NineAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logs: AgentLogEntry[] = [];
  private onLog?: (entry: AgentLogEntry) => void;

  constructor(onLog?: (entry: AgentLogEntry) => void) {
    this.onLog = onLog;
  }

  private log(level: AgentLogEntry['level'], message: string) {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.push(entry);
    this.onLog?.(entry);
    // Keine sensiblen Daten in console.log
    if (!message.toLowerCase().includes('passwort') && !message.toLowerCase().includes('password')) {
      console.log(`[NineAgent][${level}] ${message}`);
    }
  }

  async launch() {
    this.log('info', 'Starte Chromium-Browser (sichtbar)…');
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 200,       // 200ms Pause zwischen Aktionen – besser sichtbar
      args: ['--window-size=1280,900'],
    });
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'de-DE',
    });
    this.page = await context.newPage();
    this.log('success', 'Browser gestartet.');
  }

  async login(username: string, password: string, baseUrl: string): Promise<boolean> {
    if (!this.page) throw new Error('Browser nicht gestartet.');
    this.log('info', `Navigiere zu: ${baseUrl}`);

    try {
      await this.page.goto(baseUrl, { timeout: 30_000, waitUntil: 'networkidle' });
      this.log('info', `Seite geladen: ${this.page.url()}`);

      // Verschiedene Login-Selektoren versuchen (NINE-Oberfläche kann variieren)
      const usernameSelectors = ['input[name="username"]', 'input[type="text"]', '#username', 'input[name="j_username"]'];
      const passwordSelectors = ['input[name="password"]', 'input[type="password"]', '#password', 'input[name="j_password"]'];
      const submitSelectors   = ['button[type="submit"]', 'input[type="submit"]', '.login-button', '#login-btn'];

      let userField: ReturnType<Page['locator']> | null = null;
      for (const sel of usernameSelectors) {
        const el = this.page.locator(sel).first();
        if (await el.count() > 0) { userField = el; break; }
      }

      let passField: ReturnType<Page['locator']> | null = null;
      for (const sel of passwordSelectors) {
        const el = this.page.locator(sel).first();
        if (await el.count() > 0) { passField = el; break; }
      }

      if (!userField || !passField) {
        this.log('warn', 'Login-Formular nicht gefunden. Möglicherweise bereits eingeloggt oder anderes Layout.');
        // Trotzdem als "Erfolg" behandeln, wenn schon eingeloggt
        return true;
      }

      this.log('info', 'Login-Formular gefunden. Fülle Benutzername ein…');
      await userField.fill(username);
      await this.page.waitForTimeout(300);

      this.log('info', 'Fülle Passwort ein… (wird nicht geloggt)');
      await passField.fill(password);
      await this.page.waitForTimeout(300);

      this.log('info', 'Klicke Login-Button…');
      for (const sel of submitSelectors) {
        const btn = this.page.locator(sel).first();
        if (await btn.count() > 0) {
          await btn.click();
          break;
        }
      }

      await this.page.waitForTimeout(2000);
      this.log('info', `Nach Login: ${this.page.url()}`);

      // Fehler-Erkennung
      const errorText = await this.page.locator('.error, .alert-error, #error, .login-error').first().textContent().catch(() => null);
      if (errorText && errorText.length > 0) {
        this.log('error', `Login-Fehler erkannt: ${errorText.trim()}`);
        return false;
      }

      this.log('success', 'Login erfolgreich (kein Fehler erkannt).');
      return true;

    } catch (e) {
      this.log('error', `Login fehlgeschlagen: ${String(e)}`);
      return false;
    }
  }

  async extractSchedule(curriculum: string, semester: string): Promise<NineScheduleEntry[]> {
    if (!this.page) throw new Error('Browser nicht gestartet.');
    const schedule: NineScheduleEntry[] = [];

    // Erst REST API versuchen (effizient)
    this.log('info', `Lade Stundenplan via API: ${curriculum} / ${semester}…`);
    try {
      const baseUrl = process.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu';
      const token = process.env.VITE_NINE_TOKEN ?? '';

      for (let stage = 1; stage <= 7; stage++) {
        const url = `${baseUrl}/api/v2/modules/${curriculum}/${stage}/${encodeURIComponent(semester)}`;
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await this.page.request.get(url, { headers, timeout: 10_000 }).catch(() => null);
        if (!response || !response.ok()) {
          this.log('warn', `Stage ${stage}: API-Fehler (${response?.status() ?? 'timeout'})`);
          continue;
        }

        const data = await response.json() as { courses?: unknown[] };
        const courses = data.courses ?? (Array.isArray(data) ? data : []) as unknown[];
        this.log('success', `Stage ${stage}: ${courses.length} Kurse aus API`);

        for (const c of courses as Record<string, unknown>[]) {
          const appointments = (c['appointments'] as Record<string, unknown>[] | undefined) ?? [];
          for (const a of appointments) {
            schedule.push({
              moduleCode: String(c['subjectTag'] ?? c['moduleTag'] ?? ''),
              moduleName: String(c['courseName'] ?? c['subjectName'] ?? ''),
              day: String(a['dayOfWeekName'] ?? a['dayDe'] ?? ''),
              startTime: String(a['timeBegin'] ?? a['startTime'] ?? ''),
              endTime: String(a['timeEnd'] ?? a['endTime'] ?? ''),
              room: String((a['rooms'] as unknown[] | undefined)?.[0] ?? ''),
              lecturer: String((a['lecturers'] as unknown[] | undefined)?.[0] ?? ''),
              group: String(c['name'] ?? c['courseName'] ?? ''),
              semester: stage,
            });
          }
        }
      }

      if (schedule.length > 0) {
        this.log('success', `${schedule.length} Termine aus API extrahiert.`);
        return schedule;
      }
    } catch (e) {
      this.log('warn', `API-Abruf fehlgeschlagen: ${e}. Versuche Browser-Scraping…`);
    }

    // Fallback: Browser-Navigation
    this.log('info', 'Navigiere zur Stundenplan-Seite in NINE…');
    try {
      const baseUrl = process.env.VITE_NINE_API_BASE_URL ?? 'https://nine.hm.edu';
      await this.page.goto(`${baseUrl}/schedule`, { timeout: 20_000, waitUntil: 'networkidle' }).catch(() => {
        return this.page!.goto(`${baseUrl}/timetable`, { timeout: 10_000 });
      });

      // Modulnamen aus Seite extrahieren
      const rows = await this.page.locator('table tr, .schedule-entry, .module-row').all();
      this.log('info', `${rows.length} Einträge auf Stundenplan-Seite gefunden.`);

      for (const row of rows.slice(0, 50)) {
        const text = (await row.textContent() ?? '').trim();
        if (text.length > 5) {
          schedule.push({
            moduleCode: '', moduleName: text.slice(0, 60),
            day: '', startTime: '', endTime: '', room: '', lecturer: '', group: '', semester: 0,
          });
        }
      }
    } catch (e) {
      this.log('error', `Browser-Scraping fehlgeschlagen: ${e}`);
    }

    return schedule;
  }

  async takeScreenshot(): Promise<string | undefined> {
    if (!this.page) return undefined;
    try {
      const buf = await this.page.screenshot({ type: 'png', fullPage: false });
      return buf.toString('base64');
    } catch { return undefined; }
  }

  async close() {
    if (this.browser) {
      this.log('info', 'Schließe Browser…');
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.page = null;
      this.log('success', 'Browser geschlossen.');
    }
  }

  async run(
    username: string,
    password: string,
    baseUrl: string,
    curriculum: string,
    semester: string,
  ): Promise<NineAgentResult> {
    this.logs = [];
    let schedule: NineScheduleEntry[] = [];
    let success = false;

    try {
      await this.launch();
      const loggedIn = await this.login(username, password, baseUrl);
      if (!loggedIn) {
        const screenshot = await this.takeScreenshot();
        return { success: false, error: 'Login fehlgeschlagen.', schedule: [], modules: [], moodleCourses: [], logs: this.logs, screenshot };
      }
      schedule = await this.extractSchedule(curriculum, semester);
      success = true;
    } catch (e) {
      this.log('error', `Agent-Fehler: ${e}`);
    } finally {
      await this.close();
    }

    return {
      success,
      schedule,
      modules: [...new Map(schedule.map(s => [s.moduleCode, { code: s.moduleCode, name: s.moduleName, semester: s.semester }])).values()],
      moodleCourses: [],
      logs: this.logs,
    };
  }
}
