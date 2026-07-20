import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Company,
  getCompanies,
  getCompanyReviews,
  getCompanyStats,
  Review,
  submitReview,
} from '../../api/internshipApi';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radii, shadow, ThemeColors } from '../../theme/colors';
import TouchLogo from '../../assets/internship-logos/touch.png';
import YoubeeLogo from '../../assets/internship-logos/Youbee ai.png';
import WhishLogo from '../../assets/internship-logos/Whish Money.png';
import XpertBotLogo from '../../assets/internship-logos/XpertBot.png';
import IDSLogo from '../../assets/internship-logos/IDS.png';
import FortyTwoBeirutLogo from '../../assets/internship-logos/42 Beirut.png';
import AlMaarefLogo from '../../assets/internship-logos/Al Maaref.png';
import BrainketsLogo from '../../assets/internship-logos/Brainkets.png';
import DynasoftLogo from '../../assets/internship-logos/Dynasoft.png';
import EktidarLogo from '../../assets/internship-logos/Ektidar.png';
import NeruosLogo from '../../assets/internship-logos/Neruos.png';
import SemicolonLogo from '../../assets/internship-logos/Semicolon.png';
import SoftaviaLogo from '../../assets/internship-logos/Softavia.png';
import VanriseLogo from '../../assets/internship-logos/Vanrise.png';

const COMPANY_DOMAIN_FALLBACKS: Record<string, string> = {
  touch: 'touch.com.lb',
  'youbee ai': 'youbee.ai',
  'whish money': 'whish.money',
  xpertbot: 'xpertbotacademy.com',
  ids: 'ids.com.lb',
  '42 beirut': '42beirut.com',
  'al maaref': 'almaaref.edu.lb',
  brainkets: 'brainkets.com',
  dynasoft: 'dynasoft.com.lb',
  ektidar: 'ektidar.com',
  neruos: 'neruos.com',
  semicolon: 'semicolon.academy',
  softavia: 'softavia.com',
  vanrise: 'vanrise.com',
};

const LOCAL_LOGO_MAP: Record<string, ImageSourcePropType> = {
  touch: TouchLogo,
  'youbee ai': YoubeeLogo,
  'whish money': WhishLogo,
  xpertbot: XpertBotLogo,
  ids: IDSLogo,
  '42 beirut': FortyTwoBeirutLogo,
  'al maaref': AlMaarefLogo,
  brainkets: BrainketsLogo,
  dynasoft: DynasoftLogo,
  ektidar: EktidarLogo,
  neruos: NeruosLogo,
  semicolon: SemicolonLogo,
  softavia: SoftaviaLogo,
  vanrise: VanriseLogo,
};

