import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AboutScreen } from '../screens/about/AboutScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfileStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
    </Stack.Navigator>
  );
}
