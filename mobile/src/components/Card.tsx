import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radii, shadow } from '../theme/colors';

type CardProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Tint for the leading icon badge. Defaults to primary. */
  iconColor?: string;
  style?: ViewStyle;
};

export function Card({ title, subtitle, onPress, icon, iconColor, style }: CardProps) {
  const { colors, scheme } = useTheme();
  const accent = iconColor ?? colors.primary;

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadow(scheme),
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  body: {
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});
