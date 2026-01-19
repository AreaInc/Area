import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { TriggerMetadata, ActionMetadata } from '../types';

interface ServicePickerModalProps {
    visible: boolean;
    onClose: () => void;
    items: (TriggerMetadata | ActionMetadata)[];
    onSelect: (item: any) => void;
    title: string;
}

const groupByProvider = <T extends { serviceProvider: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
        const provider = item.serviceProvider;
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(item);
        return acc;
    }, {} as Record<string, T[]>);
};

const ServicePickerModal: React.FC<ServicePickerModalProps> = ({ visible, onClose, items, onSelect, title }) => {
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
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalClose}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScroll}>
                        {Object.entries(groupByProvider(items)).map(([provider, providerItems]) => (
                            <View key={provider} style={styles.providerSection}>
                                <Text style={styles.providerTitle}>{provider.toUpperCase()}</Text>
                                {providerItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.itemRow}
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
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
        height: '80%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 15,
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
        flex: 1,
        paddingHorizontal: 20,
    },
    providerSection: {
        marginBottom: 24,
    },
    providerTitle: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    itemRow: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDesc: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 18,
    },
});

export default ServicePickerModal;
