/**
 * AgentCourseDetailResult
 *
 * Zeigt extrahierte Daten einer NINE-Kursdetailseite an.
 * Sicherheit:
 *  - Moodle-Schlüssel immer maskiert
 *  - High-Risk-Aktionen erfordern doppelte Bestätigung
 *  - Keine automatischen Aktionen
 */

import React, { useState } from 'react';
import type {
  ExtractedCourseDetail, AgentAction, EnrollmentStatusCode, RiskLevel,
} from '../types/courseDetail';

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function enrollmentBadge(status: EnrollmentStatusCode) {
  const map: Record<EnrollmentStatusCode, { label: string; color: string }> = {
    enrolled:    { label: 'Eingetragen',     color: '#22c55e' },
    not_enrolled:{ label: 'Nicht eingetragen', color: '#f59e0b' },
    waitlist:    { label: 'Warteliste',      color: '#3b82f6' },
    closed:      { label: 'Geschlossen',     color: '#ef4444' },
    unknown:     { label: 'Unbekannt',       color: '#9ca3af' },
  };
  const b = map[status] ?? map.unknown;
  return (
    <span style={{
      backgroundColor: b.color, color: '#fff',
      borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600,
    }}>{b.label}</span>
  );
}

function riskColor(level: RiskLevel): string {
  return level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
}

