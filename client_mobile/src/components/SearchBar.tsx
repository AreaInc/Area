import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import GlassCard from './GlassCard';
interface SearchBarProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    onFilterPress?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder, onFilterPress }) => {
    return (
        <GlassCard style={styles.container}>
            <View style={styles.content}>
                <Search color="#94a3b8" size={20} style={styles.icon} />
                <TextInput
                    placeholder={placeholder || "Search automations..."}
                    placeholderTextColor="#64748b"
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                />
                {onFilterPress && (
                    <TouchableOpacity onPress={onFilterPress}>
                        <SlidersHorizontal color="#94a3b8" size={20} style={styles.filterIcon} />
                    </TouchableOpacity>
                )}
                {!onFilterPress && (
                    <SlidersHorizontal color="#94a3b8" size={20} style={styles.filterIcon} />
                )}
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
