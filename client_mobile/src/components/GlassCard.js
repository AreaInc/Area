import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const GlassCard = ({ children, style, intensity = 20 }) => {
    // On Android, BlurView can be resource intensive or buggy in some versions/devices.
    // We can use a semi-transparent background as a fallback or if we want a specific look.
    // For this "n8n-like" modern look, a dark semi-transparent bg matches well.

    if (Platform.OS === 'android') {
        return (
            <View style={[styles.androidContainer, style]}>
                {children}
            </View>
        )
    }

    return (
        <BlurView intensity={intensity} tint="dark" style={[styles.container, style]}>
            {children}
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 41, 59, 0.4)', // Slightly blue-ish dark tint
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    androidContainer: {
        borderRadius: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Darker fallback for Android
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
    }
});

export default GlassCard;
