import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Switch, IconButton, useTheme } from 'react-native-paper';

export default function WorkflowCard({ name, isActive, onToggle, onPress }) {
  const theme = useTheme();

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.infoContainer}>
          <Text variant="titleMedium" style={styles.name}>{name}</Text>
          <Text variant="bodySmall" style={{ color: isActive ? theme.colors.primary : theme.colors.secondary }}>
            {isActive ? 'Active' : 'Cc'}
          </Text>
        </View>
        <View style={styles.actions}>
           <Switch value={isActive} onValueChange={onToggle} />
           <IconButton icon="dots-vertical" onPress={() => {}} />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
