import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addAdmin, getAdmins, removeAdmin } from '../../api/adminApi';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radii, ThemeColors } from '../../theme/colors';

type AdminRow = {
  universityId: string;
  createdAt?: string;
  isOnline?: boolean;
};

export function AdminScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newId, setNewId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setAdmins((await getAdmins()) as AdminRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newId.trim()) return;
    try {
      await addAdmin(newId.trim());
      setNewId('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add admin.');
    }
  };

  const handleRemove = (universityId: string) => {
    if (universityId === user?.universityId) {
      Alert.alert('Action blocked', 'You cannot remove your own admin access.');
      return;
    }

    Alert.alert('Remove admin', `Remove ${universityId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeAdmin(universityId);
          await load();
        },
      },
    ]);
  };

  return (
    <Screen header>
      <Text style={styles.title}>Admin Control</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newId}
          onChangeText={setNewId}
          placeholder="University ID"
          placeholderTextColor={colors.textMuted}
        />
        <Button title="Add" icon="add" onPress={handleAdd} style={styles.addBtn} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.universityId}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.id}>{item.universityId}</Text>
                {item.isOnline ? <Text style={styles.online}>Online</Text> : null}
              </View>
              <Button
                title="Remove"
                variant="ghost"
                disabled={item.universityId === user?.universityId}
                onPress={() => handleRemove(item.universityId)}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    title: { color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 16, marginTop: 8 },
    addRow: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      padding: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    addBtn: { minWidth: 88 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    id: { color: c.text, fontSize: 16, fontWeight: '600' },
    online: { color: c.success, fontSize: 12, marginTop: 2 },
  });
