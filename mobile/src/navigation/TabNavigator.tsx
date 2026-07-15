import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChatStack } from './ChatStack';
import { ExploreStack } from './ExploreStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { ToolsStack } from './ToolsStack';
import { RootTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Tools: { active: 'construct', inactive: 'construct-outline' },
  Internships: { active: 'briefcase', inactive: 'briefcase-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const set = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? set.active : set.inactive}
              size={size}
              color={color}
            />
          );
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Chat" component={ChatStack} options={{ title: 'MuChat' }} />
      <Tab.Screen name="Tools" component={ToolsStack} />
      <Tab.Screen name="Internships" component={ExploreStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
