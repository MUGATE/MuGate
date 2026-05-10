import React from 'react';
import ScoreRing from './ScoreRing';
import SuggestionCard from './SuggestionCard';
import ChatBubble from './ChatBubble';
import CVField, { CVSection, CVRow } from './CVField';

const GLOBAL_SUGGESTIONS = [
  'Keep your resume to one page for early-career positions.',
  'Lead with impact metrics in your experience bullets.',
  'List relevant coursework only if it supports your target role.',
  'Use the format: Action verb + Task + Result for each bullet.',
  'Include both technical and language skills with proficiency levels.',
];

const GlobalCVBuilder = ({
  form, updateField, messages, input, setInput,
  sendMessage, isLoading, chatRef,
  extraExp, extraLead,
  addExp, removeExp, updateExp,
  addLead, removeLead, updateLead,
  showPreview, setShowPreview,
  openDownloadModal, onBack,
}) => {
  const fillRatio = Math.round(
    Object.values(form).filter(v => v.trim()).length / Object.keys(form).length * 100
  );

  if (showPreview === 'global') {
    return (
      <div className="re-cv-form-card re-glass">
        <div className="cv-form-header">
          <button className="re-cv-back-btn" onClick={() => setShowPreview(null)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Edit
          </button>
          <h2 className="cv-form-title">Review Your CV <span className="re-cv-badge re-cv-badge-global">International</span></h2>
        </div>
        <div className="cv-form-body">
          <div className="cv-prev-document">
            <h3 className="cv-prev-name">{[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Your Name'}</h3>
            <div className="cv-prev-contact">{[form.address, form.email, form.phone].filter(Boolean).join(' | ') || 'Contact info'}</div>

            <h4 className="cv-prev-heading">EDUCATION</h4>
            {form.eduInst?.trim() && <div className="cv-prev-org-line"><strong>{form.eduInst}</strong>{form.eduLoc && <span>, {form.eduLoc}</span>}</div>}
            {form.eduDegree?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {form.eduDegree}</div>}
            {form.eduGpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa}</div>}
            {form.eduCoursework?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {form.eduCoursework}</div>}
            {form.abroadInst?.trim() && <><div className="cv-prev-org-line" style={{marginTop:8}}><strong>{form.abroadInst}</strong>{form.abroadLoc && <span>, {form.abroadLoc}</span>}</div>{form.abroadCourse?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {form.abroadCourse}</div>}</>}
            {form.hsName?.trim() && <><div className="cv-prev-org-line" style={{marginTop:8}}><strong>{form.hsName}</strong>{form.hsLoc && <span>, {form.hsLoc}</span>}</div>{form.hsDetails?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Details:</span> {form.hsDetails}</div>}</>}

            <h4 className="cv-prev-heading">EXPERIENCE</h4>
            {form.expOrg1?.trim() && <div className="cv-prev-org-line"><strong>{form.expOrg1}</strong>{form.expLoc1 && <span>, {form.expLoc1}</span>}</div>}
            {form.expTitle1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {form.expTitle1}</div>}
            {[form.expB1a, form.expB1b, form.expB1c, form.expB1d].filter(b => b?.trim()).length > 0 &&
              <ul className="cv-prev-bullets">{[form.expB1a, form.expB1b, form.expB1c, form.expB1d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
            {form.expOrg2?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{form.expOrg2}</strong>{form.expLoc2 && <span>, {form.expLoc2}</span>}</div>}
            {form.expTitle2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {form.expTitle2}</div>}
            {[form.expB2a, form.expB2b, form.expB2c, form.expB2d].filter(b => b?.trim()).length > 0 &&
              <ul className="cv-prev-bullets">{[form.expB2a, form.expB2b, form.expB2c, form.expB2d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>}
            {extraExp.map((exp, i) => (
              <React.Fragment key={`prev-gexp-${i}`}>
                {exp.org?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{exp.org}</strong>{exp.loc && <span>, {exp.loc}</span>}</div>}
                {exp.title?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {exp.title}</div>}
                {[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).length > 0 &&
                  <ul className="cv-prev-bullets">{[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </React.Fragment>
            ))}

            {(form.leadOrg?.trim() || extraLead.some(l => l.org?.trim())) && <><h4 className="cv-prev-heading">LEADERSHIP & ACTIVITIES</h4>
              {form.leadOrg?.trim() && <><div className="cv-prev-org-line"><strong>{form.leadOrg}</strong>{form.leadLoc && <span>, {form.leadLoc}</span>}</div>
              {form.leadRole?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {form.leadRole}</div>}
              {[form.leadB1, form.leadB2].filter(b => b && b.trim()).length > 0 && (
                <ul className="cv-prev-bullets">
                  {[form.leadB1, form.leadB2].filter(b => b && b.trim()).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}</>}
              {extraLead.map((lead, i) => (
                <React.Fragment key={`prev-glead-${i}`}>
                  {lead.org?.trim() && <div className="cv-prev-org-line" style={{marginTop:8}}><strong>{lead.org}</strong>{lead.loc && <span>, {lead.loc}</span>}</div>}
                  {lead.role?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {lead.role}</div>}
                  {[lead.b1, lead.b2].filter(b => b?.trim()).length > 0 &&
                    <ul className="cv-prev-bullets">{[lead.b1, lead.b2].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}</ul>}
                </React.Fragment>
              ))}
            </>}

            <h4 className="cv-prev-heading">SKILLS & INTERESTS</h4>
            {form.technical?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {form.technical}</div>}
            {form.language?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Language:</span> {form.language}</div>}
            {form.laboratory?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Laboratory:</span> {form.laboratory}</div>}
            {form.interests?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Interests:</span> {form.interests}</div>}
          </div>
          <div className="cv-prev-actions">
            <button className="cv-prev-edit-btn" onClick={() => setShowPreview(null)}>Edit</button>
            <button className="cv-download-btn cv-prev-confirm-btn" onClick={() => openDownloadModal('global')}>Confirm & Download</button>
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
          <h3 className="re-section-title">Tips for Global CV</h3>
          <div className="suggestions-list">
            {GLOBAL_SUGGESTIONS.map((text, i) => <SuggestionCard key={i} index={i} text={text} />)}
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
            <h2 className="cv-form-title">Global CV Builder <span className="re-cv-badge re-cv-badge-global">International</span></h2>
          </div>
          <div className="cv-form-body">
            <CVSection title="PERSONAL INFORMATION">
              <CVRow>
                <CVField label="First Name" value={form.firstName} onChange={v => updateField('firstName', v)} placeholder="First Name" />
                <CVField label="Last Name" value={form.lastName} onChange={v => updateField('lastName', v)} placeholder="Last Name" />
              </CVRow>
              <CVField label="Address" value={form.address} onChange={v => updateField('address', v)} placeholder="Street Address, City, State ZIP" />
              <CVRow>
                <CVField label="Email" value={form.email} onChange={v => updateField('email', v)} placeholder="youremail@university.edu" />
                <CVField label="Phone" value={form.phone} onChange={v => updateField('phone', v)} placeholder="Phone number" />
              </CVRow>
            </CVSection>

            <CVSection title="EDUCATION">
              <CVRow>
                <CVField label="University" value={form.eduInst} onChange={v => updateField('eduInst', v)} placeholder="Harvard University" />
                <CVField label="Location" value={form.eduLoc} onChange={v => updateField('eduLoc', v)} placeholder="Cambridge, MA" />
              </CVRow>
              <CVField label="Degree & Concentration" value={form.eduDegree} onChange={v => updateField('eduDegree', v)} placeholder="B.A. in Computer Science" />
              <CVRow>
                <CVField label="GPA (Optional)" value={form.eduGpa} onChange={v => updateField('eduGpa', v)} placeholder="3.8/4.0" />
                <CVField label="Graduation Date" value={form.eduGradDate} onChange={v => updateField('eduGradDate', v)} placeholder="May 2026" />
              </CVRow>
              <CVField label="Relevant Coursework (Optional)" value={form.eduCoursework} onChange={v => updateField('eduCoursework', v)} placeholder="Data Structures, Algorithms, Machine Learning..." />
            </CVSection>

            <CVSection title="STUDY ABROAD">
              <CVRow>
                <CVField label="Institution" value={form.abroadInst} onChange={v => updateField('abroadInst', v)} placeholder="University Name" />
                <CVField label="Location" value={form.abroadLoc} onChange={v => updateField('abroadLoc', v)} placeholder="City, Country" />
              </CVRow>
              <CVRow>
                <CVField label="Coursework in..." value={form.abroadCourse} onChange={v => updateField('abroadCourse', v)} placeholder="Field of study" />
                <CVField label="Dates" value={form.abroadDates} onChange={v => updateField('abroadDates', v)} placeholder="Month Year - Month Year" />
              </CVRow>
            </CVSection>

            <CVSection title="HIGH SCHOOL">
              <CVRow>
                <CVField label="School Name" value={form.hsName} onChange={v => updateField('hsName', v)} placeholder="High School Name" />
                <CVField label="Location" value={form.hsLoc} onChange={v => updateField('hsLoc', v)} placeholder="City, State" />
              </CVRow>
              <CVRow>
                <CVField label="Details (GPA, SAT, Honors)" value={form.hsDetails} onChange={v => updateField('hsDetails', v)} placeholder="GPA, SAT scores, academic honors" />
                <CVField label="Graduation Date" value={form.hsGradDate} onChange={v => updateField('hsGradDate', v)} placeholder="June 2022" />
              </CVRow>
            </CVSection>

            <CVSection title="EXPERIENCE">
              <CVRow>
                <CVField label="Organization" value={form.expOrg1} onChange={v => updateField('expOrg1', v)} placeholder="Company / Organization" />
                <CVField label="Location" value={form.expLoc1} onChange={v => updateField('expLoc1', v)} placeholder="City, State" />
              </CVRow>
              <CVRow>
                <CVField label="Position Title" value={form.expTitle1} onChange={v => updateField('expTitle1', v)} placeholder="Software Engineer Intern" />
                <CVField label="Dates" value={form.expDates1} onChange={v => updateField('expDates1', v)} placeholder="Month Year - Month Year" />
              </CVRow>
              <CVField label="• Achievement 1" value={form.expB1a} onChange={v => updateField('expB1a', v)} placeholder="Begin with action verb, describe experience, skills, and outcomes" />
              <CVField label="• Achievement 2" value={form.expB1b} onChange={v => updateField('expB1b', v)} placeholder="Include details about accomplishments and abilities" />
              <CVField label="• Achievement 3" value={form.expB1c} onChange={v => updateField('expB1c', v)} placeholder="Quantify where possible" />
              <CVField label="• Achievement 4" value={form.expB1d} onChange={v => updateField('expB1d', v)} placeholder="No personal pronouns; use phrases, not full sentences" />

              <div className="cv-form-divider" />
              <CVRow>
                <CVField label="Organization" value={form.expOrg2} onChange={v => updateField('expOrg2', v)} placeholder="Company / Organization" />
                <CVField label="Location" value={form.expLoc2} onChange={v => updateField('expLoc2', v)} placeholder="City, State" />
              </CVRow>
              <CVRow>
                <CVField label="Position Title" value={form.expTitle2} onChange={v => updateField('expTitle2', v)} placeholder="Position Title" />
                <CVField label="Dates" value={form.expDates2} onChange={v => updateField('expDates2', v)} placeholder="Month Year - Month Year" />
              </CVRow>
              <CVField label="• Achievement 1" value={form.expB2a} onChange={v => updateField('expB2a', v)} placeholder="Describe experience and resulting outcomes" />
              <CVField label="• Achievement 2" value={form.expB2b} onChange={v => updateField('expB2b', v)} placeholder="Include details about accomplishments" />
              <CVField label="• Achievement 3" value={form.expB2c} onChange={v => updateField('expB2c', v)} placeholder="Quantify where possible" />
              <CVField label="• Achievement 4" value={form.expB2d} onChange={v => updateField('expB2d', v)} placeholder="No personal pronouns" />
              {extraExp.map((exp, i) => (
                <React.Fragment key={`gextra-exp-${i}`}>
                  <div className="cv-form-divider" />
                  <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeExp(i)}>Remove</button></div>
                  <CVRow>
                    <CVField label="Organization" value={exp.org} onChange={v => updateExp(i, 'org', v)} placeholder="Company / Organization" />
                    <CVField label="Location" value={exp.loc} onChange={v => updateExp(i, 'loc', v)} placeholder="City, State" />
                  </CVRow>
                  <CVRow>
                    <CVField label="Position Title" value={exp.title} onChange={v => updateExp(i, 'title', v)} placeholder="Position Title" />
                    <CVField label="Dates" value={exp.dates} onChange={v => updateExp(i, 'dates', v)} placeholder="Month Year - Month Year" />
                  </CVRow>
                  <CVField label="• Achievement 1" value={exp.b1} onChange={v => updateExp(i, 'b1', v)} placeholder="Describe experience and outcomes" />
                  <CVField label="• Achievement 2" value={exp.b2} onChange={v => updateExp(i, 'b2', v)} placeholder="Include details about accomplishments" />
                  <CVField label="• Achievement 3" value={exp.b3} onChange={v => updateExp(i, 'b3', v)} placeholder="Quantify where possible" />
                  <CVField label="• Achievement 4" value={exp.b4} onChange={v => updateExp(i, 'b4', v)} placeholder="No personal pronouns" />
                </React.Fragment>
              ))}
              <button className="cv-add-entry-btn" onClick={addExp}>+ Add Experience</button>
            </CVSection>

            <CVSection title="LEADERSHIP & ACTIVITIES">
              <CVRow>
                <CVField label="Organization" value={form.leadOrg} onChange={v => updateField('leadOrg', v)} placeholder="Club / Organization" />
                <CVField label="Location" value={form.leadLoc} onChange={v => updateField('leadLoc', v)} placeholder="City, State" />
              </CVRow>
              <CVRow>
                <CVField label="Role" value={form.leadRole} onChange={v => updateField('leadRole', v)} placeholder="President, Member, etc." />
                <CVField label="Dates" value={form.leadDates} onChange={v => updateField('leadDates', v)} placeholder="Month Year - Month Year" />
              </CVRow>
              <CVField label="• Detail 1" value={form.leadB1} onChange={v => updateField('leadB1', v)} placeholder="Describe your role and contributions" />
              <CVField label="• Detail 2" value={form.leadB2} onChange={v => updateField('leadB2', v)} placeholder="Move above Experience if more relevant to target role" />
              {extraLead.map((lead, i) => (
                <React.Fragment key={`gextra-lead-${i}`}>
                  <div className="cv-form-divider" />
                  <div className="cv-extra-entry-header"><button className="cv-remove-entry-btn" onClick={() => removeLead(i)}>Remove</button></div>
                  <CVRow>
                    <CVField label="Organization" value={lead.org} onChange={v => updateLead(i, 'org', v)} placeholder="Club / Organization" />
                    <CVField label="Location" value={lead.loc} onChange={v => updateLead(i, 'loc', v)} placeholder="City, State" />
                  </CVRow>
                  <CVRow>
                    <CVField label="Role" value={lead.role} onChange={v => updateLead(i, 'role', v)} placeholder="President, Member, etc." />
                    <CVField label="Dates" value={lead.dates} onChange={v => updateLead(i, 'dates', v)} placeholder="Month Year - Month Year" />
                  </CVRow>
                  <CVField label="• Detail 1" value={lead.b1} onChange={v => updateLead(i, 'b1', v)} placeholder="Describe your role and contributions" />
                  <CVField label="• Detail 2" value={lead.b2} onChange={v => updateLead(i, 'b2', v)} placeholder="Include relevant details" />
                </React.Fragment>
              ))}
              <button className="cv-add-entry-btn" onClick={addLead}>+ Add Activity</button>
            </CVSection>

            <CVSection title="SKILLS & INTERESTS">
              <CVField label="Technical" value={form.technical} onChange={v => updateField('technical', v)} placeholder="List software, programming languages, and proficiency level" />
              <CVField label="Language" value={form.language} onChange={v => updateField('language', v)} placeholder="List foreign languages and fluency levels" />
              <CVField label="Laboratory" value={form.laboratory} onChange={v => updateField('laboratory', v)} placeholder="Lab techniques or tools (if applicable)" />
              <CVField label="Interests" value={form.interests} onChange={v => updateField('interests', v)} placeholder="Activities that may spark interview conversation" />
            </CVSection>

            <div className="cv-download-section">
              <button className="cv-download-btn" onClick={() => openDownloadModal('global')}>
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
            <p className="chat-subtitle">Get help building your international CV</p>
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
            <input type="text" className="chat-input" placeholder="Ask the AI for CV advice..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l14-7-7 14v-7H3z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalCVBuilder;
