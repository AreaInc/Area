import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { LogOut, User, ChevronLeft, Link2, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, signOut } = useAuth();

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <User color="#fff" size={40} />
                        </View>
                    </View>

                    <GlassCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name</Text>
                            <Text style={styles.value}>{user?.name || 'User'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{user?.email || 'email@example.com'}</Text>
                        </View>
                    </GlassCard>

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
    backButton: {},
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 30,
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
    infoCard: {
        width: '100%',
        marginBottom: 30,
    },
    infoRow: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
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
    },
    logoutText: {
        color: '#ff4d4d',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ProfileScreen;
