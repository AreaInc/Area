import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

interface GradientBackgroundProps {
    children: ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                // Deep blue/purple gradient based on the reference
                colors={['#0F172A', '#1E1B4B', '#312E81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {children}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
});

export default GradientBackground;
