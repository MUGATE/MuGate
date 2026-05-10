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
  const hasKeyword = keywords.some(k => lower.includes(k));
  if (!hasKeyword) return false;
  if (!minimumContent) return true;
  // Check if there's actual content beyond the section header
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(k => line.includes(k))) {
      // Check next 2-3 lines for content
      const afterLines = lines.slice(i + 1, i + 4).filter(l => l.trim());
      if (afterLines.length >= 1 && afterLines.some(l => l.length > 5)) return true;
    }
  }
  return false;
}

/**
 * More accurate LinkedIn detection — catches various LinkedIn URL formats
 * and the word LinkedIn in any context
 */
function hasLinkedInProfile(text) {
  // Check for linkedin.com URLs
  if (/linkedin\.com\/in\b/i.test(text)) return true;
  // Check for the word "LinkedIn" as a standalone concept
  if (/\blinkedin\b/i.test(text)) return true;
  // Check for "linkedin" in markdown links
  if (/\[.*\]\(.*linkedin/i.test(text)) return true;
  return false;
}

/**
 * More accurate email detection — avoids false positives
 */
function hasEmailAddress(text) {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
}

/**
 * More accurate phone detection — catches Lebanese and international formats
 */
function hasPhoneNumber(text) {
  // Lebanese mobile: 03/70/71/76/78/79/81 followed by 6 digits
  if (/(?:\+961|00961)?[\s-]?(?:3[0-9]|7[0-689]|8[1]|9[0-9])[\s-]?\d{3}[\s-]?\d{3}/.test(text)) return true;
  // General international phone
  if (/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(text)) return true;
  return false;
}

/**
 * Check if experience bullets use action verbs with good variety
 */
function evaluateActionVerbs(text, lines) {
  const bulletLines = lines.filter(l => /^[\s]*[•\-\*▪]/.test(l) || /^[\s]*\d+[\.\)]/.test(l));
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
    hasActionVerbs: actionVerbCount >= 2,
    hasVariety: uniqueVerbCount >= 3,
  };
}

/**
 * Check if there's a professional summary with actual content
 */
function hasMeaningfulSummary(text) {
  const lower = text.toLowerCase();
  const summaryHeaders = ['summary', 'objective', 'profile', 'about me', 'professional summary', 'career objective'];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    if (summaryHeaders.some(h => line.includes(h) || line === h)) {
      // Check if there's meaningful content after the header
      const afterText = lines.slice(i, i + 4).filter(l => l.trim()).join(' ');
      return afterText.length > 30; // At least 30 chars of actual content
    }
  }
  return false;
}

/**
 * Check if quantified achievements/numbers are present in bullet points
 */
function hasQuantifiedMetrics(text, lines) {
  // Stats in bullet points
  const bulletLines = lines.filter(l => /^[\s]*[•\-\*▪]/.test(l));
  const bulletText = bulletLines.join(' ');

  // Check for percentages, dollar amounts, numbers with units
  const metricPatterns = [
    /\d+%/,
    /\$[\d,]+/,
    /\d+\s*(times|fold|x)/i,
    /\d+\s*(users|clients|customers|projects|team\s*members|employees|students)/i,
    /increased?\s+(by\s+)?\d+/i,
    /decreased?\s+(by\s+)?\d+/i,
    /improved?\s+(by\s+)?\d+/i,
    /reduced?\s+(by\s+)?\d+/i,
    /grew\s+(by\s+)?\d+/i,
    /\d+%\s+(increase|decrease|growth|improvement|reduction)/i,
    /over\s+\d+/i,
    /more\s+than\s+\d+/i,
  ];

  return metricPatterns.some(p => p.test(bulletText));
}

/**
 * Check if the resume has date ranges in experience entries
 */
