import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import * as SecureStore from "expo-secure-store";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

// API Configuration
// Supports both EXPO_PUBLIC_API_KEY (dev) and SecureStore (production)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Configure base URL for all API requests
setBaseUrl(API_BASE_URL);

// Configure auth token getter
// Returns API key from SecureStore if available, falls back to EXPO_PUBLIC_API_KEY
setAuthTokenGetter(async () => {
  try {
    // Try SecureStore first (production/persisted token)
    const storedKey = await SecureStore.getItemAsync("api_key");
    if (storedKey) return storedKey;
  } catch {
    // SecureStore may fail in some environments (e.g., simulators without keychain)
    // Silently fall back to env var
  }
  // Fall back to build-time env var (development)
  return API_KEY ?? null;
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
