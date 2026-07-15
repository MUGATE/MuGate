import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  /**
   * When the screen sits under a native stack header, the header already
   * consumes the top inset. Pass `header` to drop the top safe-area edge and
   * avoid a doubled gap / content overlap.
   */
  header?: boolean;
  edges?: Edge[];
};

export function Screen({ children, style, padded = true, header = false, edges }: ScreenProps) {
  const { colors } = useTheme();
  const resolvedEdges: Edge[] =
    edges ?? (header ? ['left', 'right'] : ['top', 'left', 'right']);
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }, style]}
      edges={resolvedEdges}
    >
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

export function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <Screen padded={false}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
