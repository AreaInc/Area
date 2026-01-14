import React from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const DATA = [
  { "id": 1, "name": "Google", "description": "Connect your email and drive" },
  { "id": 2, "name": "Discord", "description": "Post messages to channels" },
  { "id": 3, "name": "Spotifi", "description": "Track your favorite music" },
  { "id": 4, "name": "YTmusillllllsdfsdfsdflsdkk", "description": "Track your favorite music" },
  { "id": 5, "name": "Googli", "description": "Connect your email and drive" },
  { "id": 6, "name": "Discordo", "description": "Post messages to channels" },
  { "id": 7, "name": "Spotify", "description": "Track your favorite music" },
  { "id": 8, "name": "YTmusillllllsdfsdfsdflsdkk", "description": "Track your favorite music" },
  { "id": 9, "name": "Google", "description": "Connect your email and drive" },
  { "id": 10, "name": "Discord", "description": "Post messages to channels" },
  { "id": 11, "name": "Spotify", "description": "Track your favorite music" },
  { "id": 12, "name": "YTmusic", "description": "Track your favorite music" }
];

const ServiceItem = ({ name, description }) => (
  <View style={styles.itemContainer}>
    <View style={styles.iconPlaceholder} />
    <View style={styles.textContainer}>
      <Text style={styles.itemName}>{name}</Text>
      <Text style={styles.itemDescription}>{description}</Text>
    </View>
  </View>
);

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AREA Benchmark</Text>
      </View>
      <FlatList
        data={DATA}
        renderItem={({ item }) => <ServiceItem name={item.name} description={item.description} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
      <ExpoStatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    backgroundColor: '#2196F3', // Blue background
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#FFC107', // Generic color square
    borderRadius: 4,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
