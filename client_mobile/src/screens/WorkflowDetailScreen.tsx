import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Play, Settings } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import WorkflowNode from '../components/WorkflowNode';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Workflow, WorkflowNodeUI } from '../types';

import { api } from '../services/api';

const ITEM_HEIGHT = 100;

type Props = NativeStackScreenProps<RootStackParamList, 'WorkflowDetail'>;

interface DraggableItemProps {
    item: WorkflowNodeUI;
    index: number;
    isDragging: boolean;
    displacement: number;
    onDragStart: () => void;
    onDragMove: (dy: number) => void;
    onDragEnd: () => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onDragStart }) => {
    return (
        <View style={styles.itemContainer}>
            <TouchableOpacity onLongPress={onDragStart} delayLongPress={200}>
                <WorkflowNode
                    title={item.title}
                    subtitle={item.subtitle}
                    type={item.type}
                    status={item.status}
                    isStart={item.isStart}
                    isEnd={item.isEnd}
                />
                {/* TODO: Implement full drag-and-drop visuals if needed */}
            </TouchableOpacity>
        </View>
    );
};

const WorkflowDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { id, title: initialTitle, status: initialStatus } = route.params || {};
    const [data, setData] = useState<WorkflowNodeUI[]>([]);
    const [title, setTitle] = useState<string>(initialTitle || "Loading...");
    const [isActive, setIsActive] = useState<boolean>(initialStatus === 'Active');
    const [loading, setLoading] = useState<boolean>(true);

    // Drag state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (id) {
            fetchWorkflowDetails();
        }
    }, [id]);

    const fetchWorkflowDetails = async (): Promise<void> => {
        try {
            const { data: workflow, error } = await api.get<Workflow>(`/api/v2/workflows/${id}`);
            if (workflow) {
                setTitle(workflow.name);
                setIsActive(workflow.isActive);

                // Map backend nodes to mobile UI nodes
                // Backend nodes structure: { id, type, data: { label, ... } }
                // Mobile UI expects: { id, type, title, subtitle, status, isStart, isEnd }
                // We need to linearize them or just show them as a list for now
                if (workflow.nodes && Array.isArray(workflow.nodes)) {
                    const mappedNodes: WorkflowNodeUI[] = workflow.nodes.map((node, index) => ({
                        id: node.id,
                        type: mapNodeType(node.type),
                        title: node.data?.label || node.type,
                        subtitle: node.data?.description || 'No description',
                        status: 'Idle' as const, // Default status
                        isStart: index === 0, // Simplified assumption
                        isEnd: index === workflow.nodes!.length - 1 // Simplified assumption
                    }));
                    setData(mappedNodes);
                }
            } else {
                console.error("Error fetching details:", error);
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const mapNodeType = (backendType: string): 'trigger' | 'action' | 'logic' | 'db' => {
        // Map backend node types to mobile icon types
        // Example: 'webhook' -> 'trigger', 'gmail' -> 'action'
        if (backendType?.includes('trigger') || backendType?.includes('webhook')) return 'trigger';
        if (backendType?.includes('action') || backendType?.includes('gmail')) return 'action';
        return 'action'; // Default
    };

    const toggleWorkflow = async (value: boolean): Promise<void> => {
        // Optimistic update
        setIsActive(value);
        try {
            await api.post(`/api/v2/workflows/${id}/${value ? 'activate' : 'deactivate'}`);
        } catch (error) {
            console.error("Toggle error:", error);
            setIsActive(!value); // Revert on error
        }
    };

    const handleDragStart = (itemId: string): void => {
        setDraggingId(itemId);
        setScrollEnabled(false);
    };

    const handleDragMove = (_itemId: string, _dy: number): void => {
        // Placeholder
    };

    const handleDragEnd = (): void => {
        setDraggingId(null);
        setScrollEnabled(true);
    };

    const getDisplacement = (_index: number): number => 0;

    const handleDelete = (): void => {
        Alert.alert(
            "Delete Workflow",
            "Are you sure you want to delete this workflow?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/api/v2/workflows/${id}`);
                            navigation.goBack();
                        } catch (error) {
                            console.error("Delete error:", error);
                            Alert.alert("Error", "Failed to delete workflow");
                        }
                    }
                }
            ]
        );
    };

    return (
        <GradientBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? '#4ade80' : '#ef4444' }]} />
                        <Text style={styles.statusText}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={handleDelete}>
                    <Settings color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.controlBar}>
                <Text style={styles.controlLabel}>Workflow Status</Text>
                <Switch
                    value={isActive}
                    onValueChange={toggleWorkflow}
                    trackColor={{ false: "#334155", true: "#2563eb" }}
                    thumbColor={"#fff"}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (



                <ScrollView
                    scrollEnabled={scrollEnabled}
                    contentContainerStyle={styles.canvas}
                    showsVerticalScrollIndicator={false}
                >
                    {data.map((item, index) => (
                        <DraggableItem
                            key={item.id}
                            item={item}
                            index={index}
                            isDragging={draggingId === item.id}
                            displacement={getDisplacement(index)}
                            onDragStart={() => handleDragStart(item.id)}
                            onDragMove={(dy) => handleDragMove(item.id, dy)}
                            onDragEnd={handleDragEnd}
                        />
                    ))}

                    <TouchableOpacity style={styles.addNodeButton}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.addNodeGradient}
                        >
                            <Text style={styles.addNodeText}>+ Add Node</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
            <View style={styles.bottomBar}>
                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.toolBtn}>
                        <Settings color="#94a3b8" size={20} />
                        <Text style={styles.toolText}>Config</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.runButton}>
                    <LinearGradient
                        colors={['#2563eb', '#1d4ed8']}
                        style={styles.runGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Play fill="#fff" color="#fff" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.runText}>Test Run</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </GradientBackground >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBar: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    controlLabel: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
    },
    canvas: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
    },
    addNodeButton: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    addNodeGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    addNodeText: {
        color: '#fff',
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#020617',
        borderRadius: 24,
        flexDirection: 'row',
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 10,
    },
    toolbar: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: 10,
        alignItems: 'center',
    },
    toolBtn: {
        alignItems: 'center',
        marginRight: 20,
    },
    toolText: {
        color: '#94a3b8',
        fontSize: 10,
        marginTop: 2,
    },
    runButton: {
        flex: 1.5,
    },
    runGradient: {
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
    },
    runText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default WorkflowDetailScreen;
