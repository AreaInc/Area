import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import SearchBar from '../components/SearchBar';
import WorkflowItem from '../components/WorkflowItem';
import FilterModal, { FilterStatus } from '../components/FilterModal';
import { api } from '../services/api';
import type { RootStackParamList, Workflow } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllWorkflows'>;

const AllWorkflowsScreen: React.FC<Props> = ({ navigation }) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'active' && workflow.isActive) ||
            (filterStatus === 'inactive' && !workflow.isActive);

        return matchesSearch && matchesFilter;
    });

    const fetchWorkflows = async (): Promise<void> => {
        try {
            const { data, error } = await api.get<Workflow[]>('/api/v2/workflows');
            if (data) {
                setWorkflows(data);
            } else {
                console.error('Failed to fetch workflows:', error);
            }
        } catch (err) {
            console.error('Error fetching workflows:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchWorkflows();
        }, [])
    );

    const onRefresh = useCallback((): void => {
        setRefreshing(true);
        fetchWorkflows();
    }, []);

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>All Workflows</Text>
                    <View style={{ width: 24 }} />
                </View>

                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFilterPress={() => setShowFilterModal(true)}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                    }
                >
                    <View style={styles.workflowList}>
                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                        ) : filteredWorkflows.length === 0 ? (
                            <Text style={styles.emptyText}>
                                {workflows.length === 0 ? 'No workflows created yet.' : 'No workflows match your search.'}
                            </Text>
                        ) : (
                            filteredWorkflows.map((workflow) => (
                                <WorkflowItem
                                    key={workflow.id}
                                    title={workflow.name}
                                    lastRun={workflow.lastRun ? String(workflow.lastRun) : "Never"}
                                    iconType="filter"
                                    status={workflow.isActive ? "Active" : "Paused"}
                                    initialActive={workflow.isActive}
                                    onPress={() => navigation.navigate('WorkflowDetail', { id: workflow.id, title: workflow.name, status: workflow.isActive ? "Active" : "Paused" })}
                                    onToggle={async (newStatus: boolean) => {
                                        setWorkflows((prev) =>
                                            prev.map((w) =>
                                                w.id === workflow.id ? { ...w, isActive: newStatus } : w
                                            )
                                        );
                                        try {
                                            await api.post(`/api/v2/workflows/${workflow.id}/${newStatus ? 'activate' : 'deactivate'}`);
                                        } catch (e) {
                                            console.error('Toggle error:', e);
                                            setWorkflows((prev) =>
                                                prev.map((w) =>
                                                    w.id === workflow.id ? { ...w, isActive: !newStatus } : w
                                                )
                                            );
                                        }
                                    }}
                                />
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                currentFilter={filterStatus}
                onSelectFilter={setFilterStatus}
            />
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
    scrollContent: {
        paddingBottom: 40,
    },
    workflowList: {
        paddingHorizontal: 20,
        marginTop: 16,
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});

export default AllWorkflowsScreen;
