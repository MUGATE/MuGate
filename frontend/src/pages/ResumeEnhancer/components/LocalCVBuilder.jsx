import React from 'react';
import ScoreRing from './ScoreRing';
import SuggestionCard from './SuggestionCard';
import ChatBubble from './ChatBubble';
import CVField, { CVSection, CVRow } from './CVField';

const LOCAL_SUGGESTIONS = [
  'Include your phone number with Lebanon country code (+961).',
  'Add a LinkedIn profile URL below your email.',
  'Use action verbs to describe experience bullets.',
  'Include GPA if above 3.0 on a 4.0 scale.',
  'List languages with fluency levels (e.g., Native, Fluent, Basic).',
];

const LocalCVBuilder = ({
  form, updateField, messages, input, setInput,
  sendMessage, isLoading, chatRef,
  extraEdu, extraExp, extraProjects,
  addEdu, removeEdu, updateEdu,
  addExp, removeExp, updateExp,
  addProject, removeProject, updateProject,
  showPreview, setShowPreview,
  openDownloadModal, onBack,
}) => {
  const fillRatio = Math.round(
    Object.values(form).filter(v => v.trim()).length / Object.keys(form).length * 100
  );

  if (showPreview === 'local') {
    return (
      <div className="re-cv-form-card re-glass">
        <div className="cv-form-header">
          <button className="re-cv-back-btn" onClick={() => setShowPreview(null)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Edit
          </button>
          <h2 className="cv-form-title">Review Your CV <span className="re-cv-badge re-cv-badge-local">Local</span></h2>
        </div>
        <div className="cv-form-body">
          <div className="cv-prev-document">
            <h3 className="cv-prev-name">{form.fullName || 'Your Name'}</h3>
            <div className="cv-prev-contact">
              {[form.address, form.phone, form.email, form.linkedin].filter(Boolean).join(' | ') || 'Contact info'}
            </div>
            {form.objective?.trim() && <><h4 className="cv-prev-heading">OBJECTIVE</h4><p className="cv-prev-body">{form.objective}</p></>}
            <h4 className="cv-prev-heading">EDUCATION</h4>
            {form.eduInst1?.trim() && <div className="cv-prev-org-line"><strong>{form.eduInst1}</strong>{form.eduLoc1 && <span>, {form.eduLoc1}</span>}</div>}
            {form.eduDegree1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {form.eduDegree1}</div>}
            {form.eduGpa1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa1}</div>}
            {form.eduInst2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{form.eduInst2}</strong>{form.eduLoc2 && <span>, {form.eduLoc2}</span>}</div>}
            {form.eduGpa2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa2}</div>}
            {extraEdu.map((edu, i) => (
              <React.Fragment key={`prev-edu-${i}`}>
                {edu.inst?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{edu.inst}</strong>{edu.loc && <span>, {edu.loc}</span>}</div>}
                {edu.gpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {edu.gpa}</div>}
              </React.Fragment>
            ))}
            <h4 className="cv-prev-heading">EXPERIENCE</h4>
            {form.expCompany1?.trim() && <div className="cv-prev-org-line"><strong>{form.expCompany1}</strong>{form.expLoc1 && <span>, {form.expLoc1}</span>}</div>}
            {form.expPos1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {form.expPos1}</div>}
            {[form.expBullet1a, form.expBullet1b, form.expBullet1c].filter(b => b?.trim()).length > 0 &&
              <ul className="cv-prev-bullets">{[form.expBullet1a, form.expBullet1b, form.expBullet1c].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
            {form.expCompany2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{form.expCompany2}</strong>{form.expLoc2 && <span>, {form.expLoc2}</span>}</div>}
            {form.expPos2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {form.expPos2}</div>}
            {[form.expBullet2a, form.expBullet2b].filter(b => b?.trim()).length > 0 &&
              <ul className="cv-prev-bullets">{[form.expBullet2a, form.expBullet2b].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
            {extraExp.map((exp, i) => (
              <React.Fragment key={`prev-exp-${i}`}>
                {exp.company?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{exp.company}</strong>{exp.loc && <span>, {exp.loc}</span>}</div>}
                {exp.pos?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {exp.pos}</div>}
                {[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).length > 0 &&
                  <ul className="cv-prev-bullets">{[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </React.Fragment>
            ))}
            {(form.project1?.trim() || form.project2?.trim() || extraProjects.some(p => p.text?.trim())) &&
              <><h4 className="cv-prev-heading">PROJECTS</h4>{form.project1?.trim() && <div className="cv-prev-line">{form.project1}</div>}{form.project2?.trim() && <div className="cv-prev-line">{form.project2}</div>}{extraProjects.map((p, i) => p.text?.trim() ? <div key={i} className="cv-prev-line">{p.text}</div> : null)}</>}
            <h4 className="cv-prev-heading">SKILLS</h4>
            {form.languages?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Languages:</span> {form.languages}</div>}
            {form.computerSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Computer:</span> {form.computerSkills}</div>}
            {form.technicalSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {form.technicalSkills}</div>}
            {form.softSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Soft Skills:</span> {form.softSkills}</div>}
          </div>
          <div className="cv-prev-actions">
            <button className="cv-prev-edit-btn" onClick={() => setShowPreview(null)}>Edit</button>
            <button className="cv-download-btn cv-prev-confirm-btn" onClick={() => openDownloadModal('local')}>Confirm & Download</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="re-left-col">
        <div className="re-score-card re-glass">
          <h3 className="re-section-title">CV Progress</h3>
          <ScoreRing score={fillRatio} />
        </div>
        <div className="re-suggestions-card re-glass">
          <h3 className="re-section-title">Tips for Local CV</h3>
          <div className="suggestions-list">
            {LOCAL_SUGGESTIONS.map((text, i) => <SuggestionCard key={i} index={i} text={text} />)}
          </div>
        </div>
      </div>

      <div className="re-center-col">
        <div className="re-cv-form-card re-glass">
          <div className="cv-form-header">
            <button className="re-cv-back-btn" onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h2 className="cv-form-title">Local CV Builder <span className="re-cv-badge re-cv-badge-local">Lebanon</span></h2>
          </div>
          <div className="cv-form-body">
            <CVSection title="PERSONAL INFORMATION">
              <CVField label="Full Name" value={form.fullName} onChange={v => updateField('fullName', v)} placeholder="Your Full Name" />
              <CVField label="Address" value={form.address} onChange={v => updateField('address', v)} placeholder="Street, City, Lebanon" />
              <CVRow>
                <CVField label="Phone" value={form.phone} onChange={v => updateField('phone', v)} placeholder="+961-3-XXXXXXX" />
                <CVField label="Email" value={form.email} onChange={v => updateField('email', v)} placeholder="your@email.com" />
              </CVRow>
              <CVField label="LinkedIn" value={form.linkedin} onChange={v => updateField('linkedin', v)} placeholder="linkedin.com/in/yourprofile" />
            </CVSection>

            <CVSection title="OBJECTIVE / PROFILE">
              <CVField value={form.objective} onChange={v => updateField('objective', v)} placeholder="Seeking a position in..." multiline />
            </CVSection>

            <CVSection title="EDUCATION (Most Recent First)">
              <CVRow>
                <CVField label="From" value={form.eduFrom1} onChange={v => updateField('eduFrom1', v)} placeholder="MM/YY" />
                <CVField label="To" value={form.eduTo1} onChange={v => updateField('eduTo1', v)} placeholder="MM/YY" />
              </CVRow>
              <CVRow>
                <CVField label="Institution" value={form.eduInst1} onChange={v => updateField('eduInst1', v)} placeholder="American University of Beirut" />
                <CVField label="Location" value={form.eduLoc1} onChange={v => updateField('eduLoc1', v)} placeholder="Beirut, Lebanon" />
              </CVRow>
              <CVField label="Degree & Emphasis" value={form.eduDegree1} onChange={v => updateField('eduDegree1', v)} placeholder="Bachelor in Business Administration, Emphasis on Finance" />
              <CVRow>
                <CVField label="Minor" value={form.eduMinor1} onChange={v => updateField('eduMinor1', v)} placeholder="Economics" />
                <CVField label="Expected Graduation" value={form.eduGradDate1} onChange={v => updateField('eduGradDate1', v)} placeholder="June 2026" />
              </CVRow>
              <CVField label="Relevant Courses" value={form.eduCourses1} onChange={v => updateField('eduCourses1', v)} placeholder="Accounting, Finance, Marketing, Management" />
              <CVField label="GPA / Honors" value={form.eduGpa1} onChange={v => updateField('eduGpa1', v)} placeholder="3.5/4.0, Dean's List" />

              <div className="cv-form-divider" />
              <CVRow>
                <CVField label="From" value={form.eduFrom2} onChange={v => updateField('eduFrom2', v)} placeholder="MM/YY" />
                <CVField label="To" value={form.eduTo2} onChange={v => updateField('eduTo2', v)} placeholder="MM/YY" />
              </CVRow>
              <CVRow>
                <CVField label="High School" value={form.eduInst2} onChange={v => updateField('eduInst2', v)} placeholder="International College" />
                <CVField label="Location" value={form.eduLoc2} onChange={v => updateField('eduLoc2', v)} placeholder="Beirut, Lebanon" />
              </CVRow>
              <CVField label="GPA / Honors" value={form.eduGpa2} onChange={v => updateField('eduGpa2', v)} placeholder="GPA or Awards" />
              {extraEdu.map((edu, i) => (
                <React.Fragment key={`extra-edu-${i}`}>
                  <div className="cv-form-divider" />
                  <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeEdu(i)}>Remove</button></div>
                  <CVRow>
                    <CVField label="From" value={edu.from} onChange={v => updateEdu(i, 'from', v)} placeholder="MM/YY" />
                    <CVField label="To" value={edu.to} onChange={v => updateEdu(i, 'to', v)} placeholder="MM/YY" />
                  </CVRow>
                  <CVRow>
                    <CVField label="Institution" value={edu.inst} onChange={v => updateEdu(i, 'inst', v)} placeholder="Institution Name" />
                    <CVField label="Location" value={edu.loc} onChange={v => updateEdu(i, 'loc', v)} placeholder="City, Country" />
                  </CVRow>
                  <CVField label="GPA / Honors" value={edu.gpa} onChange={v => updateEdu(i, 'gpa', v)} placeholder="GPA or Awards" />
                </React.Fragment>
              ))}
              <button className="cv-add-entry-btn" onClick={addEdu}>+ Add Education</button>
            </CVSection>

            <CVSection title="EXPERIENCE (Most Recent First)">
              <CVRow>
                <CVField label="From" value={form.expFrom1} onChange={v => updateField('expFrom1', v)} placeholder="MM/YY" />
                <CVField label="To" value={form.expTo1} onChange={v => updateField('expTo1', v)} placeholder="Present" />
              </CVRow>
              <CVRow>
                <CVField label="Company" value={form.expCompany1} onChange={v => updateField('expCompany1', v)} placeholder="Company Name" />
                <CVField label="Location" value={form.expLoc1} onChange={v => updateField('expLoc1', v)} placeholder="City, Country" />
              </CVRow>
              <CVField label="Position" value={form.expPos1} onChange={v => updateField('expPos1', v)} placeholder="Job Title" />
              <CVField label="• Responsibility 1" value={form.expBullet1a} onChange={v => updateField('expBullet1a', v)} placeholder="Use action verbs: Designed, Managed, Developed..." />
              <CVField label="• Responsibility 2" value={form.expBullet1b} onChange={v => updateField('expBullet1b', v)} placeholder="Describe tasks and outcomes" />
              <CVField label="• Responsibility 3" value={form.expBullet1c} onChange={v => updateField('expBullet1c', v)} placeholder="Include measurable results" />

              <div className="cv-form-divider" />
              <CVRow>
                <CVField label="From" value={form.expFrom2} onChange={v => updateField('expFrom2', v)} placeholder="MM/YY" />
                <CVField label="To" value={form.expTo2} onChange={v => updateField('expTo2', v)} placeholder="MM/YY" />
              </CVRow>
              <CVRow>
                <CVField label="Company" value={form.expCompany2} onChange={v => updateField('expCompany2', v)} placeholder="Organization Name" />
                <CVField label="Location" value={form.expLoc2} onChange={v => updateField('expLoc2', v)} placeholder="City, Country" />
              </CVRow>
              <CVField label="Position" value={form.expPos2} onChange={v => updateField('expPos2', v)} placeholder="Position Held" />
              <CVField label="• Responsibility 1" value={form.expBullet2a} onChange={v => updateField('expBullet2a', v)} placeholder="Use action verbs" />
              <CVField label="• Responsibility 2" value={form.expBullet2b} onChange={v => updateField('expBullet2b', v)} placeholder="Describe tasks and outcomes" />
              {extraExp.map((exp, i) => (
                <React.Fragment key={`extra-exp-${i}`}>
                  <div className="cv-form-divider" />
                  <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeExp(i)}>Remove</button></div>
                  <CVRow>
                    <CVField label="From" value={exp.from} onChange={v => updateExp(i, 'from', v)} placeholder="MM/YY" />
                    <CVField label="To" value={exp.to} onChange={v => updateExp(i, 'to', v)} placeholder="MM/YY" />
                  </CVRow>
                  <CVRow>
                    <CVField label="Company" value={exp.company} onChange={v => updateExp(i, 'company', v)} placeholder="Company Name" />
                    <CVField label="Location" value={exp.loc} onChange={v => updateExp(i, 'loc', v)} placeholder="City, Country" />
                  </CVRow>
                  <CVField label="Position" value={exp.pos} onChange={v => updateExp(i, 'pos', v)} placeholder="Job Title" />
                  <CVField label="• Responsibility 1" value={exp.bullet1} onChange={v => updateExp(i, 'bullet1', v)} placeholder="Use action verbs" />
                  <CVField label="• Responsibility 2" value={exp.bullet2} onChange={v => updateExp(i, 'bullet2', v)} placeholder="Describe tasks and outcomes" />
                  <CVField label="• Responsibility 3" value={exp.bullet3} onChange={v => updateExp(i, 'bullet3', v)} placeholder="Include measurable results" />
                </React.Fragment>
              ))}
              <button className="cv-add-entry-btn" onClick={addExp}>+ Add Experience</button>
            </CVSection>

            <CVSection title="PROJECTS / EXTRA CURRICULAR ACTIVITIES">
              <CVField label="Project 1" value={form.project1} onChange={v => updateField('project1', v)} placeholder="Project name and brief description" />
              <CVField label="Project 2" value={form.project2} onChange={v => updateField('project2', v)} placeholder="Project name and brief description" />
              {extraProjects.map((proj, i) => (
                <React.Fragment key={`extra-proj-${i}`}>
                  <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeProject(i)}>Remove</button></div>
                  <CVField label={`Project ${i + 3}`} value={proj.text} onChange={v => updateProject(i, v)} placeholder="Project name and brief description" />
                </React.Fragment>
              ))}
              <button className="cv-add-entry-btn" onClick={addProject}>+ Add Project</button>
            </CVSection>

            <CVSection title="SKILLS">
              <CVField label="Languages" value={form.languages} onChange={v => updateField('languages', v)} placeholder="Fluent in English, Arabic, French; Basic knowledge in Spanish" />
              <CVField label="Computer Skills" value={form.computerSkills} onChange={v => updateField('computerSkills', v)} placeholder="MS Office, AutoCAD, Python, C++, HTML..." />
              <CVField label="Research Skills" value={form.researchSkills} onChange={v => updateField('researchSkills', v)} placeholder="Statistical tools, SPSS, R, etc." />
              <CVField label="Technical Skills" value={form.technicalSkills} onChange={v => updateField('technicalSkills', v)} placeholder="Surveying, Procurement, etc." />
              <CVField label="Soft Skills" value={form.softSkills} onChange={v => updateField('softSkills', v)} placeholder="Leadership, Communication, Team-Building..." />
            </CVSection>

            <div className="cv-download-section">
              <button className="cv-download-btn" onClick={() => openDownloadModal('local')}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Review & Download CV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="re-right-col">
        <div className="re-chat-card re-glass">
          <div className="chat-header">
            <h3 className="re-section-title">Ask AI About Your CV</h3>
            <p className="chat-subtitle">Get help building your Lebanese-format CV</p>
          </div>
          <div className="chat-messages" ref={chatRef}>
            {messages.map((msg, i) => <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />)}
            {isLoading && (
              <div className="chat-bubble chat-ai">
                <div className="chat-avatar-ai">AI</div>
                <div className="chat-text ai-text">
                  <div className="chat-typing"><span className="chat-typing-dot" /><span className="chat-typing-dot" /><span className="chat-typing-dot" /></div>
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text" className="chat-input" placeholder="Ask the AI for CV advice..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocalCVBuilder;
