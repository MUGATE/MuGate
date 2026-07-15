import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, ThemeColors } from '../../theme/colors';
import {
  buildSlotsByDay,
  computeGridHours,
  COURSE_COLOR_STYLES,
  DAY_LABEL_WIDTH,
  DAY_ROW_HEIGHT,
  DAYS,
  formatHour,
  formatTime,
  HOUR_COLUMN_WIDTH,
  UICourse,
} from '../../utils/scheduleHelpers';

type Props = {
  courses: UICourse[];
  onCoursePress: (course: UICourse) => void;
};

export function ScheduleGrid({ courses, onCoursePress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const slotsByDay = useMemo(() => buildSlotsByDay(courses), [courses]);
  const { gridStartHour, hours } = useMemo(() => computeGridHours(courses), [courses]);
  const gridWidth = hours.length * HOUR_COLUMN_WIDTH;

  return (
    <View style={styles.card}>
      <View style={styles.gridWrap}>
        {/* Top-left corner + day labels (fixed) */}
        <View style={styles.dayLabelsColumn}>
          <View style={styles.cornerCell} />
          {DAYS.map((day) => (
            <View key={day} style={styles.dayLabelCell}>
              <Text style={styles.dayLabelText}>{day.slice(0, 3)}</Text>
            </View>
          ))}
        </View>

        {/* Time headers + day rows (scroll horizontally for hours) */}
        <ScrollView horizontal showsHorizontalScrollIndicator bounces={false} style={styles.scroll}>
          <View>
            <View style={[styles.timeHeaderRow, { width: gridWidth }]}>
              {hours.map((hour) => (
                <View key={hour} style={styles.timeHeaderCell}>
                  <Text style={styles.timeHeaderText}>{formatHour(hour)}</Text>
                </View>
              ))}
            </View>

            {DAYS.map((day, dayIndex) => (
              <View
                key={day}
                style={[styles.dayRow, { width: gridWidth, height: DAY_ROW_HEIGHT }]}
              >
                {hours.map((hour) => (
                  <View key={hour} style={styles.hourCell} />
                ))}

                {slotsByDay[dayIndex].map(({ course, slot }) => {
                  if (slot.startHour == null || slot.duration <= 0) return null;
                  const palette = COURSE_COLOR_STYLES[course.color];
                  const left = (slot.startHour - gridStartHour) * HOUR_COLUMN_WIDTH;
                  const width = Math.max(slot.duration * HOUR_COLUMN_WIDTH - 4, 48);

                  return (
                    <Pressable
                      key={`${course.id}-${slot.day}-${slot.startHour}`}
                      onPress={() => onCoursePress(course)}
                      style={[
                        styles.courseBlock,
                        {
                          left: left + 2,
                          width,
                          backgroundColor: palette.background,
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      <Text style={[styles.courseCode, { color: palette.text }]} numberOfLines={1}>
                        {course.code}
                      </Text>
                      <Text style={[styles.courseMeta, { color: palette.text }]} numberOfLines={1}>
                        {formatTime(slot.startHour)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    gridWrap: {
      flexDirection: 'row',
    },
    dayLabelsColumn: {
      width: DAY_LABEL_WIDTH,
      borderRightWidth: 1,
      borderRightColor: c.border,
      backgroundColor: c.surfaceLight,
    },
    cornerCell: {
      height: 32,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    dayLabelCell: {
      height: DAY_ROW_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    dayLabelText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.text,
      textTransform: 'uppercase',
    },
    scroll: {
      flex: 1,
    },
    timeHeaderRow: {
      flexDirection: 'row',
      height: 32,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surfaceLight,
    },
    timeHeaderCell: {
      width: HOUR_COLUMN_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.border,
    },
    timeHeaderText: {
      fontSize: 9,
      fontWeight: '600',
      color: c.textMuted,
    },
    dayRow: {
      position: 'relative',
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    hourCell: {
      width: HOUR_COLUMN_WIDTH,
      height: DAY_ROW_HEIGHT,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.border,
    },
    courseBlock: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      borderRadius: radii.sm,
      borderWidth: 1,
      paddingHorizontal: 4,
      paddingVertical: 3,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    courseCode: {
      fontSize: 10,
      fontWeight: '800',
    },
    courseMeta: {
      fontSize: 8,
      marginTop: 2,
      opacity: 0.85,
    },
  });
