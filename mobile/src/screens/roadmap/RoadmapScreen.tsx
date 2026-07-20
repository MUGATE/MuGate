import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getRoadmap,
  resetRoadmap,
  RoadmapCourse,
  saveRoadmap,
} from '../../api/roadmapApi';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  CREDIT_CAP,
  REMEDIAL_CATEGORY,
  checkPlacement,
  sumRemedialCredits,
} from '../../data/curriculumRules';
import { RootStackParamList } from '../../navigation/types';
import { radii, shadow, ThemeColors } from '../../theme/colors';

type PlanCourse = RoadmapCourse & { _key: string };

const SEMESTERS = ['Fall', 'Spring', 'Summer'];

const CATEGORIES = [
  'General Requirements',
  'Free Liberal Arts',
  'Mathematics & Sciences',
  'Major Requirements',
  'Technical Electives',
  'Remedial',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  'Major Requirements': '#3b82f6',
  'Mathematics & Sciences': '#8b5cf6',
  'General Requirements': '#10b981',
  'Free Liberal Arts': '#f59e0b',
  'Technical Electives': '#ec4899',
  Remedial: '#64748b',
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#06b6d4';
}

let keyCounter = 0;
const withKeys = (courses: RoadmapCourse[]): PlanCourse[] =>
  courses.map((c) => ({ ...c, _key: `c-${keyCounter++}` }));

const stripKeys = (courses: PlanCourse[]): RoadmapCourse[] =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  courses.map(({ _key, ...rest }) => rest);

