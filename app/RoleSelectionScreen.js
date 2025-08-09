import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ROLE_API_URL = 'https://api.theopenshift.com/v1/roles/me';
const USER_API_URL = 'https://api.theopenshift.com/v1/users/me';
const ORG_API_URL = 'https://api.theopenshift.com/v1/orgs/me';

const { width, height } = Dimensions.get('window');

const RoleSelectionScreen = ({ route }) => {
  const navigation = useNavigation();
  const { access_token } = route.params || {};

  useEffect(() => {
    if (!access_token) return;
    // 1. Check role using /v1/roles/me (preferred, as per schema)
    fetch(ROLE_API_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(roleData => {
        if (roleData && roleData.role) {
          if (roleData.role === 'org') {
            navigation.reset({ index: 0, routes: [{ name: 'ProfileOrg', params: { access_token } }] });
            return;
          } else if (roleData.role === 'user') {
            navigation.reset({ index: 0, routes: [{ name: 'Profile', params: { access_token } }] });
            return;
          }
        }
        // If no role, fallback to old logic (optional)
        fetch(USER_API_URL, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data && data.role) {
              if (data.role === 'org') {
                navigation.reset({ index: 0, routes: [{ name: 'ProfileOrg', params: { access_token } }] });
                return;
              } else if (data.role === 'user') {
                navigation.reset({ index: 0, routes: [{ name: 'Profile', params: { access_token } }] });
                return;
              }
            }
          });
      });
  }, [access_token]);

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.avatarCircle}>
          <Image source={require('../assets/images/Org_roleselection.png')} style={styles.avatar} />
        </View>
        <Text style={styles.title}>Aged Care Organisation</Text>
        <TouchableOpacity style={styles.hireButton} onPress={() => navigation.replace('ProfileOrg', { access_token })}>
          <Text style={styles.hireButtonText}>Continue as Aged Care Organisation</Text>
        </TouchableOpacity>
        {/*<Text style={{ color:'white'}}>Just incase if we want to put some text here.</Text>*/}
      </View>
      <View style={styles.bottomCard}>
        <View style={styles.avatarCircleSmall}>
          <Image source={require('../assets/images/Staff_roleselection.png')} style={styles.avatarSmall} />
        </View>
        <Text style={styles.roleTitle}>Independent Contractor</Text>
        <TouchableOpacity style={styles.freelancerButton} onPress={() => navigation.replace('ProfileCreate', { access_token })}>
          <Text style={styles.freelancerButtonText}>Continue as Independent Contractor</Text>
        </TouchableOpacity>
        {/*<Text style={styles.learnText}>Just incase if we want to put some text here.</Text>*/}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCard: {
    backgroundColor: '#3565b4',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    width: width,
    height: height / 2,
    alignItems: 'center',
    paddingTop: width / 4,
    paddingBottom: 32,
    marginBottom: -24,
    zIndex: 2,
  },
  avatarCircle: {
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 30,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 18,
  },
  hireButton: {
    backgroundColor: '#fe743c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  hireButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    width: width,
    height: height / 2,
    alignItems: 'center',
    paddingTop: width / 4,
    paddingBottom: width / 2,
    marginTop: 0,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircleSmall: {
    width: 150,
    height: 150,
    borderRadius: 80,
    backgroundColor: '#fcfbf7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: -10,
  },
  avatarSmall: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  roleTitle: {
    color: '#25325a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleSubtitle: {
    color: '#25325a',
    fontSize: 13,
    marginBottom: 14,
  },
  freelancerButton: {
    borderColor: '#fe743c',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  freelancerButtonText: {
    color: '#fe743c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  learnText: {
    color: '#25325a',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  learnLink: {
    color: '#334eb8',
    fontWeight: 'bold',
  },
});

export default RoleSelectionScreen;