export function InternshipsScreen() {
  const { isAuthenticated } = useAuth();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Record<number, { avgRating: number; reviewCount: number }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [logoFailures, setLogoFailures] = useState<Record<number, number>>({});
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const aStat = stats[a.id];
      const bStat = stats[b.id];
      if (!aStat && !bStat) return a.name.localeCompare(b.name);
      if (!aStat) return 1;
      if (!bStat) return -1;
      if (bStat.avgRating !== aStat.avgRating) return bStat.avgRating - aStat.avgRating;
      if (bStat.reviewCount !== aStat.reviewCount) return bStat.reviewCount - aStat.reviewCount;
      return a.name.localeCompare(b.name);
    });
  }, [companies, stats]);

  useEffect(() => {
    (async () => {
      try {
        const [list, statList] = await Promise.all([getCompanies(), getCompanyStats()]);
        const map: Record<number, { avgRating: number; reviewCount: number }> = {};
        statList.forEach((s) => {
          const raw = s as {
            companyId: number;
            avgRating?: number;
            avgrating?: number;
            reviewCount?: number;
            reviewcount?: number;
          };
          const avgRating = Number(raw.avgRating ?? raw.avgrating);
          const reviewCount = Number(raw.reviewCount ?? raw.reviewcount);
          if (!Number.isFinite(avgRating) || !Number.isFinite(reviewCount)) return;
          map[raw.companyId] = { avgRating, reviewCount };
        });
        setCompanies(list);
        setStats(map);
        setLogoFailures({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCompany = async (company: Company) => {
    setSelected(company);
    setRating(5);
    const list = await getCompanyReviews(company.id);
    setReviews(list);
  };

  const handleSubmitReview = async () => {
    if (!selected || !isAuthenticated) {
      rootNav.navigate('Login');
      return;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }
    await submitReview(selected.id, rating, feedback);
    const list = await getCompanyReviews(selected.id);
    setReviews(list);
    const avgRating = list.reduce((sum, review) => sum + review.rating, 0) / list.length;
    setStats((prev) => ({
      ...prev,
      [selected.id]: { avgRating, reviewCount: list.length },
    }));
    setFeedback('');
  };

  const openLink = async (url: string, label: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Cannot open', `No app available to open ${label}.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Cannot open', `Failed to open ${label}.`);
    }
  };

  const hasContact = !!(selected?.email || selected?.phone || selected?.website);
  const normalizeWebsite = (site: string) =>
    /^https?:\/\//i.test(site) ? site : `https://${site}`;
  const isLogoUri = (value?: string) =>
    !!value && (/^data:image\//i.test(value) || /^https?:\/\//i.test(value));
  const getLogoSources = (company: Company): ImageSourcePropType[] => {
    const sources: ImageSourcePropType[] = [];
    const nameKey = company.name.trim().toLowerCase();
    const svgKey = (company.svgString ?? '').trim().toLowerCase();
    const mappedLocal = LOCAL_LOGO_MAP[svgKey] ?? LOCAL_LOGO_MAP[nameKey];
    if (mappedLocal) sources.push(mappedLocal);
    if (isLogoUri(company.svgString)) sources.push({ uri: company.svgString as string });

    let domain = '';
    if (company.website) {
      const normalized = normalizeWebsite(company.website);
      try {
        domain = new URL(normalized).hostname.replace(/^www\./i, '');
      } catch {
        domain = '';
      }
    }
    if (!domain && company.email?.includes('@')) {
      domain = company.email.split('@')[1].toLowerCase();
    }
    if (!domain) {
      const key = svgKey || nameKey;
      domain = COMPANY_DOMAIN_FALLBACKS[key] ?? '';
    }
    if (!domain) return sources;

    try {
      sources.push({ uri: `https://logo.clearbit.com/${domain}?size=128` });
      sources.push({ uri: `https://icons.duckduckgo.com/ip3/${domain}.ico` });
      sources.push({ uri: `https://www.google.com/s2/favicons?sz=128&domain=${domain}` });
    } catch {
      return sources;
    }
    return sources;
  };

  if (loading) {
    return (
      <Screen padded={false} header>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} header>
      <FlatList
        data={sortedCompanies}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No companies available yet.</Text>}
        renderItem={({ item }) => {
          const stat = stats[item.id];
          const logoSources = getLogoSources(item);
          const logoIndex = logoFailures[item.id] ?? 0;
          const logoSource = logoSources[logoIndex];
          return (
            <Pressable style={styles.card} onPress={() => openCompany(item)}>
              <View style={styles.cardHeader}>
                {logoSource ? (
                  <Image
                    source={logoSource}
                    style={styles.logo}
                    resizeMode="contain"
                    onError={() =>
                      setLogoFailures((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))
                    }
                  />
                ) : (
                  <View style={styles.logoFallback}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.headerText}>
                  <Text style={styles.name}>{item.name}</Text>
                  {stat && typeof stat.avgRating === 'number' ? (
                    <Text style={styles.rating}>
                      ★ {stat.avgRating.toFixed(1)} ({stat.reviewCount} reviews)
                    </Text>
                  ) : null}
                </View>
              </View>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <Screen>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.modalDesc}>{selected?.description}</Text>

            {hasContact ? (
              <>
                <Text style={styles.section}>Contact</Text>
                {selected?.email ? (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => openLink(`mailto:${selected.email}`, 'email')}
                  >
                    <Ionicons name="mail-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selected.email}</Text>
                  </Pressable>
                ) : null}
                {selected?.phone ? (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => openLink(`tel:${selected.phone?.replace(/\s+/g, '')}`, 'phone')}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selected.phone}</Text>
                  </Pressable>
                ) : null}
                {selected?.website ? (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => openLink(normalizeWebsite(selected.website as string), 'website')}
                  >
                    <Ionicons name="globe-outline" size={18} color={colors.primary} />
                    <Text style={styles.contactText}>{selected.website}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            <Text style={styles.section}>Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={styles.empty}>No reviews yet. Be the first!</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.review}>
                  <Text style={styles.reviewRating}>★ {r.rating}</Text>
                  <Text style={styles.reviewText}>{r.feedback}</Text>
                </View>
              ))
            )}

            <Text style={styles.section}>Add a review</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} style={styles.starButton}>
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={30}
                    color={colors.warning}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.starLabel}>Selected: {rating}/5</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Your feedback..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Button title="Submit Review" icon="send" onPress={handleSubmitReview} />
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setSelected(null)}
              style={styles.close}
            />
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    loader: { marginTop: 60 },
    list: { padding: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow(scheme),
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
    },
    logoFallback: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    headerText: { flex: 1 },
    name: { color: c.text, fontSize: 18, fontWeight: '700' },
    rating: { color: c.warning, marginTop: 6, fontWeight: '600' },
    desc: { color: c.textMuted, marginTop: 8, lineHeight: 20 },
    modalTitle: { color: c.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
    modalDesc: { color: c.textMuted, marginTop: 8, lineHeight: 22 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    contactText: { color: c.text, fontSize: 14, flex: 1 },
    section: {
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 12,
    },
    review: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      padding: 12,
      marginBottom: 8,
    },
    reviewRating: { color: c.warning, fontWeight: '700' },
    reviewText: { color: c.text, marginTop: 4, lineHeight: 20 },
    starRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    starButton: { paddingVertical: 4, paddingHorizontal: 2 },
    starLabel: { color: c.textMuted, marginBottom: 12, fontWeight: '600' },
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      padding: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    empty: { color: c.textMuted, marginTop: 8 },
    close: { marginTop: 12, marginBottom: 32 },
  });
