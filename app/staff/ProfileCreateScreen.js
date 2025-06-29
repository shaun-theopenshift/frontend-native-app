import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  AU_STATES_SUBURBS,
  AU_STATE_LABELS,
} from "../../assets/au-states-suburbs";
import auFlag from "../../assets/images/au-flag.png";

import LottieView from "lottie-react-native";
import GeoapifyAutocomplete from "../components/GeoapifyAutocomplete";

const API_URL = "https://api.theopenshift.com/v1/users/user";

const { width } = Dimensions.get("window");

const steps = [
  { key: "greeting", label: "Greeting" },
  { key: "profile", label: "Profile Info" }, // photo, bio, first, last
  { key: "address", label: "Address" },
  { key: "details", label: "Details" }, // birthday, gender, phone
  { key: "skills", label: "Skills" },
  { key: "emergency", label: "Emergency" },
  { key: "review", label: "Review" },
];

const ProfileCreateScreen = ({ route }) => {
  const navigation = useNavigation();
  // Try to get accessToken from route.params first, then fallback to state
  const initialToken = route?.params?.access_token || null;
  const [accessToken, setAccessToken] = useState(initialToken);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    profile_photo: null,
    about: "",
    fname: "",
    lname: "",
    address: "",
    state: "",
    suburb: "",
    dob: "",
    gender: "",
    phone: "",
    skills: [],
    emergency_contact: "",
    emergency_contact_phone: "",
    tfn: "",
    role: "user",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [anim] = useState(new Animated.Value(0));

  // Always get the latest access token from SecureStore
  useEffect(() => {
    // If we already have a token from route, don't overwrite it
    if (!accessToken) {
      const getToken = async () => {
        const token = await SecureStore.getItemAsync("access_token");
        setAccessToken(token);
      };
      getToken();
    }
  }, [accessToken]);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("user");
    } catch (e) {}
    navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
  };

  const handleNext = () => {
    Animated.timing(anim, {
      toValue: step + 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setStep((s) => Math.min(s + 1, steps.length - 1)));
  };
  const handlePrev = () => {
    Animated.timing(anim, {
      toValue: step - 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setStep((s) => Math.max(s - 1, 0)));
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setForm((f) => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Always get the latest access token: prefer route param, then SecureStore
    let latestToken = accessToken;
    if (!latestToken && route?.params?.access_token) {
      latestToken = route.params.access_token;
      setAccessToken(latestToken);
    }
    if (!latestToken) {
      latestToken = await SecureStore.getItemAsync("access_token");
      setAccessToken(latestToken);
    }
    if (!latestToken) {
      setLoading(false);
      Alert.alert("Error", "You are not logged in. Please log in again.");
      navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
      return;
    }
    const genderValue = form.gender ? form.gender.toLowerCase() : null;
    const payload = {
      fname: form.fname || null,
      lname: form.lname || null,
      address: form.address || null,
      suburb: form.suburb || null,
      dob: form.dob || null,
      gender: genderValue,
      phone: form.phone || null,
      bio: form.about || null,
      emergency_contact: form.emergency_contact || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      skills: form.skills || [],
      badges: [],
      vaccinations: [],
      languages: [],
      interests: [],
      preferences: [],
      services: [],
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${latestToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert("Success", "Profile created successfully!", [
          { text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "Profile", params: { access_token: latestToken } }] }) }
        ]);
      } else {
        const errorText = await res.text();
        Alert.alert("Error", `Failed to create profile.\n${errorText}`);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create profile.");
    }
    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setForm((f) => ({
        ...f,
        profile_photo: `data:image/jpeg;base64,${result.assets[0].base64}`,
      }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fcf4f2" }}>
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#334eb8" />
      </TouchableOpacity>
      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.dot, step === i && styles.activeDot]} />
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {step === 0 && (
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#334eb8",
                marginBottom: 16,
              }}
            >
              Hi!
            </Text>
            <Text style={{ fontSize: 25, color: "#555", textAlign: "center" }}>
              Let's get you started.
            </Text>
            <LottieView
              source={require("../../assets/lotties/hi_animation.json")}
              autoPlay
              loop
              style={{ width: 400, height: 400 }}
            />
            <Text style={{ fontSize: 18, color: "#555", textAlign: "center" }}>
              A little info goes a long way in helping us serve you better.
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#334eb8",
                textAlign: "center",
                fontWeight: "bold",
                paddingTop: 15,
              }}
            >
              Think of it like setting up your profile — quick, easy, and all
              about you.
            </Text>
          </View>
        )}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={{ alignItems: "center", marginBottom: 18 }}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarCircle}>
                {form.profile_photo ? (
                  <Image
                    source={{ uri: form.profile_photo }}
                    style={styles.avatar}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={150}
                    color="#bbb"
                  />
                )}
              </TouchableOpacity>
              <Text
                style={{ color: "#888", marginTop: 8, textAlign: "center" }}
              >
                Upload a professional photo of yourself. This will be visible to
                the Aged Care Organisations.
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { minHeight: 60, textAlignVertical: "top" },
              ]}
              placeholder="Bio (About Me)"
              value={form.about}
              onChangeText={(v) => setForm((f) => ({ ...f, about: v }))}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={form.fname}
              onChangeText={(v) => setForm((f) => ({ ...f, fname: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={form.lname}
              onChangeText={(v) => setForm((f) => ({ ...f, lname: v }))}
            />
            <LottieView
              source={require("../../assets/lotties/personal_info_lottie.json")}
              autoPlay
              loop
              style={{
                width: 350,
                height: 350,
                alignSelf: "center",
                marginTop: -60,
              }}
            />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Where do you live?</Text>
            <Text style={styles.label}>Address</Text>
            {/* Address Autocomplete */}
            <GeoapifyAutocomplete
              apiKey={"4195db721fdd4b71bae0b85ead1327c3"}
              value={form.address}
              onSelect={(item) => {
                setForm((f) => ({
                  ...f,
                  address: item.formatted,
                  // Optionally auto-fill suburb/state if available from item
                  suburb: item.city || f.suburb,
                  state: item.state_code || f.state,
                }));
              }}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.label}>State</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={{ marginBottom: 10 }}
            >
              {Object.entries(AU_STATE_LABELS).map(([code, label]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.stateBtn,
                    form.state === code && styles.stateBtnActive,
                  ]}
                  onPress={() =>
                    setForm((f) => ({ ...f, state: code, suburb: "" }))
                  }
                >
                  <Text
                    style={{ color: form.state === code ? "#fff" : "#334eb8" }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {form.state ? (
              <>
                <Text style={styles.label}>Suburb</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={{ marginBottom: 10 }}
                >
                  {AU_STATES_SUBURBS[form.state].map((suburb) => (
                    <TouchableOpacity
                      key={suburb}
                      style={[
                        styles.stateBtn,
                        form.suburb === suburb && styles.stateBtnActive,
                      ]}
                      onPress={() => setForm((f) => ({ ...f, suburb }))}
                    >
                      <Text
                        style={{
                          color: form.suburb === suburb ? "#fff" : "#334eb8",
                        }}
                      >
                        {suburb}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <LottieView
                  source={require("../../assets/lotties/address_lottie.json")}
                  autoPlay
                  loop
                  style={{
                    width: 300,
                    height: 300,
                    alignSelf: "center",
                    marginTop: 50,
                  }}
                />
              </>
            ) : null}
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>Your Details</Text>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: form.dob ? "#222" : "#aaa" }}>
                {form.dob || "Select date of birth"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.dob ? new Date(form.dob) : new Date()}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date)
                    setForm((f) => ({
                      ...f,
                      dob: date.toISOString().split("T")[0],
                    }));
                }}
                maximumDate={new Date()}
              />
            )}
            <Text style={styles.label}>Gender</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {["Male", "Female", "Other"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.stateBtn,
                    form.gender === gender && styles.stateBtnActive,
                  ]}
                  onPress={() => setForm((f) => ({ ...f, gender }))}
                >
                  <Text
                    style={{
                      color: form.gender === gender ? "#fff" : "#334eb8",
                    }}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Phone Number</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={auFlag}
                style={{
                  width: 32,
                  height: 20,
                  marginRight: 8,
                  borderRadius: 4,
                }}
              />
              <Text style={{ fontSize: 16, marginRight: 4 }}>+61</Text>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Phone Number"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
              />
            </View>
            <LottieView
                  source={require("../../assets/lotties/your_details.json")}
                  autoPlay
                  loop
                  style={{
                    width: 300,
                    height: 300,
                    alignSelf: "center",
                    marginTop: 50,
                  }}
                />
            
          </>
        )}
        {step === 4 && (
          <>
            <Text style={styles.sectionTitle}>
              What are your healthcare skills?
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Type a skill and press Enter"
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={handleAddSkill}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddSkill}
                style={styles.addSkillBtn}
              >
                <Ionicons name="add-circle-outline" size={28} color="#334eb8" />
              </TouchableOpacity>
            </View>
            <View style={styles.skillsList}>
              {form.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillItem}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
            <LottieView
                  source={require("../../assets/lotties/skills_lottie.json")}
                  autoPlay
                  loop
                  style={{
                    width: 350,
                    height: 350,
                    alignSelf: "center",
                    marginTop: 150,
                  }}
                />
          </>
        )}
        {step === 5 && (
          <>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Emergency Contact Name"
              value={form.emergency_contact}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, emergency_contact: v }))
              }
            />
            <Text style={styles.label}>Phone Number</Text>
            <View style={{ flexDirection: "row", alignItems: "center"}}>
              <Image
                source={auFlag}
                style={{
                  width: 32,
                  height: 20,
                  marginRight: 8,
                  borderRadius: 4,
                }}
              />
              <Text style={{ fontSize: 16, marginRight: 4 }}>+61</Text>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Emergency Contact Phone"
                value={form.emergency_contact_phone}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, emergency_contact_phone: v }))
                }
                keyboardType="phone-pad"
              />
            </View>
            <LottieView
                  source={require("../../assets/lotties/emergency_lottie.json")}
                  autoPlay
                  loop
                  style={{
                    width: 400,
                    height: 400,
                    alignSelf: "center",
                    marginTop: 100,
                  }}
                />
          </>
        )}
        {step === 6 && (
          <>
            <Text style={styles.sectionTitle}>Review & Submit</Text>
            <View style={styles.reviewBox}>
              <Text style={styles.reviewLabel}>
                First Name: <Text style={styles.reviewValue}>{form.fname}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Last Name: <Text style={styles.reviewValue}>{form.lname}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Address: <Text style={styles.reviewValue}>{form.address}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                State:{" "}
                <Text style={styles.reviewValue}>
                  {AU_STATE_LABELS[form.state]}
                </Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Suburb: <Text style={styles.reviewValue}>{form.suburb}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                DOB: <Text style={styles.reviewValue}>{form.dob}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Gender: <Text style={styles.reviewValue}>{form.gender}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Phone: <Text style={styles.reviewValue}>{form.phone}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Skills:{" "}
                <Text style={styles.reviewValue}>{form.skills.join(", ")}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                About: <Text style={styles.reviewValue}>{form.about}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Emergency Contact:{" "}
                <Text style={styles.reviewValue}>{form.emergency_contact}</Text>
              </Text>
              <Text style={styles.reviewLabel}>
                Emergency Phone:{" "}
                <Text style={styles.reviewValue}>
                  {form.emergency_contact_phone}
                </Text>
              </Text>
            </View>
            <Text
              style={{
                textAlign: "center",
                color: "#334eb8",
                fontWeight: "bold",
                marginTop: 15,
                fontSize: 15,
              }}
            >
              Review your details carefully before submitting.
            </Text>
            <LottieView
                  source={require("../../assets/lotties/review_submit.json")}
                  autoPlay
                  loop
                  style={{
                    width: 200,
                    height: 200,
                    alignSelf: "center",
                  }}
                />
          </>
        )}
      </ScrollView>
      {/* Floating Next Button */}
      {step < steps.length - 1 && (
        <TouchableOpacity style={styles.fab} onPress={handleNext}>
          <Ionicons name="arrow-forward" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Floating Submit Button */}
      {step === steps.length - 1 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="checkmark" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Floating Previous Button */}
      {step > 0 && (
        <TouchableOpacity style={styles.fabPrev} onPress={handlePrev}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoutBtn: {
    position: "absolute",
    top: 40,
    right: 24,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#334eb8",
  },
  formContainer: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 18,
    color: "#334eb8",
    paddingTop: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: "#334eb8",
  },
  label: {
    fontWeight: "bold",
    color: "#334eb8",
    marginBottom: 6,
    marginTop: 8,
  },
  addSkillBtn: {
    marginLeft: 8,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  skillItem: {
    backgroundColor: "#e6edff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: "#334eb8",
    fontWeight: "bold",
  },
  reviewBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewLabel: {
    fontWeight: "bold",
    color: "#334eb8",
    marginBottom: 10,
  },
  reviewValue: {
    color: "#222",
    fontWeight: "normal",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 40,
  },
  navBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#334eb8",
    marginRight: 10,
  },
  navBtnText: {
    color: "#334eb8",
    fontWeight: "bold",
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: "#334eb8",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  stateBtn: {
    backgroundColor: "#e6edff",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334eb8",
  },
  stateBtnActive: {
    backgroundColor: "#334eb8",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#334eb8",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabPrev: {
    position: "absolute",
    bottom: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#334eb8",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  avatarCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#e6edff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
});

export default ProfileCreateScreen;
