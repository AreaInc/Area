import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import { Share2, Mail, Filter, Database } from 'lucide-react-native';
import GlassCard from './GlassCard';

type IconType = 'social' | 'mail' | 'filter' | 'db';

interface WorkflowItemProps {
    title: string;
    lastRun: string;
    status?: string;
    iconType: IconType;
    initialActive?: boolean;
    onPress?: () => void;
    onToggle?: (newStatus: boolean) => void;
}

const WorkflowItem: React.FC<WorkflowItemProps> = ({
    title,
    lastRun,
    status,
    iconType,
    initialActive = true,
    onPress,
    onToggle
}) => {
    const [isActive, setIsActive] = useState<boolean>(initialActive);

    const getIcon = (): React.JSX.Element => {
        switch (iconType) {
            case 'social': return <Share2 size={20} color="#38bdf8" />;
            case 'mail': return <Mail size={20} color="#fb923c" />;
            case 'filter': return <Filter size={20} color="#94a3b8" />;
            case 'db': return <Database size={20} color="#4ade80" />;
            default: return <Share2 size={20} color="#fff" />;
        }
    };

    const getIconBg = (): string => {
        switch (iconType) {
            case 'social': return 'rgba(56, 189, 248, 0.15)'; // sky
            case 'mail': return 'rgba(251, 146, 60, 0.15)'; // orange
            case 'filter': return 'rgba(148, 163, 184, 0.15)'; // slate
            case 'db': return 'rgba(74, 222, 128, 0.15)'; // green
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    };

    const handleToggle = (): void => {
        const newStatus = !isActive;
        setIsActive(newStatus);
        onToggle?.(newStatus);
    };

    return (
        <GlassCard style={styles.container}>
            <TouchableOpacity style={styles.row} onPress={onPress}>
                <View style={[styles.iconBox, { backgroundColor: getIconBg() }]}>
                    {getIcon()}
                </View>

                <View style={styles.info}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.statusDot, { backgroundColor: status === 'Running now...' ? '#4ade80' : isActive ? '#4ade80' : '#64748b' }]} />
                        <Text style={styles.metaText}>{status || `Last run: ${lastRun}`}</Text>
                    </View>
                </View>

                <Switch
                    trackColor={{ false: "#334155", true: "#2563eb" }}
                    thumbColor={isActive ? "#fff" : "#94a3b8"}
                    ios_backgroundColor="#334155"
                    onValueChange={handleToggle}
                    value={isActive}
                />
            </TouchableOpacity>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderRadius: 20,
        padding: 2, // Slight inner padding for border effect
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    metaText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    }

});

export default WorkflowItem;
