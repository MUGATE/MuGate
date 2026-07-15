import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../theme/colors';

export function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Screen header>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About MuGate</Text>
        <Text style={styles.body}>
          MuGate is an all-in-one student companion platform for Al Maaref University. It
          combines an AI academic assistant, career tooling, and university services behind a
          single authenticated portal.
        </Text>
        <Text style={styles.section}>Features</Text>
        <Text style={styles.body}>
          MuChat, Resume Enhancer, Schedule Generator, Capstone matching, Internships, Events,
          and Degree Roadmap.
        </Text>
        <Text style={styles.section}>Mobile app</Text>
        <Text style={styles.body}>
          Built with Expo and React Native — native navigation and components, connected to
          the same Express API and SQL Server database as the web app.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    title: { color: c.text, fontSize: 24, fontWeight: '800', marginBottom: 12, marginTop: 8 },
    section: {
      color: c.primary,
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
    },
    body: { color: c.textMuted, lineHeight: 22, fontSize: 15 },
  });
