import React, { useState } from 'react';
import '../styles/analysis.css';

const scoreColor = (s) => (s >= 75 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444');

/**
 * Explainable AI analysis display. Purely presentational — renders the structured
 * result from POST /api/resume/analyze. Optional job-description box drives the
 * keyword-match category.
 */
const AnalysisBreakdown = ({ analysis, jobDescription, setJobDescription, onReanalyze, isAnalyzing }) => {
  const [open, setOpen] = useState(null);
  if (!analysis) return null;

  const { overallScore, summary, categories = [], keywords = {}, topRecommendations = [], meta = {} } = analysis;

  return (
    <div className="re-analysis re-glass">
      <div className="re-analysis-head">
        <h3 className="re-section-title">AI Analysis Breakdown</h3>
        <span className={`re-analysis-source re-analysis-source-${meta.source || 'ai'}`}>
          {meta.source === 'heuristic' ? 'Offline scoring' : 'AI scoring'}
        </span>
      </div>

      {summary && <p className="re-analysis-summary">{summary}</p>}

      {topRecommendations.length > 0 && (
        <div className="re-analysis-recos">
          <h4 className="re-analysis-subtitle">Top recommendations</h4>
          <ul>
            {topRecommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="re-analysis-cats">
        {categories.map((c) => {
          const isOpen = open === c.key;
          return (
            <div key={c.key} className="re-cat">
              <button className="re-cat-head" onClick={() => setOpen(isOpen ? null : c.key)} aria-expanded={isOpen}>
                <span className="re-cat-label">{c.label}</span>
                <span className="re-cat-score" style={{ color: scoreColor(c.score) }}>{c.score}</span>
              </button>
              <div className="re-cat-bar">
                <div className="re-cat-bar-fill" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
              </div>
              {isOpen && (
                <div className="re-cat-detail">
                  {c.reasoning && <p className="re-cat-reasoning">{c.reasoning}</p>}
                  {c.strengths?.length > 0 && (
                    <div className="re-cat-list re-cat-strengths">
                      <span className="re-cat-list-title">Strengths</span>
                      <ul>{c.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {c.weaknesses?.length > 0 && (
                    <div className="re-cat-list re-cat-weaknesses">
                      <span className="re-cat-list-title">Weaknesses</span>
                      <ul>{c.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {c.improvements?.length > 0 && (
                    <div className="re-cat-list re-cat-improvements">
                      <span className="re-cat-list-title">How to improve</span>
                      <ul>{c.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(keywords.matched?.length > 0 || keywords.missing?.length > 0) && (
        <div className="re-analysis-keywords">
          <h4 className="re-analysis-subtitle">Keywords</h4>
          <div className="re-kw-row">
            {keywords.matched?.map((k, i) => <span key={`m-${i}`} className="re-kw re-kw-matched">{k}</span>)}
            {keywords.missing?.map((k, i) => <span key={`x-${i}`} className="re-kw re-kw-missing">{k}</span>)}
          </div>
        </div>
      )}

      <div className="re-analysis-jd">
        <label className="re-analysis-subtitle" htmlFor="re-jd">Target job description (optional)</label>
        <textarea
          id="re-jd"
          className="re-jd-input"
          placeholder="Paste a job description to score keyword match against it..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={3}
        />
        <button className="re-jd-btn" onClick={onReanalyze} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>
      <p className="re-analysis-overall">Overall score: <strong style={{ color: scoreColor(overallScore) }}>{overallScore}/100</strong></p>
    </div>
  );
};

export default AnalysisBreakdown;
