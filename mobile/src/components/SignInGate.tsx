import React, { useMemo } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from './Button';
import { Screen } from './Screen';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors } from '../theme/colors';

type SignInGateProps = {
  message: string;
  /** When false, render only the message + button (for embedding in a parent Screen). */
  wrapScreen?: boolean;
  header?: boolean;
  style?: ViewStyle;
};

export function SignInGate({
  message,
  wrapScreen = true,
  header = true,
  style,
}: SignInGateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const content = (
    <>
      <Text style={styles.locked}>{message}</Text>
      <Button
        title="Sign In"
        icon="log-in-outline"
        onPress={() => rootNav.navigate('Login')}
        style={style}
      />
    </>
  );

  if (!wrapScreen) return content;

  return <Screen header={header}>{content}</Screen>;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    locked: { color: c.textMuted, marginBottom: 16, marginTop: 8, lineHeight: 22 },
  });
}
