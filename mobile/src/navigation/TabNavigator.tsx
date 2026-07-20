import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatStack } from './ChatStack';
import { ExploreStack } from './ExploreStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { ToolsStack } from './ToolsStack';
import { RootTabParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_BAR_CONTENT_HEIGHT = 56;

const ICONS: Record<keyof RootTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Tools: { active: 'construct', inactive: 'construct-outline' },
  Internships: { active: 'briefcase', inactive: 'briefcase-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
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
