import React, { useState, useCallback } from 'react';
import {
  normalizeResume, setByPath,
  emptyEducation, emptyExperience, emptyLeadership, emptyProject,
} from './resumeSchema';
import { toBackendPayload } from './adapters';
import { aiEditResume, generateResumeFile } from '../../../services/resumeApi';
import LocalTemplate from './templates/LocalTemplate';
import GlobalTemplate from './templates/GlobalTemplate';
import '../styles/editor.css';

const EMPTY_ITEM = {
  education: emptyEducation,
  experience: emptyExperience,
  leadership: emptyLeadership,
  projects: emptyProject,
};

const AI_SCOPES = [
  { value: 'all', label: 'Whole CV' },
  { value: 'summary', label: 'Summary' },
  { value: 'experience', label: 'Experience' },
  { value: 'education', label: 'Education' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'projects', label: 'Projects' },
  { value: 'skills', label: 'Skills' },
];

const ResumeEditor = ({ data, setData, onBack }) => {
  const [editable, setEditable] = useState(true);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiScope, setAiScope] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [note, setNote] = useState('');
  const [exporting, setExporting] = useState(false);

  // ── Manual edit operations (immutable, instant live preview) ──
  const update = useCallback((path, value) => setData((d) => setByPath(d, path, value)), [setData]);
  const addItem = useCallback((section) => setData((d) => ({
    ...d, [section]: [...d[section], (EMPTY_ITEM[section] || (() => ({})))()],
  })), [setData]);
  const removeItem = useCallback((section, idx) => setData((d) => ({
    ...d, [section]: d[section].filter((_, i) => i !== idx),
  })), [setData]);
  const addBullet = useCallback((section, idx) => setData((d) => {
    const arr = [...d[section]];
    arr[idx] = { ...arr[idx], bullets: [...(arr[idx].bullets || []), ''] };
    return { ...d, [section]: arr };
  }), [setData]);
  const removeBullet = useCallback((section, idx, bi) => setData((d) => {
    const arr = [...d[section]];
    arr[idx] = { ...arr[idx], bullets: (arr[idx].bullets || []).filter((_, i) => i !== bi) };
    return { ...d, [section]: arr };
  }), [setData]);

  const ops = { update, addItem, removeItem, addBullet, removeBullet };

  const switchTemplate = (template) => {
    setData((d) => ({ ...d, template }));
    setNote('');
  };

  // ── AI rewrite (returns structured JSON, merged safely) ──
  const runAi = useCallback(async () => {
    setAiLoading(true);
    setNote('');
    try {
      const result = await aiEditResume(data, aiInstruction, aiScope);
      setData(normalizeResume(result.resume));
      setNote(result.changed
        ? `AI improved your ${aiScope === 'all' ? 'CV' : aiScope}.`
        : 'AI is unavailable right now — your CV is unchanged.');
    } catch (e) {
      console.error('AI edit failed:', e);
      setNote('AI edit failed — your CV is unchanged.');
    } finally {
      setAiLoading(false);
    }
  }, [data, aiInstruction, aiScope, setData]);

  // ── Export via the EXISTING generate endpoint (content matches the preview) ──
  const handleExport = useCallback(async (fileType) => {
    setExporting(true);
    setNote('');
    try {
      const { format, formData, extras } = toBackendPayload(data);
      const blob = await generateResumeFile({ format, formData, extras, fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.personal.fullName || 'My Resume').trim()}.${fileType}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNote('Export failed. Make sure the backend is running.');
    } finally {
      setExporting(false);
    }
  }, [data]);

  const Template = data.template === 'global' ? GlobalTemplate : LocalTemplate;

  return (
    <div className="re-editor">
      {/* Toolbar */}
      <div className="re-editor-toolbar re-glass">
        <button className="re-cv-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="re-editor-tpl-switch">
          <button className={data.template === 'local' ? 'active' : ''} onClick={() => switchTemplate('local')}>Local CV</button>
          <button className={data.template === 'global' ? 'active' : ''} onClick={() => switchTemplate('global')}>Global CV</button>
        </div>

        <div className="re-editor-actions">
          <button className="re-editor-mode" onClick={() => setEditable((v) => !v)}>
            {editable ? 'Preview' : 'Edit'}
          </button>
          <button className="re-editor-export" disabled={exporting} onClick={() => handleExport('pdf')}>
            {exporting ? '…' : 'PDF'}
          </button>
          <button className="re-editor-export" disabled={exporting} onClick={() => handleExport('docx')}>
            {exporting ? '…' : 'DOCX'}
          </button>
        </div>
      </div>

      <div className="re-editor-body">
        {/* AI side panel */}
        <aside className="re-editor-ai re-glass">
          <h3 className="re-section-title">AI Editor</h3>
          <p className="re-editor-ai-hint">Rewrite a section or the whole CV. Facts are preserved — wording and impact are improved.</p>
          <label className="re-editor-ai-label">Target</label>
          <select className="re-editor-ai-select" value={aiScope} onChange={(e) => setAiScope(e.target.value)}>
            {AI_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label className="re-editor-ai-label">Instruction (optional)</label>
          <textarea
            className="re-editor-ai-input"
            rows={3}
            placeholder="e.g. Make bullets results-driven with metrics"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
          />
          <button className="re-editor-ai-btn" disabled={aiLoading} onClick={runAi}>
            {aiLoading ? 'Improving…' : '✨ Improve with AI'}
          </button>
          {note && <p className="re-editor-note">{note}</p>}
          <p className="re-editor-ai-foot">{editable ? 'Editing mode — click any field to type.' : 'Preview mode.'}</p>
        </aside>

        {/* Document (live preview / inline editor) */}
        <main className="re-editor-doc-wrap">
          <div className={`re-editor-doc-paper ${editable ? 'editing' : ''}`}>
            <Template data={data} editable={editable} ops={ops} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumeEditor;
