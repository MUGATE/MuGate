import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { CourseDetailModal } from '../../components/schedule/CourseDetailModal';
import { ScheduleGrid } from '../../components/schedule/ScheduleGrid';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  generateSchedules,
  getSavedSchedules,
  saveSchedule,
  SchedulePreferences,
} from '../../api/scheduleApi';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radii, ThemeColors } from '../../theme/colors';
import {
  BackendScheduleItem,
  COURSE_COLOR_STYLES,
  parseBackendSchedule,
  TopSchedule,
  UICourse,
} from '../../utils/scheduleHelpers';

const defaultPrefs: SchedulePreferences = {
  skip8am: false,
  twoDaysOnly: false,
  freeFridays: false,
  maxCredits: 17,
};

export function ScheduleScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [prefs, setPrefs] = useState<SchedulePreferences>(defaultPrefs);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [generatedSchedules, setGeneratedSchedules] = useState<TopSchedule[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<UICourse | null>(null);
  const [isSavedView, setIsSavedView] = useState(false);

  const applySchedule = useCallback((backendSchedule: BackendScheduleItem[]) => {
    setCourses(parseBackendSchedule(backendSchedule));
    setScheduleVisible(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSaved = async () => {
      try {
        const res = await getSavedSchedules();
        const saved = res.data?.[0];
        if (saved?.courses && Array.isArray(saved.courses) && saved.courses.length > 0) {
          applySchedule(saved.courses as BackendScheduleItem[]);
          setIsSavedView(true);
        }
      } catch {
        /* no saved schedule */
      }
    };

    loadSaved();
  }, [isAuthenticated, applySchedule]);

  if (!isAuthenticated) {
    return (
      <Screen header>
        <Text style={styles.locked}>Sign in to generate personalized schedules.</Text>
        <Button title="Sign In" icon="log-in-outline" onPress={() => rootNav.navigate('Login')} />
      </Screen>
    );
  }

  const toggle = (key: keyof SchedulePreferences) => {
    if (key === 'maxCredits') return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setErrorMsg('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    setScheduleVisible(false);
    setIsSavedView(false);
    setGeneratedSchedules([]);
    setVisibleCount(0);
    setCurrentIndex(0);

    try {
      const res = await generateSchedules(prefs);
      const top = res.data?.topSchedules ?? [];

      if (top.length > 0) {
        setGeneratedSchedules(top);
        setVisibleCount(1);
        setCurrentIndex(0);
        applySchedule(top[0].schedule);
      } else if (res.data?.offeringsFound === 0) {
        setErrorMsg(
          'No course offerings were loaded for this semester. Try again in a moment.'
        );
      } else {
        setErrorMsg('No combinations match your preferences. Try relaxing your toggles.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      setCurrentIndex(next);
      applySchedule(generatedSchedules[next].schedule);
    }
  };

  const goNext = () => {
    if (currentIndex < visibleCount - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      applySchedule(generatedSchedules[next].schedule);
    }
  };

  const handleRevealNext = () => {
    if (visibleCount < generatedSchedules.length) {
      const nextCount = visibleCount + 1;
      setVisibleCount(nextCount);
      const idx = nextCount - 1;
      setCurrentIndex(idx);
      applySchedule(generatedSchedules[idx].schedule);
    }
  };

  const handleSave = async () => {
    if (!generatedSchedules.length) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const active = generatedSchedules[currentIndex];
      const sectionIds = active.schedule
        .map((c) => c.section.sectionId)
        .filter((id): id is number => id != null);

      await saveSchedule({
        name: `Generated Schedule ${new Date().toLocaleDateString()}`,
        score: active.score,
        totalCredits: active.totalCredits,
        sectionIds,
      });

      Alert.alert('Saved', 'Schedule saved to your profile.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save schedule.');
    } finally {
      setLoading(false);
    }
  };

  const activeTotalCredits =
    generatedSchedules[currentIndex]?.totalCredits ??
    courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  return (
    <Screen header>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.desc}>Set your preferences and generate optimized schedules.</Text>

        <View style={styles.group}>
          <PrefRow
            label="Skip 8 AM classes"
            value={prefs.skip8am}
            onValueChange={() => toggle('skip8am')}
            colors={colors}
          />
          <PrefRow
            label="Two days only"
            value={prefs.twoDaysOnly}
            onValueChange={() => toggle('twoDaysOnly')}
            colors={colors}
          />
          <PrefRow
            label="Free Fridays"
            value={prefs.freeFridays}
            onValueChange={() => toggle('freeFridays')}
            colors={colors}
            last
          />
        </View>

        <Text style={styles.credits}>Max credits: {prefs.maxCredits}</Text>

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <Button
          title={loading ? 'Generating...' : 'Generate Schedule'}
          icon="sparkles-outline"
          onPress={handleGenerate}
          loading={loading}
          style={styles.btn}
        />

        {scheduleVisible ? (
          <View style={styles.results}>
            <View style={styles.resultsHeader}>
              {generatedSchedules.length > 0 && !isSavedView ? (
                <View style={styles.carousel}>
                  <IconBtn
                    icon="chevron-back"
                    disabled={currentIndex === 0}
                    onPress={goPrev}
                    colors={colors}
                  />
                  <Text style={styles.optionLabel}>
                    Option {currentIndex + 1} of {visibleCount}
                  </Text>
                  <IconBtn
                    icon="chevron-forward"
                    disabled={currentIndex >= visibleCount - 1}
                    onPress={goNext}
                    colors={colors}
                  />
                </View>
              ) : (
                <Text style={styles.savedLabel}>Saved schedule</Text>
              )}
              <Text style={styles.creditsBadge}>
                {activeTotalCredits} cr
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Weekly grid</Text>
            <Text style={styles.hint}>Swipe horizontally to see all hours. Tap a block for details.</Text>
            <ScheduleGrid courses={courses} onCoursePress={setSelectedCourse} />

            <Text style={[styles.sectionTitle, styles.coursesTitle]}>Registered courses</Text>
            {courses.map((course) => {
              const palette = COURSE_COLOR_STYLES[course.color];
              return (
                <Pressable
                  key={String(course.id)}
                  style={styles.courseItem}
                  onPress={() => setSelectedCourse(course)}
                >
                  <View style={[styles.colorDot, { backgroundColor: palette.border }]} />
                  <View style={styles.courseBody}>
                    <Text style={styles.courseName}>
                      {course.code} — {course.name}
                    </Text>
                    <Text style={styles.courseSub}>
                      {course.type ?? 'Course'} · {course.credits} credits
                    </Text>
                    <Text style={styles.courseInstructor}>{course.instructor}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}

            {generatedSchedules.length > 0 && !isSavedView ? (
              <View style={styles.actions}>
                <Button
                  title="Next option"
                  variant="secondary"
                  icon="refresh-outline"
                  onPress={handleRevealNext}
                  disabled={visibleCount >= generatedSchedules.length || loading}
                  style={styles.actionBtn}
                />
                <Button
                  title={loading ? 'Saving...' : 'Save selection'}
                  icon="checkmark-circle-outline"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📅</Text>
            <Text style={styles.placeholderText}>Your weekly schedule will appear here</Text>
          </View>
        )}
      </ScrollView>

      <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </Screen>
  );
}

function IconBtn({
  icon,
  disabled,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  disabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.onPrimary} />
    </Pressable>
  );
}

function PrefRow({
  label,
  value,
  onValueChange,
  colors,
  last,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  colors: ThemeColors;
  last?: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
        },
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 16 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: { paddingBottom: 32 },
    locked: { color: c.textMuted, marginBottom: 16, marginTop: 8, lineHeight: 22 },
    desc: { color: c.textMuted, marginBottom: 20, marginTop: 8, lineHeight: 22 },
    group: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    credits: { color: c.textMuted, marginTop: 16, marginBottom: 8 },
    error: { color: c.error, marginBottom: 8, lineHeight: 20 },
    btn: { marginTop: 8 },
    results: { marginTop: 24 },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 8,
    },
    carousel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      flexShrink: 1,
    },
    savedLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
      flex: 1,
    },
    creditsBadge: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 6,
    },
    hint: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 10,
    },
    coursesTitle: { marginTop: 20 },
    courseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 8,
      gap: 10,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    courseBody: { flex: 1 },
    courseName: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    courseSub: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    courseInstructor: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 4,
    },
    actions: {
      marginTop: 16,
      gap: 10,
    },
    actionBtn: { marginTop: 0 },
    placeholder: {
      marginTop: 32,
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    placeholderIcon: { fontSize: 40, marginBottom: 8 },
    placeholderText: { color: c.textMuted, fontSize: 15 },
  });
