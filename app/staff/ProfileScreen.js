export let staffServices = [];
import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import auth0Config from "../auth0Config";

const API_URL = "https://api.theopenshift.com/v1/users/me";
const PATCH_URL = "https://api.theopenshift.com/v1/users/user";
const AVAILABILITY_URL = "https://api.theopenshift.com/v1/users/availability";
// Define the photo upload URL
const UPLOAD_PHOTO_URL = "https://img.theopenshift.com/v1/upload/"; //

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
      const data = await res.json();
      console.log("Stripe onboarding API response:", data);
      if (!res.ok || !data.url)
        throw new Error(data?.message || "Could not fetch onboarding link");
      setOnboardLink(data.url.trim());
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
            try {
              // Use the onboardLink from state, which is a string
              const url = onboardLink.trim();
              if (!url) {
                setError("No onboarding URL returned.");
                return;
              }
              await Linking.openURL(url);
            } catch (e) {
              setError("Cannot open this link on your device.");
              console.log("Error opening onboarding link:", e);
            }
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Open Stripe Dashboard
          </Text>
        </TouchableOpacity>
        {error ? (
          <Text style={{ color: "#e53935", marginTop: 8, textAlign: "center" }}>
            {error}
          </Text>
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
  //Pull to refesh functionality
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    // Re-fetch user and availability data
    try {
      // Fetch user
      const userRes = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = userRes.ok ? await userRes.json() : null;
      setUser(userData);

      // Fetch availability
      const availRes = await fetch(AVAILABILITY_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const availData = availRes.ok ? await availRes.json() : null;
      setAvailabilityObj(availData?.availability || null);
    } catch (e) {
      // Optionally handle error
    }
    setRefreshing(false);
  };
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profileCardExpanded, setProfileCardExpanded] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      SecureStore.setItemAsync("accessToken", "dev-token");
    }
  }, []);

  useEffect(() => {
    if (user) {
      staffServices = user.services || [];
    }
  }, [user]);

  const AUTH0_DOMAIN = auth0Config.domain;

  //Auth0 Data of the User - for now just to check the email verification
  const fetchAuth0Profile = async (accessToken) => {
    try {
      const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch Auth0 profile");
      return await res.json();
    } catch (e) {
      console.log("Auth0 profile fetch error:", e);
      return null;
    }
  };
  //Profile Complete Card
  const availabilityComplete =
    availabilityObj && Object.values(availabilityObj).some(Boolean);
  const stripeComplete = user?.charges_enabled;
  const [auth0Profile, setAuth0Profile] = useState(null);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      const profile = await fetchAuth0Profile(accessToken);
      setAuth0Profile(profile);
    })();
  }, [accessToken]);

  const emailVerified = auth0Profile?.email_verified;
  console.log("Email verified:", emailVerified);
  const bgvComplete = false;
  // Show card only if not all complete
  const allComplete =
    availabilityComplete && stripeComplete && emailVerified && bgvComplete;

  // Profile Complete Card
  const ProfileCompletionCard = ({
    availabilityComplete,
    stripeComplete,
    emailVerified,
    bgvComplete,
    onPressAvailability,
    onPressStripe,
    onPressEmail,
    onPressBGV,
    expanded,
    setExpanded,
  }) => (
    <View
      style={{
        backgroundColor: "#fff5f5",
        borderColor: "#e53935",
        borderWidth: 1,
        borderRadius: 16,
        padding: 18,
        margin: 16,
        marginBottom: 0,
        shadowColor: "#e53935",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        width: "auto", //can also be 100%
        alignSelf: "stretch",
      }}
    >
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="alert-circle"
          size={22}
          color="#e53935"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: "#e53935", fontWeight: "bold", fontSize: 18 }}>
          Profile Incomplete!
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#e53935"
          style={{ marginLeft: "auto" }}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={{ marginTop: 10 }}>
          {[
            {
              label: "Availability",
              complete: availabilityComplete,
              onPress: onPressAvailability,
              action: "View",
            },
            {
              label: "Stripe Onboarding",
              complete: stripeComplete,
              onPress: onPressStripe,
              action: "View",
            },
            {
              label: "Email Verification",
              complete: emailVerified,
              onPress: onPressEmail,
              action: "View",
            },
            {
              label: "Background Verification",
              complete: bgvComplete,
              onPress: onPressBGV,
              action: bgvComplete ? "View" : "Complete",
            },
          ].map((item, idx) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: idx === 3 ? 0 : 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {item.complete ? (
                  <AntDesign
                    name="checkcircle"
                    size={20}
                    color="#34c759"
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Feather
                    name="circle"
                    size={20}
                    color="#bbb"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={{
                    color: item.complete ? "#222" : "#888",
                    fontWeight: item.complete ? "bold" : "normal",
                    textDecorationLine: item.complete ? "none" : "line-through",
                    fontSize: 16,
                  }}
                >
                  {item.label}
                </Text>
              </View>
              <TouchableOpacity onPress={item.onPress} disabled={item.complete}>
                <Text
                  style={{
                    color: item.complete ? "#bbb" : "#334eb8",
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >
                  {item.action}{" "}
                  <Feather
                    name="arrow-right"
                    size={15}
                    color={item.complete ? "#bbb" : "#334eb8"}
                  />
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

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

  // Fetch user details when accessToken changes (redundant with useFocusEffect & tokenResolved useEffect, but kept for existing logic flow)
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

  // Fetch availability separately and ensure correct token and user_id usage (redundant, see above useEffect)
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
      const { availability, ...dataWithoutAvailability } = data; // Availability is patched separately
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
        setUser(updated); // Update user state with patched data
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

  const patchAvailability = async (daysObj, onSuccess) => {
    setSaving(true);
    try {
      const allDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const payload = {};
      allDays.forEach((day) => {
        payload[day] = !!daysObj[day];
      });

      console.log("PATCHING AVAILABILITY:", payload);

      const res = await fetch(AVAILABILITY_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("PATCH response status:", res.status);

      if (res.ok) {
        showToast("Availability saved!");
        // ...rest of your code...
      } else {
        const errorText = await res.text();
        console.log("PATCH error response:", errorText);
        showToast("Failed to save availability.");
      }
    } catch (e) {
      console.log("PATCH exception:", e);
      showToast("Error saving availability.");
    }
    setSaving(false);
  };

  const auth0Id = user?.user_id; // <-- use user_id from your user object
  const userId = auth0Id ? auth0Id.replace(/^auth0\|/, "") : null;
  const dynamicProfileUrl = userId
    ? `https://img.theopenshift.com/profile/${userId}.webp`
    : null;
  //console.log("auth0Id:", auth0Id);
  //console.log("userId:", userId);
  console.log("dynamicProfileUrl:", dynamicProfileUrl);

  const handleProfilePhotoChange = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable media library permissions to upload photos."
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUploading(true);
        const selectedImageUri = result.assets[0].uri;
        if (!accessToken) {
          Alert.alert("Authentication Error", "No access token found.");
          return;
        }

        const formData = new FormData();
        formData.append("file", {
          uri: selectedImageUri,
          name: "profile_photo.jpg",
          type: "image/jpeg",
        });

        const res = await fetch("https://img.theopenshift.com/v1/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });
        const data = await res.json();
        console.log("Upload response data:", data);
        if (data.image_url) {
          showToast("Profile photo uploaded!");
        } else if (data.detail) {
          Alert.alert("Upload Error", data.detail); // Show backend error
        } else {
          Alert.alert("Upload Error", "No image_url in response.");
        }
      }
    } catch (e) {
      console.log("Upload error:", e);
      Alert.alert("Upload Error", "Could not upload image.");
    } finally {
      setPhotoUploading(false);
    }
  };
  //For Design element
  const screenWidth = Dimensions.get("window").width;
  const semiCircleOverflow = 48;

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
    if (__DEV__) {
      // In development, don't auto-logout, just show a warning
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
            No access token found (dev mode)
          </Text>
          <Text style={{ color: "#888", marginBottom: 16 }}>
            You are in development mode. Auto-logout is disabled.
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
    // Production: auto-logout as before
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
    <View style={{ flex: 1, position: "relative", backgroundColor: "#fff" }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: -semiCircleOverflow,
          width: screenWidth + semiCircleOverflow * 2,
          zIndex: 0,
        }}
      >
        <Svg
          width={screenWidth + semiCircleOverflow * 2}
          height={(screenWidth + semiCircleOverflow * 2) / 2}
          viewBox={`0 0 ${screenWidth + semiCircleOverflow * 2} ${
            (screenWidth + semiCircleOverflow * 2) / 2
          }`}
        >
          <Path
            d={`
        M0,0
        A${(screenWidth + semiCircleOverflow * 2) / 2},${
              (screenWidth + semiCircleOverflow * 2) / 2
            } 0 0,1 ${screenWidth + semiCircleOverflow * 2},0
        A${(screenWidth + semiCircleOverflow * 2) / 2},${
              (screenWidth + semiCircleOverflow * 2) / 2
            } 0 0,1 0,0
        Z
      `}
            fill="#ffbd59"
          />
        </Svg>
      </View>

      {/* Floating Logout Button (REMAINS ON TOP) 
    <TouchableOpacity
      style={{
        position: "absolute",
        top: 30,
        right: 25,
        zIndex: 100, // Higher zIndex to ensure it's on top
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
    </TouchableOpacity>*/}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: screenWidth / 6,
          paddingBottom: 100,
          backgroundColor: "transparent",
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#334eb8"]}
          />
        }
      >
        <View style={[styles.header, { backgroundColor: "transparent" }]}>
          <Text style={styles.profileTitle}>Hi, {user.fname}! 👋🏻</Text>
          {/* Avatar with Upload Button */}
          <View style={styles.avatarContainer}>
            <Image
              source={
                dynamicProfileUrl
                  ? { uri: dynamicProfileUrl }
                  : require("../../assets/images/default-avatar.png")
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              onPress={handleProfilePhotoChange}
              style={styles.cameraButton}
              disabled={photoUploading}
            >
              {photoUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {/* Verified/Unverified badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            {!allComplete && (
              <ProfileCompletionCard
                availabilityComplete={availabilityComplete}
                stripeComplete={stripeComplete}
                emailVerified={emailVerified}
                bgvComplete={bgvComplete}
                onPressAvailability={() => {
                  setTab("additional");
                  setIsEditingAdditional(true);
                }}
                onPressStripe={() => {
                  setTab("additional");
                  setIsEditingAdditional(true);
                }}
                onPressEmail={() => {
                  // Optionally show info or open email app
                }}
                onPressBGV={() => {
                  if (!bgvComplete) {
                    navigation.navigate("Compliance");
                  }
                  // Optionally handle "View" if bgvComplete is true
                }}
                expanded={profileCardExpanded}
                setExpanded={setProfileCardExpanded}
              />
            )}
          </View>
          {/* Bio with edit icon out of the screen */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: 8,
              paddingHorizontal: 24,
            }}
          >
            <Text style={[styles.bioText, { flex: 1, marginBottom: 0 }]}>
              {user.bio}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setEditBio(user.bio || "");
                setEditBioModalVisible(true);
              }}
              style={{
                marginLeft: 8,
                padding: 4,
                alignSelf: "flex-start",
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
                  borderBottomWidth: 1,
                  borderBottomColor: "#021870",
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
                  borderBottomWidth: 1,
                  borderBottomColor: "#021870",
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
              color="#ebeff8"
              label="Personal Information"
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
              color="#ebeff8"
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
              color="#ebeff8"
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
            key={JSON.stringify(user.availability)}
            user={{ ...user, availability: availabilityObj }}
            patchUser={(data) =>
              patchUser(data, () => setIsEditingAdditional(false))
            }
            patchAvailability={patchAvailability}
            onDone={() => setIsEditingAdditional(false)}
            onBack={() => setIsEditingAdditional(false)}
            accessToken={accessToken}
            setParentAvailabilityObj={setAvailabilityObj}
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather
                  name="star"
                  size={18}
                  color="#334eb8"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>Badges</Text>
                {/* <TouchableOpacity onPress={()=>setIsEditingAdditional(true)} style={{marginLeft:8}>
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
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
                {/* <TouchableOpacity onPress={()=>setIsEditingAdditional(true)} style={{marginLeft:8}>
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}
              >
                <Feather name="briefcase" size={18} color="#334eb8" /> Services
                Provided
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(user.services || []).map((s, i) => {
                  const serviceMap = {
                    //everyday: "Everyday Activities Support",
                    self_care: "Personal Care Worker",
                    nursing: "Skilled Nursing Care",
                    //healthcare: "Allied Health Services",
                  };
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
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
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#e6edff",
                borderRadius: 16,
                padding: 16,
              }}
            >
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
  patchAvailability,
  onBack,
  accessToken,
  setParentAvailabilityObj,
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

  useEffect(() => {
    if (user.availability && !Array.isArray(user.availability)) {
      setAvailabilityObj(user.availability);
    } else if (user.availability && Array.isArray(user.availability)) {
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
      setAvailabilityObj(obj);
    }
  }, [user.availability]);

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
                //{ key: "everyday", label: "Everyday Activities Support" },
                { key: "self_care", label: "Personal Care Assistance" },
                { key: "nursing", label: "Skilled Nursing Care" },
                //{ key: "healthcare", label: "Allied Health Services" },
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
              <Text style={{ fontWeight: "bold", color: "#334eb8" }}>Note</Text>
              <Text style={{ marginTop: 4, color: "#444" }}>
                The Service type you select requires a valid certification.
                Changing the Service Type is possible only by contacting
                support.
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
                        Authorization: `Bearer ${accessToken || ""}`,
                      },
                    });
                    const data = getRes.ok ? await getRes.json() : null;
                    setAvailabilityObj(data?.availability || availabilityObj);
                    if (typeof setParentAvailabilityObj === "function") {
                      setParentAvailabilityObj(
                        data?.availability || availabilityObj
                      );
                    }
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
    backgroundColor: "#fe7239",
    borderRadius: 16,
    padding: 16,
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    alignSelf: "flex-start",
    marginLeft: 24,
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#eee",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#334eb8",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 5,
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
    textAlign: "justify",
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
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
