import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProfileScreenOrg = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organization Profile</Text>
      {/* Add organization-specific profile UI here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcf4f2',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#334eb8',
  },
});

export default ProfileScreenOrg;
