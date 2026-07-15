import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme/colors';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surfaceLight
        : 'transparent';
  const fg =
    variant === 'primary' ? colors.onPrimary : variant === 'ghost' ? colors.primary : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={fg} />
        ) : null}
        <Text style={[styles.text, { color: fg }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
