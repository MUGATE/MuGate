import React from 'react';
import { EField, RemoveBtn, AddBtn } from '../EditablePrimitives';
import { expHasContent } from '../resumeSchema';

/** Section wrapper with a titled, underlined heading. */
export const Section = ({ title, children }) => (
  <div className="re-doc-section">
    <h2 className="re-doc-section-title">{title}</h2>
    <div className="re-doc-hr" />
    {children}
  </div>
);

/** An organization/role entry with bullets — shared by experience & leadership. */
export const ExperienceEntry = ({ entry, idx, section, u, ops, editable, roleField = 'title' }) => {
  // In preview, skip entries with no content so we never show empty blocks.
  if (!editable && !expHasContent(entry)) return null;
  return (
  <div className="re-doc-entry">
    {editable && <RemoveBtn onClick={() => ops.removeItem(section, idx)} />}
    <div className="re-doc-entry-row">
      <EField as="strong" className="re-doc-org" value={entry.organization} path={`${section}.${idx}.organization`} update={u} editable={editable} placeholder="Organization" />
      <span className="re-doc-meta">
        <EField value={entry.location} path={`${section}.${idx}.location`} update={u} editable={editable} placeholder="Location" />
        <EField value={entry.dates} path={`${section}.${idx}.dates`} update={u} editable={editable} placeholder="Dates" />
      </span>
    </div>
    <EField as="div" className="re-doc-role" value={entry[roleField]} path={`${section}.${idx}.${roleField}`} update={u} editable={editable} placeholder={roleField === 'role' ? 'Role' : 'Title'} />
    <ul className="re-doc-bullets">
      {(entry.bullets || []).map((b, bi) => (
        <li key={bi} className="re-doc-bullet">
          {editable && <RemoveBtn onClick={() => ops.removeBullet(section, idx, bi)} />}
          <EField value={b} path={`${section}.${idx}.bullets.${bi}`} update={u} editable={editable} multiline placeholder="Achievement (start with an action verb)" />
        </li>
      ))}
    </ul>
    {editable && <AddBtn onClick={() => ops.addBullet(section, idx)}>+ Add bullet</AddBtn>}
  </div>
  );
};

/** A single "Label: value" skill line. */
export const SkillLine = ({ label, field, skills, u, editable }) => {
  if (!editable && !skills[field]) return null;
  return (
    <div className="re-doc-line">
      <span className="re-doc-skill-label">{label}: </span>
      <EField value={skills[field]} path={`skills.${field}`} update={u} editable={editable} placeholder={label} />
    </div>
  );
};
