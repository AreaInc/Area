import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    Modal
} from 'react-native';
import { ChevronLeft, ChevronDown, Zap, Play } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Workflow } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateWorkflow'>;

interface TriggerMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    triggerType: string;
    configSchema: Record<string, any>;
    requiresCredentials: boolean;
}

interface ActionMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    inputSchema: Record<string, any>;
    requiresCredentials: boolean;
}

const CreateWorkflowScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Triggers
    const [triggers, setTriggers] = useState<TriggerMetadata[]>([]);
    const [selectedTrigger, setSelectedTrigger] = useState<TriggerMetadata | null>(null);
    const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);

    // Actions
    const [actions, setActions] = useState<ActionMetadata[]>([]);
    const [selectedAction, setSelectedAction] = useState<ActionMetadata | null>(null);
    const [showActionModal, setShowActionModal] = useState<boolean>(false);

    const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async (): Promise<void> => {
        try {
            const [triggersRes, actionsRes] = await Promise.all([
                api.get<TriggerMetadata[]>('/api/v2/workflows/metadata/triggers'),
                api.get<ActionMetadata[]>('/api/v2/workflows/metadata/actions')
            ]);

            if (triggersRes.data) setTriggers(triggersRes.data);
            if (actionsRes.data) setActions(actionsRes.data);
        } catch (e) {
            console.error('Failed to load metadata:', e);
        } finally {
            setLoadingMetadata(false);
        }
    };

    const handleCreate = async (): Promise<void> => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a workflow name');
            return;
        }
        if (!selectedTrigger) {
            Alert.alert('Error', 'Please select a trigger');
            return;
        }
        if (!selectedAction) {
            Alert.alert('Error', 'Please select an action');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await api.post<Workflow>('/api/v2/workflows', {
                name,
                description: description || undefined,
                trigger: {
                    provider: selectedTrigger.serviceProvider,
                    triggerId: selectedTrigger.id,
                    config: {}
                },
                action: {
                    provider: selectedAction.serviceProvider,
                    actionId: selectedAction.id,
                    config: {}
                }
            });
            if (data) {
                navigation.replace('WorkflowDetail', { id: data.id, title: data.name, status: 'Inactive' });
            } else {
                console.error('Create error:', error);
                Alert.alert('Error', error?.message || 'Failed to create workflow');
            }
        } catch (e) {
            console.error('Create exception:', e);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const groupByProvider = <T extends { serviceProvider: string }>(items: T[]): Record<string, T[]> => {
        return items.reduce((acc, item) => {
            const provider = item.serviceProvider;
            if (!acc[provider]) acc[provider] = [];
            acc[provider].push(item);
            return acc;
        }, {} as Record<string, T[]>);
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        items: (TriggerMetadata | ActionMetadata)[],
        onSelect: (item: any) => void,
        title: string
    ) => (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalClose}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScroll}>
                        {Object.entries(groupByProvider(items)).map(([provider, providerItems]) => (
                            <View key={provider} style={styles.providerSection}>
                                <Text style={styles.providerTitle}>{provider.toUpperCase()}</Text>
                                {providerItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.itemRow}
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    if (loadingMetadata) {
        return (
            <GradientBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Workflow</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <GlassCard style={styles.formCard}>
                        <Text style={styles.label}>Workflow Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Forward Emails"
                            placeholderTextColor="#64748b"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={[styles.label, { marginTop: 16 }]}>Description (optional)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="What does this workflow do?"
                            placeholderTextColor="#64748b"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </GlassCard>

                    {/* Trigger Selection */}
                    <GlassCard style={styles.selectorCard}>
                        <View style={styles.selectorHeader}>
                            <Zap color="#f59e0b" size={20} />
                            <Text style={styles.selectorTitle}>Trigger</Text>
                        </View>
                        <Text style={styles.selectorSubtitle}>When this happens...</Text>

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
                    </GlassCard>

                    {/* Action Selection */}
                    <GlassCard style={styles.selectorCard}>
                        <View style={styles.selectorHeader}>
                            <Play color="#10b981" size={20} />
                            <Text style={styles.selectorTitle}>Action</Text>
                        </View>
                        <Text style={styles.selectorSubtitle}>Do this...</Text>

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
                    </GlassCard>

                    <TouchableOpacity onPress={handleCreate} disabled={isLoading} style={styles.createButtonContainer}>
                        <LinearGradient
                            colors={['#2563eb', '#1d4ed8']}
                            style={styles.createButton}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Workflow</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </View>

            {renderPickerModal(
                showTriggerModal,
                () => setShowTriggerModal(false),
                triggers,
                setSelectedTrigger,
                'Select Trigger'
            )}

            {renderPickerModal(
                showActionModal,
                () => setShowActionModal(false),
                actions,
                setSelectedAction,
                'Select Action'
            )}
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {},
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
    },
    formCard: {
        padding: 20,
        marginBottom: 16,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectorCard: {
        padding: 20,
        marginBottom: 16,
    },
    selectorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    selectorTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    selectorSubtitle: {
        color: '#94a3b8',
        fontSize: 13,
        marginBottom: 12,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerTextPlaceholder: {
        color: '#64748b',
        fontSize: 16,
    },
    pickerTextSelected: {
        color: '#fff',
        fontSize: 16,
    },
    createButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    createButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 12,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalClose: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '600',
    },
    modalScroll: {
        padding: 20,
    },
    providerSection: {
        marginBottom: 20,
    },
    providerTitle: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    itemRow: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDesc: {
        color: '#94a3b8',
        fontSize: 13,
    },
});

export default CreateWorkflowScreen;
