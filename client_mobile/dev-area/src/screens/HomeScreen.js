import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatsCard from '../components/StatsCard';
import WorkflowItem from '../components/WorkflowItem';
import BottomNav from '../components/BottomNav';

const HomeScreen = ({ navigation }) => {
  return (
    <GradientBackground>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Workflow</Text>
          <Text style={styles.pageTitle}>Dashboard</Text>
        </View>

        <SearchBar />

        <View style={styles.statsContainer}>
          <StatsCard
            title="Executions today"
            value="12.4k"
            icon="zap"
            trend="+12%"
            colors={['#1e1b4b', '#312e81']}
          />
          <StatsCard
            title="Success Rate"
            value="99.9%"
            icon="activity"
            trend="Stable"
            colors={['#1e1b4b', '#1e1b4b']} // Darker flat for contrast
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Workflows</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <View style={styles.workflowList}>
          <WorkflowItem
            title="Social Sync"
            lastRun="2m ago"
            iconType="social"
            status="Last run: 2m ago"
            onPress={() => navigation.navigate('WorkflowDetail', { title: "Social Sync", status: "Active" })}
          />
          <WorkflowItem
            title="Daily Report"
            lastRun="5h ago"
            iconType="mail"
            status="Last run: 5h ago"
            onPress={() => navigation.navigate('WorkflowDetail', { title: "Daily Report", status: "Active" })}
          />
          <WorkflowItem
            title="Lead Filter"
            lastRun="Paused"
            iconType="filter"
            status="Paused"
            initialActive={false}
            onPress={() => navigation.navigate('WorkflowDetail', { title: "Lead Filter", status: "Paused" })}
          />
          <WorkflowItem
            title="DB Backup"
            lastRun="Running now..."
            iconType="db"
            status="Running now..."
            onPress={() => navigation.navigate('WorkflowDetail', { title: "DB Backup", status: "Running" })}
          />
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
  scrollContent: {
    paddingBottom: 40,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14, // 6 margin on cards covers the rest 
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  workflowList: {
    paddingHorizontal: 20,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  }
});

export default HomeScreen;
