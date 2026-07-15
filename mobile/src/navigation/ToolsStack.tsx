import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { CapstoneScreen } from '../screens/capstone/CapstoneScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { ResumeScreen } from '../screens/resume/ResumeScreen';
import { RoadmapScreen } from '../screens/roadmap/RoadmapScreen';
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen';
import { ToolsHubScreen } from '../screens/tools/ToolsHubScreen';
import { ToolsStackParamList } from './types';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<ToolsStackParamList>();

function toolDetailHeaderLeft(navigation: NativeStackNavigationProp<ToolsStackParamList>) {
  return (props: React.ComponentProps<typeof HeaderBackButton>) => (
    <HeaderBackButton
      {...props}
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ToolsMain');
        }
      }}
    />
  );
}

export function ToolsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="ToolsMain"
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        ...(route.name !== 'ToolsMain'
          ? { headerLeft: toolDetailHeaderLeft(navigation) }
          : {}),
      })}
    >
      <Stack.Screen
        name="ToolsMain"
        component={ToolsHubScreen}
        options={{ title: 'Tools' }}
      />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Smart Schedule' }} />
      <Stack.Screen name="Resume" component={ResumeScreen} options={{ title: 'Resume Enhancer' }} />
      <Stack.Screen name="Capstone" component={CapstoneScreen} options={{ title: 'Capstone' }} />
      <Stack.Screen name="Roadmap" component={RoadmapScreen} options={{ title: 'Degree Roadmap' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
    </Stack.Navigator>
  );
}
