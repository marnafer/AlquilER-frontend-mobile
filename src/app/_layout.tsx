import {
  Slot
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider
} from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import AppHeader from '@/components/AppHeader';
import { AuthProvider } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
            <AnimatedSplashOverlay />

            <AppHeader />

            <Slot />

            <AppTabs />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}