export function RoadmapScreen() {
  const { isAuthenticated } = useAuth();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [courses, setCourses] = useState<PlanCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [moving, setMoving] = useState<PlanCourse | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRoadmap();
        setCourses(withKeys(Array.isArray(res.data) ? res.data : []));
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(
    async (next: PlanCourse[]) => {
      if (!isAuthenticated) return;
      setSaving('saving');
      try {
        await saveRoadmap(stripKeys(next));
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 1500);
      } catch {
        setSaving('idle');
      }
    },
    [isAuthenticated]
  );

  const years = useMemo(() => {
    const present = Array.from(new Set(courses.map((c) => c.year))).sort((a, b) => a - b);
    return present.length > 0 ? present : [1, 2, 3, 4];
  }, [courses]);

  const planCredits = useMemo(
    () =>
      courses.reduce((sum, c) => {
        if (c.category === REMEDIAL_CATEGORY) return sum;
        return sum + (Number(c.credits) || 0);
      }, 0),
    [courses]
  );

  const remedialCredits = useMemo(() => sumRemedialCredits(courses), [courses]);
  const totalCredits = planCredits + remedialCredits;

  const moveCourse = (course: PlanCourse, year: number, semester: string) => {
    const error = checkPlacement(courses, course, year, semester, course._key);
    if (error) {
      Alert.alert('Cannot move course', error);
      return;
    }
    const next = courses.map((c) =>
      c._key === course._key ? { ...c, year, semester } : c
    );
    setCourses(next);
    setMoving(null);
    persist(next);
  };

  const deleteCourse = (course: PlanCourse) => {
    const next = courses.filter((c) => c._key !== course._key);
    setCourses(next);
    setMoving(null);
    persist(next);
  };

  const addCourse = (course: RoadmapCourse) => {
    const error = checkPlacement(courses, course, course.year, course.semester);
    if (error) {
      Alert.alert('Cannot add course', error);
      return;
    }
    const next = [...courses, { ...course, _key: `c-${keyCounter++}` }];
    setCourses(next);
    setAddOpen(false);
    persist(next);
  };

  const handleReset = () => {
    if (!isAuthenticated) {
      rootNav.navigate('Login');
      return;
    }
    Alert.alert('Reset roadmap', 'Reset to the default curriculum?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const res = await resetRoadmap();
            setCourses(withKeys(Array.isArray(res.data) ? res.data : []));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen header>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} header>
      <View style={styles.topBar}>
        <View style={styles.creditPills}>
          <View style={styles.creditPill}>
            <Ionicons name="school-outline" size={15} color={colors.primary} />
            <Text style={styles.creditText}>Plan {planCredits}</Text>
          </View>
          <View style={[styles.creditPill, styles.remedialPill]}>
            <Text style={[styles.creditText, styles.remedialCreditText]}>
              + Remedial {remedialCredits}
            </Text>
          </View>
          <View style={styles.creditPill}>
            <Text style={styles.creditText}>Total {totalCredits}</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          {saving !== 'idle' ? (
            <Text style={styles.savingText}>
              {saving === 'saving' ? 'Saving…' : 'Saved ✓'}
            </Text>
          ) : null}
          <Pressable onPress={() => setAddOpen(true)} hitSlop={8} style={styles.iconAction}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleReset} hitSlop={8} style={styles.iconAction}>
            <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {!isAuthenticated ? (
        <Pressable style={styles.signinBanner} onPress={() => rootNav.navigate('Login')}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.signinText}>Sign in to save changes to your plan.</Text>
        </Pressable>
      ) : null}

      <Text style={styles.hint}>
        Tap a course to move it. Prerequisites and the {CREDIT_CAP}-credit per-semester
        limit are enforced.
      </Text>

      <ScrollView contentContainerStyle={styles.board} showsVerticalScrollIndicator={false}>
        {years.map((year) => {
          const yearCourses = courses.filter((c) => c.year === year);
          const activeSemesters = SEMESTERS.filter((s) =>
            yearCourses.some((c) => c.semester === s)
          );
          const semestersToShow = activeSemesters.length > 0 ? activeSemesters : ['Fall'];
          return (
            <View key={year} style={styles.yearBlock}>
              <Text style={styles.yearTitle}>Year {year}</Text>
              {semestersToShow.map((sem) => {
                const semCourses = yearCourses.filter((c) => c.semester === sem);
                const semCredits = semCourses.reduce(
                  (s, c) => s + (Number(c.credits) || 0),
                  0
                );
                return (
                  <View key={sem} style={styles.semColumn}>
                    <View style={styles.semHeader}>
                      <Text style={styles.semTitle}>{sem}</Text>
                      <Text
                        style={[
                          styles.semCredits,
                          semCredits > CREDIT_CAP && styles.semCreditsOver,
                        ]}
                      >
                        {semCredits} / {CREDIT_CAP} cr
                      </Text>
                    </View>
                    {semCourses.length === 0 ? (
                      <Text style={styles.emptySem}>No courses</Text>
                    ) : (
                      semCourses.map((course) => (
                        <Pressable
                          key={course._key}
                          style={styles.courseCard}
                          onPress={() => setMoving(course)}
                        >
                          <View
                            style={[
                              styles.catDot,
                              { backgroundColor: categoryColor(course.category) },
                            ]}
                          />
                          <View style={styles.courseBody}>
                            <Text style={styles.courseCode}>{course.courseCode}</Text>
                            <Text style={styles.courseName} numberOfLines={2}>
                              {course.courseName}
                            </Text>
                          </View>
                          <View style={styles.courseRight}>
                            <Text style={styles.courseCredits}>{course.credits}</Text>
                            <Ionicons name="swap-vertical" size={16} color={colors.textMuted} />
                          </View>
                        </Pressable>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <MoveSheet
        course={moving}
        years={years}
        courses={courses}
        onClose={() => setMoving(null)}
        onMove={moveCourse}
        onDelete={deleteCourse}
      />
      <AddCourseSheet
        open={addOpen}
        years={years}
        onClose={() => setAddOpen(false)}
        onAdd={addCourse}
      />
    </Screen>
  );
}

function MoveSheet({
  course,
  years,
  courses,
  onClose,
  onMove,
  onDelete,
}: {
  course: PlanCourse | null;
  years: number[];
  courses: PlanCourse[];
  onClose: () => void;
  onMove: (course: PlanCourse, year: number, semester: string) => void;
  onDelete: (course: PlanCourse) => void;
}) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);

  return (
    <Modal visible={!!course} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Move {course?.courseCode}</Text>
          <Text style={styles.sheetSub} numberOfLines={1}>
            {course?.courseName}
          </Text>
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {years.map((year) => (
              <View key={year} style={styles.sheetYear}>
                <Text style={styles.sheetYearLabel}>Year {year}</Text>
                <View style={styles.sheetTargets}>
                  {SEMESTERS.map((sem) => {
                    const isCurrent = course?.year === year && course?.semester === sem;
                    const error = course && !isCurrent
                      ? checkPlacement(courses, course, year, sem, course._key)
                      : null;
                    const blocked = !!error;
                    return (
                      <Pressable
                        key={sem}
                        disabled={isCurrent}
                        style={[
                          styles.targetBtn,
                          isCurrent && styles.targetBtnCurrent,
                          blocked && styles.targetBtnBlocked,
                        ]}
                        onPress={() => {
                          if (!course) return;
                          if (error) {
                            Alert.alert('Not allowed here', error);
                            return;
                          }
                          onMove(course, year, sem);
                        }}
                      >
                        <Text
                          style={[
                            styles.targetText,
                            isCurrent && styles.targetTextCurrent,
                            blocked && styles.targetTextBlocked,
                          ]}
                        >
                          {sem}
                        </Text>
                        {blocked ? (
                          <Ionicons
                            name="lock-closed"
                            size={11}
                            color={colors.textMuted}
                            style={styles.lockIcon}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <Button
            title="Remove from plan"
            variant="ghost"
            icon="trash-outline"
            onPress={() => course && onDelete(course)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddCourseSheet({
  open,
  years,
  onClose,
  onAdd,
}: {
  open: boolean;
  years: number[];
  onClose: () => void;
  onAdd: (course: RoadmapCourse) => void;
}) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [category, setCategory] = useState<string>('Technical Electives');
  const [year, setYear] = useState(years[0] ?? 1);
  const [semester, setSemester] = useState('Fall');

  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setCredits('3');
      setCategory('Technical Electives');
      setYear(years[0] ?? 1);
      setSemester('Fall');
    }
  }, [open, years]);

  const submit = () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert('Missing info', 'Enter a course code and name.');
      return;
    }
    onAdd({
      courseCode: code.trim(),
      courseName: name.trim(),
      credits: Number(credits) || 0,
      category,
      year,
      semester,
    });
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Add course</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Course code (e.g. CSC 480)"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Course name"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={credits}
            onChangeText={setCredits}
            placeholder="Credits"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
          <Text style={styles.sheetYearLabel}>Category</Text>
          <View style={styles.sheetTargets}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.targetBtn, category === cat && styles.targetBtnActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.targetText, category === cat && styles.targetTextActive]}>
                  {cat === 'Remedial' ? 'Remedial' : cat.replace(' Requirements', '')}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sheetYearLabel}>Year</Text>
          <View style={styles.sheetTargets}>
            {years.map((y) => (
              <Pressable
                key={y}
                style={[styles.targetBtn, year === y && styles.targetBtnActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.targetText, year === y && styles.targetTextActive]}>
                  Year {y}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sheetYearLabel}>Semester</Text>
          <View style={styles.sheetTargets}>
            {SEMESTERS.map((s) => (
              <Pressable
                key={s}
                style={[styles.targetBtn, semester === s && styles.targetBtnActive]}
                onPress={() => setSemester(s)}
              >
                <Text style={[styles.targetText, semester === s && styles.targetTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title="Add to plan" icon="add" onPress={submit} style={styles.addSubmit} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    creditPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      marginRight: 8,
    },
    creditPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.primary + '22',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radii.pill,
    },
    remedialPill: {
      backgroundColor: '#64748b22',
    },
    creditText: { color: c.primary, fontWeight: '700', fontSize: 12 },
    remedialCreditText: { color: '#64748b' },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    savingText: { color: c.textMuted, fontSize: 12 },
    iconAction: { padding: 2 },
    signinBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 4,
      padding: 10,
      borderRadius: radii.md,
      backgroundColor: c.warning + '1a',
    },
    signinText: { color: c.warning, fontSize: 13, flex: 1 },
    hint: {
      color: c.textMuted,
      fontSize: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    board: { padding: 16, paddingTop: 4, paddingBottom: 40 },
    yearBlock: { marginBottom: 20 },
    yearTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 10,
    },
    semColumn: {
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 10,
    },
    semHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    semTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    semCredits: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    semCreditsOver: { color: c.error },
    emptySem: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', paddingVertical: 6 },
    courseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: 10,
      marginBottom: 8,
      ...shadow(scheme),
    },
    catDot: { width: 8, height: 38, borderRadius: 4, marginRight: 10 },
    courseBody: { flex: 1 },
    courseCode: { color: c.text, fontWeight: '700', fontSize: 14 },
    courseName: { color: c.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
    courseRight: { alignItems: 'center', gap: 2, marginLeft: 8 },
    courseCredits: { color: c.primary, fontWeight: '800', fontSize: 15 },

    overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: 20,
      maxHeight: '80%',
    },
    sheetTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
    sheetSub: { color: c.textMuted, fontSize: 13, marginTop: 2, marginBottom: 12 },
    sheetScroll: { marginBottom: 8 },
    sheetYear: { marginBottom: 12 },
    sheetYearLabel: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 8,
      marginBottom: 8,
    },
    sheetTargets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    targetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    targetBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    targetBtnCurrent: { opacity: 0.4 },
    targetBtnBlocked: { opacity: 0.45, borderStyle: 'dashed' },
    targetText: { color: c.text, fontWeight: '600', fontSize: 13 },
    targetTextActive: { color: c.onPrimary },
    targetTextCurrent: { color: c.textMuted },
    targetTextBlocked: { color: c.textMuted },
    lockIcon: { marginLeft: 2 },
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
      fontSize: 15,
    },
    addSubmit: { marginTop: 12 },
  });
