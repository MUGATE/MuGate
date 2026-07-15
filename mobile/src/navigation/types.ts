import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type ChatStackParamList = {
  ChatMain: undefined;
};

export type ToolsStackParamList = {
  ToolsMain: undefined;
  Schedule: undefined;
  Resume: undefined;
  Capstone: undefined;
  Roadmap: undefined;
  Events: undefined;
};

export type ExploreStackParamList = {
  Companies: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Login: undefined;
  Admin: undefined;
  About: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Chat: NavigatorScreenParams<ChatStackParamList> | undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList> | undefined;
  Internships: NavigatorScreenParams<ExploreStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  Login: undefined;
};
