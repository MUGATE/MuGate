import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getAcademicSummary, syncHistory } from '../../api/historyApi';
import { GpaGauge } from '../../components/home/GpaGauge';
import { SuggestionCard } from '../../components/home/SuggestionCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/types';
import { ThemeColors } from '../../theme/colors';
import {
  HomeSuggestion,
  pickRandomSuggestion,
} from '../../components/home/suggestions';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated, updateGpa } = useAuth();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [gpa, setGpa] = useState<number | null>(user?.gpa ?? null);
  const [loadingGpa, setLoadingGpa] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestion, setSuggestion] = useState<HomeSuggestion>(() =>
    pickRandomSuggestion()
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setGpa(null);
      return;
    }
    if (user?.gpa != null) setGpa(user.gpa);
  }, [isAuthenticated, user?.gpa]);

  const loadSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingGpa(true);
    try {
      const summary = await getAcademicSummary();
      setGpa(summary.gpa);
      await updateGpa(summary.gpa);
    } catch {
      // Keep seeded/cached GPA if summary fetch fails
    } finally {
      setLoadingGpa(false);
    }
  }, [isAuthenticated, updateGpa]);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary])
  );

  const onRefresh = useCallback(async () => {
    setSuggestion(pickRandomSuggestion(suggestion.id));
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        setLoadingGpa(true);
        try {
          const summary = await syncHistory();
          if (summary) {
            setGpa(summary.gpa);
            await updateGpa(summary.gpa);
          } else {
            await loadSummary();
          }
        } catch {
          await loadSummary();
        } finally {
          setLoadingGpa(false);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, loadSummary, suggestion.id, updateGpa]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <SafeAreaView edges={['top']}>
            <Text style={styles.brand}>MuGate</Text>
            <Text style={styles.greeting}>
              {isAuthenticated
                ? `Welcome, ${user?.name ?? 'Student'}`
                : 'Your MU student companion'}
            </Text>
            <Text style={styles.heroSub}>
              Your academic snapshot and a nudge toward what to do next.
            </Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.section}>Your GPA</Text>
          <GpaGauge
            gpa={isAuthenticated ? gpa : null}
            isAuthenticated={isAuthenticated}
            loading={loadingGpa && gpa == null}
            onSignIn={() => navigation.navigate('Login')}
          />

          {isAuthenticated && loadingGpa && gpa != null ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Refreshing from portal…</Text>
            </View>
          ) : null}

          <Text style={styles.section}>Suggested for you</Text>
          <SuggestionCard
            suggestion={suggestion}
            onPress={() => suggestion.navigate(navigation)}
          />

          <View style={styles.footer}>
            <Ionicons name="server-outline" size={12} color={colors.textMuted} />
            <Text style={styles.apiHint}>
              {scheme === 'dark' ? 'Dark' : 'Light'} theme · pull to refresh
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 32 },
    hero: {
      paddingHorizontal: 20,
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    brand: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      opacity: 0.85,
      marginTop: 8,
    },
    greeting: {
      color: '#ffffff',
      fontSize: 26,
      fontWeight: '800',
      marginTop: 6,
    },
    heroSub: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    content: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    section: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 8,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      marginTop: -4,
    },
    loadingText: {
      fontSize: 12,
      color: c.textMuted,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 20,
    },
    apiHint: {
      fontSize: 11,
      color: c.textMuted,
    },
  });
