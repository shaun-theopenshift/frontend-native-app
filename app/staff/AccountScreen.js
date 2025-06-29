import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import auth0Config from '../auth0Config';

const AccountScreen = () => {
  const navigation = useNavigation();
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user');
      // Log out from Auth0 session as well (system browser)
      const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${encodeURIComponent('theopenshiftapp://')}`;
      await WebBrowser.openBrowserAsync(logoutUrl);
    } catch (e) {
      // Ignore errors
    }
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Account Settings</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf4f2' },
  text: { fontSize: 20, color: '#333', marginBottom: 40 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334eb8',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AccountScreen;