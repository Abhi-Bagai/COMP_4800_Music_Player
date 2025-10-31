import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { AudioPlaybackProvider } from '@/src/components/audio-playback-provider';
import { ThemeProvider as CustomThemeProvider } from '@/src/theme/provider';
import { DragProvider } from '@/src/contexts/drag-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <View className="flex-1">
      <CustomThemeProvider initialMode="dark">
        <DragProvider>
          <ThemeProvider value={NAV_THEME["dark"]}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            <PortalHost />
            <AudioPlaybackProvider />
          </ThemeProvider>
        </DragProvider>
      </CustomThemeProvider>
    </View>
  );
}
