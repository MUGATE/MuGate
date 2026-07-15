import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingScreen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading } = useAuth();
  const { colors, scheme } = useTheme();

  if (isLoading) return <LoadingScreen />;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Sign In',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
