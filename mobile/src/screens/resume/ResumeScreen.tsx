import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickResumeFile } from '../../api/fileBase64';
import {
  analyzeResume,
  convertResumeFile,
  enhanceResumeWithAI,
  generateAndShareResume,
  PickedFile,
  ResumeAnalysis,
  ResumeFormat,
  ResumeFileType,
} from '../../api/resumeApi';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { SignInGate } from '../../components/SignInGate';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radii, ThemeColors } from '../../theme/colors';

type Tab = 'analyze' | 'build' | 'edit';

type ExperienceEntry = {
  org: string;
  title: string;
  loc: string;
  from: string;
  to: string;
  b1: string;
  b2: string;
  b3: string;
};

type BuilderState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  summary: string;
  eduInst: string;
  eduDegree: string;
  eduLoc: string;
  eduGradDate: string;
  eduGpa: string;
  technical: string;
  tools: string;
  languages: string;
  soft: string;
  project1: string;
  project2: string;
};

const emptyExperience = (): ExperienceEntry => ({
  org: '',
  title: '',
  loc: '',
  from: '',
  to: '',
  b1: '',
  b2: '',
  b3: '',
});

const initialBuilder: BuilderState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  summary: '',
  eduInst: '',
  eduDegree: '',
  eduLoc: '',
  eduGradDate: '',
  eduGpa: '',
  technical: '',
  tools: '',
  languages: '',
  soft: '',
  project1: '',
  project2: '',
};

function dateRange(from: string, to: string): string {
  if (from && to) return `${from} - ${to}`;
  return from || to || '';
}

function scoreColor(score: number, c: ThemeColors): string {
  if (score >= 80) return c.success;
  if (score >= 60) return c.warning;
  return c.error;
}

