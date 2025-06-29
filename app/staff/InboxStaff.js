import { StyleSheet, Text, View } from 'react-native';
import BottomNavbar from '../components/BottomNavbar';

const InboxStaff = ({ navigation }) => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, color: '#334eb8', fontWeight: 'bold' }}>Inbox (Staff)</Text>
    </View>
    <BottomNavbar navigation={navigation} activeTab="Inbox" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 22, color: '#334eb8', fontWeight: 'bold' },
});

export default InboxStaff;
