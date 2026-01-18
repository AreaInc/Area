import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Activity } from 'lucide-react-native';

interface StatsCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: 'zap' | 'activity';
    trend?: string;
    colors?: [string, string, ...string[]];
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, colors }) => {
    const IconComponent = icon === 'zap' ? Zap : Activity;

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={colors || ['#1e293b', '#0f172a']} // Default dark gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <IconComponent color="#fff" size={18} />
                    </View>
                    {trend && <Text style={styles.trend}>{trend}</Text>}
                </View>
                <View style={styles.content}>
                    <Text style={styles.value}>{value}</Text>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderRadius: 24,
        margin: 6,
    },
    container: {
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        height: 140,
        justifyContent: 'space-between'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trend: {
        color: '#4ade80', // green-400
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        marginTop: 10
    },
    value: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    title: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default StatsCard;
