import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatMain" component={ChatScreen} />
    </Stack.Navigator>
  );
}
