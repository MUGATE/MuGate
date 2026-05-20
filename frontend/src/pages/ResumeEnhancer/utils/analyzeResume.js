/* ── Resume Analysis Engine ── */

export const ACTION_VERBS = [
  'achieved','administered','analyzed','built','collaborated','conducted',
  'created','decreased','delivered','designed','developed','directed',
  'enhanced','established','evaluated','exceeded','executed','expanded',
  'generated','implemented','improved','increased','initiated','launched',
  'led','managed','mentored','negotiated','optimized','organized','oversaw',
  'planned','produced','reduced','resolved','restructured','spearheaded',
  'streamlined','supervised','trained','transformed',
];

/**
 * Check if the resume text has a section with meaningful content
 */
function sectionExists(text, keywords, minimumContent = false) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

/**
 * More accurate LinkedIn detection — catches various LinkedIn URL formats
 */
function hasLinkedInProfile(text) {
  return /linkedin/i.test(text);
}

/**
 * More accurate email detection — avoids false negatives
 */
function hasEmailAddress(text) {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) || text.includes('@');
}

/**
 * More accurate phone detection — catches Lebanese and international formats
 */
function hasPhoneNumber(text) {
  // 1. Strip all spaces, dashes, dots, brackets, and plus signs
  const clean = text.replace(/[\s\-\.\(\)\+]/g, '');
  
  // 2. Check for standard Lebanese patterns:
  // e.g., 96170123456, 03123456, 71123456, 76123456
  const hasLebMobile = /(?:961)?(?:3|70|71|76|78|79|81|86|03)\d{6}\b/.test(clean);
  if (hasLebMobile) return true;

  // 3. Or check for any contiguous sequence of 7 to 15 digits
  return /\d{7,15}/.test(clean);
}

/**
 * Check if experience bullets use action verbs with good variety
 */
function evaluateActionVerbs(text, lines) {
  const bulletLines = lines.filter(l => /^[\s]*[•\-\*▪]/.test(l) || /^[\s]*\d+[\.\)]/.test(l));
  if (bulletLines.length === 0) {
    // If no explicit bullets are found, scan all lines for verb presence
    const words = text.toLowerCase().split(/\s+/);
    const foundVerbs = words.filter(w => ACTION_VERBS.includes(w.replace(/ed$|ing$|s$/, '')));
    return {
      totalBullets: 1,
      actionVerbBullets: foundVerbs.length > 0 ? 1 : 0,
      uniqueVerbs: new Set(foundVerbs).size,
      hasActionVerbs: foundVerbs.length >= 2,
      hasVariety: new Set(foundVerbs).size >= 2,
    };
  }

  const usedVerbs = new Set();
  const actionVerbCount = bulletLines.filter(l => {
    const firstWords = l.replace(/^[\s•\-\*▪\d\.\)]+/, '').trim().split(/\s+/).slice(0, 2);
    const found = firstWords.some(w => {
      const root = w.toLowerCase().replace(/ed$|ing$|s$/, '');
      if (ACTION_VERBS.includes(root)) {
        usedVerbs.add(root);
        return true;
      }
      return false;
    });
    return found;
  }).length;

  const uniqueVerbCount = usedVerbs.size;
  return {
    totalBullets: bulletLines.length,
    actionVerbBullets: actionVerbCount,
    uniqueVerbs: uniqueVerbCount,
    hasActionVerbs: actionVerbCount >= 1,
    hasVariety: uniqueVerbCount >= 1,
  };
}

/**
 * Check if there's a professional summary with actual content
 */
function hasMeaningfulSummary(text) {
  const lower = text.toLowerCase();
  const summaryHeaders = ['summary', 'objective', 'profile', 'about me', 'professional summary', 'career objective'];
  return summaryHeaders.some(h => lower.includes(h)) || text.length > 250;
}

/**
 * Check if quantified achievements/numbers are present in bullet points
 */
function hasQuantifiedMetrics(text, lines) {
  // Check for percentages, dollar amounts, numbers with units
  const metricPatterns = [
    /\d+%/,
    /\$[\d,]+/,
    /\b\d+\s*(times|fold|x)\b/i,
    /\b\d+\s*(users|clients|customers|projects|team\s*members|employees|students)\b/i,
    /(increased?|decreased?|improved?|reduced?|grew)\s+(by\s+)?\d+/i,
    /\b\d{2,}\b/, // Any number of 2+ digits (e.g. budget, metrics)
  ];

  return metricPatterns.some(p => p.test(text));
}

/**
 * Check if the resume has date ranges in experience entries
 */
function hasDateRanges(text) {
  // Look for 4-digit years indicating timeline (e.g. 2018, 2022)
  return /\b(19|20)\d{2}\b/.test(text);
}

