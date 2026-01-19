import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal
} from 'react-native';
import { ChevronLeft, Plus, Trash2, CheckCircle, XCircle, Link2 } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Services'>;

interface Credential {
    id: number;
    name: string;
    serviceProvider: string;
    credentialType: string;
    isValid: boolean;
    createdAt: string;
    updatedAt: string;
}

const PROVIDERS = [
    { id: 'gmail', name: 'Gmail', color: '#EA4335' },
    { id: 'google-calendar', name: 'Google Calendar', color: '#4285F4' },
    { id: 'google-sheets', name: 'Google Sheets', color: '#34A853' },
    { id: 'spotify', name: 'Spotify', color: '#1DB954' },
    { id: 'twitch', name: 'Twitch', color: '#9146FF' },
    { id: 'youtube', name: 'YouTube', color: '#FF0000' },
    { id: 'telegram', name: 'Telegram', color: '#0088CC' },
];

const ServicesScreen: React.FC<Props> = ({ navigation }) => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);

    // New credential form
    const [newName, setNewName] = useState<string>('');
    const [newProvider, setNewProvider] = useState<string>('');
    const [newClientId, setNewClientId] = useState<string>('');
    const [newClientSecret, setNewClientSecret] = useState<string>('');
    const [creating, setCreating] = useState<boolean>(false);

    useFocusEffect(
        useCallback(() => {
            fetchCredentials();
        }, [])
    );

    const fetchCredentials = async (): Promise<void> => {
        try {
            const { data, error } = await api.get<Credential[]>('/api/oauth2-credential');
            if (data) {
                setCredentials(data);
            } else {
                console.error('Failed to fetch credentials:', error);
            }
        } catch (e) {
            console.error('Error fetching credentials:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCredential = async (): Promise<void> => {
        if (!newName.trim() || !newProvider || !newClientId.trim() || !newClientSecret.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setCreating(true);
        try {
            const { data, error } = await api.post<Credential>('/api/oauth2-credential', {
                name: newName,
                provider: newProvider,
                clientId: newClientId,
                clientSecret: newClientSecret
            });

            if (data) {
                setShowAddModal(false);
                resetForm();
                fetchCredentials();
                // Automatically start OAuth flow
                handleAuthorize(data.id);
            } else {
                Alert.alert('Error', error?.message || 'Failed to create credential');
            }
        } catch (e) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setCreating(false);
        }
    };

    const handleAuthorize = async (credentialId: number): Promise<void> => {
        try {
            // Open OAuth flow in browser
            const authUrl = `${api.getBaseUrl()}/api/oauth2-credential/auth?credentialId=${credentialId}`;
            const result = await WebBrowser.openAuthSessionAsync(authUrl);

            if (result.type === 'success') {
                // Refresh credentials to get updated status
                fetchCredentials();
                Alert.alert('Success', 'Account connected successfully!');
            }
        } catch (e) {
            console.error('Auth error:', e);
            Alert.alert('Error', 'Failed to authorize');
        }
    };

    const handleDelete = (credential: Credential): void => {
        Alert.alert(
            'Delete Credential',
            `Are you sure you want to delete "${credential.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/oauth2-credential/${credential.id}`);
                            fetchCredentials();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete credential');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = (): void => {
        setNewName('');
        setNewProvider('');
        setNewClientId('');
        setNewClientSecret('');
    };

    const getProviderColor = (providerId: string): string => {
        return PROVIDERS.find(p => p.id === providerId)?.color || '#3b82f6';
    };

    const getProviderName = (providerId: string): string => {
        return PROVIDERS.find(p => p.id === providerId)?.name || providerId;
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Connected Services</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)}>
                        <Plus color="#3b82f6" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                    ) : credentials.length === 0 ? (
                        <GlassCard style={styles.emptyCard}>
                            <Link2 color="#64748b" size={48} style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>No Services Connected</Text>
                            <Text style={styles.emptyText}>
                                Connect your accounts to use them in workflows.
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowAddModal(true)}
                            >
                                <Text style={styles.addButtonText}>+ Add Connection</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    ) : (
                        credentials.map(cred => (
                            <GlassCard key={cred.id} style={styles.credentialCard}>
                                <View style={styles.credentialHeader}>
                                    <View style={[styles.providerBadge, { backgroundColor: getProviderColor(cred.serviceProvider) }]}>
                                        <Text style={styles.providerBadgeText}>
                                            {getProviderName(cred.serviceProvider).charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={styles.credentialInfo}>
                                        <Text style={styles.credentialName}>{cred.name}</Text>
                                        <Text style={styles.credentialProvider}>
                                            {getProviderName(cred.serviceProvider)}
                                        </Text>
                                    </View>
                                    <View style={styles.credentialStatus}>
                                        {cred.isValid ? (
                                            <CheckCircle color="#4ade80" size={20} />
                                        ) : (
                                            <XCircle color="#f87171" size={20} />
                                        )}
                                    </View>
                                </View>

                                <View style={styles.credentialActions}>
                                    {!cred.isValid && (
                                        <TouchableOpacity
                                            style={styles.authorizeButton}
                                            onPress={() => handleAuthorize(cred.id)}
                                        >
                                            <Text style={styles.authorizeButtonText}>Authorize</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(cred)}
                                    >
                                        <Trash2 color="#f87171" size={18} />
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* Add Credential Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Connection</Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                                <Text style={styles.modalClose}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.fieldLabel}>Name</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="e.g. My Gmail"
                                placeholderTextColor="#64748b"
                                value={newName}
                                onChangeText={setNewName}
                            />

                            <Text style={styles.fieldLabel}>Service</Text>
                            <View style={styles.providerGrid}>
                                {PROVIDERS.map(provider => (
                                    <TouchableOpacity
                                        key={provider.id}
                                        style={[
                                            styles.providerOption,
                                            newProvider === provider.id && styles.providerOptionSelected,
                                            { borderColor: newProvider === provider.id ? provider.color : 'rgba(255,255,255,0.1)' }
                                        ]}
                                        onPress={() => setNewProvider(provider.id)}
                                    >
                                        <View style={[styles.providerDot, { backgroundColor: provider.color }]} />
                                        <Text style={styles.providerOptionText}>{provider.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.fieldLabel}>Client ID</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="From OAuth provider console"
                                placeholderTextColor="#64748b"
                                value={newClientId}
                                onChangeText={setNewClientId}
                                autoCapitalize="none"
                            />

                            <Text style={styles.fieldLabel}>Client Secret</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="From OAuth provider console"
                                placeholderTextColor="#64748b"
                                value={newClientSecret}
                                onChangeText={setNewClientSecret}
                                secureTextEntry
                                autoCapitalize="none"
                            />

                            <Text style={styles.helpText}>
                                You need to create OAuth credentials in the provider's developer console
                                (e.g., Google Cloud Console) and add the callback URL from your server.
                            </Text>

                            <TouchableOpacity
                                onPress={handleCreateCredential}
                                disabled={creating}
                                style={styles.createButtonContainer}
                            >
                                <LinearGradient
                                    colors={['#2563eb', '#1d4ed8']}
                                    style={styles.createButton}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.createButtonText}>Create & Authorize</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    emptyCard: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    addButtonText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    credentialCard: {
        padding: 16,
        marginBottom: 12,
    },
    credentialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerBadgeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    credentialInfo: {
        flex: 1,
        marginLeft: 12,
    },
    credentialName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    credentialProvider: {
        color: '#94a3b8',
        fontSize: 13,
    },
    credentialStatus: {
        marginLeft: 8,
    },
    credentialActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
    },
    authorizeButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    authorizeButtonText: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: 14,
    },
    deleteButton: {
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        padding: 8,
        borderRadius: 8,
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
        maxHeight: '85%',
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
    fieldLabel: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 12,
    },
    fieldInput: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    providerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    providerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    providerOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    providerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    providerOptionText: {
        color: '#e2e8f0',
        fontSize: 13,
    },
    helpText: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 16,
        lineHeight: 18,
    },
    createButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 20,
        marginBottom: 40,
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
});

export default ServicesScreen;
