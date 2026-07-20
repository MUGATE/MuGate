import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const maxWait = setTimeout(() => {
      if (!cancelled) setAssetsReady(true);
    }, 4000);

    (async () => {
      try {
        await Asset.loadAsync([
          require('./assets/splash-icon.png'),
          require('./assets/icon.png'),
        ]);
      } catch {
        // Still hide splash if asset prefetch fails
      } finally {
        if (!cancelled) setAssetsReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(maxWait);
    };
  }, []);

  const hideSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isLoading && assetsReady) {
      hideSplash();
    }
  }, [isLoading, assetsReady, hideSplash]);

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SplashGate>
            <ThemedStatusBar />
            <RootNavigator />
          </SplashGate>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
