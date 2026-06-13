import React from 'react';
import { EField, RemoveBtn, AddBtn } from '../EditablePrimitives';
import { Section, ExperienceEntry, SkillLine } from './parts';
import { hasAnySkill, eduHasContent, expHasContent } from '../resumeSchema';

/**
 * Global (international / Harvard) CV template. Renders the SAME normalized data
 * as the Local template, just with international conventions and no objective.
 */
const GlobalTemplate = ({ data, editable = false, ops }) => {
  const { personal, education, experience, leadership, skills } = data;
  const u = ops.update;
  const contactPreview = [personal.address, personal.email, personal.phone].filter(Boolean).join('  |  ');
  const eduList = editable ? education : education.filter(eduHasContent);

  return (
    <div className="re-doc re-doc-global">
      <div className="re-doc-head">
        <EField as="h1" className="re-doc-name re-doc-name-lg" value={personal.fullName} path="personal.fullName" update={u} editable={editable} placeholder="First Last" />
        {editable ? (
          <div className="re-doc-contact-edit">
            <EField value={personal.address} path="personal.address" update={u} editable placeholder="Address" />
            <EField value={personal.email} path="personal.email" update={u} editable placeholder="email@university.edu" />
            <EField value={personal.phone} path="personal.phone" update={u} editable placeholder="Phone" />
          </div>
        ) : (
          contactPreview && <div className="re-doc-contact">{contactPreview}</div>
        )}
      </div>

      {(editable || eduList.length > 0) && (
        <Section title="EDUCATION">
          {eduList.map((e, i) => (
            <div className="re-doc-entry" key={i}>
              {editable && <RemoveBtn onClick={() => ops.removeItem('education', i)} />}
              <div className="re-doc-entry-row">
                <EField as="strong" className="re-doc-org" value={e.institution} path={`education.${i}.institution`} update={u} editable={editable} placeholder="University" />
                <span className="re-doc-meta">
                  <EField value={e.location} path={`education.${i}.location`} update={u} editable={editable} placeholder="Location" />
                  <EField value={e.dates} path={`education.${i}.dates`} update={u} editable={editable} placeholder="Dates" />
                </span>
              </div>
              <EField as="div" className="re-doc-line" value={e.degree} path={`education.${i}.degree`} update={u} editable={editable} placeholder="Degree & concentration" />
              {editable ? (
                <>
                  <EField value={e.gpa} path={`education.${i}.gpa`} update={u} editable placeholder="GPA" />
                  <EField value={e.gradDate} path={`education.${i}.gradDate`} update={u} editable placeholder="Graduation date" />
                  <EField value={e.coursework} path={`education.${i}.coursework`} update={u} editable placeholder="Relevant coursework / details" />
                </>
              ) : (
                <>
                  {e.gpa && <div className="re-doc-line">GPA: {e.gpa}</div>}
                  {e.gradDate && <div className="re-doc-line">Expected: {e.gradDate}</div>}
                  {e.coursework && <div className="re-doc-line">Relevant Coursework: {e.coursework}</div>}
                </>
              )}
            </div>
          ))}
          {editable && <AddBtn onClick={() => ops.addItem('education')}>+ Add Education</AddBtn>}
        </Section>
      )}

      {(editable || experience.some(expHasContent)) && (
        <Section title="EXPERIENCE">
          {experience.map((x, i) => (
            <ExperienceEntry key={i} entry={x} idx={i} section="experience" u={u} ops={ops} editable={editable} />
          ))}
          {editable && <AddBtn onClick={() => ops.addItem('experience')}>+ Add Experience</AddBtn>}
        </Section>
      )}

      {(editable || leadership.some(expHasContent)) && (
        <Section title="LEADERSHIP & ACTIVITIES">
          {leadership.map((x, i) => (
            <ExperienceEntry key={i} entry={x} idx={i} section="leadership" u={u} ops={ops} editable={editable} roleField="role" />
          ))}
          {editable && <AddBtn onClick={() => ops.addItem('leadership')}>+ Add Activity</AddBtn>}
        </Section>
      )}

      {(editable || hasAnySkill(skills, ['technical', 'languages', 'laboratory', 'interests'])) && (
        <Section title="SKILLS & INTERESTS">
          <SkillLine label="Technical" field="technical" skills={skills} u={u} editable={editable} />
          <SkillLine label="Language" field="languages" skills={skills} u={u} editable={editable} />
          <SkillLine label="Laboratory" field="laboratory" skills={skills} u={u} editable={editable} />
          <SkillLine label="Interests" field="interests" skills={skills} u={u} editable={editable} />
        </Section>
      )}
    </div>
  );
};

export default GlobalTemplate;
