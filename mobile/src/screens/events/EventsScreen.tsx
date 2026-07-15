import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EventItem, getEventCategories, getUpcomingEvents } from '../../api/eventsApi';
import { Screen } from '../../components/Screen';
import { useTheme } from '../../context/ThemeContext';
import { radii, shadow, ThemeColors } from '../../theme/colors';

export function EventsScreen() {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [list, cats] = await Promise.all([
        getUpcomingEvents({ search, category, limit: 50 }),
        getEventCategories(),
      ]);
      setEvents(list);
      setCategories(cats);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  return (
    <Screen header>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search events..."
        placeholderTextColor={colors.textMuted}
        onSubmitEditing={load}
        returnKeyType="search"
      />

      <FlatList
        horizontal
        data={['', ...categories]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Pressable onPress={() => setCategory(item)}>
            <Text style={[styles.chip, category === item && styles.chipActive]}>
              {item || 'All'}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {item.startDate || item.eventDate ? (
                <Text style={styles.meta}>
                  {new Date(item.startDate || item.eventDate!).toLocaleDateString()}
                </Text>
              ) : null}
              {item.location ? <Text style={styles.meta}>{item.location}</Text> : null}
              {item.category ? <Text style={styles.badge}>{item.category}</Text> : null}
              {item.description ? (
                <Text style={styles.desc} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No upcoming events found.</Text>}
        />
      )}
    </Screen>
  );
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    search: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 8,
      marginBottom: 12,
    },
    chips: { maxHeight: 44, marginBottom: 12 },
    chip: {
      color: c.textMuted,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: c.surfaceLight,
      borderRadius: radii.pill,
      overflow: 'hidden',
      fontWeight: '600',
    },
    chipActive: { color: c.onPrimary, backgroundColor: c.primary },
    loader: { marginTop: 40 },
    list: { paddingBottom: 24 },
    card: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow(scheme),
    },
    title: { color: c.text, fontSize: 17, fontWeight: '700' },
    meta: { color: c.textMuted, marginTop: 4, fontSize: 13 },
    badge: {
      alignSelf: 'flex-start',
      marginTop: 8,
      color: c.accent,
      fontSize: 12,
      fontWeight: '600',
    },
    desc: { color: c.textMuted, marginTop: 8, lineHeight: 20 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
  });
