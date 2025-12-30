import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Settings } from 'lucide-react-native';

const Header = () => {
    return (
        <View style={styles.container}>
            <View style={styles.userInfo}>
                {/* Placeholder Avatar */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }}
                        style={styles.avatar}
                    />
                </View>
                <View>
                    <Text style={styles.greeting}>WELCOME BACK</Text>
                    <Text style={styles.name}>Alex Morgan</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
                <Settings color="#fff" size={24} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60, // Safe area padding estimate
        paddingBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 12,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#334155',
    },
    greeting: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Header;