export function ResumeScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>('analyze');

  if (!isAuthenticated) {
    return <SignInGate message="Sign in to analyze and build resumes." />;
  }

  return (
    <Screen padded={false} header>
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {(['analyze', 'build', 'edit'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Ionicons
                name={
                  t === 'analyze'
                    ? 'analytics-outline'
                    : t === 'build'
                      ? 'create-outline'
                      : 'color-wand-outline'
                }
                size={16}
                color={tab === t ? colors.onPrimary : colors.textMuted}
              />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'analyze' ? 'Analyze' : t === 'build' ? 'Build' : 'Edit'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'analyze' ? <AnalyzeTab /> : tab === 'build' ? <BuildTab /> : <EditTab />}
    </Screen>
  );
}

function AnalyzeTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [textExpanded, setTextExpanded] = useState(false);
  const hasResumeText = resumeText.trim().length > 0;

  const importFile = async () => {
    try {
      const file = await pickResumeFile();
      if (!file) return;
      setImporting(true);
      const { text } = await convertResumeFile(file);
      if (!text.trim()) {
        Alert.alert('Empty file', 'Could not read text from that file. Try a text-based PDF or DOCX.');
        return;
      }
      setResumeText(text);
      setFileName(file.name);
      setTextExpanded(false);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const run = async () => {
    if (resumeText.trim().length < 40) {
      Alert.alert('Add more text', 'Paste at least a few lines of your resume to analyze.');
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeResume(resumeText.trim(), jobDescription.trim() || undefined);
      setAnalysis(result);
    } catch (err) {
      Alert.alert('Analysis failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.uploadBox}
          onPress={importFile}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
          )}
          <View style={styles.uploadTextWrap}>
            <Text style={styles.uploadTitle}>
              {fileName ? 'Replace file' : 'Upload a resume file'}
            </Text>
            <Text style={styles.uploadHint} numberOfLines={1}>
              {fileName ? fileName : 'PDF or Word — we extract the text for you'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.resumeTextHeader}
          onPress={() => hasResumeText && setTextExpanded((v) => !v)}
          disabled={!hasResumeText}
          accessibilityRole="button"
          accessibilityState={{ expanded: textExpanded }}
          accessibilityLabel={textExpanded ? 'Collapse resume text' : 'Expand resume text'}
        >
          <Text style={[styles.label, styles.resumeTextLabel]}>
            {hasResumeText ? 'Resume text' : 'Or paste your resume text'}
          </Text>
          {hasResumeText ? (
            <Ionicons
              name={textExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          ) : null}
        </Pressable>
        {hasResumeText && !textExpanded ? (
          <Pressable
            style={[styles.input, styles.textAreaCollapsed]}
            onPress={() => setTextExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Show full resume text"
          >
            <Text style={styles.collapsedPreview} numberOfLines={3}>
              {resumeText}
            </Text>
            <Text style={styles.expandHint}>Tap to view full text</Text>
          </Pressable>
        ) : (
          <TextInput
            style={[styles.input, hasResumeText ? styles.textArea : styles.textAreaCompact]}
            value={resumeText}
            onChangeText={(value) => {
              const wasEmpty = !resumeText.trim();
              setResumeText(value);
              if (!value.trim()) {
                setTextExpanded(false);
              } else if (wasEmpty) {
                // Short typing stays editable; a long paste collapses like an upload.
                setTextExpanded(value.length < 200);
              }
            }}
            placeholder="Copy the text from your CV and paste it here..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        )}

        <Text style={styles.label}>Target job description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textAreaSmall]}
          value={jobDescription}
          onChangeText={setJobDescription}
          placeholder="Paste a job post to check keyword match..."
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Button
          title={loading ? 'Analyzing...' : 'Analyze Resume'}
          icon="sparkles-outline"
          onPress={run}
          loading={loading}
          disabled={!resumeText.trim()}
          style={styles.actionBtn}
        />

        {analysis ? <AnalysisResult analysis={analysis} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AnalysisResult({ analysis }: { analysis: ResumeAnalysis }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const overall = analysis.overallScore;

  return (
    <View style={styles.result}>
      <View style={styles.scoreCard}>
        <View style={[styles.scoreRing, { borderColor: scoreColor(overall, colors) }]}>
          <Text style={[styles.scoreNum, { color: scoreColor(overall, colors) }]}>{overall}</Text>
          <Text style={styles.scoreOutOf}>/100</Text>
        </View>
        <View style={styles.scoreMeta}>
          <Text style={styles.scoreTitle}>Overall score</Text>
          <Text style={styles.summary}>{analysis.summary}</Text>
          <Text style={styles.sourceTag}>
            {analysis.meta.source === 'ai' ? 'AI analysis' : 'Heuristic analysis'}
          </Text>
        </View>
      </View>

      {analysis.categories.map((cat) => (
        <View key={cat.key} style={styles.catCard}>
          <View style={styles.catHeader}>
            <Text style={styles.catLabel}>{cat.label}</Text>
            <Text style={[styles.catScore, { color: scoreColor(cat.score, colors) }]}>
              {cat.score}
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${cat.score}%`, backgroundColor: scoreColor(cat.score, colors) },
              ]}
            />
          </View>
          {cat.reasoning ? <Text style={styles.catReason}>{cat.reasoning}</Text> : null}
          {cat.improvements.length > 0 ? (
            <View style={styles.improveBlock}>
              {cat.improvements.map((imp, i) => (
                <View key={i} style={styles.improveRow}>
                  <Ionicons name="arrow-up-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.improveText}>{imp}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      {(analysis.keywords.matched.length > 0 || analysis.keywords.missing.length > 0) && (
        <View style={styles.catCard}>
          <Text style={styles.catLabel}>Keywords</Text>
          {analysis.keywords.matched.length > 0 ? (
            <>
              <Text style={styles.kwHeading}>Matched</Text>
              <View style={styles.chipRow}>
                {analysis.keywords.matched.map((k, i) => (
                  <Text key={i} style={[styles.chip, styles.chipMatched]}>
                    {k}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
          {analysis.keywords.missing.length > 0 ? (
            <>
              <Text style={styles.kwHeading}>Missing</Text>
              <View style={styles.chipRow}>
                {analysis.keywords.missing.map((k, i) => (
                  <Text key={i} style={[styles.chip, styles.chipMissing]}>
                    {k}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
        </View>
      )}

      {analysis.topRecommendations.length > 0 ? (
        <View style={styles.catCard}>
          <Text style={styles.catLabel}>Top recommendations</Text>
          {analysis.topRecommendations.map((rec, i) => (
            <View key={i} style={styles.improveRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
              <Text style={styles.improveText}>{rec}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BuildTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [format, setFormat] = useState<ResumeFormat>('local');
  const [data, setData] = useState<BuilderState>(initialBuilder);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([emptyExperience()]);
  const [generating, setGenerating] = useState(false);

  const set = (key: keyof BuilderState) => (value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const setExp = (index: number, key: keyof ExperienceEntry) => (value: string) =>
    setExperiences((prev) => prev.map((e, i) => (i === index ? { ...e, [key]: value } : e)));

  const addExperience = () => setExperiences((prev) => [...prev, emptyExperience()]);
  const removeExperience = (index: number) =>
    setExperiences((prev) => prev.filter((_, i) => i !== index));

  const buildPayload = (fileType: 'pdf' | 'docx') => {
    const formData: Record<string, string> = {};
    const [first, ...rest] = experiences;

    if (format === 'local') {
      Object.assign(formData, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        linkedin: data.linkedin,
        objective: data.summary,
        eduInst1: data.eduInst,
        eduDegree1: data.eduDegree,
        eduLoc1: data.eduLoc,
        eduGradDate1: data.eduGradDate,
        eduGpa1: data.eduGpa,
        technicalSkills: data.technical,
        computerSkills: data.tools,
        languages: data.languages,
        softSkills: data.soft,
        project1: data.project1,
        project2: data.project2,
      });
      if (first) {
        Object.assign(formData, {
          expCompany1: first.org,
          expPos1: first.title,
          expLoc1: first.loc,
          expFrom1: first.from,
          expTo1: first.to,
          expBullet1a: first.b1,
          expBullet1b: first.b2,
          expBullet1c: first.b3,
        });
      }
      const extras = {
        exp: rest.map((e) => ({
          company: e.org,
          pos: e.title,
          loc: e.loc,
          from: e.from,
          to: e.to,
          bullet1: e.b1,
          bullet2: e.b2,
          bullet3: e.b3,
        })),
      };
      return { format, formData, extras, fileType };
    }

    const [firstName, ...lastParts] = (data.fullName || '').trim().split(' ');
    Object.assign(formData, {
      firstName: firstName ?? '',
      lastName: lastParts.join(' '),
      email: data.email,
      phone: data.phone,
      address: data.address,
      eduInst: data.eduInst,
      eduDegree: data.eduDegree,
      eduLoc: data.eduLoc,
      eduGradDate: data.eduGradDate,
      eduGpa: data.eduGpa,
      technical: data.technical,
      language: data.languages,
      interests: data.soft,
    });
    if (first) {
      Object.assign(formData, {
        expOrg1: first.org,
        expTitle1: first.title,
        expLoc1: first.loc,
        expDates1: dateRange(first.from, first.to),
        expB1a: first.b1,
        expB1b: first.b2,
        expB1c: first.b3,
      });
    }
    const extras = {
      exp: rest.map((e) => ({
        org: e.org,
        title: e.title,
        loc: e.loc,
        dates: dateRange(e.from, e.to),
        b1: e.b1,
        b2: e.b2,
        b3: e.b3,
      })),
    };
    return { format, formData, extras, fileType };
  };

  const generate = async (fileType: 'pdf' | 'docx') => {
    if (!data.fullName.trim()) {
      Alert.alert('Name required', 'Add at least your full name before generating.');
      return;
    }
    setGenerating(true);
    try {
      await generateAndShareResume(buildPayload(fileType));
    } catch (err) {
      Alert.alert('Generation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formatRow}>
          {(['local', 'global'] as ResumeFormat[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.formatBtn, format === f && styles.formatBtnActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.formatText, format === f && styles.formatTextActive]}>
                {f === 'local' ? 'Local (Lebanese)' : 'Global (Harvard)'}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel text="Personal" />
        <Field label="Full name" value={data.fullName} onChange={set('fullName')} />
        <Field label="Email" value={data.email} onChange={set('email')} keyboardType="email-address" />
        <Field label="Phone" value={data.phone} onChange={set('phone')} keyboardType="phone-pad" />
        <Field label="Address" value={data.address} onChange={set('address')} />
        {format === 'local' ? (
          <Field label="LinkedIn" value={data.linkedin} onChange={set('linkedin')} />
        ) : null}

        {format === 'local' ? (
          <>
            <SectionLabel text="Summary / Objective" />
            <Field
              label="Professional summary"
              value={data.summary}
              onChange={set('summary')}
              multiline
            />
          </>
        ) : null}

        <SectionLabel text="Education" />
        <Field label="Institution" value={data.eduInst} onChange={set('eduInst')} />
        <Field label="Degree" value={data.eduDegree} onChange={set('eduDegree')} />
        <Field label="Location" value={data.eduLoc} onChange={set('eduLoc')} />
        <Field label="Graduation date" value={data.eduGradDate} onChange={set('eduGradDate')} />
        <Field label="GPA / Honors" value={data.eduGpa} onChange={set('eduGpa')} />

        <SectionLabel text="Experience" />
        {experiences.map((exp, i) => (
          <View key={i} style={styles.expCard}>
            <View style={styles.expHeader}>
              <Text style={styles.expHeaderText}>Experience {i + 1}</Text>
              {experiences.length > 1 ? (
                <Pressable onPress={() => removeExperience(i)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              ) : null}
            </View>
            <Field label="Company / Organization" value={exp.org} onChange={setExp(i, 'org')} />
            <Field label="Position / Title" value={exp.title} onChange={setExp(i, 'title')} />
            <Field label="Location" value={exp.loc} onChange={setExp(i, 'loc')} />
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Field label="From" value={exp.from} onChange={setExp(i, 'from')} />
              </View>
              <View style={styles.dateCol}>
                <Field label="To" value={exp.to} onChange={setExp(i, 'to')} />
              </View>
            </View>
            <Field label="Highlight 1" value={exp.b1} onChange={setExp(i, 'b1')} multiline />
            <Field label="Highlight 2" value={exp.b2} onChange={setExp(i, 'b2')} multiline />
            <Field label="Highlight 3" value={exp.b3} onChange={setExp(i, 'b3')} multiline />
          </View>
        ))}
        <Button
          title="Add experience"
          variant="secondary"
          icon="add"
          onPress={addExperience}
          style={styles.addBtn}
        />

        <SectionLabel text="Skills" />
        <Field label="Technical skills" value={data.technical} onChange={set('technical')} multiline />
        <Field label="Tools / Software" value={data.tools} onChange={set('tools')} multiline />
        <Field label="Languages" value={data.languages} onChange={set('languages')} />
        <Field
          label={format === 'local' ? 'Soft skills' : 'Interests'}
          value={data.soft}
          onChange={set('soft')}
          multiline
        />

        {format === 'local' ? (
          <>
            <SectionLabel text="Projects" />
            <Field label="Project 1" value={data.project1} onChange={set('project1')} multiline />
            <Field label="Project 2" value={data.project2} onChange={set('project2')} multiline />
          </>
        ) : null}

        <View style={styles.generateRow}>
          <Button
            title="PDF"
            icon="document-outline"
            onPress={() => generate('pdf')}
            loading={generating}
            style={styles.genBtn}
          />
          <Button
            title="Word"
            variant="secondary"
            icon="document-text-outline"
            onPress={() => generate('docx')}
            disabled={generating}
            style={styles.genBtn}
          />
        </View>
        <Text style={styles.hint}>
          Generates your CV on the server and opens the share sheet to save or send it.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EditTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [instructions, setInstructions] = useState('');
  const [format, setFormat] = useState<ResumeFormat>('local');
  const [fileType, setFileType] = useState<ResumeFileType>('pdf');
  const [working, setWorking] = useState(false);

  const choose = async () => {
    try {
      const picked = await pickResumeFile();
      if (picked) setFile(picked);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const apply = async () => {
    if (!file) {
      Alert.alert('Pick a file', 'Upload a PDF or Word resume to edit first.');
      return;
    }
    if (!instructions.trim()) {
      Alert.alert('Add instructions', 'Describe what you want to change.');
      return;
    }
    setWorking(true);
    try {
      await enhanceResumeWithAI(file, instructions.trim(), format, fileType);
    } catch (err) {
      Alert.alert('Edit failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Upload the resume to edit</Text>
        <Pressable style={styles.uploadBox} onPress={choose} disabled={working}>
          <Ionicons name="document-attach-outline" size={22} color={colors.primary} />
          <View style={styles.uploadTextWrap}>
            <Text style={styles.uploadTitle}>{file ? 'Replace file' : 'Choose a file'}</Text>
            <Text style={styles.uploadHint} numberOfLines={1}>
              {file ? file.name : 'PDF or Word document'}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.label}>CV format</Text>
        <View style={styles.formatRow}>
          {(['local', 'global'] as ResumeFormat[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.formatBtn, format === f && styles.formatBtnActive]}
              onPress={() => setFormat(f)}
              disabled={working}
            >
              <Text style={[styles.formatText, format === f && styles.formatTextActive]}>
                {f === 'local' ? 'Local (Lebanese)' : 'Global (Harvard)'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>What should we change?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder='e.g. "Make the summary more concise" or "Strengthen my experience bullets with action verbs"'
          placeholderTextColor={colors.textMuted}
          multiline
          editable={!working}
        />

        <Text style={styles.label}>Export as</Text>
        <View style={styles.formatRow}>
          {(['pdf', 'docx'] as ResumeFileType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.formatBtn, fileType === t && styles.formatBtnActive]}
              onPress={() => setFileType(t)}
              disabled={working}
            >
              <Text style={[styles.formatText, fileType === t && styles.formatTextActive]}>
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          title={working ? 'AI is editing your CV...' : 'Apply AI Changes & Share'}
          icon="color-wand-outline"
          onPress={apply}
          loading={working}
          disabled={!file || !instructions.trim()}
          style={styles.actionBtn}
        />
        <Text style={styles.hint}>
          AI reads your resume, applies your instructions, and opens the share sheet so you can save the updated PDF or Word file.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textAreaSmall]}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    tabsWrap: { paddingHorizontal: 16, paddingTop: 8 },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: { backgroundColor: c.primary },
    tabText: { color: c.textMuted, fontWeight: '600', fontSize: 14 },
    tabTextActive: { color: c.onPrimary },
    scroll: { padding: 16, paddingBottom: 48 },
    label: { color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 4 },
    resumeTextHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      marginBottom: 6,
    },
    resumeTextLabel: { marginTop: 0, marginBottom: 0, flex: 1 },
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 15,
    },
    textArea: { minHeight: 160, textAlignVertical: 'top', marginBottom: 12 },
    textAreaCompact: { minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
    textAreaCollapsed: { marginBottom: 12, gap: 6 },
    collapsedPreview: { color: c.text, fontSize: 15, lineHeight: 22 },
    expandHint: { color: c.textMuted, fontSize: 12 },
    textAreaSmall: { minHeight: 80, textAlignVertical: 'top' },
    actionBtn: { marginTop: 12 },

    uploadBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
      backgroundColor: c.surfaceLight,
      marginBottom: 12,
    },
    uploadTextWrap: { flex: 1 },
    uploadTitle: { color: c.text, fontWeight: '700', fontSize: 14 },
    uploadHint: { color: c.textMuted, fontSize: 12, marginTop: 2 },

    result: { marginTop: 20 },
    scoreCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 12,
    },
    scoreRing: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 5,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    scoreNum: { fontSize: 26, fontWeight: '800' },
    scoreOutOf: { fontSize: 10, color: c.textMuted, marginTop: -2 },
    scoreMeta: { flex: 1 },
    scoreTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
    summary: { color: c.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    sourceTag: { color: c.accent, fontSize: 11, marginTop: 6, fontWeight: '600' },
    catCard: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 12,
    },
    catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catLabel: { color: c.text, fontSize: 15, fontWeight: '700' },
    catScore: { fontSize: 18, fontWeight: '800' },
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.surfaceLight,
      marginTop: 8,
      overflow: 'hidden',
    },
    barFill: { height: 6, borderRadius: 3 },
    catReason: { color: c.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8 },
    improveBlock: { marginTop: 8, gap: 6 },
    improveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    improveText: { color: c.text, fontSize: 13, lineHeight: 19, flex: 1 },
    kwHeading: { color: c.textMuted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
    chipMatched: { backgroundColor: c.success + '22', color: c.success },
    chipMissing: { backgroundColor: c.error + '22', color: c.error },

    formatRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    formatBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    formatBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    formatText: { color: c.textMuted, fontWeight: '600', fontSize: 13 },
    formatTextActive: { color: c.onPrimary },
    sectionLabel: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 18,
      marginBottom: 10,
    },
    field: { marginBottom: 10 },
    fieldLabel: { color: c.textMuted, fontSize: 12, marginBottom: 5 },
    expCard: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 12,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    expHeaderText: { color: c.text, fontWeight: '700', fontSize: 14 },
    dateRow: { flexDirection: 'row', gap: 10 },
    dateCol: { flex: 1 },
    addBtn: { marginTop: 4 },
    generateRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
    genBtn: { flex: 1 },
    hint: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 18 },
  });
