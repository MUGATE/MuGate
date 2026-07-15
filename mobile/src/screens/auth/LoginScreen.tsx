import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/types';
import { radii, shadow, ThemeColors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!universityId.trim() || !password) {
      setError('Please enter your university ID and password.');
      return;
    }

    setLoading(true);
    try {
      await login(universityId.trim(), password);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>MuGate</Text>
          <Text style={styles.tagline}>Sign in with your MU Portal credentials</Text>

          <View style={styles.form}>
            <Text style={styles.label}>University ID</Text>
            <TextInput
              style={styles.input}
              value={universityId}
              onChangeText={setUniversityId}
              placeholder="e.g. 101230014"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Portal Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="MU portal password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={loading ? 'Verifying with MU Portal...' : 'Sign In'}
              icon="log-in-outline"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
          </View>

          <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 24,
    },
    brand: {
      fontSize: 34,
      fontWeight: '800',
      color: c.primary,
      textAlign: 'center',
    },
    tagline: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    form: {
      backgroundColor: c.surface,
      borderRadius: radii.xl,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
      ...shadow(scheme),
    },
    label: {
      color: c.textMuted,
      fontSize: 14,
      marginBottom: 6,
      marginTop: 8,
    },
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 16,
    },
    error: {
      color: c.error,
      marginTop: 12,
      lineHeight: 20,
    },
    button: {
      marginTop: 20,
    },
  });
