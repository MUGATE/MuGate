import React from 'react';
import ScoreRing from '../components/ScoreRing';
import SuggestionCard from '../components/SuggestionCard';
import CVField, { CVSection, CVRow } from '../components/CVField';
import ChatInterface from '../components/ChatInterface';

import '../styles/builder.css';
import '../styles/chat.css';

const LOCAL_SUGGESTIONS = [
  'Include your phone number with Lebanon country code (+961).',
  'Add a LinkedIn profile URL below your email.',
  'Use action verbs to describe experience bullets.',
  'Include GPA if above 3.0 on a 4.0 scale.',
  'List languages with fluency levels (e.g., Native, Fluent, Basic).',
];

const GLOBAL_SUGGESTIONS = [
  'Keep your resume to one page for early-career positions.',
  'Lead with impact metrics in your experience bullets.',
  'List relevant coursework only if it supports your target role.',
  'Use the format: Action verb + Task + Result for each bullet.',
  'Include both technical and language skills with proficiency levels.',
];

const ResumeBuilderPage = ({
  type, // 'local' or 'global'
  form,
  updateField,
  messages,
  input,
  setInput,
  sendMessage,
  isLoading,
  chatRef,
  // Extra arrays (conditionally passed/used)
  extraEdu = [],
  addEdu,
  removeEdu,
  updateEdu,
  extraExp = [],
  addExp,
  removeExp,
  updateExp,
  extraProjects = [],
  addProject,
  removeProject,
  updateProject,
  extraLead = [],
  addLead,
  removeLead,
  updateLead,
  // Routing & Modals
  showPreview,
  setShowPreview,
  openDownloadModal,
  onBack,
}) => {
  const isLocal = type === 'local';

  const fillRatio = Math.round(
    Object.values(form).filter(v => v.trim()).length / Object.keys(form).length * 100
  );

  const tipsList = isLocal ? LOCAL_SUGGESTIONS : GLOBAL_SUGGESTIONS;

  // ─── RENDERING PREVIEW ───────────────────────────────────────────
  if (showPreview === type) {
    return (
      <div className="re-cv-form-card re-glass" style={{ width: '100%' }}>
        <div className="cv-form-header">
          <button className="re-cv-back-btn" onClick={() => setShowPreview(null)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Edit
          </button>
          <h2 className="cv-form-title">
            Review Your CV <span className={`re-cv-badge re-cv-badge-${type}`}>{isLocal ? 'Local' : 'International'}</span>
          </h2>
        </div>
        <div className="cv-form-body">
          <div className="cv-prev-document">
            {isLocal ? (
              // Lebanese Format Preview
              <>
                <h3 className="cv-prev-name">{form.fullName || 'Your Name'}</h3>
                <div className="cv-prev-contact">
                  {[form.address, form.phone, form.email, form.linkedin].filter(Boolean).join(' | ') || 'Contact info'}
                </div>
                {form.objective?.trim() && (
                  <>
                    <h4 className="cv-prev-heading">OBJECTIVE</h4>
                    <p className="cv-prev-body">{form.objective}</p>
                  </>
                )}
                <h4 className="cv-prev-heading">EDUCATION</h4>
                {form.eduInst1?.trim() && (
                  <div className="cv-prev-org-line">
                    <strong>{form.eduInst1}</strong>{form.eduLoc1 && <span>, {form.eduLoc1}</span>}
                  </div>
                )}
                {form.eduDegree1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {form.eduDegree1}</div>}
                {form.eduGpa1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa1}</div>}
                {form.eduInst2?.trim() && (
                  <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                    <strong>{form.eduInst2}</strong>{form.eduLoc2 && <span>, {form.eduLoc2}</span>}
                  </div>
                )}
                {form.eduGpa2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa2}</div>}
                {extraEdu.map((edu, i) => (
                  <React.Fragment key={`prev-edu-${i}`}>
                    {edu.inst?.trim() && (
                      <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                        <strong>{edu.inst}</strong>{edu.loc && <span>, {edu.loc}</span>}
                      </div>
                    )}
                    {edu.gpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {edu.gpa}</div>}
                  </React.Fragment>
                ))}
                
                <h4 className="cv-prev-heading">EXPERIENCE</h4>
                {form.expCompany1?.trim() && (
                  <div className="cv-prev-org-line">
                    <strong>{form.expCompany1}</strong>{form.expLoc1 && <span>, {form.expLoc1}</span>}
                  </div>
                )}
                {form.expPos1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {form.expPos1}</div>}
                {[form.expBullet1a, form.expBullet1b, form.expBullet1c].filter(b => b?.trim()).length > 0 && (
                  <ul className="cv-prev-bullets">
                    {[form.expBullet1a, form.expBullet1b, form.expBullet1c].filter(b => b?.trim()).map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                )}
                {form.expCompany2?.trim() && (
                  <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                    <strong>{form.expCompany2}</strong>{form.expLoc2 && <span>, {form.expLoc2}</span>}
                  </div>
                )}
                {form.expPos2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {form.expPos2}</div>}
                {[form.expBullet2a, form.expBullet2b].filter(b => b?.trim()).length > 0 && (
                  <ul className="cv-prev-bullets">
                    {[form.expBullet2a, form.expBullet2b].filter(b => b?.trim()).map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                )}
                {extraExp.map((exp, i) => (
                  <React.Fragment key={`prev-exp-${i}`}>
                    {exp.company?.trim() && (
                      <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                        <strong>{exp.company}</strong>{exp.loc && <span>, {exp.loc}</span>}
                      </div>
                    )}
                    {exp.pos?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Position:</span> {exp.pos}</div>}
                    {[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).length > 0 && (
                      <ul className="cv-prev-bullets">
                        {[exp.bullet1, exp.bullet2, exp.bullet3].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </React.Fragment>
                ))}

                {(form.project1?.trim() || form.project2?.trim() || extraProjects.some(p => p.text?.trim())) && (
                  <>
                    <h4 className="cv-prev-heading">PROJECTS</h4>
                    {form.project1?.trim() && <div className="cv-prev-line">{form.project1}</div>}
                    {form.project2?.trim() && <div className="cv-prev-line">{form.project2}</div>}
                    {extraProjects.map((p, i) => p.text?.trim() ? <div key={i} className="cv-prev-line">{p.text}</div> : null)}
                  </>
                )}

                <h4 className="cv-prev-heading">SKILLS</h4>
                {form.languages?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Languages:</span> {form.languages}</div>}
                {form.computerSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Computer:</span> {form.computerSkills}</div>}
                {form.technicalSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {form.technicalSkills}</div>}
                {form.softSkills?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Soft Skills:</span> {form.softSkills}</div>}
              </>
            ) : (
              // Global Harvard Format Preview
              <>
                <h3 className="cv-prev-name">{[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Your Name'}</h3>
                <div className="cv-prev-contact">
                  {[form.address, form.email, form.phone].filter(Boolean).join(' | ') || 'Contact info'}
                </div>

                <h4 className="cv-prev-heading">EDUCATION</h4>
                {form.eduInst?.trim() && <div className="cv-prev-org-line"><strong>{form.eduInst}</strong>{form.eduLoc && <span>, {form.eduLoc}</span>}</div>}
                {form.eduDegree?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Degree:</span> {form.eduDegree}</div>}
                {form.eduGpa?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">GPA:</span> {form.eduGpa}</div>}
                {form.eduCoursework?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {form.eduCoursework}</div>}
                {form.abroadInst?.trim() && (
                  <>
                    <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                      <strong>{form.abroadInst}</strong>{form.abroadLoc && <span>, {form.abroadLoc}</span>}
                    </div>
                    {form.abroadCourse?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Coursework:</span> {form.abroadCourse}</div>}
                  </>
                )}
                {form.hsName?.trim() && (
                  <>
                    <div className="cv-prev-org-line" style={{ marginTop: 8 }}>
                      <strong>{form.hsName}</strong>{form.hsLoc && <span>, {form.hsLoc}</span>}
                    </div>
                    {form.hsDetails?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Details:</span> {form.hsDetails}</div>}
                  </>
                )}

                <h4 className="cv-prev-heading">EXPERIENCE</h4>
                {form.expOrg1?.trim() && <div className="cv-prev-org-line"><strong>{form.expOrg1}</strong>{form.expLoc1 && <span>, {form.expLoc1}</span>}</div>}
                {form.expTitle1?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {form.expTitle1}</div>}
                {[form.expB1a, form.expB1b, form.expB1c, form.expB1d].filter(b => b?.trim()).length > 0 && (
                  <ul className="cv-prev-bullets">
                    {[form.expB1a, form.expB1b, form.expB1c, form.expB1d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {form.expOrg2?.trim() && <div className="cv-prev-org-line" style={{ marginTop: 8 }}><strong>{form.expOrg2}</strong>{form.expLoc2 && <span>, {form.expLoc2}</span>}</div>}
                {form.expTitle2?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {form.expTitle2}</div>}
                {[form.expB2a, form.expB2b, form.expB2c, form.expB2d].filter(b => b?.trim()).length > 0 && (
                  <ul className="cv-prev-bullets">
                    {[form.expB2a, form.expB2b, form.expB2c, form.expB2d].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {extraExp.map((exp, i) => (
                  <React.Fragment key={`prev-gexp-${i}`}>
                    {exp.org?.trim() && <div className="cv-prev-org-line" style={{ marginTop: 8 }}><strong>{exp.org}</strong>{exp.loc && <span>, {exp.loc}</span>}</div>}
                    {exp.title?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Title:</span> {exp.title}</div>}
                    {[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).length > 0 && (
                      <ul className="cv-prev-bullets">
                        {[exp.b1, exp.b2, exp.b3, exp.b4].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </React.Fragment>
                ))}

                {(form.leadOrg?.trim() || extraLead.some(l => l.org?.trim())) && (
                  <>
                    <h4 className="cv-prev-heading">LEADERSHIP & ACTIVITIES</h4>
                    {form.leadOrg?.trim() && (
                      <>
                        <div className="cv-prev-org-line"><strong>{form.leadOrg}</strong>{form.leadLoc && <span>, {form.leadLoc}</span>}</div>
                        {form.leadRole?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {form.leadRole}</div>}
                        {[form.leadB1, form.leadB2].filter(b => b?.trim()).length > 0 && (
                          <ul className="cv-prev-bullets">
                            {[form.leadB1, form.leadB2].filter(b => b?.trim()).map((b, i) => <li key={i}>{b}</li>)}
                          </ul>
                        )}
                      </>
                    )}
                    {extraLead.map((lead, i) => (
                      <React.Fragment key={`prev-glead-${i}`}>
                        {lead.org?.trim() && <div className="cv-prev-org-line" style={{ marginTop: 8 }}><strong>{lead.org}</strong>{lead.loc && <span>, {lead.loc}</span>}</div>}
                        {lead.role?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Role:</span> {lead.role}</div>}
                        {[lead.b1, lead.b2].filter(b => b?.trim()).length > 0 && (
                          <ul className="cv-prev-bullets">
                            {[lead.b1, lead.b2].filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}

                <h4 className="cv-prev-heading">SKILLS & INTERESTS</h4>
                {form.technical?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Technical:</span> {form.technical}</div>}
                {form.language?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Language:</span> {form.language}</div>}
                {form.laboratory?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Laboratory:</span> {form.laboratory}</div>}
                {form.interests?.trim() && <div className="cv-prev-line"><span className="cv-prev-label">Interests:</span> {form.interests}</div>}
              </>
            )}
          </div>
          <div className="cv-prev-actions">
            <button className="cv-prev-edit-btn" onClick={() => setShowPreview(null)}>Edit</button>
            <button className="cv-download-btn cv-prev-confirm-btn" onClick={() => openDownloadModal(type)}>Confirm & Download</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDERING EDIT FORM ──────────────────────────────────────────
  return (
    <>
      <div className="re-left-col">
        <div className="re-score-card re-glass">
          <h3 className="re-section-title">CV Progress</h3>
          <ScoreRing score={fillRatio} />
        </div>
        <div className="re-suggestions-card re-glass">
          <h3 className="re-section-title">Tips for {isLocal ? 'Local' : 'Global'} CV</h3>
          <div className="suggestions-list">
            {tipsList.map((text, i) => <SuggestionCard key={i} index={i} text={text} />)}
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
            <h2 className="cv-form-title">
              {isLocal ? 'Local' : 'Global'} CV Builder{' '}
              <span className={`re-cv-badge re-cv-badge-${type}`}>
                {isLocal ? 'Lebanon' : 'International'}
              </span>
            </h2>
          </div>
          <div className="cv-form-body">
            {isLocal ? (
              // ─── LEBANESE FORM FIELDS ───
              <>
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
                  <CVField label="• Responsibility 1" value={form.expBullet1a} onChange={v => updateField('expBullet1a', v)} placeholder="Use action verbs" />
                  <CVField label="• Responsibility 2" value={form.expBullet1b} onChange={v => updateField('expBullet1b', v)} placeholder="Describe outcomes" />
                  <CVField label="• Responsibility 3" value={form.expBullet1c} onChange={v => updateField('expBullet1c', v)} placeholder="Quantify outcomes" />

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
                  <CVField label="• Responsibility 2" value={form.expBullet2b} onChange={v => updateField('expBullet2b', v)} placeholder="Describe outcomes" />
                  
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
                      <CVField label="• Responsibility 2" value={exp.bullet2} onChange={v => updateExp(i, 'bullet2', v)} placeholder="Describe outcomes" />
                      <CVField label="• Responsibility 3" value={exp.bullet3} onChange={v => updateExp(i, 'bullet3', v)} placeholder="Quantify outcomes" />
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
              </>
            ) : (
              // ─── HARVARD GLOBAL FORM FIELDS ───
              <>
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
                  <CVField label="• Achievement 1" value={form.expB1a} onChange={v => updateField('expB1a', v)} placeholder="Begin with action verb" />
                  <CVField label="• Achievement 2" value={form.expB1b} onChange={v => updateField('expB1b', v)} placeholder="Describe results" />
                  <CVField label="• Achievement 3" value={form.expB1c} onChange={v => updateField('expB1c', v)} placeholder="Quantify outcomes" />
                  <CVField label="• Achievement 4" value={form.expB1d} onChange={v => updateField('expB1d', v)} placeholder="Use short phrases" />

                  <div className="cv-form-divider" />
                  <CVRow>
                    <CVField label="Organization" value={form.expOrg2} onChange={v => updateField('expOrg2', v)} placeholder="Company / Organization" />
                    <CVField label="Location" value={form.expLoc2} onChange={v => updateField('expLoc2', v)} placeholder="City, State" />
                  </CVRow>
                  <CVRow>
                    <CVField label="Position Title" value={form.expTitle2} onChange={v => updateField('expTitle2', v)} placeholder="Position Title" />
                    <CVField label="Dates" value={form.expDates2} onChange={v => updateField('expDates2', v)} placeholder="Month Year - Month Year" />
                  </CVRow>
                  <CVField label="• Achievement 1" value={form.expB2a} onChange={v => updateField('expB2a', v)} placeholder="Begin with action verb" />
                  <CVField label="• Achievement 2" value={form.expB2b} onChange={v => updateField('expB2b', v)} placeholder="Describe results" />
                  <CVField label="• Achievement 3" value={form.expB2c} onChange={v => updateField('expB2c', v)} placeholder="Quantify outcomes" />
                  <CVField label="• Achievement 4" value={form.expB2d} onChange={v => updateField('expB2d', v)} placeholder="Use short phrases" />
                  
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
                      <CVField label="• Achievement 1" value={exp.b1} onChange={v => updateExp(i, 'b1', v)} placeholder="Describe outcomes" />
                      <CVField label="• Achievement 2" value={exp.b2} onChange={v => updateExp(i, 'b2', v)} placeholder="Describe outcomes" />
                      <CVField label="• Achievement 3" value={exp.b3} onChange={v => updateExp(i, 'b3', v)} placeholder="Quantify outcomes" />
                      <CVField label="• Achievement 4" value={exp.b4} onChange={v => updateExp(i, 'b4', v)} placeholder="Use short phrases" />
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
                  <CVField label="• Detail 2" value={form.leadB2} onChange={v => updateField('leadB2', v)} placeholder="Include relevant details" />
                  
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
              </>
            )}

            <div className="cv-download-section">
              <button className="cv-download-btn" onClick={() => openDownloadModal(type)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v2h14v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Review & Download CV
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChatInterface
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
        chatRef={chatRef}
        title="Ask AI About Your CV"
        subtitle={`Get help building your ${isLocal ? 'Lebanese-format' : 'international'} CV`}
        placeholder="Ask the AI for CV advice..."
      />
    </>
  );
};

export default ResumeBuilderPage;
