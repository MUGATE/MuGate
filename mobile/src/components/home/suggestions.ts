import type { Ionicons } from '@expo/vector-icons';

export type HomeSuggestion = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  navigate: (nav: {
    navigate: (...args: any[]) => void;
  }) => void;
};

/** Curated tips for the home dashboard — one is picked at random per visit/refresh. */
export const HOME_SUGGESTIONS: HomeSuggestion[] = [
  {
    id: 'resume',
    icon: 'document-text-outline',
    iconColor: '#10b981',
    title: 'Enhance your resume',
    subtitle: 'Analyze your CV and get concrete improvements before applying.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Resume' } }),
  },
  {
    id: 'capstone-idea',
    icon: 'bulb-outline',
    iconColor: '#f59e0b',
    title: 'Start a capstone idea',
    subtitle: 'Browse project ideas and get AI help shaping your proposal.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Capstone' } }),
  },
  {
    id: 'capstone-partner',
    icon: 'people-outline',
    iconColor: '#8b5cf6',
    title: 'Find a capstone partner',
    subtitle: 'Match with classmates who share your interests and skills.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Capstone' } }),
  },
  {
    id: 'schedule',
    icon: 'calendar-number-outline',
    iconColor: '#3b82f6',
    title: 'Build your schedule',
    subtitle: 'Generate an optimized timetable around your preferences.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Schedule' } }),
  },
  {
    id: 'muchat',
    icon: 'chatbubbles-outline',
    iconColor: '#2563eb',
    title: 'Ask MuChat',
    subtitle: 'Get quick answers about courses, policies, and campus life.',
    navigate: (nav) => nav.navigate('Tabs', { screen: 'Chat' }),
  },
  {
    id: 'internships',
    icon: 'briefcase-outline',
    iconColor: '#f59e0b',
    title: 'Explore internships',
    subtitle: 'Browse companies and read reviews from other MU students.',
    navigate: (nav) =>
      nav.navigate('Tabs', {
        screen: 'Internships',
        params: { screen: 'Companies' },
      }),
  },
  {
    id: 'events',
    icon: 'calendar-outline',
    iconColor: '#ec4899',
    title: 'Check upcoming events',
    subtitle: 'Discover tech talks and workshops happening around Lebanon.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Events' } }),
  },
  {
    id: 'roadmap',
    icon: 'map-outline',
    iconColor: '#06b6d4',
    title: 'Plan your degree roadmap',
    subtitle: 'Map out semesters and stay on track toward graduation.',
    navigate: (nav) =>
      nav.navigate('Tabs', { screen: 'Tools', params: { screen: 'Roadmap' } }),
  },
];

export function pickRandomSuggestion(excludeId?: string): HomeSuggestion {
  const pool =
    excludeId != null
      ? HOME_SUGGESTIONS.filter((s) => s.id !== excludeId)
      : HOME_SUGGESTIONS;
  const list = pool.length > 0 ? pool : HOME_SUGGESTIONS;
  return list[Math.floor(Math.random() * list.length)];
}
