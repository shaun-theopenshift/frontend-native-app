import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://api.theopenshift.com/v1/users/me";
const PATCH_URL = "https://api.theopenshift.com/v1/users/user";
const AVAILABILITY_URL = "https://api.theopenshift.com/v1/users/availability";

const iconMap = {
  name: (
    <Ionicons
      name="person"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  phone: (
    <Ionicons
      name="call"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  dob: (
    <MaterialIcons
      name="cake"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  gender: (
    <FontAwesome5
      name="venus-mars"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  address: (
    <Ionicons
      name="location"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  email: (
    <MaterialIcons
      name="email"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  emergency: (
    <MaterialIcons
      name="contacts"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
  tfn: (
    <MaterialCommunityIcons
      name="file-document-outline"
      size={15}
      color="#334eb8"
      style={{ marginRight: 8 }}
    />
  ),
};

const stepperSections = [
  {
    key: "availability",
    label: "Availability",
    icon: <Feather name="clock" size={20} color="#334eb8" />,
    required: true,
  },
  {
    key: "bank",
    label: "Stripe",
    icon: <Feather name="credit-card" size={20} color="#334eb8" />,
  },
  {
    key: "badges",
    label: "Badges",
    icon: <Feather name="star" size={20} color="#334eb8" />,
  },
  {
    key: "vaccination",
    label: "Vaccination",
    icon: <Feather name="shield" size={20} color="#334eb8" />,
  },
  {
    key: "languages",
    label: "Languages",
    icon: <Feather name="globe" size={20} color="#334eb8" />,
  },
  {
    key: "interests",
    label: "Interests & Hobbies",
    icon: <Feather name="heart" size={20} color="#334eb8" />,
  },
  {
    key: "services",
    label: "Services Provided",
    icon: <Feather name="briefcase" size={20} color="#334eb8" />,
    required: true,
  },
  {
    key: "preferences",
    label: "My Preferences",
    icon: <Feather name="settings" size={20} color="#334eb8" />,
    required: true,
  },
];

const customTick = (
  <View
    style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#34c759",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <AntDesign name="check" size={16} color="#fff" />
  </View>
);

//Stripe Onboarding Section
const StripeOnboardingSection = ({ user, accessToken }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [onboardLink, setOnboardLink] = React.useState("");
  const [dashboardLink, setDashboardLink] = React.useState("");
  const [chargesEnabled, setChargesEnabled] = React.useState(
    user?.charges_enabled || false
  );

  // Refresh charges_enabled when user changes (e.g. after returning from onboarding)
  React.useEffect(() => {
    setChargesEnabled(user?.charges_enabled || false);
  }, [user]);

  const fetchOnboardLink = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "https://api.theopenshift.com/v1/payments/onboard",
        {
          headers: { Authorization: `Bearer ${accessToken || ""}` },
        }
      );
      const data = await res.text();
      console.log("Stripe onboarding API response:", data);
      if (!res.ok || !data)
        throw new Error(data?.message || "Could not fetch onboarding link");
      setOnboardLink(data.trim());
    } catch (e) {
      setError(e.message || "Failed to fetch onboarding link");
    }
    setLoading(false);
  };

  const fetchDashboardLink = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "https://api.theopenshift.com/v1/payments/dashboard",
        {
          headers: { Authorization: `Bearer ${accessToken || ""}` },
        }
      );
      const data = await res.text();
      if (!res.ok || !data) throw new Error("Could not fetch dashboard link");
      setDashboardLink(data.trim().replace(/^"+|"+$/g, "")); // Clean the link
    } catch (e) {
      setError(e.message || "Failed to fetch dashboard link");
    }
    setLoading(false);
  };

  if (chargesEnabled) {
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <AntDesign
            name="checkcircle"
            size={22}
            color="#34c759"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "#34c759", fontWeight: "bold", fontSize: 16 }}>
            Your Stripe account is enabled for payouts!
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#334eb8",
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
            alignItems: "center",
          }}
          onPress={async () => {
            setLoading(true);
            setError("");
            try {
              const res = await fetch(
                "https://api.theopenshift.com/v1/payments/dashboard",
                {
                  headers: { Authorization: `Bearer ${accessToken || ""}` },
                }
              );
              const data = await res.text();
              if (!res.ok || !data)
                throw new Error("Could not fetch dashboard link");
              const url = data.trim().replace(/^"+|"+$/g, "");
              setDashboardLink(url);
              const supported = await Linking.canOpenURL(url);
              if (supported || url.startsWith("http")) {
                await Linking.openURL(url);
              } else {
                setError("Cannot open this link on your device.");
              }
            } catch (e) {
              setError("Could not open dashboard link.");
            }
            setLoading(false);
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Open Stripe Dashboard
          </Text>
        </TouchableOpacity>
        {error ? (
          <Text style={{ color: "#e53935", marginTop: 8 }}>{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={{
          backgroundColor: "#334eb8",
          borderRadius: 8,
          padding: 12,
          alignItems: "center",
          marginBottom: 10,
        }}
        onPress={fetchOnboardLink}
        disabled={loading}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          Get Onboarding Link
        </Text>
      </TouchableOpacity>
      {onboardLink ? (
        <TouchableOpacity
          style={{
            backgroundColor: "#5167FC",
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
            marginBottom: 10,
          }}
          onPress={async () => {
            try {
              const url = onboardLink.trim().replace(/^"+|"+$/g, "");
              console.log("Opening Stripe onboarding link:", url);
              const supported = await Linking.canOpenURL(url);
              console.log("canOpenURL result:", supported);
              if (supported) {
                await Linking.openURL(url);
              } else {
                setError("Cannot open this link on your device.");
              }
            } catch (e) {
              setError("Could not open onboarding link.");
              console.log("Error opening onboarding link:", e);
            }
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Start Onboarding
          </Text>
        </TouchableOpacity>
      ) : null}
      {error ? (
        <Text style={{ color: "#e53935", marginTop: 8 }}>{error}</Text>
      ) : null}
    </View>
  );
};

const ProfileScreen = ({ route = {}, navigation }) => {
  const params = route.params || {};
  const [accessToken, setAccessToken] = useState("");
  const [tokenResolved, setTokenResolved] = useState(false); // Always false initially
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("current");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBioModalVisible, setEditBioModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editData, setEditData] = useState({});
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [detailsData, setDetailsData] = useState({});
  const [availabilityObj, setAvailabilityObj] = useState(null);
  // --- Additional Details Display/Edit Toggle ---
  const [isEditingAdditional, setIsEditingAdditional] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Always resolve access_token from SecureStore on every focus (industry best practice)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const resolveToken = async () => {
        let token = await SecureStore.getItemAsync("access_token");
        console.log("[ProfileScreen] Resolved token from SecureStore:", token);
        if (isActive) {
          setAccessToken(token || "");
          setTokenResolved(true);
        }
      };
      setTokenResolved(false); // Reset before resolving
      resolveToken();
      return () => {
        isActive = false;
      };
    }, [navigation])
  );

  // Fetch user details only when tokenResolved and accessToken are both ready
  useEffect(() => {
    let isActive = true;
    if (!tokenResolved) {
      setLoading(true);
      console.log("[ProfileScreen] Waiting for token to resolve...");
      return;
    }
    if (!accessToken) {
      setLoading(false);
      setUser(null);
      setErrorMsg("No access token found.");
      console.log("[ProfileScreen] No accessToken after tokenResolved.");
      return;
    }
    setLoading(true);
    console.log(
      "[ProfileScreen] Fetching user profile with token:",
      accessToken
    );
    fetch(API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        if (!res.ok) {
          console.log("[ProfileScreen] /v1/users/me error:", res.status, data);
          throw new Error(data?.message || "User fetch failed");
        }
        console.log("[ProfileScreen] /v1/users/me success:", data);
        return data;
      })
      .then((data) => {
        if (isActive) {
          if (!data || data.error) {
            setUser(null);
            setLoading(false);
            setErrorMsg("No user data returned from API.");
            console.log(
              "[ProfileScreen] No user data returned from API:",
              data
            );
            return;
          }
          setUser(data);
          setLoading(false);
          setErrorMsg("");
        }
      })
      .catch((err) => {
        if (isActive) {
          setUser(null);
          setLoading(false);
          setErrorMsg(err.message || "User fetch error");
          console.log("[ProfileScreen] User fetch error:", err);
        }
      });
    return () => {
      isActive = false;
    };
  }, [tokenResolved, accessToken]);

  // Fetch availability when token is resolved and accessToken is ready
  useEffect(() => {
    if (!tokenResolved || !accessToken) return;
    fetch(AVAILABILITY_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data &&
          typeof data.availability === "object" &&
          data.availability !== null
        ) {
          setAvailabilityObj(data.availability);
        } else {
          setAvailabilityObj(null);
        }
      });
  }, [tokenResolved, accessToken]);

  useEffect(() => {
    if (user) {
      setDetailsData({
        availability: user.availability || [],
        badges: user.badges || [],
        vaccination: user.vaccinations || [],
        languages: user.languages || [],
        interests: user.interests || [],
        services: user.services || [],
        preferences: user.preferences || [],
      });
    }
  }, [user]);

  // Fetch user details when accessToken changes
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [accessToken]);

  // Fetch availability separately and ensure correct token and user_id usage
  useEffect(() => {
    if (!accessToken) return;
    fetch(AVAILABILITY_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data &&
          typeof data.availability === "object" &&
          data.availability !== null
        ) {
          setAvailabilityObj(data.availability);
        } else {
          setAvailabilityObj(null);
        }
      });
  }, [accessToken]);

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("", msg);
    }
  };

  const patchUser = async (data, onSuccess) => {
    setSaving(true);
    try {
      const { availability, ...dataWithoutAvailability } = data;
      const res = await fetch(PATCH_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dataWithoutAvailability),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        showToast("Details saved successfully!");
        onSuccess && onSuccess();
      } else {
        showToast("Failed to save details.");
        Alert.alert("Update failed", "Could not update profile.");
      }
    } catch (e) {
      showToast("Error saving details.");
      Alert.alert("Error", "Could not update profile.");
    }
    setSaving(false);
  };

  const patchAvailability = async (days, onSuccess) => {
    setSaving(true);
    try {
      const filteredDays = Object.keys(days).reduce((acc, key) => {
        if (days[key]) acc[key] = true;
        return acc;
      }, {});
      const res = await fetch(AVAILABILITY_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ availability: filteredDays }),
      });
      if (res.ok) {
        showToast("Availability saved!");
        // Fetch latest availability for display
        const getRes = await fetch(AVAILABILITY_URL, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = getRes.ok ? await getRes.json() : null;
        setAvailabilityObj(data?.availability || filteredDays);
        onSuccess && onSuccess();
      } else {
        showToast("Failed to save availability.");
      }
    } catch (e) {
      showToast("Error saving availability.");
    }
    setSaving(false);
  };

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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 20, color: "#334eb8", fontWeight: "bold" }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noUser}>No user found.</Text>
        {errorMsg ? (
          <Text style={{ color: "#e53935", marginTop: 8 }}>{errorMsg}</Text>
        ) : null}
      </View>
    );
  }

  if (!tokenResolved) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 18, color: "#334eb8", fontWeight: "bold" }}>
          Resolving session...
        </Text>
      </View>
    );
  }

  if (!accessToken) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: "#e53935",
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          Session expired
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#334eb8",
            borderRadius: 8,
            paddingHorizontal: 18,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Log in again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Floating Logout Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          zIndex: 100,
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPress={handleLogout}
        accessibilityLabel="Logout"
      >
        <Ionicons name="log-out-outline" size={24} color="#334eb8" />
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.profileTitle}>Hi, {user.fname}!</Text>
          <Image
            source={{
              uri: user.picture || "https://i.pravatar.cc/150",
            }}
            style={styles.avatar}
          />
          {/* Verified/Unverified badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={18}
              color="#e53935"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: "#e53935",
                fontWeight: "bold",
                fontSize: 15,
                marginRight: 8,
              }}
            >
              Unverified
            </Text>
          </View>
          {/* Bio with edit icon out of the screen */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              position: "relative",
              marginBottom: 8,
            }}
          >
            <Text style={styles.bioText}>{user.bio}</Text>
            <TouchableOpacity
              onPress={() => {
                setEditBio(user.bio || "");
                setEditBioModalVisible(true);
              }}
              style={{
                position: "absolute",
                right: 18,
                top: 0,
                padding: 4,
                zIndex: 2,
              }}
            >
              <Ionicons name="create-outline" size={20} color="#334eb8" />
            </TouchableOpacity>
          </View>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === "current" && {
                  ...styles.tabButtonActive,
                  borderBottomWidth: 2,
                  borderBottomColor: "#f55b5f",
                },
              ]}
              onPress={() => setTab("current")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "current" && styles.tabTextActive,
                ]}
              >
                Current Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === "additional" && {
                  ...styles.tabButtonActive,
                  borderBottomWidth: 2,
                  borderBottomColor: "#f55b5f",
                },
              ]}
              onPress={() => setTab("additional")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "additional" && styles.tabTextActive,
                ]}
              >
                Additional Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {tab === "current" ? (
          <>
            <ProfileCard
              color="#D6D6FF"
              label="Personal information"
              values={[
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 8,
                  }}
                  key="name"
                >
                  {iconMap.name}
                  <Text>{user.fname + " " + user.lname}</Text>
                </View>,
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 8,
                  }}
                  key="phone"
                >
                  {iconMap.phone}
                  <Text>{user.phone}</Text>
                </View>,
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 8,
                  }}
                  key="dob"
                >
                  {iconMap.dob}
                  <Text>{user.dob}</Text>
                </View>,
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 8,
                  }}
                  key="gender"
                >
                  {iconMap.gender}
                  <Text>{user.gender}</Text>
                </View>,
                <View
                  style={{ flexDirection: "row", alignItems: "center" }}
                  key="address"
                >
                  {iconMap.address}
                  <Text>{user.address}</Text>
                </View>,
              ]}
              onEdit={() => {
                setEditData({
                  fname: user.fname,
                  lname: user.lname,
                  phone: user.phone,
                  dob: user.dob,
                  gender: user.gender,
                  address: user.address,
                });
                setEditModalVisible(true);
              }}
            />
            <ProfileCard
              color="#A6F7E2"
              label="Emergency Contact"
              values={[
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 8,
                  }}
                  key="emergency"
                >
                  {iconMap.emergency}
                  <Text>{user.emergency_contact}</Text>
                </View>,
                <View
                  style={{ flexDirection: "row", alignItems: "center" }}
                  key="emergency_phone"
                >
                  {iconMap.phone}
                  <Text>{user.emergency_contact_phone}</Text>
                </View>,
              ]}
              onEdit={() => {
                setEditData({
                  emergency_contact: user.emergency_contact,
                  emergency_contact_phone: user.emergency_contact_phone,
                });
                setEditModalVisible(true);
              }}
            />
            <ProfileCard
              color="#fff"
              label="Tax Information"
              values={[
                <View
                  style={{ flexDirection: "row", alignItems: "center" }}
                  key="tfn"
                >
                  {iconMap.tfn}
                  <Text>
                    {user.tfn === null ? "No TFN provided" : user.tfn}
                  </Text>
                </View>,
              ]}
              onEdit={() => {
                setEditData({ tfn: user.tfn });
                setEditModalVisible(true);
              }}
            />
            <ProfileCard
              color="#FFF7C2"
              label="Skills"
              values={
                user.skills && user.skills.length
                  ? user.skills
                  : ["No skills added"]
              }
              onEdit={() => {
                setEditData({ skills: user.skills });
                setEditModalVisible(true);
              }}
            />
          </>
        ) : // --- Additional Details Horizontal Stepper ---
        isEditingAdditional ? (
          <HorizontalStepper
            user={user}
            patchUser={(data) =>
              patchUser(data, () => setIsEditingAdditional(false))
            }
            onDone={() => setIsEditingAdditional(false)}
            onBack={() => setIsEditingAdditional(false)}
            accessToken={accessToken}
          />
        ) : (
          <View style={{ padding: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 22, flex: 1 }}>
                Additional Details
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditingAdditional(true)}
                style={{ padding: 8 }}
              >
                <Ionicons name="create-outline" size={22} color="#334eb8" />
              </TouchableOpacity>
            </View>
            {/* Availability */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather
                  name="clock"
                  size={18}
                  color="#334eb8"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                  Availability
                </Text>
              </View>
              <Text style={{ color: "#888", marginTop: 2 }}>
                Support sessions don't need to fill each time slot completely.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginTop: 8,
                  gap: 8,
                }}
              >
                {availabilityObj && Object.keys(availabilityObj).length > 0 ? (
                  Object.entries(availabilityObj)
                    .filter(([_, value]) => value)
                    .map(([day, value]) => (
                      <View
                        key={day}
                        style={{
                          backgroundColor: "#334eb8",
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          marginRight: 8,
                          marginBottom: 8,
                          minWidth: 80,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 15,
                            textTransform: "capitalize",
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    ))
                ) : (
                  <Text style={{ color: "#bbb", fontStyle: "italic" }}>
                    No availability set.
                  </Text>
                )}
              </View>
            </View>
            {/* Badges */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather
                  name="star"
                  size={18}
                  color="#334eb8"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>Badges</Text>
                {/* <TouchableOpacity onPress={()=>setIsEditingAdditional(true)} style={{marginLeft:8}}>
                    <Text style={{color:'#334eb8', fontWeight:'bold'>Edit</Text>
                  </TouchableOpacity> */}
              </View>
              <View
                style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}
              >
                {(user.badges || []).map((badge, i) => {
                  const badgeMap = {
                    lgbtq: { label: "LGBTQIA+ Friendly", emoji: "🏳️‍🌈" },
                    non_smoker: { label: "Non-Smoker", emoji: "🚭" },
                    pet_friendly: { label: "Pet Friendly", emoji: "🐾" },
                  };
                  const b = badgeMap[badge] || { label: badge, emoji: "" };
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#f7f8fa",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 4 }}>
                        {b.emoji}
                      </Text>
                      <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                        {b.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Vaccinations */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather
                  name="shield"
                  size={18}
                  color="#334eb8"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                  Vaccinations
                </Text>
                {/* <TouchableOpacity onPress={()=>setIsEditingAdditional(true)} style={{marginLeft:8}}>
                    <Text style={{color:'#334eb8', fontWeight:'bold'}}>Edit</Text>
                  </TouchableOpacity> */}
              </View>
              <View style={{ marginTop: 6 }}>
                {(user.vaccinations || []).map((v, i) => {
                  const vacMap = {
                    covid_19: { label: "COVID-19 vaccine", emoji: "💉" },
                    flu: { label: "Seasonal flu vaccine", emoji: "🤧" },
                    tetanus: { label: "Tetanus vaccine", emoji: "🩹" },
                  };
                  const vObj = vacMap[v] || { label: v, emoji: "" };
                  return (
                    <Text key={i} style={{ marginBottom: 2 }}>
                      {vObj.emoji} {vObj.label} -{" "}
                      <Text style={{ color: "#888" }}>Self declared</Text>
                    </Text>
                  );
                })}
              </View>
            </View>
            {/* Services Provided */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}
              >
                <Feather name="briefcase" size={18} color="#334eb8" /> Services
                Provided
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(user.services || []).map((s, i) => {
                  const serviceMap = {
                    everyday: "Everyday Activities Support",
                    self_care: "Self-Care Assistance",
                    nursing: "Skilled Nursing Care",
                    healthcare: "Allied Health Services",
                  };
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#e6edff",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                        {serviceMap[s] || s}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Languages */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}
              >
                <Feather name="globe" size={18} color="#334eb8" /> Languages
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(user.languages || []).map((lang, i) => {
                  const langMap = {
                    english: { label: "English", emoji: "🇬🇧" },
                    spanish: { label: "Spanish", emoji: "🇪🇸" },
                    french: { label: "French", emoji: "🇫🇷" },
                    german: { label: "German", emoji: "🇩🇪" },
                    chinese: { label: "Chinese", emoji: "🇨🇳" },
                    other: { label: "Other", emoji: "🌐" },
                  };
                  const l = langMap[lang] || { label: lang, emoji: "🌐" };
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#e6edff",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 4 }}>
                        {l.emoji}
                      </Text>
                      <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                        {l.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Interests & Hobbies */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}
              >
                <Feather name="heart" size={18} color="#334eb8" /> Interests &
                Hobbies
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(user.interests || []).map((hobby, i) => {
                  const hobbyMap = {
                    cooking: { label: "Cooking", emoji: "🍳" },
                    movies: { label: "Movies", emoji: "🎬" },
                    pets: { label: "Pets", emoji: "🐶" },
                    sports: { label: "Sports", emoji: "🏀" },
                    gardening: { label: "Gardening", emoji: "🌱" },
                    music: { label: "Music", emoji: "🎵" },
                    photography: { label: "Photography", emoji: "📷" },
                    travel: { label: "Travel", emoji: "✈️" },
                    art: { label: "Art", emoji: "🎨" },
                    reading: { label: "Reading", emoji: "📚" },
                    games: { label: "Games", emoji: "🎮" },
                    festivities: { label: "Festivities", emoji: "🎉" },
                    fitness: { label: "Fitness", emoji: "🏋️" },
                  };
                  const h = hobbyMap[hobby] || { label: hobby, emoji: "🎯" };
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#e6edff",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 4 }}>
                        {h.emoji}
                      </Text>
                      <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                        {h.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* My Preferences */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}
              >
                <Feather name="settings" size={18} color="#334eb8" /> My
                Preferences
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(user.preferences || []).map((pref, i) => {
                  const prefMap = {
                    non_smoker: { label: "Non-smoker", emoji: "🚭" },
                    no_pets: { label: "No pets", emoji: "🚫🐾" },
                    male_only: { label: "Male only", emoji: "👨" },
                    female_only: { label: "Female only", emoji: "👩" },
                  };
                  const p = prefMap[pref] || { label: pref, emoji: "⚙️" };
                  return (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#e6edff",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 4 }}>
                        {p.emoji}
                      </Text>
                      <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                        {p.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                width: "90%",
                maxWidth: 400,
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
              >
                Edit Profile
              </Text>
              {Object.keys(editData).map((key) =>
                key !== "skills" ? (
                  <View key={key} style={{ marginBottom: 10 }}>
                    <Text style={{ color: "#888", marginBottom: 2 }}>
                      {key.replace(/_/g, " ")}
                    </Text>
                    <TextInput
                      value={editData[key] || ""}
                      onChangeText={(text) =>
                        setEditData((prev) => ({ ...prev, [key]: text }))
                      }
                      style={{
                        borderWidth: 1,
                        borderColor: "#eee",
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 16,
                      }}
                    />
                  </View>
                ) : (
                  <View key={key} style={{ marginBottom: 10 }}>
                    <Text style={{ color: "#888", marginBottom: 2 }}>
                      Skills (comma separated)
                    </Text>
                    <TextInput
                      value={
                        Array.isArray(editData.skills)
                          ? editData.skills.join(", ")
                          : ""
                      }
                      onChangeText={(text) =>
                        setEditData((prev) => ({
                          ...prev,
                          skills: text
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      style={{
                        borderWidth: 1,
                        borderColor: "#eee",
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 16,
                      }}
                    />
                  </View>
                )
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={{ marginRight: 16 }}
                >
                  <Text style={{ color: "#888" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    patchUser(editData, () => setEditModalVisible(false))
                  }
                  style={{
                    backgroundColor: "#334eb8",
                    borderRadius: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                  }}
                  disabled={saving}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Bio Modal */}
        <Modal
          visible={editBioModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setEditBioModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                width: "90%",
                maxWidth: 400,
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
              >
                Edit Bio
              </Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 16,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
                multiline
                numberOfLines={3}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setEditBioModalVisible(false)}
                  style={{ marginRight: 16 }}
                >
                  <Text style={{ color: "#888" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    patchUser({ bio: editBio }, () =>
                      setEditBioModalVisible(false)
                    )
                  }
                  style={{
                    backgroundColor: "#334eb8",
                    borderRadius: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                  }}
                  disabled={saving}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
      {/* Fixed Bottom Navbar */}
    </View>
  );
};

// --- Additional Details Horizontal Stepper ---
const HorizontalStepper = ({
  user,
  patchUser,
  onDone,
  onBack,
  accessToken,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  // Always initialize detailsData and availabilityObj from user prop
  const [detailsData, setDetailsData] = useState(() => ({
    badges: user.badges || [],
    vaccinations: user.vaccinations || [],
    languages: user.languages || [],
    interests: user.interests || [],
    services: user.services || [],
    preferences: user.preferences || [],
  }));
  // Availability as boolean object for each day
  const [availabilityObj, setAvailabilityObj] = useState(() => {
    // If user.availability is an object, use as is; if array, convert to object
    if (user.availability && !Array.isArray(user.availability))
      return user.availability;
    if (user.availability && Array.isArray(user.availability)) {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const obj = {};
      days.forEach((day) => {
        obj[day] = user.availability.includes(day);
      });
      return obj;
    }
    return {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    };
  });
  const stepperSections = [
    {
      key: "availability",
      label: "Availability",
      icon: <Feather name="clock" size={20} color="#334eb8" />,
      required: true,
    },
    {
      key: "bank",
      label: "Stripe",
      icon: <Feather name="credit-card" size={20} color="#334eb8" />,
    },
    {
      key: "badges",
      label: "Badges",
      icon: <Feather name="star" size={20} color="#334eb8" />,
    },
    {
      key: "vaccination",
      label: "Vaccination",
      icon: <Feather name="shield" size={20} color="#334eb8" />,
    },
    {
      key: "languages",
      label: "Languages",
      icon: <Feather name="globe" size={20} color="#334eb8" />,
    },
    {
      key: "interests",
      label: "Interests & Hobbies",
      icon: <Feather name="heart" size={20} color="#334eb8" />,
    },
    {
      key: "services",
      label: "Services Provided",
      icon: <Feather name="briefcase" size={20} color="#334eb8" />,
      required: true,
    },
    {
      key: "preferences",
      label: "My Preferences",
      icon: <Feather name="settings" size={20} color="#334eb8" />,
      required: true,
    },
  ];
  const customTick = (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#34c759",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AntDesign name="check" size={16} color="#fff" />
    </View>
  );
  const filledCount = stepperSections.filter((s) => {
    if (s.required)
      return (
        detailsData[s.key] &&
        (Array.isArray(detailsData[s.key])
          ? detailsData[s.key].length
          : Object.keys(detailsData[s.key] || {}).length)
      );
    return (
      detailsData[s.key] &&
      (Array.isArray(detailsData[s.key])
        ? detailsData[s.key].length
        : detailsData[s.key])
    );
  }).length;
  // Fix canSave logic: check required fields for filled status
  const canSave = stepperSections
    .filter((s) => s.required)
    .every((s) => {
      if (s.key === "availability") {
        // At least one day must be true
        return Object.values(availabilityObj || {}).some(Boolean);
      }
      const val =
        s.key === "vaccination"
          ? detailsData["vaccinations"]
          : detailsData[s.key];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object") return Object.keys(val || {}).length > 0;
      return !!val;
    });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f8fa",
        borderRadius: 16,
        margin: 12,
        padding: 0,
        minHeight: 420,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ marginRight: 8, padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color="#334eb8" />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 18, color: "#334eb8" }}>
          Edit Additional Details
        </Text>
      </View>
      {/* Horizontal Stepper Bar with dots for required */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: "row",
          paddingVertical: 16,
          paddingHorizontal: 8,
        }}
      >
        {stepperSections.map((section, idx) => (
          <TouchableOpacity
            key={section.key}
            onPress={() => setStepIndex(idx)}
            style={{ alignItems: "center", marginRight: 18 }}
          >
            <View
              style={{
                backgroundColor: stepIndex === idx ? "#334eb8" : "#e6edff",
                borderRadius: 20,
                padding: 8,
                borderWidth: 2,
                borderColor: stepIndex === idx ? "#334eb8" : "#e6edff",
                position: "relative",
              }}
            >
              {React.cloneElement(section.icon, {
                color: stepIndex === idx ? "#fff" : "#334eb8",
              })}
              {section.required && (
                <View
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: "#e53935",
                  }}
                />
              )}
            </View>
            <Text
              style={{
                fontWeight: stepIndex === idx ? "bold" : "normal",
                color: stepIndex === idx ? "#334eb8" : "#222",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Step Content */}
      <View style={{ flex: 1, padding: 18, justifyContent: "center" }}>
        {/* Availability */}
        {stepIndex === 0 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="clock" size={20} color="#334eb8" /> Availability
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={{
                    borderWidth: 1,
                    borderColor: availabilityObj?.[day] ? "#334eb8" : "#eee",
                    borderRadius: 10,
                    padding: 12,
                    margin: 6,
                    backgroundColor: availabilityObj?.[day]
                      ? "#e6edff"
                      : "#fff",
                    minWidth: 100,
                    alignItems: "center",
                  }}
                  onPress={() =>
                    setAvailabilityObj((prev) => ({
                      ...prev,
                      [day]: !prev?.[day],
                    }))
                  }
                >
                  <Text
                    style={{ fontWeight: "bold", color: "#222", fontSize: 16 }}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {/* Stripe Details */}
        {stepIndex === 1 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="credit-card" size={20} color="#5167FC" /> Stripe
              Onboarding
            </Text>
            {/* Stripe Onboarding Logic */}
            <StripeOnboardingSection user={user} accessToken={accessToken} />
          </View>
        )}
        {/* Badges */}
        {stepIndex === 2 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="star" size={20} color="#334eb8" /> Badges
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[
                { key: "lgbtq", label: "LGBTQIA+", emoji: "🏳️‍🌈" },
                { key: "non_smoker", label: "Non Smoker", emoji: "🚭" },
                { key: "pet_friendly", label: "Pet Friendly", emoji: "🐾" },
              ].map((badge) => (
                <TouchableOpacity
                  key={badge.key}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.badges?.includes(badge.key)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 12,
                    padding: 18,
                    margin: 6,
                    backgroundColor: detailsData.badges?.includes(badge.key)
                      ? "#e6edff"
                      : "#fff",
                    alignItems: "center",
                    minWidth: 110,
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      badges: prev.badges?.includes(badge.key)
                        ? prev.badges.filter((b) => b !== badge.key)
                        : [...(prev.badges || []), badge.key],
                    }))
                  }
                >
                  <Text style={{ fontSize: 28 }}>{badge.emoji}</Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: "#222",
                      fontSize: 16,
                      marginTop: 6,
                    }}
                  >
                    {badge.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {/* Vaccinations */}
        {stepIndex === 3 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="shield" size={20} color="#334eb8" /> Vaccinations
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[
                { key: "covid_19", label: "COVID-19 Vaccine", emoji: "💉" },
                { key: "flu", label: "Flu Vaccine", emoji: "🤧" },
                { key: "tetanus", label: "Tetanus Vaccine", emoji: "🩹" },
              ].map((vac) => (
                <TouchableOpacity
                  key={vac.key}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.vaccinations?.includes(vac.key)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 12,
                    padding: 18,
                    margin: 6,
                    backgroundColor: detailsData.vaccinations?.includes(vac.key)
                      ? "#e6edff"
                      : "#fff",
                    alignItems: "center",
                    minWidth: 130,
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      vaccinations: prev.vaccinations?.includes(vac.key)
                        ? prev.vaccinations.filter((v) => v !== vac.key)
                        : [...(prev.vaccinations || []), vac.key],
                    }))
                  }
                >
                  <Text style={{ fontSize: 28 }}>{vac.emoji}</Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: "#222",
                      fontSize: 16,
                      marginTop: 6,
                    }}
                  >
                    {vac.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View
              style={{
                marginTop: 18,
                backgroundColor: "#f7f8fa",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ fontWeight: "bold", color: "#334eb8" }}>
                Why Vaccination?
              </Text>
              <Text style={{ marginTop: 4, color: "#444" }}>
                • COVID-19 and flu vaccines help protect you and residents.\n•
                Most Aged Care Organisations require these vaccinations for
                staff.
              </Text>
            </View>
          </View>
        )}
        {/* Languages */}
        {stepIndex === 4 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="globe" size={20} color="#334eb8" /> Languages
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                "english",
                "spanish",
                "french",
                "german",
                "chinese",
                "other",
              ].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.languages?.includes(lang)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    margin: 6,
                    backgroundColor: detailsData.languages?.includes(lang)
                      ? "#334eb8"
                      : "#fff",
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      languages: prev.languages?.includes(lang)
                        ? prev.languages.filter((l) => l !== lang)
                        : [...(prev.languages || []), lang],
                    }))
                  }
                >
                  <Text
                    style={{
                      color: detailsData.languages?.includes(lang)
                        ? "#fff"
                        : "#334eb8",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {/* Interests & Hobbies */}
        {stepIndex === 5 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="heart" size={20} color="#334eb8" /> Interests &
              Hobbies
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { key: "cooking", label: "Cooking", icon: "🍳" },
                { key: "movies", label: "Movies", icon: "🎬" },
                { key: "pets", label: "Pets", icon: "🐶" },
                { key: "sports", label: "Sports", icon: "🏀" },
                { key: "gardening", label: "Gardening", icon: "🌱" },
                { key: "music", label: "Music", icon: "🎵" },
                { key: "photography", label: "Photography", icon: "📷" },
                { key: "travel", label: "Travel", icon: "✈️" },
                { key: "art", label: "Art", icon: "🎨" },
                { key: "reading", label: "Reading", icon: "📚" },
                { key: "games", label: "Games", icon: "🎮" },
                { key: "festivities", label: "Festivities", icon: "🎉" },
                { key: "fitness", label: "Fitness", icon: "🏋️" },
              ].map((hobby) => (
                <TouchableOpacity
                  key={hobby.key}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.interests?.includes(hobby.key)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 12,
                    padding: 14,
                    margin: 6,
                    backgroundColor: detailsData.interests?.includes(hobby.key)
                      ? "#e6edff"
                      : "#fff",
                    alignItems: "center",
                    minWidth: 90,
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      interests: prev.interests?.includes(hobby.key)
                        ? prev.interests.filter((h) => h !== hobby.key)
                        : [...(prev.interests || []), hobby.key],
                    }))
                  }
                >
                  <Text style={{ fontSize: 22 }}>{hobby.icon}</Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: "#222",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {hobby.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {/* Services Provided */}
        {stepIndex === 6 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="briefcase" size={20} color="#334eb8" /> Services
              Provided
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { key: "everyday", label: "Everyday Activities Support" },
                { key: "self_care", label: "Self-Care Assistance" },
                { key: "nursing", label: "Skilled Nursing Care" },
                { key: "healthcare", label: "Allied Health Services" },
              ].map((service) => (
                <TouchableOpacity
                  key={service.key}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.services?.includes(service.key)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    margin: 6,
                    backgroundColor: detailsData.services?.includes(service.key)
                      ? "#334eb8"
                      : "#fff",
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      services: prev.services?.includes(service.key)
                        ? prev.services.filter((s) => s !== service.key)
                        : [...(prev.services || []), service.key],
                    }))
                  }
                >
                  <Text
                    style={{
                      color: detailsData.services?.includes(service.key)
                        ? "#fff"
                        : "#334eb8",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    {service.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View
              style={{
                marginTop: 18,
                backgroundColor: "#e6edff",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ fontWeight: "bold", color: "#334eb8" }}>
                Informational message
              </Text>
              <Text style={{ marginTop: 4, color: "#444" }}>
                Some additional text to explain said message.
              </Text>
            </View>
          </View>
        )}
        {/* My Preferences */}
        {stepIndex === 7 && (
          <View>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}
            >
              <Feather name="settings" size={20} color="#334eb8" /> My
              Preferences
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { key: "non_smoker", label: "Non-smoker", icon: "🛡️" },
                { key: "no_pets", label: "No pets", icon: "🟡" },
                { key: "male_only", label: "Male only", icon: "👨" },
                { key: "female_only", label: "Female only", icon: "👩" },
              ].map((pref) => (
                <TouchableOpacity
                  key={pref.key}
                  style={{
                    borderWidth: 1,
                    borderColor: detailsData.preferences?.includes(pref.key)
                      ? "#334eb8"
                      : "#eee",
                    borderRadius: 12,
                    padding: 18,
                    margin: 6,
                    backgroundColor: detailsData.preferences?.includes(pref.key)
                      ? "#e6edff"
                      : "#fff",
                    alignItems: "center",
                    minWidth: 110,
                  }}
                  onPress={() =>
                    setDetailsData((prev) => ({
                      ...prev,
                      preferences: prev.preferences?.includes(pref.key)
                        ? prev.preferences.filter((p) => p !== pref.key)
                        : [...(prev.preferences || []), pref.key],
                    }))
                  }
                >
                  <Text style={{ fontSize: 22 }}>{pref.icon}</Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: "#222",
                      fontSize: 15,
                      marginTop: 6,
                    }}
                  >
                    {pref.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 32,
          }}
        >
          <TouchableOpacity
            disabled={stepIndex === 0}
            onPress={() => setStepIndex((i) => i - 1)}
            style={{
              opacity: stepIndex === 0 ? 0.5 : 1,
              backgroundColor: "#eee",
              borderRadius: 8,
              paddingHorizontal: 18,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#222", fontWeight: "bold" }}>Previous</Text>
          </TouchableOpacity>
          {stepIndex < stepperSections.length - 1 ? (
            <TouchableOpacity
              onPress={() => setStepIndex((i) => i + 1)}
              style={{
                backgroundColor: "#334eb8",
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                if (canSave) {
                  await patchUser(
                    { ...detailsData, vaccinations: detailsData.vaccinations },
                    () => {
                      onDone && onDone();
                    }
                  );
                  // PATCH availability as boolean object
                  await patchAvailability(availabilityObj, async () => {
                    // After save, GET latest availability
                    const getRes = await fetch(AVAILABILITY_URL, {
                      headers: {
                        Authorization: `Bearer ${user.access_token || ""}`,
                      },
                    });
                    const data = getRes.ok ? await getRes.json() : null;
                    setAvailabilityObj(data?.availability || availabilityObj);
                    onDone && onDone();
                  });
                }
              }}
              style={{
                backgroundColor: canSave ? "#34c759" : "#ccc",
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
              disabled={!canSave}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const ProfileCard = ({ color, label, values, onEdit }) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardLabel}>{label}</Text>
      {label === "Skills" ? (
        <View style={styles.skillsContainer}>
          {values && values.length && values[0] !== "No skills added" ? (
            values.map((skill, i) => (
              <View key={i} style={styles.skillBlob}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardValue}>No skills added</Text>
          )}
        </View>
      ) : (
        values.map((v, i) =>
          typeof v === "string" || typeof v === "number" ? (
            <Text key={i} style={styles.cardValue}>
              {v}
            </Text>
          ) : (
            v
          )
        )
      )}
    </View>
    <TouchableOpacity style={styles.editIconBtn} onPress={onEdit}>
      <Ionicons name="create-outline" size={22} color="#222" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    alignSelf: "flex-start",
    marginLeft: 24,
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#eee",
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: "#334eb8",
  },
  tabText: {
    color: "#888",
    fontWeight: "bold",
    fontSize: 16,
  },
  tabTextActive: {
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },
  cardValue: {
    color: "#222",
    fontSize: 16,
    marginBottom: 2,
  },
  editIconBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  bioText: {
    color: "#666",
    fontSize: 16,
    textAlign: "left",
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 5,
  },
  emptySection: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  noUser: { fontSize: 18, color: "#888" },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  skillBlob: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFD500",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  skillText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ProfileScreen;
