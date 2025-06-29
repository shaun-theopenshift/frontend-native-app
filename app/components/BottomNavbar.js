import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Props: navigation, activeTab (string: 'Home' | 'Jobs' | 'Inbox' | 'Account')
const BottomNavbar = ({ navigation: propNavigation, activeTab }) => {
  const navigation = propNavigation || useNavigation();

  const navItems = [
    {
      key: 'Home',
      icon: <Ionicons name="home" size={28} color={activeTab === 'Home' ? '#334eb8' : '#b0b3c6'} />,
      route: 'staff/HomeScreenStaff',
    },
    {
      key: 'Jobs',
      icon: <MaterialCommunityIcons name="briefcase" size={28} color={activeTab === 'Jobs' ? '#334eb8' : '#b0b3c6'} />,
      route: 'staff/JobScreenStaff',
    },
    {
      key: 'Inbox',
      icon: <Feather name="message-square" size={28} color={activeTab === 'Inbox' ? '#334eb8' : '#b0b3c6'} />,
      route: 'staff/InboxStaff',
    },
    {
      key: 'Account',
      icon: <Ionicons name="person" size={28} color={activeTab === 'Account' ? '#334eb8' : '#b0b3c6'} />,
      route: 'staff/ProfileScreen', 
    },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item, idx) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.tab,
            activeTab === item.key && styles.activeTab,
          ]}
          onPress={() => navigation.navigate(item.route)}
          accessibilityLabel={item.key}
        >
          <View style={styles.iconWrap}>
            {item.icon}
            {activeTab === item.key && <View style={styles.activeIndicator} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    margin: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: '#f5f7ff',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  activeIndicator: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5bb780',
  },
});

export default BottomNavbar;
