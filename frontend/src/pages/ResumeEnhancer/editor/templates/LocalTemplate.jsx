import React from 'react';
import { EField, RemoveBtn, AddBtn } from '../EditablePrimitives';
import { Section, ExperienceEntry, SkillLine } from './parts';
import { hasAnySkill, eduHasContent, projHasContent, expHasContent } from '../resumeSchema';

/**
 * Local (Lebanese) CV template. Pure presentation over normalized resume data.
 * `editable` toggles inline editing; `ops` carries the update/add/remove handlers.
 */
const LocalTemplate = ({ data, editable = false, ops }) => {
  const { personal, summary, education, experience, projects, skills } = data;
  const u = ops.update;
  const contactPreview = [personal.address, personal.phone, personal.email, personal.linkedin].filter(Boolean).join('  |  ');
  // In preview, drop empty entries so sections never render bare headers.
  const eduList = editable ? education : education.filter(eduHasContent);
  const projList = editable ? projects : projects.filter(projHasContent);

  return (
    <div className="re-doc re-doc-local">
      {/* Header */}
      <div className="re-doc-head">
        <EField as="h1" className="re-doc-name" value={personal.fullName} path="personal.fullName" update={u} editable={editable} placeholder="Your Full Name" />
        {editable ? (
          <div className="re-doc-contact-edit">
            <EField value={personal.address} path="personal.address" update={u} editable placeholder="Address" />
            <EField value={personal.phone} path="personal.phone" update={u} editable placeholder="+961-3-XXXXXX" />
            <EField value={personal.email} path="personal.email" update={u} editable placeholder="email@example.com" />
            <EField value={personal.linkedin} path="personal.linkedin" update={u} editable placeholder="linkedin.com/in/you" />
          </div>
        ) : (
          contactPreview && <div className="re-doc-contact">{contactPreview}</div>
        )}
      </div>

      {/* Objective */}
      {(editable || summary) && (
        <Section title="OBJECTIVE / PROFILE">
          <EField as="p" className="re-doc-body" value={summary} path="summary" update={u} editable={editable} multiline placeholder="Brief professional objective..." />
        </Section>
      )}

      {/* Education */}
      {(editable || eduList.length > 0) && (
        <Section title="EDUCATION">
          {eduList.map((e, i) => (
            <div className="re-doc-entry" key={i}>
              {editable && <RemoveBtn onClick={() => ops.removeItem('education', i)} />}
              <div className="re-doc-entry-row">
                <EField as="strong" className="re-doc-org" value={e.institution} path={`education.${i}.institution`} update={u} editable={editable} placeholder="Institution" />
                <span className="re-doc-meta">
                  <EField value={e.location} path={`education.${i}.location`} update={u} editable={editable} placeholder="Location" />
                  <EField value={e.dates} path={`education.${i}.dates`} update={u} editable={editable} placeholder="Dates" />
                </span>
              </div>
              <EField as="div" className="re-doc-line" value={e.degree} path={`education.${i}.degree`} update={u} editable={editable} placeholder="Degree & emphasis" />
              {editable ? (
                <>
                  <EField value={e.minor} path={`education.${i}.minor`} update={u} editable placeholder="Minor" />
                  <EField value={e.gradDate} path={`education.${i}.gradDate`} update={u} editable placeholder="Expected graduation" />
                  <EField value={e.coursework} path={`education.${i}.coursework`} update={u} editable placeholder="Relevant courses" />
                  <EField value={e.gpa} path={`education.${i}.gpa`} update={u} editable placeholder="GPA / Honors" />
                </>
              ) : (
                <>
                  {e.minor && <div className="re-doc-line">Minor: {e.minor}</div>}
                  {e.gradDate && <div className="re-doc-line">Expected Graduation: {e.gradDate}</div>}
                  {e.coursework && <div className="re-doc-line">Relevant Courses: {e.coursework}</div>}
                  {e.gpa && <div className="re-doc-line">GPA / Honors: {e.gpa}</div>}
                </>
              )}
            </div>
          ))}
          {editable && <AddBtn onClick={() => ops.addItem('education')}>+ Add Education</AddBtn>}
        </Section>
      )}

      {/* Experience */}
      {(editable || experience.some(expHasContent)) && (
        <Section title="EXPERIENCE">
          {experience.map((x, i) => (
            <ExperienceEntry key={i} entry={x} idx={i} section="experience" u={u} ops={ops} editable={editable} />
          ))}
          {editable && <AddBtn onClick={() => ops.addItem('experience')}>+ Add Experience</AddBtn>}
        </Section>
      )}

      {/* Projects */}
      {(editable || projList.length > 0) && (
        <Section title="PROJECTS / ACTIVITIES">
          <ul className="re-doc-bullets">
            {projList.map((p, i) => (
              <li key={i} className="re-doc-bullet">
                {editable && <RemoveBtn onClick={() => ops.removeItem('projects', i)} />}
                <EField value={p.text} path={`projects.${i}.text`} update={u} editable={editable} multiline placeholder="Project / activity description" />
              </li>
            ))}
          </ul>
          {editable && <AddBtn onClick={() => ops.addItem('projects')}>+ Add Project</AddBtn>}
        </Section>
      )}

      {/* Skills */}
      {(editable || hasAnySkill(skills, ['languages', 'computer', 'research', 'technical', 'soft'])) && (
        <Section title="SKILLS">
          <SkillLine label="Languages" field="languages" skills={skills} u={u} editable={editable} />
          <SkillLine label="Computer" field="computer" skills={skills} u={u} editable={editable} />
          <SkillLine label="Research" field="research" skills={skills} u={u} editable={editable} />
          <SkillLine label="Technical" field="technical" skills={skills} u={u} editable={editable} />
          <SkillLine label="Soft Skills" field="soft" skills={skills} u={u} editable={editable} />
        </Section>
      )}
    </div>
  );
};

export default LocalTemplate;
