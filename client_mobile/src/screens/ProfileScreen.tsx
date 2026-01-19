import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { LogOut, User, ChevronLeft, Link2, ChevronRight, Edit2, Save, X, Lock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, signOut, updateProfile } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
        }
    }, [user]);

    const handleSave = async () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setSaving(true);
        try {
            const result = await updateProfile({
                name: editName,
                password: editPassword ? editPassword : undefined
            });

            if (result.error) {
                Alert.alert('Error', result.error.message);
            } else {
                setIsEditing(false);
                setEditPassword(''); // Clear password field
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    {isEditing ? (
                        <View style={{ width: 24 }} />
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Edit2 color="#3b82f6" size={20} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <User color="#fff" size={40} />
                        </View>
                        {isEditing && (
                            <Text style={styles.editAvatarText}>Change Avatar not supported yet</Text>
                        )}
                    </View>

                    <GlassCard style={styles.infoCard}>
                        {isEditing ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Your Name"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email (Read Only)</Text>
                                    <View style={styles.readOnlyInput}>
                                        <Text style={[styles.value, { opacity: 0.7 }]}>{user?.email}</Text>
                                        <Lock color="#64748b" size={16} />
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editPassword}
                                        onChangeText={setEditPassword}
                                        placeholder="Leave empty to keep current"
                                        placeholderTextColor="#64748b"
                                        secureTextEntry
                                    />
                                </View>

                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setIsEditing(false);
                                            setEditName(user?.name || '');
                                            setEditPassword('');
                                        }}
                                        disabled={saving}
                                    >
                                        <X color="#94a3b8" size={20} />
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Save color="#fff" size={20} />
                                                <Text style={styles.saveText}>Save</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Name</Text>
                                    <Text style={styles.value}>{user?.name || 'User'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Email</Text>
                                    <Text style={styles.value}>{user?.email || 'email@example.com'}</Text>
                                </View>
                            </>
                        )}
                    </GlassCard>

                    {!isEditing && (
                        <>
                            <TouchableOpacity
                                style={styles.servicesBtn}
                                onPress={() => navigation.navigate('Services')}
                            >
                                <Link2 color="#3b82f6" size={20} />
                                <Text style={styles.servicesBtnText}>Connected Services</Text>
                                <ChevronRight color="#64748b" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                                <LogOut color="#ff4d4d" size={20} />
                                <Text style={styles.logoutText}>Sign Out</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
        paddingBottom: 40,
    },
    avatarContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    editAvatarText: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 8,
    },
    infoCard: {
        width: '100%',
        marginBottom: 30,
        padding: 0,
        overflow: 'hidden',
    },
    infoRow: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 0,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    servicesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        marginBottom: 16,
        width: '100%',
    },
    servicesBtnText: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: 16,
        flex: 1,
        marginLeft: 12,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.5)',
        width: '100%',
        justifyContent: 'center',
    },
    logoutText: {
        color: '#ff4d4d',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    // Edit styles
    inputGroup: {
        padding: 16,
    },
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 4,
    },
    readOnlyInput: {
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: 4,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        flex: 1,
        marginRight: 8,
        justifyContent: 'center',
    },
    cancelText: {
        color: '#94a3b8',
        fontWeight: '600',
        marginLeft: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        flex: 1,
        marginLeft: 8,
        justifyContent: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ProfileScreen;
