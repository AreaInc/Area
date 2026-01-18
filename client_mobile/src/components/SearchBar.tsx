import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import GlassCard from './GlassCard';

const SearchBar: React.FC = () => {
    return (
        <GlassCard style={styles.container}>
            <View style={styles.content}>
                <Search color="#94a3b8" size={20} style={styles.icon} />
                <TextInput
                    placeholder="Search automations..."
                    placeholderTextColor="#64748b"
                    style={styles.input}
                />
                <SlidersHorizontal color="#94a3b8" size={20} style={styles.filterIcon} />
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: 'System',
    },
    filterIcon: {
        marginLeft: 10,
    },
});

export default SearchBar;