function hasDateRanges(text) {
  const datePatterns = [
    /\b(20\d{2})\s*[-–—to]+\s*(20\d{2}|present|current|now)\b/i,
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(20\d{2})\s*[-–—]\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(20\d{2}|present|current|now)/i,
    /\b(20\d{2})\s*[-–—]\s*(20\d{2}|present|current|now)\b/i,
  ];
  return datePatterns.some(p => p.test(text));
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

  // 2. Education section — check for meaningful content, not just keywords
  const hasEducation = sectionExists(text, ['education', 'university', 'college', 'bachelor', 'master', 'degree', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'ph.d'], true);
  checks.push({ name: 'education', pass: hasEducation, weight: 10, suggestion: 'Include an Education section with your degree, institution, and graduation date.' });

  // 3. Experience section — check for actual entries, not just the word
  const hasExperience = sectionExists(text, ['experience', 'work', 'employment', 'intern', 'professional background'], true);
  checks.push({ name: 'experience', pass: hasExperience, weight: 12, suggestion: 'Add a Work Experience section detailing your professional roles with specific bullet points.' });

  // 4. Skills section
  const hasSkills = sectionExists(text, ['skills', 'proficiencies', 'competencies', 'technologies', 'tools', 'technical skills'], true);
  checks.push({ name: 'skills', pass: hasSkills, weight: 10, suggestion: 'Add a Skills section listing your technical and soft skills.' });

  // 5. Action verbs in bullets — improved detection with variety check
  const verbAnalysis = evaluateActionVerbs(text, lines);
  const hasActionVerbs = verbAnalysis.hasActionVerbs;
  const hasVariety = verbAnalysis.hasVariety;
  checks.push({
    name: 'actionVerbs',
    pass: hasActionVerbs && hasVariety,
    weight: 10,
    suggestion: !hasActionVerbs
      ? 'Start your experience bullet points with strong action verbs (e.g., Developed, Managed, Designed).'
      : 'Add more variety to your action verbs — use different strong verbs for each bullet point.',
  });

  // 6. Quantified achievements — more thorough check
  const hasMetrics = hasQuantifiedMetrics(text, lines);
  checks.push({ name: 'metrics', pass: hasMetrics, weight: 12, suggestion: 'Quantify your achievements with numbers, percentages, or dollar amounts (e.g., "Increased sales by 25%").' });

  // 7. Professional summary / objective — check for meaningful content
  const hasSummary = hasMeaningfulSummary(text);
  checks.push({ name: 'summary', pass: hasSummary, weight: 8, suggestion: 'Add a 2-3 line professional summary at the top of your resume describing your key qualifications and career goals.' });

  // 8. Appropriate length
  const goodLength = wordCount >= 200 && wordCount <= 1500;
  checks.push({
    name: 'length', pass: goodLength, weight: 5,
    suggestion: wordCount < 200
      ? 'Your resume is too short. Expand your experience descriptions and add more details.'
      : 'Your resume may be too long. Keep it concise — aim for 1-2 pages.',
  });

  // 9. GPA mentioned — only if education section exists
  const hasGpa = sectionExists(text, ['education', 'university', 'college']) ?
    /gpa|grade point|dean.?s list|cum laude|magna|summa|honors/i.test(text) : false;
  checks.push({ name: 'gpa', pass: hasGpa, weight: 5, suggestion: 'Include your GPA if above 3.0/4.0, or mention academic honors.' });

  // 10. Projects or extracurricular
  const hasProjects = sectionExists(text, ['project', 'portfolio', 'extracurricular', 'volunteer', 'club', 'organization', 'activitie', 'leadership'], true);
  checks.push({ name: 'projects', pass: hasProjects, weight: 5, suggestion: 'Add a Projects or Activities section to showcase initiative beyond work experience.' });

  // 11. No personal pronouns
  const pronounCount = (text.match(/\b(I|me|my|myself)\b/g) || []).length;
  const noPronouns = pronounCount <= 2;
  checks.push({ name: 'noPronouns', pass: noPronouns, weight: 5, suggestion: 'Remove personal pronouns (I, me, my) — use phrases like "Developed..." instead of "I developed...".' });

  // 12. Date ranges in experience (new check)
  const hasDates = hasDateRanges(text);
  checks.push({ name: 'hasDates', pass: hasDates || !hasExperience, weight: 5, suggestion: 'Add date ranges (e.g., "Jan 2020 - Present") to your experience entries to show timeline.' });

  // Calculate score
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  // Build suggestions from failing checks — deduplicate and improve wording
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

