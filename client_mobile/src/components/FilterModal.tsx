import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

export type FilterStatus = 'all' | 'active' | 'inactive';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    currentFilter: FilterStatus;
    onSelectFilter: (status: FilterStatus) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, currentFilter, onSelectFilter }) => {

    const options: { label: string; value: FilterStatus }[] = [
        { label: 'All Workflows', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive / Paused', value: 'inactive' },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter Workflows</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalClose}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionRow,
                                    currentFilter === option.value && styles.selectedOptionRow
                                ]}
                                onPress={() => {
                                    onSelectFilter(option.value);
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    currentFilter === option.value && styles.selectedOptionLabel
                                ]}>
                                    {option.label}
                                </Text>
                                {currentFilter === option.value && (
                                    <Check color="#3b82f6" size={20} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
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
    optionsContainer: {
        padding: 20,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedOptionRow: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    optionLabel: {
        color: '#cbd5e1',
        fontSize: 16,
    },
    selectedOptionLabel: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default FilterModal;
