import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { ChatMessage } from '../services/chatbotService';
import { generateBotResponse } from '../services/chatbotService';
import type { PassedModule } from '../types';

const SUGGESTIONS = [
  'Was fehlt mir noch?',
  'Ich arbeite Montag von 8 bis 13.',
  'Ich habe Mathematik 1 bestanden mit 2,3.',
  'Kann ich 30 ECTS machen?',
  'Kann ich Semester-3-Module machen?',
  'Warum ist TM2 nicht empfohlen?',
  'Welches Szenario ist sinnvoll?',
];

export default function StudentChatbot() {
  const { planningParams, updatePlanningParams, student, updatePassedModules, recalculate } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init', role: 'bot', timestamp: new Date().toISOString(),
    text: 'Hallo! Ich bin dein Studienplanungs-Assistent.\n\nIch verstehe Fragen wie:\n• „Ich arbeite Montag von 8 bis 13"\n• „Ich habe Mathematik 1 bestanden mit 2,3"\n• „Kann ich 30 ECTS machen?"\n• „Was fehlt mir noch?"\n• „Kann ich Semester-3-Module machen?"',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const passedNames = student.passedModules.map(m => m.module);
  const openNames = student.openModules.map(m => m.module);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));

    const response = generateBotResponse(text, planningParams, passedNames, openNames);

    // Planungsparameter aktualisieren
    if (Object.keys(response.paramUpdates).length > 0) {
      updatePlanningParams(response.paramUpdates);
    }

    // Neues bestandenes Modul
    if (response.newPassedModule) {
      const { module, grade, ects } = response.newPassedModule;
      const newMod: PassedModule = {
        code: `CHAT-${Date.now()}`, module, semester: 0,
        ects: ects ?? 5, grade, status: 'bestanden',
        source: 'Chatbot', dataLabel: 'manuell',
      };
      updatePassedModules([...student.passedModules, newMod]);
      recalculate();
    }

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(), role: 'bot', text: response.text,
      intent: response.intent, timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="page">
      <h1>Studienplanungs-Assistent</h1>
      <p className="source-note">
        Regelbasierter Chatbot · lokal · kein Server · Schreibfehler werden toleriert
        <span className="badge badge-code" style={{ marginLeft: 8 }}>Lokal</span>
        <span className="badge badge-warn" style={{ marginLeft: 4 }}>KI-Agent zurückgestellt</span>
      </p>

      {/* Chat-Verlauf */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', minHeight: 300, maxHeight: 450, overflowY: 'auto', background: '#f8fafc', marginBottom: '0.75rem' }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.6rem' }}>
            <div style={{
              maxWidth: '82%', padding: '0.55rem 0.85rem', borderRadius: 12,
              background: m.role === 'user' ? '#1e3a8a' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1a1a2e',
              border: m.role === 'bot' ? '1px solid #e2e8f0' : 'none',
              fontSize: '0.84rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>
              {m.role === 'bot' && <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: 3 }}>Assistent</span>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.55rem 0.85rem', fontSize: '0.84rem', color: '#94a3b8' }}>
              Schreibe…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Schnell-Vorschläge */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '0.6rem' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 9px' }}
            onClick={() => handleSend(s)}>{s}</button>
        ))}
      </div>

      {/* Eingabe */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
          placeholder="Nachricht eingeben… (Enter zum Senden)"
          style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #c5cae9', borderRadius: 8, fontSize: '0.88rem' }}
          disabled={loading} />
        <button className="btn-primary" onClick={() => handleSend(input)} disabled={loading || !input.trim()}>
          Senden
        </button>
      </div>

      <div className="info-box" style={{ marginTop: '1rem' }}>
        <strong>Eigener KI-Agent:</strong> Zurückgestellt. Chatbot nutzt lokal regelbasierte Logik.
        LLM-Anbindung ist architektonisch vorbereitet.
      </div>
    </div>
  );
}
