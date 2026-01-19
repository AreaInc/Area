import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, FlatList, Modal } from 'react-native';
import { ArrowLeft, Play, Settings, Zap, Target, Trash2, Save, X, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Workflow, WorkflowExecution, Schema, TriggerMetadata, ActionMetadata } from '../types';
import DynamicConfigForm from '../components/DynamicConfigForm';
import ServicePickerModal from '../components/ServicePickerModal';

import { api } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkflowDetail'>;



const WorkflowDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { id, title: initialTitle, status: initialStatus } = route.params || {};
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [title, setTitle] = useState<string>(initialTitle || "Loading...");
    const [isActive, setIsActive] = useState<boolean>(initialStatus === 'Active');
    const [loading, setLoading] = useState<boolean>(true);

    // Logs State
    const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
    const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editDescription, setEditDescription] = useState<string>("");

    // Metadata State
    const [triggers, setTriggers] = useState<TriggerMetadata[]>([]);
    const [actions, setActions] = useState<ActionMetadata[]>([]);
    const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);

    const [selectedTrigger, setSelectedTrigger] = useState<TriggerMetadata | null>(null);
    const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
    const [editTriggerConfig, setEditTriggerConfig] = useState<Record<string, any>>({});

    const [selectedAction, setSelectedAction] = useState<ActionMetadata | null>(null);
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const [editActionConfig, setEditActionConfig] = useState<Record<string, any>>({});

    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (id) {
            fetchWorkflowDetails();
            fetchExecutions();
            fetchMetadata();
        }
    }, [id]);

    // Sync selected metadata when workflow or metadata changes
    useEffect(() => {
        if (workflow && triggers.length > 0 && actions.length > 0) {
            // Only set if not already set (or if specific circumstances require)
            // But here we want to ensure edit state matches workflow state initially
            setEditName(workflow.name);
            setEditDescription(workflow.description || "");

            // Initial Trigger
            const matchingTrigger = triggers.find(t => t.id === workflow.triggerId && t.serviceProvider === workflow.triggerProvider);
            if (matchingTrigger) {
                setSelectedTrigger(matchingTrigger);
                setEditTriggerConfig(workflow.triggerConfig || {});
            }

            // Initial Action
            const matchingAction = actions.find(a => a.id === workflow.actionId && a.serviceProvider === workflow.actionProvider);
            if (matchingAction) {
                setSelectedAction(matchingAction);
                setEditActionConfig(workflow.actionConfig || {});
            }
        }
    }, [workflow, triggers, actions]);

    // Reset Config when changing Provider/Type
    const handleTriggerChange = (trigger: TriggerMetadata) => {
        setSelectedTrigger(trigger);
        setEditTriggerConfig({}); // Clear config on type change
    };

    const handleActionChange = (action: ActionMetadata) => {
        setSelectedAction(action);
        setEditActionConfig({}); // Clear config on type change
    };

    const fetchMetadata = async (): Promise<void> => {
        try {
            const [triggersRes, actionsRes] = await Promise.all([
                api.get<TriggerMetadata[]>('/api/v2/triggers'),
                api.get<ActionMetadata[]>('/api/v2/actions')
            ]);

            if (triggersRes.data) setTriggers(triggersRes.data);
            if (actionsRes.data) setActions(actionsRes.data);
        } catch (e) {
            console.error('Failed to load metadata:', e);
        } finally {
            setLoadingMetadata(false);
        }
    };

    const fetchWorkflowDetails = async (): Promise<void> => {
        try {
            const { data, error } = await api.get<Workflow>(`/api/v2/workflows/${id}`);
            if (data) {
                setWorkflow(data);
                setTitle(data.name);
                setIsActive(data.isActive);
            } else {
                console.error("Error fetching details:", error);
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchExecutions = async (): Promise<void> => {
        setLoadingLogs(true);
        try {
            const { data, error } = await api.get<WorkflowExecution[]>(`/api/v2/workflows/${id}/executions`);
            if (data) {
                setExecutions(data);
            }
        } catch (e) {
            console.error("Fetch logs error:", e);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSave = async (): Promise<void> => {
        if (!workflow || !selectedTrigger || !selectedAction) return;
        setSaving(true);
        try {
            const body = {
                name: editName,
                description: editDescription,
                trigger: {
                    provider: selectedTrigger.serviceProvider, // Use selected provider
                    triggerId: selectedTrigger.id,             // Use selected ID
                    config: editTriggerConfig
                },
                action: {
                    provider: selectedAction.serviceProvider,  // Use selected provider
                    actionId: selectedAction.id,               // Use selected ID
                    config: editActionConfig,
                    credentialsId: workflow.actionCredentialsId
                }
            };

            const { data, error } = await api.put<Workflow>(`/api/v2/workflows/${id}`, body);

            if (data) {
                setWorkflow(data);
                setTitle(data.name);
                setIsEditing(false);
                Alert.alert("Success", "Workflow updated successfully!");
                // Force sync again just in case (though useEffect should verify it)
            } else {
                console.error("Update error:", error);
                Alert.alert("Error", error?.message || "Failed to update workflow");
            }
        } catch (e) {
            console.error("Save ex:", e);
            Alert.alert("Error", "An unexpected error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkflow = async (value: boolean): Promise<void> => {
        setIsActive(value);
        try {
            await api.post(`/api/v2/workflows/${id}/${value ? 'activate' : 'deactivate'}`);
        } catch (error) {
            console.error("Toggle error:", error);
            setIsActive(!value);
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

    const handleExecute = async (): Promise<void> => {
        try {
            const { data, error } = await api.post(`/api/v2/workflows/${id}/execute`, {});
            if (data) {
                Alert.alert("Success", "Workflow execution started!");
                setTimeout(fetchExecutions, 1000); // Activity refresh
            } else {
                Alert.alert("Error", error?.message || "Failed to execute workflow");
            }
        } catch (e) {
            Alert.alert("Error", "Failed to execute workflow");
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
                    {isEditing ? (
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={[styles.headerTitle, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)', minWidth: 100, textAlign: 'center' }]}
                            placeholder="Workflow Name"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                    ) : (
                        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    )}
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? '#4ade80' : '#ef4444' }]} />
                        <Text style={styles.statusText}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    {isEditing ? (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => setIsEditing(false)}>
                            <X color="#fff" size={22} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.deleteButton} onPress={() => setIsEditing(true)}>
                            <Settings color="#fff" size={22} />
                        </TouchableOpacity>
                    )}

                    {!isEditing && (
                        <TouchableOpacity style={[styles.deleteButton, { marginLeft: 4 }]} onPress={handleDelete}>
                            <Trash2 color="#ef4444" size={22} />
                        </TouchableOpacity>
                    )}
                </View>
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
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        {/* Description */}
                        <GlassCard style={styles.card}>
                            <Text style={styles.cardLabel}>Description</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.cardValue, { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 4 }]}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    multiline
                                    placeholder="Enter description"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            ) : (
                                <Text style={styles.cardValue}>{workflow.description || 'No description'}</Text>
                            )}
                        </GlassCard>

                        {/* Trigger Info */}
                        {/* Trigger Info */}
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Zap color="#f59e0b" size={20} />
                                <Text style={styles.cardTitle}>Trigger</Text>
                            </View>

                            {isEditing ? (
                                <>
                                    <Text style={styles.cardLabel}>Select Trigger ({triggers.length} available)</Text>

                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => setShowTriggerModal(true)}
                                    >
                                        <Text style={selectedTrigger ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                                            {selectedTrigger
                                                ? `${selectedTrigger.serviceProvider}: ${selectedTrigger.name}`
                                                : 'Select a trigger...'
                                            }
                                        </Text>
                                        <ChevronDown color="#94a3b8" size={20} />
                                    </TouchableOpacity>

                                    {/* Trigger Config Form */}
                                    {selectedTrigger && (
                                        <DynamicConfigForm
                                            schema={selectedTrigger.configSchema}
                                            config={editTriggerConfig}
                                            setConfig={setEditTriggerConfig}
                                            title="Trigger Configuration"
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Provider</Text>
                                        <Text style={styles.infoValue}>{workflow.triggerProvider}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Type</Text>
                                        <Text style={styles.infoValue}>{workflow.triggerId}</Text>
                                    </View>
                                    {(Object.keys(workflow.triggerConfig || {}).length > 0) && (
                                        <View style={styles.configSection}>
                                            <Text style={styles.configLabel}>Config:</Text>
                                            <Text style={styles.configValue}>
                                                {JSON.stringify(workflow.triggerConfig, null, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </GlassCard>

                        {/* Action Info */}
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Target color="#10b981" size={20} />
                                <Text style={styles.cardTitle}>Action</Text>
                            </View>

                            {isEditing ? (
                                <>
                                    <Text style={styles.cardLabel}>Select Action ({actions.length})</Text>
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => setShowActionModal(true)}
                                    >
                                        <Text style={selectedAction ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                                            {selectedAction
                                                ? `${selectedAction.serviceProvider}: ${selectedAction.name}`
                                                : 'Select an action...'
                                            }
                                        </Text>
                                        <ChevronDown color="#94a3b8" size={20} />
                                    </TouchableOpacity>

                                    {/* Action Config Form */}
                                    {selectedAction && (
                                        <DynamicConfigForm
                                            schema={selectedAction.inputSchema}
                                            config={editActionConfig}
                                            setConfig={setEditActionConfig}
                                            title="Action Configuration"
                                        />
                                    )}
                                </>
                            ) : (
                                <>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Provider</Text>
                                        <Text style={styles.infoValue}>{workflow.actionProvider}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Type</Text>
                                        <Text style={styles.infoValue}>{workflow.actionId}</Text>
                                    </View>
                                    {(Object.keys(workflow.actionConfig || {}).length > 0) && (
                                        <View style={styles.configSection}>
                                            <Text style={styles.configLabel}>Config:</Text>
                                            <Text style={styles.configValue}>
                                                {JSON.stringify(workflow.actionConfig, null, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </GlassCard>

                        {/* Recent Executions Log */}
                        <GlassCard style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Clock color="#fff" size={20} />
                                <Text style={styles.cardTitle}>Recent Logs</Text>
                                <TouchableOpacity onPress={fetchExecutions} style={{ marginLeft: 'auto' }}>
                                    <Text style={styles.refreshLink}>Refresh</Text>
                                </TouchableOpacity>
                            </View>

                            {loadingLogs ? (
                                <ActivityIndicator color="#fff" size="small" style={{ marginVertical: 10 }} />
                            ) : executions.length === 0 ? (
                                <Text style={styles.emptyLogs}>No executions yet.</Text>
                            ) : (
                                <View>
                                    {executions.slice(0, 5).map((exec) => {
                                        let icon;
                                        let color;

                                        if (exec.status === 'completed') {
                                            icon = <CheckCircle color="#4ade80" size={16} />;
                                            color = '#4ade80';
                                        } else if (exec.status === 'failed') {
                                            icon = <XCircle color="#ef4444" size={16} />;
                                            color = '#ef4444';
                                        } else {
                                            // Running or Pending
                                            icon = <ActivityIndicator color="#3b82f6" size="small" style={{ transform: [{ scale: 0.7 }] }} />;
                                            color = '#3b82f6';
                                        }

                                        return (
                                            <View key={exec.id} style={styles.logItemContainer}>
                                                <View style={styles.logItem}>
                                                    <View style={{ width: 20, alignItems: 'center' }}>
                                                        {icon}
                                                    </View>
                                                    <Text style={styles.logTime}>{formatDate(exec.startedAt)}</Text>
                                                    <Text style={[styles.logStatus, { color }]}>
                                                        {exec.status.toUpperCase()}
                                                    </Text>
                                                </View>
                                                {exec.status === 'failed' && exec.errorMessage && (
                                                    <Text style={styles.errorMessage}>
                                                        {exec.errorMessage}
                                                    </Text>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </GlassCard>

                        {/* Last Run Info (Simplified) */}
                        <View style={{ marginTop: 8, alignItems: 'center' }}>
                            <Text style={styles.infoLabel}>Created: {formatDate(workflow.createdAt)}</Text>
                        </View>

                    </KeyboardAvoidingView>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                {isEditing ? (
                    <TouchableOpacity style={styles.runButton} onPress={handleSave} disabled={saving}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.runGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Save fill="#fff" color="#fff" size={20} style={{ marginRight: 8 }} />
                                    <Text style={styles.runText}>Save Changes</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
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
                )}
            </View>

            <ServicePickerModal
                visible={showTriggerModal}
                onClose={() => setShowTriggerModal(false)}
                items={triggers}
                onSelect={handleTriggerChange}
                title="Select Trigger"
            />

            <ServicePickerModal
                visible={showActionModal}
                onClose={() => setShowActionModal(false)}
                items={actions}
                onSelect={handleActionChange}
                title="Select Action"
            />
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
    },
    // Picker & Field Styles
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 8,
        marginBottom: 16,
    },
    pickerTextPlaceholder: {
        color: '#64748b',
        fontSize: 14,
    },
    pickerTextSelected: {
        color: '#fff',
        fontSize: 14,
    },



    // Log styles
    refreshLink: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyLogs: {
        color: '#64748b',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
    logItemContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logTime: {
        color: '#cbd5e1',
        fontSize: 12,
        marginLeft: 10,
        flex: 1,
    },
    logStatus: {
        fontSize: 12,
        fontWeight: '700',
    },
    errorMessage: {
        color: '#f87171',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 30, // Align with text
        fontStyle: 'italic',
    }
});

export default WorkflowDetailScreen;
