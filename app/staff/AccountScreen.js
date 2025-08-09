import { Entypo, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { default as React, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const AccountScreen = () => {
  const navigation = useNavigation();
  const [showAccountOptions, setShowAccountOptions] = useState(false);

  //FAQ Section
  const [showFaq, setShowFaq] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  // Data for the FAQ section
  const faqItems = [
    {
      question: "What is TheOpenShift?",
      answer:
        "TheOpenShift is a platform designed to streamline the process of finding and managing shifts in aged care facilities, connecting qualified staff with organizations seamlessly.",
    },
    {
      question: "How do I sign up as a staff member?",
      answer:
        "You can sign up as a staff member by clicking on the 'Sign Up' button in the hero section and creating your profile with your qualifications and preferences.",
    },
    {
      question: "How do organizations post shifts?",
      answer:
        "Organizations can easily set up their profile, define staffing requirements, and then quickly create and publish shifts with all necessary details.",
    },
    {
      question: "Is there support available?",
      answer:
        "Yes, we offer 24/7 dedicated support to ensure smooth operations for both staff and organizations.",
    },
    {
      question: "What kind of professionals can join TheOpenShift?",
      answer:
        "Our platform is for verified and highly qualified aged care professionals looking for work opportunities.",
    },
    {
      question: "Can I manage my shifts through the platform?",
      answer:
        "Yes, staff members can browse a wide range of shifts and apply for those that best fit their schedule and expertise, and organizations can efficiently review applications and manage their workforce.",
    },
  ];

  //States for Terms and Conditions, Privacy Policy
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  //Tawk.to Chat
  const [chatVisible, setChatVisible] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear tokens and session
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("user");
      if (require("expo-auth-session").getAuthSessionAsyncStorage) {
        const storage =
          require("expo-auth-session").getAuthSessionAsyncStorage();
        if (storage && storage.clear) {
          await storage.clear();
        }
      }
    } catch (e) {
      console.log("Logout error:", e);
    }
    navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
  };

  const toggleAccountOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAccountOptions(!showAccountOptions);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SafeAreaView style={styles.headerContainer} edges={["top"]}>
        <Text style={styles.header}>Account</Text>
      </SafeAreaView>

      <View style={styles.section}>
        {/* FAQ Collapsible */}
        <TouchableOpacity
          style={[styles.item, styles.lastItem]}
          onPress={() => setShowFaq(!showFaq)}
        >
          <Ionicons name="help-circle-outline" size={20} style={styles.icon} />
          <Text style={styles.title}>FAQ</Text>
          <Ionicons
            name={showFaq ? "chevron-up" : "chevron-down"}
            size={18}
            style={{ marginLeft: "auto", color: "#555" }}
          />
        </TouchableOpacity>

        {showFaq && (
          <View style={{ marginTop: 8 }}>
            {faqItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  marginBottom: 8,
                  borderWidth: openFaqIndex === idx ? 1 : 0,
                  borderColor: "#334eb8",
                }}
                onPress={() =>
                  setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                }
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      openFaqIndex === idx ? "chevron-down" : "chevron-forward"
                    }
                    size={18}
                    color="#334eb8"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{ fontWeight: "bold", fontSize: 16, color: "#222" }}
                  >
                    {item.question}
                  </Text>
                </View>
                {openFaqIndex === idx && (
                  <Text style={{ marginTop: 6, color: "#555", fontSize: 15 }}>
                    {item.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        {/* Data Privacy Collapsible */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => setShowPrivacy(!showPrivacy)}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            style={styles.icon}
          />
          <Text style={styles.title}>Data Privacy</Text>
          <Ionicons
            name={showPrivacy ? "chevron-up" : "chevron-down"}
            size={18}
            style={{ marginLeft: "auto", color: "#555" }}
          />
        </TouchableOpacity>
        {showPrivacy && (
          <View
            style={{
              padding: 10,
              backgroundColor: "#fff",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#555", fontSize: 15 }}>
              We value your privacy. All your data is securely stored and never
              shared with third parties. You can request deletion of your data
              at any time.
            </Text>
          </View>
        )}

        {/* Terms and Conditions Collapsible */}
        <TouchableOpacity
          style={[styles.item, styles.lastItem]}
          onPress={() => setShowTerms(!showTerms)}
        >
          <Ionicons name="document-outline" size={20} style={styles.icon} />
          <Text style={styles.title}>Terms and Conditions</Text>
          <Ionicons
            name={showTerms ? "chevron-up" : "chevron-down"}
            size={18}
            style={{ marginLeft: "auto", color: "#555" }}
          />
        </TouchableOpacity>
        {showTerms && (
          <View
            style={{
              padding: 10,
              backgroundColor: "#fff",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#555", fontSize: 15 }}>
              By using TheOpenShift, you agree to our terms and conditions.
              Please read them carefully. For any questions, contact support.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            WebBrowser.openBrowserAsync("mailto:admin@theopenshift.com");
          }}
        >
          <Ionicons name="mail-outline" size={20} style={styles.icon} />
          <Text style={styles.title}>Email Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, styles.lastItem]}
          onPress={() => setChatVisible(true)}
        >
          <Ionicons name="chatbubbles-outline" size={20} style={styles.icon} />
          <Text style={styles.title}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Tawk.to Chat Modal */}
      <Modal visible={chatVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 10,
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 6,
              elevation: 2,
            }}
            onPress={() => setChatVisible(false)}
          >
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <WebView
            source={{
              uri: "https://tawk.to/chat/6876316f7f202b19181eb4e7/1j06r26po",
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>

      {/* ACCOUNT SECTION */}
      <View style={styles.section}>
        {/* Report Incident */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            const parentNav = navigation.getParent();
            if (parentNav && parentNav.navigate) {
              parentNav.navigate("IncidentReport");
            } else if (navigation.navigate) {
              navigation.navigate("IncidentReport");
            } else {
              // Optionally show an error or fallback
              alert("IncidentReport screen not found.");
            }
          }}
        >
          <Ionicons name="alert-circle-outline" size={20} style={styles.icon} />
          <Text style={styles.title}>Report Incident</Text>
        </TouchableOpacity>

        {/* Collapsible Account */}
        <TouchableOpacity
          style={[styles.item, styles.lastItem]}
          onPress={toggleAccountOptions}
        >
          <Entypo name="user" size={20} style={styles.icon} />
          <Text style={styles.title}>Account</Text>
          <Ionicons
            name={showAccountOptions ? "chevron-up" : "chevron-down"}
            size={18}
            style={{ marginLeft: "auto", color: "#555" }}
          />
        </TouchableOpacity>

        {showAccountOptions && (
          <View style={styles.accountContainer}>
            <Text style={styles.warningText}>
              This will permanently delete your data from The Open Shift.
            </Text>
            <TouchableOpacity style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>
                Contact Support to Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.item, styles.logout]}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          style={[styles.icon, styles.logoutIcon]}
        />
        <Text style={[styles.title, styles.logoutText]}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: "#ffbd59",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingLeft: 20, // Remove horizontal padding
    alignItems: "flex-start",
    width: "100%", // Ensure full width
  },
  header: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1d3491",
  },
  section: {
    marginVertical: 15,
    marginHorizontal: 16,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20, // Add horizontal padding here
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  icon: {
    marginRight: 16,
    color: "#444",
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: "#222",
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  accountContainer: {
    padding: 16,
    backgroundColor: "#fff0f0",
    borderTopWidth: 1,
    borderTopColor: "#e2e2e2",
  },
  warningText: {
    fontSize: 13,
    color: "#b00020",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logout: {
    marginTop: 30,
    marginHorizontal: 16,
    backgroundColor: "#ffe5e5",
    borderRadius: 10,
    marginBottom: 10,
  },
  logoutIcon: {
    color: "#d32f2f",
  },
  logoutText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
});

export default AccountScreen;