export function analyzeResumeText(text) {
  if (!text || text.length < 20) return { score: 0, suggestions: [], details: {} };

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;
  const lines = text.split('\n').filter(l => l.trim());
  const checks = [];

  // 1. Contact info — improved accuracy
  const hasEmail = hasEmailAddress(text);
  const hasPhone = hasPhoneNumber(text);
  const hasLinkedin = hasLinkedInProfile(text);
  checks.push({ name: 'email', pass: hasEmail, weight: 8, suggestion: 'Add a professional email address to your contact section.' });
  checks.push({ name: 'phone', pass: hasPhone, weight: 5, suggestion: 'Include a phone number with country code.' });
  checks.push({ name: 'linkedin', pass: hasLinkedin, weight: 5, suggestion: 'Add your LinkedIn profile URL for better visibility.' });

  // 2. Education section
  const hasEducation = sectionExists(text, ['education', 'university', 'college', 'bachelor', 'master', 'degree', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'ph.d', 'school', 'inst']);
  checks.push({ name: 'education', pass: hasEducation, weight: 10, suggestion: 'Include an Education section with your degree, institution, and graduation date.' });

  // 3. Experience section
  const hasExperience = sectionExists(text, ['experience', 'work', 'employment', 'intern', 'professional background', 'position', 'role', 'history']);
  checks.push({ name: 'experience', pass: hasExperience, weight: 12, suggestion: 'Add a Work Experience section detailing your professional roles with specific bullet points.' });

  // 4. Skills section
  const hasSkills = sectionExists(text, ['skills', 'proficiencies', 'competencies', 'technologies', 'tools', 'technical skills', 'languages', 'skills']);
  checks.push({ name: 'skills', pass: hasSkills, weight: 10, suggestion: 'Add a Skills section listing your technical and soft skills.' });

  // 5. Action verbs in bullets
  const verbAnalysis = evaluateActionVerbs(text, lines);
  const hasActionVerbs = verbAnalysis.hasActionVerbs;
  checks.push({
    name: 'actionVerbs',
    pass: hasActionVerbs,
    weight: 10,
    suggestion: 'Start your experience bullet points with strong action verbs (e.g., Developed, Managed, Designed).',
  });

  // 6. Quantified achievements
  const hasMetrics = hasQuantifiedMetrics(text, lines);
  checks.push({ name: 'metrics', pass: hasMetrics, weight: 12, suggestion: 'Quantify your achievements with numbers, percentages, or dollar amounts (e.g., "Increased sales by 25%").' });

  // 7. Professional summary / objective
  const hasSummary = hasMeaningfulSummary(text);
  checks.push({ name: 'summary', pass: hasSummary, weight: 8, suggestion: 'Add a 2-3 line professional summary at the top of your resume describing your key qualifications and career goals.' });

  // 8. Appropriate length
  const goodLength = wordCount >= 100 && wordCount <= 1200;
  checks.push({
    name: 'length', pass: goodLength, weight: 5,
    suggestion: wordCount < 100
      ? 'Your resume is too short. Expand your experience descriptions and add more details.'
      : 'Your resume may be too long. Keep it concise — aim for 1-2 pages.',
  });

  // 9. GPA or Honors mentioned
  const hasGpa = /gpa|g\.p\.a|grade|average|distinction|honors|major|cum laude|magna|summa/i.test(text);
  checks.push({ name: 'gpa', pass: hasGpa, weight: 5, suggestion: 'Include your GPA if above 3.0/4.0, or mention academic honors.' });

  // 10. Projects or extracurricular
  const hasProjects = sectionExists(text, ['project', 'portfolio', 'extracurricular', 'volunteer', 'club', 'organization', 'activitie', 'leadership', 'academic']);
  checks.push({ name: 'projects', pass: hasProjects, weight: 5, suggestion: 'Add a Projects or Activities section to showcase initiative beyond work experience.' });

  // 11. No personal pronouns
  const pronounCount = (text.match(/\b(I|me|my|myself)\b/g) || []).length;
  const noPronouns = pronounCount <= 4;
  checks.push({ name: 'noPronouns', pass: noPronouns, weight: 5, suggestion: 'Remove personal pronouns (I, me, my) — use phrases like "Developed..." instead of "I developed...".' });

  // 12. Date ranges in experience
  const hasDates = hasDateRanges(text);
  checks.push({ name: 'hasDates', pass: hasDates, weight: 5, suggestion: 'Add date ranges (e.g., "Jan 2020 - Present") to your experience entries to show timeline.' });

  // Calculate score
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  // Build suggestions from failing checks
  const suggestions = checks
    .filter(c => !c.pass)
    .sort((a, b) => b.weight - a.weight)
    .map(c => ({ id: c.name, text: c.suggestion, weight: c.weight }));

  return {
    score,
    suggestions,
    details: {
      wordCount,
      bulletLines: verbAnalysis.totalBullets,
      actionVerbCount: verbAnalysis.actionVerbBullets,
      uniqueVerbs: verbAnalysis.uniqueVerbs,
      pronounCount,
      hasEmail,
      hasPhone,
      hasLinkedin,
      hasEducation,
      hasExperience,
      hasMetrics,
      hasDates,
    },
  };
}

