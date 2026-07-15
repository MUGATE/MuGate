import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, ThemeColors } from '../../theme/colors';
import {
  COURSE_COLOR_STYLES,
  DAYS,
  formatTime,
  UICourse,
} from '../../utils/scheduleHelpers';

type Props = {
  course: UICourse | null;
  onClose: () => void;
};

export function CourseDetailModal({ course, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!course) return null;

  const palette = COURSE_COLOR_STYLES[course.color];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { borderColor: palette.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.accent, { backgroundColor: palette.background }]} />
          <Text style={styles.title}>{course.name}</Text>
          <Text style={styles.code}>
            {course.code} · {course.credits} credits
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Instructor</Text>
            <Text style={styles.value}>{course.instructor}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Room</Text>
            <Text style={styles.value}>{course.room}</Text>
          </View>
          {course.type ? (
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{course.type}</Text>
            </View>
          ) : null}

          <Text style={styles.sessionsTitle}>Scheduled sessions</Text>
          {course.slots.map((slot, i) => (
            <View key={i} style={styles.sessionRow}>
              <Text style={styles.sessionDay}>{DAYS[slot.day]}</Text>
              <Text style={styles.sessionTime}>
                {formatTime(slot.startHour)} – {formatTime(slot.endHour)}
              </Text>
            </View>
          ))}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: c.card,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      borderWidth: 1,
      padding: 20,
      paddingBottom: 32,
    },
    accent: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    code: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    label: {
      fontSize: 14,
      color: c.textMuted,
    },
    value: {
      fontSize: 14,
      color: c.text,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 12,
    },
    sessionsTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      marginTop: 16,
      marginBottom: 8,
    },
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    sessionDay: {
      fontSize: 14,
      color: c.text,
      fontWeight: '600',
    },
    sessionTime: {
      fontSize: 14,
      color: c.textMuted,
    },
    closeBtn: {
      marginTop: 20,
      backgroundColor: c.primary,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    closeBtnText: {
      color: c.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
