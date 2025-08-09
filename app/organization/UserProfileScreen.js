import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View
} from "react-native";

const BASE_URL = "https://api.theopenshift.com";

const Pill = ({ children }) => (
  <View style={styles.pill}>
    <Text style={styles.pillText} numberOfLines={1}>
      {children}
    </Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={{ marginTop: 8 }}>{children}</View>
  </View>
);

const KeyValue = ({ label, value }) => (
  <View style={styles.kvRow}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue}>{value ?? "—"}</Text>
  </View>
);

const asList = (arr) =>
  Array.isArray(arr) && arr.length ? arr : null;

const initialsFrom = (f = "", l = "") =>
  [f?.[0], l?.[0]].filter(Boolean).join("").toUpperCase() || "👤";

const UserProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = useMemo(
    () => ({
      bg: isDark ? "#0B0B0F" : "#F5F7FB",
      card: isDark ? "#151923" : "#FFFFFF",
      text: isDark ? "#E7ECF3" : "#1C2430",
      sub: isDark ? "#9AA6B2" : "#5A6B80",
      accent: isDark ? "#5B9BFF" : "#2F6EF8",
      border: isDark ? "#202739" : "#E4E9F2",
      pillBg: isDark ? "#1E2432" : "#EEF2FF",
      pillText: isDark ? "#C9D7FF" : "#2F50A4",
      danger: isDark ? "#FF6B6B" : "#C81E1E",
    }),
    [isDark]
  );

  const getProfile = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/v1/users/${userId}`);
      const data = await res.json();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    getProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator />
        <Text style={[styles.loadingText, { color: colors.sub, marginTop: 12 }]}>
          Loading profile…
        </Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>
          Failed to load profile
        </Text>
        <Pressable onPress={getProfile} style={[styles.retryBtn, { borderColor: colors.border }]}>
          <Text style={[styles.retryText, { color: colors.text }]}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const {
    fname,
    lname,
    bio,
    address,
    suburb,
    gender,
    f2w_certified,
    skills,
    badges,
    vaccinations,
    languages,
    interests,
    preferences,
    services,
  } = profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.text }]}>Back</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          {imageError ? (
            <View style={[styles.avatar, { backgroundColor: colors.accent + "22", borderColor: colors.accent }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {initialsFrom(fname, lname)}
              </Text>
            </View>
          ) : (
            <Image
              source={{
                uri: `https://img.theopenshift.com/profile/${(profile.user_id || "").replace("auth0|", "")}.webp`,
              }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            {fname} {lname}
          </Text>
          {bio ? (
            <Text style={[styles.subtitle, { color: colors.sub }]} numberOfLines={2}>
              {bio}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Section title="About">
          <KeyValue label="Gender" value={gender || "—"} />
          <KeyValue label="Address" value={address || "—"} />
          <KeyValue label="Suburb" value={suburb || "—"} />
          <KeyValue label="Certified" value={f2w_certified ? "Yes" : "No"} />
        </Section>


        <Section title="Services">
          {asList(services) ? (
            <View style={styles.pillWrap}>
              {services.map((s, i) => (
                <Pill key={`${s}-${i}`}>{s}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No services listed.</Text>
          )}
        </Section>

        <Section title="Skills">
          {asList(skills) ? (
            <View style={styles.pillWrap}>
              {skills.map((s, i) => (
                <Pill key={`${s}-${i}`}>{s}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No skills added.</Text>
          )}
        </Section>

        <Section title="Badges">
          {asList(badges) ? (
            <View style={styles.pillWrap}>
              {badges.map((b, i) => (
                <Pill key={`${b}-${i}`}>{b}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No badges yet.</Text>
          )}
        </Section>

        <Section title="Vaccinations">
          {asList(vaccinations) ? (
            <View style={styles.pillWrap}>
              {vaccinations.map((v, i) => (
                <Pill key={`${v}-${i}`}>{v}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>None provided.</Text>
          )}
        </Section>

        <Section title="Languages">
          {asList(languages) ? (
            <View style={styles.pillWrap}>
              {languages.map((l, i) => (
                <Pill key={`${l}-${i}`}>{l}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No languages listed.</Text>
          )}
        </Section>

        <Section title="Interests">
          {asList(interests) ? (
            <View style={styles.pillWrap}>
              {interests.map((it, i) => (
                <Pill key={`${it}-${i}`}>{it}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No interests yet.</Text>
          )}
        </Section>

        <Section title="Preferences">
          {asList(preferences) ? (
            <View style={styles.pillWrap}>
              {preferences.map((p, i) => (
                <Pill key={`${p}-${i}`}>{p}</Pill>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.sub }]}>No preferences yet.</Text>
          )}
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  backIcon: { fontSize: 18, marginRight: 6 },
  backLabel: { fontSize: 16, fontWeight: "600" },
  headerCenter: {
    alignItems: "center",
    paddingTop: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 24, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 4, paddingHorizontal: 24 },

  container: {
    padding: 16,
  },

  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    backgroundColor: "#fff", // overridden by color scheme via parent bg
  },
  cardTitle: { fontSize: 15, fontWeight: "700", opacity: 0.9 },

  kvRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000011",
  },
  kvLabel: { flex: 0.5, fontSize: 14, fontWeight: "600", opacity: 0.8 },
  kvValue: { flex: 0.5, fontSize: 14 },

  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: { fontSize: 13, fontWeight: "600", color: "#2F50A4" },

  emptyText: { fontSize: 14, fontStyle: "italic" },

  loadingText: { fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: "700" },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: { fontWeight: "600" },
});

export default UserProfileScreen;
