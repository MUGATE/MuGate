import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProfileStackParamList, RootStackParamList } from '../../navigation/types';
import { radii, shadow, ThemeColors } from '../../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

export function ProfileScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated, logout } = useAuth();
  const { colors, scheme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen header>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isAuthenticated ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name ?? 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.meta}>ID: {user?.universityId}</Text>
            {user?.email ? <Text style={styles.meta}>{user.email}</Text> : null}
            {user?.isAdmin ? <Text style={styles.adminBadge}>Admin</Text> : null}
          </View>
        ) : (
          <Card
            icon="person-circle-outline"
            title="Not signed in"
            subtitle="Sign in with your MU Portal credentials to unlock personalized features."
            onPress={() => rootNav.navigate('Login')}
          />
        )}

        <Text style={styles.section}>Appearance</Text>
        <Pressable style={styles.toggleRow} onPress={toggleTheme}>
          <View style={styles.toggleLeft}>
            <View style={styles.toggleIcon}>
              <Ionicons
                name={scheme === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Dark mode</Text>
              <Text style={styles.toggleSub}>
                {scheme === 'dark' ? 'On' : 'Off'} · tap to switch
              </Text>
            </View>
          </View>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#ffffff"
          />
        </Pressable>

        <Text style={styles.section}>More</Text>
        <Card
          icon="information-circle-outline"
          title="About MuGate"
          subtitle="Team and project info."
          onPress={() => navigation.navigate('About')}
        />

        {user?.isAdmin ? (
          <Card
            icon="shield-checkmark-outline"
            iconColor={colors.warning}
            title="Admin Control"
            subtitle="Manage admins and platform settings."
            onPress={() => navigation.navigate('Admin')}
          />
        ) : null}

        {isAuthenticated ? (
          <Button
            title="Sign Out"
            variant="secondary"
            icon="log-out-outline"
            onPress={handleLogout}
            style={styles.logout}
          />
        ) : (
          <Button
            title="Sign In"
            icon="log-in-outline"
            onPress={() => rootNav.navigate('Login')}
            style={styles.logout}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    userCard: {
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      padding: 20,
      marginBottom: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      ...shadow(scheme),
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: { color: c.onPrimary, fontSize: 30, fontWeight: '800' },
    name: { color: c.text, fontSize: 22, fontWeight: '800' },
    meta: { color: c.textMuted, marginTop: 4, fontSize: 14 },
    adminBadge: {
      marginTop: 10,
      backgroundColor: c.primary,
      color: c.onPrimary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radii.sm,
      overflow: 'hidden',
      fontWeight: '700',
      fontSize: 12,
    },
    section: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 16,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 12,
      ...shadow(scheme),
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center' },
    toggleIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: c.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    toggleTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    toggleSub: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    logout: { marginTop: 8, marginBottom: 32 },
  });
