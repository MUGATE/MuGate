import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import {
  ChatMessage,
  ChatSession,
  createSession,
  deleteSession,
  getSessionMessages,
  getSessions,
  sendMessage,
} from '../../api/chatbotApi';
import { Button } from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { radii, ThemeColors } from '../../theme/colors';

export function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const markdownStyles = useMemo(
    () => ({
      body: { color: colors.text, fontSize: 15, lineHeight: 22 },
      paragraph: { marginTop: 0, marginBottom: 8 },
    }),
    [colors]
  );
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const baselineHeight = Dimensions.get('window').height;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      const kb = e.endCoordinates?.height ?? 0;
      const shrunk = Math.max(0, baselineHeight - Dimensions.get('window').height);
      // OEM fallback: only pad when resize did not absorb most of the keyboard
      setAndroidKeyboardHeight(shrunk < kb * 0.5 ? Math.max(0, kb - shrunk) : 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const list = await getSessions();
      setSessions(list);
      if (!activeSession && list.length > 0) {
        setActiveSession(list[0]);
      }
    } catch {
      setSessions([]);
    }
  }, [activeSession]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const msgs = await getSessionMessages(sessionId);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadSessions().finally(() => setLoading(false));
  }, [loadSessions]);

  useEffect(() => {
    if (!activeSession) return;
    loadMessages(activeSession.id);
  }, [activeSession, loadMessages]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const handleNewChat = async () => {
    const session = await createSession('New Chat');
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    setDrawerOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    let session = activeSession;
    if (!session) {
      session = await createSession('New Chat');
      setActiveSession(session);
      setSessions((prev) => [session!, ...prev]);
    }

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: userText },
    ]);
    scrollToEnd();
    setSending(true);
    try {
      const res = await sendMessage(session.id, userText);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: res.text },
      ]);
      await loadSessions();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Failed to send message.',
        },
      ]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const handleDelete = async (sessionId: string) => {
    await deleteSession(sessionId);
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSession?.id === sessionId) {
      setActiveSession(remaining[0] ?? null);
      setMessages([]);
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeSession?.title ?? 'MuChat'}
        </Text>
        <Pressable onPress={handleNewChat} style={styles.newBtn} hitSlop={8}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.newText}>New</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={[styles.flex, androidKeyboardHeight > 0 && { paddingBottom: androidKeyboardHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {item.role === 'assistant' ? (
                  <Markdown style={markdownStyles}>{item.content}</Markdown>
                ) : (
                  <Text style={styles.userText}>{item.content}</Text>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Ask anything about MU academics or campus life.
              </Text>
            }
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message MuChat..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            accessibilityLabel="Send message"
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="send" size={20} color={colors.onPrimary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={drawerOpen} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>Sessions</Text>
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.sessionItem}
                  onPress={() => {
                    setActiveSession(item);
                    setDrawerOpen(false);
                  }}
                  onLongPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {item.title ?? 'Chat'}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No sessions yet.</Text>}
            />
            <Button title="Close" variant="secondary" onPress={() => setDrawerOpen(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconBtn: { paddingRight: 12 },
    headerTitle: { flex: 1, color: c.text, fontSize: 17, fontWeight: '700' },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    newText: { color: c.primary, fontWeight: '600' },
    loader: { marginTop: 40 },
    messages: { padding: 16, paddingBottom: 8, flexGrow: 1 },
    bubble: {
      borderRadius: radii.lg,
      padding: 12,
      marginBottom: 10,
      maxWidth: '90%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: c.primary,
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    userText: { color: c.onPrimary, fontSize: 15, lineHeight: 22 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    drawerOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    drawer: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: 20,
      maxHeight: '70%',
    },
    drawerTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    sessionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    sessionTitle: { color: c.text, fontSize: 16, flex: 1 },
  });
