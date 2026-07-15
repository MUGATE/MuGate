import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InternshipsScreen } from '../screens/internships/InternshipsScreen';
import { ExploreStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Companies"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Companies"
        component={InternshipsScreen}
        options={{ title: 'Internships' }}
      />
    </Stack.Navigator>
  );
}
