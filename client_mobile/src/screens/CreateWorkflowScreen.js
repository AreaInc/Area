import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const CreateWorkflowScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a workflow name');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await api.post('/api/workflows', {
                name,
                nodes: [],
                connections: {}
            });
            if (data) {
                // Navigate to the detail screen of the newly created workflow
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

                <View style={styles.content}>
                    <GlassCard style={styles.formCard}>
                        <Text style={styles.label}>Workflow Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Daily Standup Notifier"
                            placeholderTextColor="#64748b"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
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
                </View>
            </View>
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
        marginBottom: 30,
    },
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
        marginBottom: 20,
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
    createButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
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

export default CreateWorkflowScreen;
