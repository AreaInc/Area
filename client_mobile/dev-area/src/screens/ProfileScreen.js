import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { LogOut, User, ChevronLeft, Edit2, Check, X } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
    const { user, signOut, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        const result = await updateProfile({ name });
        setLoading(false);

        if (result.success) {
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } else {
            Alert.alert('Error', result.error?.message || 'Failed to update profile');
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Cancel edit
            setName(user?.name || '');
            setIsEditing(false);
        } else {
            // Start edit
            setName(user?.name || '');
            setIsEditing(true);
        }
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>

                    {isEditing ? (
                        <View style={styles.editActions}>
                            <TouchableOpacity onPress={toggleEdit} style={[styles.iconButton, { marginRight: 16 }]}>
                                <X color="#ff4d4d" size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdate} disabled={loading} style={styles.iconButton}>
                                {loading ? <ActivityIndicator color="#4ade80" size="small" /> : <Check color="#4ade80" size={24} />}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={toggleEdit} style={styles.iconButton}>
                            <Edit2 color="#fff" size={20} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <User color="#fff" size={40} />
                        </View>
                        {isEditing && (
                            <View style={styles.editBadge}>
                                <Edit2 color="#fff" size={12} />
                            </View>
                        )}
                    </View>

                    <GlassCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Your Name"
                                    placeholderTextColor="#64748b"
                                    autoFocus
                                />
                            ) : (
                                <Text style={styles.value}>{user?.name || 'User'}</Text>
                            )}
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={[styles.value, { color: '#94a3b8' }]}>{user?.email || 'email@example.com'}</Text>
                        </View>
                    </GlassCard>

                    {!isEditing && (
                        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                            <LogOut color="#ff4d4d" size={20} />
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
        marginBottom: 30,
        height: 44,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editActions: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 30,
        position: 'relative',
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
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0f172a',
    },
    infoCard: {
        width: '100%',
        marginBottom: 30,
    },
    infoRow: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 60,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        width: 60,
    },
    value: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    input: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        padding: 0,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
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
    },
    logoutText: {
        color: '#ff4d4d',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ProfileScreen;
