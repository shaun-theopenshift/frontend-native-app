import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const InboxScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Inbox (coming soon)</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf4f2' },
  text: { fontSize: 20, color: '#333' },
});

export default InboxScreen; 