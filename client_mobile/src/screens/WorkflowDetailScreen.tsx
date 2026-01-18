import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Play, Settings, Zap, Target, Trash2 } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Workflow } from '../types';
import {
    fetchWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    deleteWorkflow,
    executeWorkflow
} from '@area/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkflowDetail'>;

const WorkflowDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { id, title: initialTitle, status: initialStatus } = route.params || {};
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [title, setTitle] = useState<string>(initialTitle || "Loading...");
    const [isActive, setIsActive] = useState<boolean>(initialStatus === 'Active');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (id) {
            loadWorkflowDetails();
        }
    }, [id]);

    const loadWorkflowDetails = async (): Promise<void> => {
        try {
            const data = await fetchWorkflow(id);
            setWorkflow(data);
            setTitle(data.name);
            setIsActive(data.isActive);
        } catch (e) {
            console.error("Fetch error:", e);
            Alert.alert("Error", "Failed to load workflow details");
        } finally {
            setLoading(false);
        }
    };

    const toggleWorkflow = async (value: boolean): Promise<void> => {
        setIsActive(value);
        try {
            if (value) {
                await activateWorkflow(id);
            } else {
                await deactivateWorkflow(id);
            }
        } catch (error) {
            console.error("Toggle error:", error);
            setIsActive(!value);
            Alert.alert("Error", "Failed to update status");
        }
    };

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
                            await deleteWorkflow(id);
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

    const handleExecute = async (): Promise<void> => {
        try {
            await executeWorkflow(id, {});
            Alert.alert("Success", "Workflow execution started!");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to execute workflow");
        }
    };

    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return 'Never';
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };

    if (loading) {
        return (
            <GradientBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? '#4ade80' : '#ef4444' }]} />
                        <Text style={styles.statusText}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 color="#ef4444" size={22} />
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

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {workflow && (
                    <>
                        {/* Description */}
                        {workflow.description && (
                            <GlassCard style={styles.card}>
                                <Text style={styles.cardLabel}>Description</Text>
                                <Text style={styles.cardValue}>{workflow.description}</Text>
                            </GlassCard>
                        )}

                        {/* Trigger Info */}
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Zap color="#f59e0b" size={20} />
                                <Text style={styles.cardTitle}>Trigger</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Provider</Text>
                                <Text style={styles.infoValue}>{workflow.triggerProvider}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Type</Text>
                                <Text style={styles.infoValue}>{workflow.triggerId}</Text>
                            </View>
                            {Object.keys(workflow.triggerConfig || {}).length > 0 && (
                                <View style={styles.configSection}>
                                    <Text style={styles.configLabel}>Config:</Text>
                                    <Text style={styles.configValue}>
                                        {JSON.stringify(workflow.triggerConfig, null, 2)}
                                    </Text>
                                </View>
                            )}
                        </GlassCard>

                        {/* Action Info */}
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Target color="#10b981" size={20} />
                                <Text style={styles.cardTitle}>Action</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Provider</Text>
                                <Text style={styles.infoValue}>{workflow.actionProvider}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Type</Text>
                                <Text style={styles.infoValue}>{workflow.actionId}</Text>
                            </View>
                            {Object.keys(workflow.actionConfig || {}).length > 0 && (
                                <View style={styles.configSection}>
                                    <Text style={styles.configLabel}>Config:</Text>
                                    <Text style={styles.configValue}>
                                        {JSON.stringify(workflow.actionConfig, null, 2)}
                                    </Text>
                                </View>
                            )}
                        </GlassCard>

                        {/* Last Run Info */}
                        <GlassCard style={styles.card}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Last Run</Text>
                                <Text style={styles.infoValue}>{formatDate(workflow.lastRun)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Created</Text>
                                <Text style={styles.infoValue}>{formatDate(workflow.createdAt)}</Text>
                            </View>
                        </GlassCard>
                    </>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.runButton} onPress={handleExecute}>
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
        </GradientBackground>
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
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 10,
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
    deleteButton: {
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
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    controlLabel: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    cardLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardValue: {
        color: '#fff',
        fontSize: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    infoLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    configSection: {
        marginTop: 12,
    },
    configLabel: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 4,
    },
    configValue: {
        color: '#64748b',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    runButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    runGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
    },
    runText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default WorkflowDetailScreen;
