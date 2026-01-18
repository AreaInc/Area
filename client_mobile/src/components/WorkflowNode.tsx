import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Hexagon, Database, Mail, MessageSquare, MoreVertical, GitBranch } from 'lucide-react-native';

type NodeType = 'trigger' | 'action' | 'logic' | 'db';
type NodeStatus = 'success' | 'error' | 'waiting' | 'Idle';

interface WorkflowNodeProps {
    type: NodeType;
    title: string;
    subtitle: string;
    status: NodeStatus;
    isStart?: boolean;
    isEnd?: boolean;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
    type,
    title,
    subtitle,
    status,
    isStart = false,
    isEnd = false
}) => {

    const getIcon = (): React.JSX.Element => {
        switch (type) {
            case 'trigger': return <Hexagon size={24} color="#f472b6" fill="#f472b6" fillOpacity={0.2} />;
            case 'action': return <Mail size={24} color="#38bdf8" />;
            case 'logic': return <GitBranch size={24} color="#fb923c" />;
            case 'db': return <Database size={24} color="#4ade80" />;
            default: return <MessageSquare size={24} color="#94a3b8" />;
        }
    };

    const statusColor = status === 'success' ? '#4ade80' : status === 'error' ? '#ef4444' : '#64748b';

    const NodeContent: React.FC = () => (
        <View style={styles.inner}>
            <View style={styles.iconContainer}>
                {getIcon()}
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.meta}>
                <MoreVertical size={20} color="#64748b" />
            </View>
        </View>
    );

    const Container = Platform.OS === 'android' ? View : BlurView;
    const containerProps = Platform.OS === 'android'
        ? { style: [styles.card, styles.androidCard] }
        : { intensity: 60, tint: "dark" as const, style: styles.card };

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            {!isStart && <View style={[styles.line, { height: 20 }]} />}

            <Container {...containerProps}>
                <NodeContent />
                {/* Status Indicator */}
                <View style={[styles.statusLine, { backgroundColor: statusColor }]} />
            </Container>

            {!isEnd && <View style={[styles.line, { height: 20 }]} />}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        width: '100%',
    },
    line: {
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    card: {
        width: '100%',
        height: 80,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 41, 59, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        position: 'relative',
    },
    androidCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        height: '100%',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 12,
    },
    meta: {},
    statusLine: {
        position: 'absolute',
        left: 0,
        top: 20,
        bottom: 20,
        width: 4,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
});

export default WorkflowNode;
