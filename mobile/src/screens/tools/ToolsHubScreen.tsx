import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useTheme } from '../../context/ThemeContext';
import { ToolsStackParamList } from '../../navigation/types';
import { ThemeColors } from '../../theme/colors';

type Props = NativeStackScreenProps<ToolsStackParamList, 'ToolsMain'>;

export function ToolsHubScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Screen header>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Academic and career tools</Text>
        <Card
          icon="calendar-number-outline"
          iconColor="#8b5cf6"
          title="Schedule Generator"
          subtitle="Generate optimized course schedules."
          onPress={() => navigation.navigate('Schedule')}
        />
        <Card
          icon="document-text-outline"
          iconColor="#10b981"
          title="Resume Enhancer"
          subtitle="Analyze, build, and export your CV."
          onPress={() => navigation.navigate('Resume')}
        />
        <Card
          icon="bulb-outline"
          iconColor="#f59e0b"
          title="Capstone"
          subtitle="Ideas, partners, and AI advisor."
          onPress={() => navigation.navigate('Capstone')}
        />
        <Card
          icon="map-outline"
          iconColor="#06b6d4"
          title="Degree Roadmap"
          subtitle="Plan your semesters visually."
          onPress={() => navigation.navigate('Roadmap')}
        />
        <Card
          icon="calendar-outline"
          iconColor="#ec4899"
          title="Events"
          subtitle="Tech events around Lebanon."
          onPress={() => navigation.navigate('Events')}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    subtitle: {
      color: c.textMuted,
      marginBottom: 16,
      marginTop: 8,
      fontSize: 15,
    },
  });
