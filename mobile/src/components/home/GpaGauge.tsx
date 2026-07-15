import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radii, shadow, ThemeColors } from '../../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 168;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_GPA = 4;

type GpaGaugeProps = {
  gpa: number | null;
  isAuthenticated: boolean;
  loading?: boolean;
  onSignIn?: () => void;
};

function gpaAccent(gpa: number | null, colors: ThemeColors): string {
  if (gpa == null) return colors.textMuted;
  if (gpa >= 3.2) return colors.success;
  if (gpa >= 2.5) return colors.warning;
  return colors.error;
}

export function GpaGauge({ gpa, isAuthenticated, loading, onSignIn }: GpaGaugeProps) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = gpaAccent(gpa, colors);
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = gpa != null && gpa >= 0 ? Math.min(gpa / MAX_GPA, 1) : 0;
    progress.value = withTiming(target, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [gpa, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const emptyCopy = !isAuthenticated
    ? 'Sign in to see your GPA'
    : loading
      ? 'Loading GPA…'
      : 'GPA unavailable — pull to refresh after login';

  return (
    <View style={[styles.wrap, shadow(scheme)]}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={gpa == null ? '8 10' : undefined}
          />
          {gpa != null ? (
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={accent}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              animatedProps={animatedProps}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null}
        </Svg>
        <View style={styles.center}>
          {gpa != null ? (
            <>
              <Text style={[styles.gpaValue, { color: accent }]}>
                {gpa.toFixed(2)}
              </Text>
              <Text style={styles.gpaScale}>/ {MAX_GPA.toFixed(1)}</Text>
            </>
          ) : (
            <Ionicons
              name={isAuthenticated ? 'school-outline' : 'lock-closed-outline'}
              size={36}
              color={colors.textMuted}
            />
          )}
        </View>
      </View>

      <Text style={styles.label}>Cumulative GPA</Text>
      {gpa != null ? (
        <Text style={styles.hint}>Synced from your MU portal profile</Text>
      ) : (
        <Text style={styles.hint}>{emptyCopy}</Text>
      )}

      {!isAuthenticated && onSignIn ? (
        <Pressable
          onPress={onSignIn}
          style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="log-in-outline" size={18} color={colors.onPrimary} />
          <Text style={styles.signInText}>Sign in with MU Portal</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radii.xl,
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 8,
    },
    ringWrap: {
      width: SIZE,
      height: SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gpaValue: {
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    gpaScale: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    label: {
      marginTop: 14,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    hint: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      color: c.textMuted,
      paddingHorizontal: 12,
    },
    signInBtn: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: radii.pill,
    },
    signInText: {
      color: c.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
