import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatsCard from '../components/StatsCard';
import WorkflowItem from '../components/WorkflowItem';
import BottomNav from '../components/BottomNav';
import type { RootStackParamList, Workflow } from '../types';
import {
    fetchWorkflows,
    activateWorkflow,
    deactivateWorkflow
} from '@area/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const loadWorkflows = async (): Promise<void> => {
        try {
            const data = await fetchWorkflows();
            setWorkflows(data);
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
            loadWorkflows();
        }, [])
    );

    const onRefresh = useCallback((): void => {
        setRefreshing(true);
        loadWorkflows();
    }, []);

    const handleToggle = async (workflowId: number, newStatus: boolean): Promise<void> => {
        // Optimistic update
        setWorkflows((prev) =>
            prev.map((w) =>
                w.id === workflowId ? { ...w, isActive: newStatus } : w
            )
        );

        try {
            if (newStatus) {
                await activateWorkflow(workflowId);
            } else {
                await deactivateWorkflow(workflowId);
            }
        } catch (e) {
            console.error('Toggle error:', e);
            // Revert on error
            setWorkflows((prev) =>
                prev.map((w) =>
                    w.id === workflowId ? { ...w, isActive: !newStatus } : w
                )
            );
        }
    };

    return (
        <GradientBackground>
            <Header />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                <View style={styles.titleContainer}>
                    <Text style={styles.pageTitle}>Workflow</Text>
                    <Text style={styles.pageTitle}>Dashboard</Text>
                </View>

                <SearchBar />

                <View style={styles.statsContainer}>
                    <StatsCard
                        title="Total Workflows"
                        value={workflows.length.toString()}
                        icon="zap"
                        trend={workflows.length > 0 ? "Active" : "No data"}
                        colors={['#1e1b4b', '#312e81']}
                    />
                    <StatsCard
                        title="Success Rate"
                        value="N/A"
                        icon="activity"
                        trend="Stable"
                        colors={['#1e1b4b', '#1e1b4b']}
                    />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Workflows</Text>
                    <Text style={styles.seeAll}>See All</Text>
                </View>

                <View style={styles.workflowList}>
                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                    ) : workflows.length === 0 ? (
                        <Text style={styles.emptyText}>No workflows created yet.</Text>
                    ) : (
                        workflows.map((workflow) => (
                            <WorkflowItem
                                key={workflow.id}
                                title={workflow.name}
                                lastRun={workflow.lastRun ? String(workflow.lastRun) : "Never"}
                                iconType="filter"
                                status={workflow.isActive ? "Active" : "Paused"}
                                initialActive={workflow.isActive}
                                onPress={() => navigation.navigate('WorkflowDetail', { id: workflow.id, title: workflow.name, status: workflow.isActive ? "Active" : "Paused" })}
                                onToggle={(newStatus: boolean) => handleToggle(workflow.id, newStatus)}
                            />
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.bottomNavContainer}>
                <BottomNav />
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 40 },
    titleContainer: { paddingHorizontal: 20, marginTop: 10 },
    pageTitle: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 40 },
    statsContainer: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    seeAll: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
    workflowList: { paddingHorizontal: 20 },
    emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 20, fontSize: 16 },
    bottomNavContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 }
});

export default HomeScreen;
