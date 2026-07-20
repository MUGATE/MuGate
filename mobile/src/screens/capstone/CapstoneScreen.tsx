import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';
import {
  addPartner,
  chatWithAI,
  deletePartner,
  getIdeas,
  getPartners,
} from '../../api/capstoneApi';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { SignInGate } from '../../components/SignInGate';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/types';
import { radii, ThemeColors } from '../../theme/colors';

type Tab = 'ideas' | 'partners' | 'ai';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type CapstoneIdea = {
  id?: number;
  title: string;
  description: string;
  faculty?: string;
  year?: number;
  tags?: string;
};

type CapstonePartner = {
  id?: number;
  userId?: string;
  userName: string;
  email: string;
  phone?: string;
  major?: string;
  skills?: string;
  description: string;
  lookingFor?: string;
};

type PartnerFormData = {
  userName: string;
  email: string;
  phone: string;
  major: string;
  skills: string;
  description: string;
  lookingFor: string;
};

const EMPTY_PARTNER_FORM: PartnerFormData = {
  userName: '',
  email: '',
  phone: '',
  major: 'Computer Science',
  skills: '',
  description: '',
  lookingFor: '',
};

function IdeaCard({ idea, styles }: { idea: CapstoneIdea; styles: ReturnType<typeof makeStyles> }) {
  const tags = idea.tags
    ? idea.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{idea.title}</Text>
      {(idea.faculty || idea.year) ? (
        <View style={styles.metaRow}>
          {idea.year ? (
            <View style={styles.metaBadge}>
              <Ionicons name="calendar-outline" size={12} color={styles.metaText.color} />
              <Text style={styles.metaText}>{idea.year}</Text>
            </View>
          ) : null}
          {idea.faculty ? (
            <View style={[styles.metaBadge, styles.facultyBadge]}>
              <Text style={styles.facultyText}>{idea.faculty}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {idea.description ? <Text style={styles.cardDesc}>{idea.description}</Text> : null}
      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PartnerCard({
  partner,
  styles,
  colors,
  canDelete,
  onDelete,
}: {
  partner: CapstonePartner;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
  canDelete: boolean;
  onDelete?: () => void;
}) {
  const skills = partner.skills
    ? partner.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.partnerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {partner.userName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.partnerInfo}>
          <Text style={styles.cardTitle}>{partner.userName}</Text>
          {partner.major ? (
            <View style={styles.majorRow}>
              <Ionicons name="school-outline" size={13} color={colors.textMuted} />
              <Text style={styles.majorText}>{partner.major}</Text>
            </View>
          ) : null}
        </View>
        {canDelete && onDelete ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        ) : null}
      </View>

      {partner.description ? <Text style={styles.cardDesc}>{partner.description}</Text> : null}

      {skills.length > 0 ? (
        <View style={styles.tagRow}>
          {skills.map((skill, i) => (
            <View key={i} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {partner.lookingFor ? (
        <View style={styles.lookingFor}>
          <Text style={styles.lookingForLabel}>Looking for: </Text>
          <Text style={styles.lookingForText}>{partner.lookingFor}</Text>
        </View>
      ) : null}

      <View style={styles.contactRow}>
        {partner.email ? (
          <Pressable style={styles.contactLink} onPress={() => openLink(`mailto:${partner.email}`)}>
            <Ionicons name="mail-outline" size={14} color={colors.primary} />
            <Text style={styles.contactText}>{partner.email}</Text>
          </Pressable>
        ) : null}
        {partner.phone ? (
          <Pressable
            style={styles.contactLink}
            onPress={() => openLink(`tel:${partner.phone?.replace(/\s+/g, '')}`)}
          >
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text style={styles.contactText}>{partner.phone}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function CapstoneScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAdmin = user?.isAdmin === true;
  const markdownStyles = useMemo(
    () => ({
      body: { color: colors.text, fontSize: 15, lineHeight: 22 },
      paragraph: { marginTop: 0, marginBottom: 8 },
    }),
    [colors]
  );

  const [tab, setTab] = useState<Tab>('ideas');
  const [ideas, setIdeas] = useState<CapstoneIdea[]>([]);
  const [partners, setPartners] = useState<CapstonePartner[]>([]);
  const [search, setSearch] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState<PartnerFormData>(EMPTY_PARTNER_FORM);
  const [partnerFormError, setPartnerFormError] = useState('');
  const [submittingPartner, setSubmittingPartner] = useState(false);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      setIdeas((await getIdeas(search)) as CapstoneIdea[]);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      setPartners((await getPartners(search)) as CapstonePartner[]);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    if (!isAuthenticated) {
      rootNav.navigate('Login');
      return;
    }
    const text = aiMessage.trim();
    if (!text || aiLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...aiMessages, userMsg];
    setAiMessages(updatedMessages);
    setAiMessage('');
    setAiLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const res = await chatWithAI(text, history);
      setAiMessages((prev) => [...prev, { role: 'assistant', content: res.text }]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Failed to reach the advisor.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiChat = () => {
    setAiMessages([]);
    setAiMessage('');
  };

  const openAddPartner = () => {
    if (!isAuthenticated) {
      rootNav.navigate('Login');
      return;
    }
    setPartnerForm({
      ...EMPTY_PARTNER_FORM,
      email: isAdmin ? '' : (user?.email || ''),
    });
    setPartnerFormError('');
    setShowAddPartner(true);
  };

  const handleAddPartner = async () => {
    if (!isAuthenticated) {
      rootNav.navigate('Login');
      return;
    }
    setPartnerFormError('');
    setSubmittingPartner(true);
    try {
      const email = (isAdmin ? partnerForm.email : user?.email || '').trim();
      const description =
        partnerForm.description.trim() || 'Looking for a capstone partner';
      const payload = {
        email,
        major: partnerForm.major.trim() || 'Computer Science',
        description,
        phone: partnerForm.phone.trim() || undefined,
        skills: partnerForm.skills.trim() || undefined,
        lookingFor: partnerForm.lookingFor.trim() || undefined,
        userName: isAdmin && partnerForm.userName.trim() ? partnerForm.userName.trim() : undefined,
      };
      await addPartner(payload);
      setShowAddPartner(false);
      setPartnerForm(EMPTY_PARTNER_FORM);
      await loadPartners();
    } catch (err) {
      setPartnerFormError(err instanceof Error ? err.message : 'Failed to add partner listing.');
    } finally {
      setSubmittingPartner(false);
    }
  };

  const handleDeletePartner = (partner: CapstonePartner) => {
    if (!partner.id) return;
    Alert.alert(
      isAdmin ? 'Remove listing' : 'Remove your listing',
      isAdmin
        ? `Remove ${partner.userName}'s partner listing?`
        : 'Remove your partner listing from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePartner(partner.id!);
              await loadPartners();
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to delete listing.'
              );
            }
          },
        },
      ]
    );
  };

  const canDeletePartner = (partner: CapstonePartner) =>
    isAdmin || (!!user?.userId && partner.userId === user.userId);

  return (
    <Screen header>
      <View style={styles.tabs}>
        {(['ideas', 'partners', 'ai'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              setTab(t);
              if (t === 'ideas') loadIdeas();
              if (t === 'partners' && isAuthenticated) loadPartners();
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'ai' ? 'AI Advisor' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'partners' && !isAuthenticated ? (
        <SignInGate
          message="Sign in to browse and list capstone partners."
          wrapScreen={false}
        />
      ) : tab === 'ai' && !isAuthenticated ? (
        <SignInGate
          message="Sign in to use the capstone AI advisor."
          wrapScreen={false}
        />
      ) : tab !== 'ai' ? (
        <>
          {tab === 'partners' ? (
            <Button
              title={isAdmin ? 'Add Partner' : 'Add Myself'}
              icon="person-add-outline"
              onPress={openAddPartner}
              style={styles.addPartnerBtn}
            />
          ) : null}
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={tab === 'ideas' ? loadIdeas : loadPartners}
            returnKeyType="search"
          />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={tab === 'ideas' ? ideas : partners}
              keyExtractor={(item, i) => String('id' in item && item.id != null ? item.id : i)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) =>
                tab === 'ideas' ? (
                  <IdeaCard idea={item as CapstoneIdea} styles={styles} />
                ) : (
                  <PartnerCard
                    partner={item as CapstonePartner}
                    styles={styles}
                    colors={colors}
                    canDelete={canDeletePartner(item as CapstonePartner)}
                    onDelete={() => handleDeletePartner(item as CapstonePartner)}
                  />
                )
              }
              ListEmptyComponent={
                <Text style={styles.empty}>Tap search or switch tabs to load data.</Text>
              }
            />
          )}
        </>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.aiScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.aiHint}>
              Trained on MU's historical CSC 499 capstone projects. Describe your interests and
              the advisor will suggest relevant past projects and new directions.
            </Text>

            {aiMessages.length > 0 ? (
              <Pressable style={styles.clearChatBtn} onPress={clearAiChat}>
                <Text style={styles.clearChatText}>Clear conversation</Text>
              </Pressable>
            ) : null}

            {aiMessages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatBubble,
                  msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                ]}
              >
                {msg.role === 'assistant' ? (
                  <Markdown style={markdownStyles}>{msg.content}</Markdown>
                ) : (
                  <Text style={styles.chatUserText}>{msg.content}</Text>
                )}
              </View>
            ))}

            {aiLoading ? (
              <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            ) : null}

            <TextInput
              style={[styles.search, styles.aiInput]}
              value={aiMessage}
              onChangeText={setAiMessage}
              placeholder="Ask the capstone advisor..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Button
              title={aiLoading ? 'Thinking...' : 'Ask AI'}
              icon="sparkles-outline"
              onPress={askAI}
              loading={aiLoading}
              disabled={!aiMessage.trim()}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <Modal visible={showAddPartner} animationType="slide" onRequestClose={() => setShowAddPartner(false)}>
        <Screen>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formTitle}>
                {isAdmin ? 'Add Partner Listing' : 'Add Yourself to the Partner List'}
              </Text>

              {isAdmin ? (
                <>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={partnerForm.userName}
                    onChangeText={(v) => setPartnerForm((p) => ({ ...p, userName: v }))}
                    placeholder="Student name"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={partnerForm.email}
                    onChangeText={(v) => setPartnerForm((p) => ({ ...p, email: v }))}
                    placeholder="student@mu.edu.lb"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </>
              ) : null}

              <Text style={styles.fieldLabel}>Phone (optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={partnerForm.phone}
                onChangeText={(v) => setPartnerForm((p) => ({ ...p, phone: v }))}
                placeholder="+961 XX XXX XXX"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Skills (optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={partnerForm.skills}
                onChangeText={(v) => setPartnerForm((p) => ({ ...p, skills: v }))}
                placeholder="e.g. React, Python, ML"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea]}
                value={partnerForm.description}
                onChangeText={(v) => setPartnerForm((p) => ({ ...p, description: v }))}
                placeholder="Describe yourself and what project you're looking for..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={styles.fieldLabel}>Looking for (optional)</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea]}
                value={partnerForm.lookingFor}
                onChangeText={(v) => setPartnerForm((p) => ({ ...p, lookingFor: v }))}
                placeholder="What kind of partner are you looking for?"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              {partnerFormError ? <Text style={styles.formError}>{partnerFormError}</Text> : null}

              <Button
                title={submittingPartner ? 'Submitting...' : 'Add to Partner List'}
                icon="checkmark-circle-outline"
                onPress={handleAddPartner}
                loading={submittingPartner}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowAddPartner(false)}
                style={styles.cancelBtn}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    tabs: { flexDirection: 'row', marginTop: 8, marginBottom: 12, gap: 8 },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
    },
    tabActive: { backgroundColor: c.primary },
    tabText: { color: c.textMuted, fontWeight: '600', fontSize: 13 },
    tabTextActive: { color: c.onPrimary },
    search: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      padding: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    loader: { marginTop: 24 },
    card: {
      backgroundColor: c.card,
      borderRadius: radii.md,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { color: c.text, fontWeight: '700', fontSize: 16 },
    cardDesc: { color: c.textMuted, marginTop: 6, lineHeight: 20 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radii.sm,
    },
    metaText: { color: c.textMuted, fontSize: 12, fontWeight: '500' },
    facultyBadge: { backgroundColor: 'rgba(81,87,217,0.1)' },
    facultyText: { color: '#5157d9', fontSize: 12, fontWeight: '600' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tag: {
      backgroundColor: c.surfaceLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.sm,
    },
    tagText: { color: c.textMuted, fontSize: 11 },
    partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.onPrimary, fontWeight: '700', fontSize: 18 },
    partnerInfo: { flex: 1 },
    majorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    majorText: { color: c.textMuted, fontSize: 13 },
    skillTag: {
      backgroundColor: 'rgba(59,130,246,0.1)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.sm,
    },
    skillTagText: { color: c.primary, fontSize: 11, fontWeight: '500' },
    lookingFor: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    lookingForLabel: { color: c.text, fontWeight: '600', fontSize: 13 },
    lookingForText: { color: c.textMuted, fontSize: 13, flex: 1 },
    contactRow: { marginTop: 12, gap: 8 },
    contactLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { color: c.primary, fontSize: 13 },
    deleteBtn: { padding: 4 },
    addPartnerBtn: { marginBottom: 12 },
    formScroll: { paddingBottom: 32 },
    formTitle: { color: c.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
    fieldLabel: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
    fieldInput: {
      backgroundColor: c.surfaceLight,
      borderRadius: radii.md,
      padding: 12,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    formError: { color: c.error, marginTop: 12, marginBottom: 4 },
    cancelBtn: { marginTop: 10 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 24 },
    aiScroll: { paddingBottom: 24 },
    aiHint: { color: c.textMuted, marginBottom: 12, lineHeight: 20 },
    aiInput: { minHeight: 110, textAlignVertical: 'top' },
    clearChatBtn: { alignSelf: 'flex-end', marginBottom: 12 },
    clearChatText: { color: c.primary, fontSize: 13, fontWeight: '600' },
    chatBubble: {
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: 14,
      marginBottom: 10,
    },
    chatBubbleUser: {
      alignSelf: 'flex-end',
      maxWidth: '92%',
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chatBubbleAssistant: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      backgroundColor: c.surfaceLight,
      borderColor: c.border,
    },
    chatUserText: { color: c.onPrimary, fontSize: 15, lineHeight: 22 },
    typingText: { color: c.textMuted, fontStyle: 'italic' },
  });
