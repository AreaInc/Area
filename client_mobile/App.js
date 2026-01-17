import React from 'react';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './src/context/AuthContext';
import { setApiBaseUrl } from '@area/shared';
// @ts-ignore
import { API_URL } from '@env';

const queryClient = new QueryClient();

// Inject API URL configuration
setApiBaseUrl(API_URL || "http://10.0.2.2:8080/api"); // 10.0.2.2 is localhost for Android emulator

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
