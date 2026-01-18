import React, { ReactNode } from 'react';
import { StyleSheet, View, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20 }) => {
    // On Android, BlurView can be resource intensive or buggy in some versions/devices.

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
