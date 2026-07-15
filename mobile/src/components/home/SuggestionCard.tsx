import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radii, shadow, ThemeColors } from '../../theme/colors';
import type { HomeSuggestion } from './suggestions';

type SuggestionCardProps = {
  suggestion: HomeSuggestion;
  onPress: () => void;
};

export function SuggestionCard({ suggestion, onPress }: SuggestionCardProps) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View style={[styles.card, shadow(scheme)]}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Try this</Text>
          <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
        </View>
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: suggestion.iconColor + '22' },
            ]}
          >
            <Ionicons
              name={suggestion.icon}
              size={24}
              color={suggestion.iconColor}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{suggestion.title}</Text>
            <Text style={styles.subtitle}>{suggestion.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radii.lg,
      padding: 16,
      marginBottom: 12,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.accent,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    body: {
      flex: 1,
      paddingRight: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
      color: c.textMuted,
    },
    pressed: {
      opacity: 0.88,
    },
  });
