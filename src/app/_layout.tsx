import {
  Slot,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import {
  View,
} from 'react-native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import AppHeader from '@/components/AppHeader';
import AuthNavigation from '@/components/AuthNavigation';
import { AuthProvider } from '../context/AuthContext';
import { LayoutProvider } from '../context/LayoutContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
        <LayoutProvider>

            <AuthNavigation />

            <View style={{ flex: 1 }}>
                <AnimatedSplashOverlay />

                <AppHeader />

                <Slot />

                <AppTabs />
            </View>

        </LayoutProvider>
    </AuthProvider>
</SafeAreaProvider>
  );
}