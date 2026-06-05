/**
 * Availability Manager – Sprint 3 Nachbesserung
 * UI für stundenweise Sperrzeiten
 */

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AvailabilityBlock } from '../types';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const REASONS: AvailabilityBlock['reason'][] = ['Arbeit', 'privat', 'Pendeln', 'sonstiges'];

export default function AvailabilityManager() {
  const { planningParams, updatePlanningParams, recalculate } = useApp();
  const blocks = planningParams.blockedTimeSlots ?? [];

  const [newDay, setNewDay] = useState('Montag');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('13:00');
  const [newReason, setNewReason] = useState<AvailabilityBlock['reason']>('Arbeit');

  const addBlock = () => {
    if (newStart >= newEnd) return;
    const block: AvailabilityBlock = {
      id: `block-${Date.now()}`, day: newDay, startTime: newStart, endTime: newEnd, reason: newReason, active: true,
    };
    const updated = [...blocks, block];
    // Auch blockedDays aktualisieren (ganze Tage aus Blocks ableiten, wenn 8+ Stunden gesperrt)
    const newBlockedDays = DAYS.filter(d => {
      const dayBlocks = updated.filter(b => b.active && b.day === d);
      const totalMins = dayBlocks.reduce((s, b) => {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        return s + (eh * 60 + em) - (sh * 60 + sm);
      }, 0);
      return totalMins >= 480; // >= 8h gesperrt → ganzer Tag
    });
    updatePlanningParams({ blockedTimeSlots: updated, blockedDays: newBlockedDays });
    recalculate();
  };

  const toggleBlock = (id: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, active: !b.active } : b);
    updatePlanningParams({ blockedTimeSlots: updated });
    recalculate();
  };

  const removeBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    updatePlanningParams({ blockedTimeSlots: updated });
    recalculate();
  };

  const byDay = DAYS.map(d => ({ day: d, blocks: blocks.filter(b => b.day === d) }));

  return (
    <div className="page">
      <h1>Verfügbarkeit & Sperrzeiten</h1>
      <p className="source-note">
        Lege stundenweise Sperrzeiten fest. Module außerhalb gesperrter Zeiten bleiben planbar.
        Bei ≥ 8h gesperrter Zeit wird der gesamte Tag automatisch als gesperrt markiert.
      </p>

      {/* Neue Sperrzeit */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Tag</label>
          <select value={newDay} onChange={e => setNewDay(e.target.value)} style={{ padding: '0.35rem 0.5rem', border: '1px solid #c5cae9', borderRadius: 6 }}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Von</label>
          <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} style={{ padding: '0.35rem', border: '1px solid #c5cae9', borderRadius: 6 }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Bis</label>
          <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ padding: '0.35rem', border: '1px solid #c5cae9', borderRadius: 6 }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Grund</label>
          <select value={newReason} onChange={e => setNewReason(e.target.value as AvailabilityBlock['reason'])} style={{ padding: '0.35rem', border: '1px solid #c5cae9', borderRadius: 6 }}>
            {REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={addBlock} disabled={newStart >= newEnd}>+ Sperrzeit hinzufügen</button>
      </div>

      {/* Übersicht nach Wochentag */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {byDay.map(({ day, blocks: dayBlocks }) => (
          <div key={day} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#1e3a8a' }}>
              {day}
              {planningParams.blockedDays.includes(day) && <span className="badge badge-blocked" style={{ marginLeft: 6, fontSize: '0.65rem' }}>ganztags gesperrt</span>}
            </div>
            {dayBlocks.length === 0 && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Keine Sperrzeiten</div>}
            {dayBlocks.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.8rem',
                opacity: b.active ? 1 : 0.5, background: b.active ? '#fee2e2' : '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                <span style={{ flex: 1 }}>{b.startTime}–{b.endTime} <span style={{ color: '#64748b' }}>({b.reason})</span></span>
                <button onClick={() => toggleBlock(b.id)} title={b.active ? 'Deaktivieren' : 'Aktivieren'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                  {b.active ? '⏸' : '▶'}
                </button>
                <button onClick={() => removeBlock(b.id)} title="Löschen"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {planningParams.blockedDays.length > 0 && (
        <div className="assumption-note" style={{ marginTop: '1rem' }}>
          Ganztags gesperrte Tage: <strong>{planningParams.blockedDays.join(', ')}</strong> –
          Module an diesen Tagen werden aus allen Szenarien entfernt.
        </div>
      )}
    </div>
  );
}