function confidenceBadge(c: 'hoch' | 'mittel' | 'niedrig') {
  const colors = { hoch: '#22c55e', mittel: '#f59e0b', niedrig: '#ef4444' };
  return (
    <span style={{
      backgroundColor: colors[c], color: '#fff',
      borderRadius: 4, padding: '1px 8px', fontSize: 12, marginLeft: 8,
    }}>Konfidenz: {c}</span>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

interface Props {
  detail: ExtractedCourseDetail;
  /** Roher transient Schlüssel – NUR wenn unmittelbar nach Extraktion übergeben */
  moodleKeyTransient?: string | null;
  onActionConfirm?: (action: AgentAction) => void;
}

export const AgentCourseDetailResult: React.FC<Props> = ({
  detail, moodleKeyTransient, onActionConfirm,
}) => {
  const [keyVisible, setKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);
  const [doubleConfirmAction, setDoubleConfirmAction] = useState<AgentAction | null>(null);

  const moodle = detail.moodle;

  // ── Schlüssel-Anzeige/-Kopieren ───────────────────────────────────────────

  function handleCopyKey() {
    if (!moodleKeyTransient) {
      alert('Zugangsschlüssel nicht verfügbar – bitte Kursdetail neu auslesen.');
      return;
    }
    navigator.clipboard.writeText(moodleKeyTransient).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    });
  }

  // ── Aktions-Bestätigung ───────────────────────────────────────────────────

  function handleActionClick(action: AgentAction) {
    if (action.requiresDoubleConfirmation) {
      setDoubleConfirmAction(action);
    } else if (action.requiresConfirmation) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  }

  function executeAction(action: AgentAction) {
    setPendingAction(null);
    setDoubleConfirmAction(null);

    if (action.type === 'OPEN_MOODLE_LINK' && action.targetUrl) {
      window.open(action.targetUrl, '_blank', 'noopener,noreferrer');
    } else if (action.type === 'COPY_MOODLE_ACCESS_KEY') {
      handleCopyKey();
    } else if (action.type === 'OPEN_COURSE_PAGE' && action.targetUrl) {
      window.open(action.targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      onActionConfirm?.(action);
    }
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10,
      padding: 20, backgroundColor: '#fff',
      fontFamily: 'system-ui, sans-serif', maxWidth: 820,
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>
          {detail.courseTitle ?? '(kein Titel)'}
        </h2>
        {detail.moduleTag && (
          <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>
            {detail.moduleTag}
          </span>
        )}
        {confidenceBadge(detail.confidence)}
      </div>

      {/* ── Metadaten ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 16, fontSize: 14 }}>
        {detail.moduleName && detail.moduleName !== detail.courseTitle && (
          <Row label="Modul" value={detail.moduleName} />
        )}
        {detail.courseGroup && <Row label="Gruppe" value={detail.courseGroup} />}
        {detail.curriculumPath && <Row label="Einordnung" value={detail.curriculumPath} />}
        {detail.lecturer && <Row label="Dozent" value={detail.lecturer} />}
        {detail.room && <Row label="Raum" value={detail.room} />}
      </div>

      {/* ── Nächster Termin ─────────────────────────────────────── */}
      {detail.nextAppointment && (
        <Section title="Nächster Termin">
          <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '8px 12px', fontSize: 14 }}>
            {detail.nextAppointment.date && <span>{detail.nextAppointment.date} </span>}
            {detail.nextAppointment.day && <span>{detail.nextAppointment.day} </span>}
            {detail.nextAppointment.startTime && (
              <strong>{detail.nextAppointment.startTime} – {detail.nextAppointment.endTime ?? '?'}</strong>
            )}
            {detail.nextAppointment.room && <span> | 📍 {detail.nextAppointment.room}</span>}
            {detail.nextAppointment.lecturer && <span> | {detail.nextAppointment.lecturer}</span>}
            <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>
              ({detail.nextAppointment.confidence})
            </span>
          </div>
          {detail.allAppointmentsLink && (
            <a href={detail.allAppointmentsLink} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#3b82f6', marginTop: 4, display: 'inline-block' }}>
              Alle Termine →
            </a>
          )}
        </Section>
      )}

      {/* ── Moodle ─────────────────────────────────────────────── */}
      {moodle && (
        <Section title="Moodle">
          <div style={{ background: '#fafaf8', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', fontSize: 14 }}>
            <div style={{ marginBottom: 6 }}>
              <strong>Link:</strong>{' '}
              <span style={{ color: '#6b7280', fontSize: 12 }}>{moodle.url}</span>
            </div>
            {moodle.hasAccessKey && (
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Zugangsschlüssel:</strong>
                <code style={{ letterSpacing: 2 }}>
                  {keyVisible && moodleKeyTransient ? moodleKeyTransient : (moodle.accessKeyMasked ?? '••••••••••')}
                </code>
                <button onClick={() => setKeyVisible(v => !v)}
                  style={btnStyle('low')}>
                  {keyVisible ? 'ausblenden' : 'anzeigen'}
                </button>
                <button onClick={() => handleActionClick(
                  detail.availableActions.find(a => a.type === 'COPY_MOODLE_ACCESS_KEY') ?? {
                    id: 'copy-key', type: 'COPY_MOODLE_ACCESS_KEY', title: 'Zugangsschlüssel kopieren',
                    description: '', riskLevel: 'low', requiresConfirmation: true, status: 'proposed',
                    warningText: 'Der Zugangsschlüssel wird nur lokal verwendet und nicht gespeichert.',
                  }
                )}
                  style={btnStyle('low')}>
                  {copiedKey ? '✓ kopiert' : 'kopieren'}
                </button>
              </div>
            )}
            <button onClick={() => handleActionClick(
              detail.availableActions.find(a => a.type === 'OPEN_MOODLE_LINK') ?? {
                id: 'open-moodle', type: 'OPEN_MOODLE_LINK', title: 'Moodle öffnen',
                description: moodle.url, targetUrl: moodle.url,
                riskLevel: 'low', requiresConfirmation: true, status: 'proposed',
              }
            )}
              style={btnStyle('low')}>
              🔗 Moodle öffnen
            </button>
          </div>
        </Section>
      )}

      {/* ── Einschreibestatus ───────────────────────────────────── */}
      <Section title="Meine Eintragung">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          {enrollmentBadge(detail.enrollment.status)}
          {detail.enrollment.statusText && (
            <span style={{ color: '#374151' }}>{detail.enrollment.statusText}</span>
          )}
        </div>
        {detail.enrollment.capacityText && (
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {detail.enrollment.capacityText}
          </div>
        )}
      </Section>

      {/* ── Handlungsempfehlungen ────────────────────────────────── */}
      {detail.availableActions.filter(a => a.type !== 'OPEN_COURSE_PAGE').length > 0 && (
        <Section title="Handlungsempfehlungen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.availableActions
              .filter(a => a.type !== 'OPEN_COURSE_PAGE')
              .map(action => (
                <div key={action.id} style={{
                  border: `1px solid ${riskColor(action.riskLevel)}30`,
                  borderLeft: `4px solid ${riskColor(action.riskLevel)}`,
                  borderRadius: 6, padding: '8px 12px', fontSize: 14,
                  background: action.riskLevel === 'high' ? '#fff5f5' : '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{action.title}</strong>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                      {action.riskLevel === 'high' ? '⚠ Hohes Risiko' :
                       action.riskLevel === 'medium' ? 'Bestätigung nötig' : ''}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{action.description}</div>
                  {action.warningText && (
                    <div style={{ color: '#d97706', fontSize: 12, marginTop: 4 }}>⚠ {action.warningText}</div>
                  )}
                  {action.status === 'proposed' && (
                    <button onClick={() => handleActionClick(action)}
                      style={{ ...btnStyle(action.riskLevel), marginTop: 6 }}>
                      {action.title}
                    </button>
                  )}
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* ── Warnungen ───────────────────────────────────────────── */}
      {detail.warnings.length > 0 && (
        <Section title="Hinweise">
          {detail.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 13, color: '#92400e', background: '#fffbeb',
              borderRadius: 4, padding: '4px 8px', marginBottom: 4 }}>
              ⚠ {w}
            </div>
          ))}
        </Section>
      )}

      {/* ── Quelle ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
        Quelle: NINE Kursdetailseite · Extrahiert: {new Date(detail.extractedAt).toLocaleString('de-DE')}
        {detail.sourceUrl && (
          <> · <a href={detail.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af' }}>
            Original öffnen
          </a></>
        )}
      </div>

      {/* ── Bestätigungsdialog (einfach) ─────────────────────────── */}
      {pendingAction && (
        <ConfirmDialog
          action={pendingAction}
          onConfirm={() => executeAction(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* ── Bestätigungsdialog (doppelt / High-Risk) ─────────────── */}
      {doubleConfirmAction && (
        <DoubleConfirmDialog
          action={doubleConfirmAction}
          onConfirm={() => executeAction(doubleConfirmAction)}
          onCancel={() => setDoubleConfirmAction(null)}
        />
      )}
    </div>
  );
};

// ── Teilkomponenten ───────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span style={{ color: '#6b7280', marginRight: 6 }}>{label}:</span>
    <span>{value}</span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 14 }}>
    <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>
      {title}
    </h4>
    {children}
  </div>
);

function btnStyle(risk: RiskLevel): React.CSSProperties {
  const bg = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#3b82f6';
  return {
    backgroundColor: bg, color: '#fff', border: 'none',
    borderRadius: 5, padding: '4px 12px', fontSize: 13,
    cursor: 'pointer', fontWeight: 500,
  };
}

const ConfirmDialog: React.FC<{
  action: AgentAction;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, onConfirm, onCancel }) => (
  <div style={overlayStyle}>
    <div style={dialogStyle}>
      <h3 style={{ marginTop: 0 }}>Bestätigung erforderlich</h3>
      <p><strong>{action.title}</strong></p>
      <p style={{ fontSize: 14, color: '#4b5563' }}>{action.description}</p>
      {action.warningText && (
        <p style={{ fontSize: 13, color: '#d97706', background: '#fffbeb', borderRadius: 4, padding: '6px 10px' }}>
          ⚠ {action.warningText}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={onConfirm} style={btnStyle(action.riskLevel)}>Bestätigen</button>
        <button onClick={onCancel} style={{ ...btnStyle('low'), backgroundColor: '#6b7280' }}>Abbrechen</button>
      </div>
    </div>
  </div>
);

const DoubleConfirmDialog: React.FC<{
  action: AgentAction;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, onConfirm, onCancel }) => {
  const [step, setStep] = useState(1);
  return (
    <div style={overlayStyle}>
      <div style={{ ...dialogStyle, borderTop: '4px solid #ef4444' }}>
        <h3 style={{ marginTop: 0, color: '#dc2626' }}>⚠ Hochriskante Aktion – Schritt {step} von 2</h3>
        <p><strong>{action.title}</strong></p>
        {step === 1 ? (
          <>
            <p style={{ fontSize: 14 }}>{action.description}</p>
            {action.warningText && (
              <p style={{ fontSize: 13, color: '#d97706', background: '#fffbeb', borderRadius: 4, padding: '6px 10px' }}>
                ⚠ {action.warningText}
              </p>
            )}
            <p style={{ fontSize: 14, fontWeight: 600 }}>Bist du sicher, dass du fortfahren möchtest?</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setStep(2)} style={btnStyle('high')}>Ja, weiter</button>
              <button onClick={onCancel} style={{ ...btnStyle('low'), backgroundColor: '#6b7280' }}>Abbrechen</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
              Letzte Bestätigung: Diese Aktion kann nicht automatisch rückgängig gemacht werden.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={onConfirm} style={btnStyle('high')}>Endgültig bestätigen</button>
              <button onClick={onCancel} style={{ ...btnStyle('low'), backgroundColor: '#6b7280' }}>Abbrechen</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 10, padding: 24,
  maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

export default AgentCourseDetailResult;
