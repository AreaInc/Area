import React from 'react';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './src/context/AuthContext';

const queryClient = new QueryClient();

export default function App(): React.JSX.Element {
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
