import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Home, History, User, Plus } from 'lucide-react-native';
import GlassCard from './GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

const BottomNav = () => {
    return (
        <GlassCard style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.navItem}>
                    <Home color="#3b82f6" size={24} fill="#3b82f6" fillOpacity={0.2} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <History color="#94a3b8" size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <User color="#94a3b8" size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.addButtonContainer}>
                    <LinearGradient
                        colors={['#2563eb', '#1d4ed8']}
                        style={styles.addButton}
                    >
                        <Plus color="#fff" size={28} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 30, // Bottom padding
        borderRadius: 30, // Full rounded
        height: 70,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    navItem: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonContainer: {
        position: 'absolute',
        right: 14,
        top: 10,
        bottom: 10
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    }
});

export default BottomNav;
