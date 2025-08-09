import { Feather } from "@expo/vector-icons"; // For icons
import { useNavigation } from "@react-navigation/native"; // For navigation
import * as SecureStore from "expo-secure-store"; // For storing/retrieving access token
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

const GEOAPIFY_API_KEY = "4195db721fdd4b71bae0b85ead1327c3";

// Mock Data for Graphs - Placeholders in the UI
const mockShiftsData = [
  { name: "Jan", shifts: 10 },
  { name: "Feb", shifts: 15 },
  { name: "Mar", shifts: 12 },
  { name: "Apr", shifts: 18 },
  { name: "May", shifts: 20 },
  { name: "Jun", shifts: 25 },
];

const mockInteractionsData = [
  { worker: "Alice", interactions: 50 },
  { worker: "Bob", interactions: 30 },
  { worker: "Charlie", interactions: 70 },
  { worker: "Diana", interactions: 45 },
  { worker: "Eve", interactions: 60 },
];

/**
 * @typedef {Object} OrganizationProfileData
 * @property {string} name
 * @property {string} abn
 * @property {string} address
 * @property {string} phone
 * @property {string} website
 * @property {string} description
 * @property {string} [logo]
 * @property {string[]} [services]
 * @property {string[]} [certifications]
 */

const ProfileScreenOrg = () => {
  const navigation = useNavigation();
  /** @type {[OrganizationProfileData | null, React.Dispatch<React.SetStateAction<OrganizationProfileData | null>>]} */
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [abnStatus, setAbnStatus] = useState(null);
  const [abnLookupLoading, setAbnLookupLoading] = useState(false);
  const [abnError, setAbnError] = useState(null);

  //__MapFetch using Geoapify try__
  const [mapUrl, setMapUrl] = useState(null);

  //__Try to count booking for graphs__
  const [bookings, setBookings] = useState([]);
const [bookingsLoading, setBookingsLoading] = useState(false);

  // --- Authentication and Data Fetching ---
  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("access_token");
        if (token) {
          setAccessToken(token);
        } else {
          setError("No access token found. Please log in.");
          setLoading(false);
        }
      } catch (e) {
        setError("Failed to retrieve access token.");
        setLoading(false);
      }
    };
    getAccessToken();
  }, []);

  //__MapFetch using Geoapify try__
  useEffect(() => {
    async function fetchMap() {
      if (!orgData?.address) return;
      try {
        const geoRes = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
            orgData.address
          )}&apiKey=${GEOAPIFY_API_KEY}`
        );
        const geoData = await geoRes.json();
        const location = geoData.features?.[0]?.geometry?.coordinates;
        if (location) {
          const [lon, lat] = location;
          const staticMapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=300&center=lonlat:${lon},${lat}&zoom=15&apiKey=${GEOAPIFY_API_KEY}`;
          setMapUrl(staticMapUrl);
        } else {
          setMapUrl(null);
        }
      } catch (e) {
        setMapUrl(null);
      }
    }
    fetchMap();
  }, [orgData?.address]);

  //__Fetching booking to display opn the graphs__
  useEffect(() => {
  if (!accessToken) return;
  async function fetchBookings() {
    setBookingsLoading(true);
    try {
      const response = await fetch("https://api.theopenshift.com/v1/bookings/my_bookings", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (e) {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }
  fetchBookings();
}, [accessToken]);
function getMonthlyShiftData(bookings) {
  const monthly = {};
  bookings.forEach(b => {
    const date = new Date(b.start_time);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g. "2025-7"
    monthly[key] = (monthly[key] || 0) + 1;
  });
  // Convert to array for chart
  return Object.entries(monthly).map(([key, count]) => ({
    month: key,
    shifts: count,
  }));
}
const monthlyShiftData = getMonthlyShiftData(bookings);
const totalShifts = bookings.length

//Ends here for the booking graph

  const fetchOrganizationProfile = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://api.theopenshift.com/v1/orgs/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        setError("Unauthorized. Please log in again.");
        await SecureStore.deleteItemAsync("access_token");
        // navigation.navigate('Login');
        return;
      }
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.message || "Failed to fetch organization profile."
        );
      }

      const data = await response.json();
      setOrgData(data);
    } catch (e) {
      setError(e.message || "Error fetching organization profile.");
      Alert.alert("Error", e.message || "Failed to load organization profile.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchOrganizationProfile();
    }
  }, [accessToken, fetchOrganizationProfile]);

  // --- ABN Lookup Logic ---
  const handleAbnLookup = useCallback(async (abn, orgName) => {
    setAbnLookupLoading(true);
    setAbnError(null);

    //Hide for production
    const ABN_LOOKUP_GUID = "59ba1e34-0d0d-4a20-81a7-7449172c96a8"; // *** IMPORTANT: Replace with your actual GUID ***
    //Hide for production
    if (!ABN_LOOKUP_GUID) {
      console.warn(
        "ABN Lookup GUID is not configured. ABN status will not be fetched."
      );
      setAbnStatus(null);
      setAbnLookupLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://abr.business.gov.au/json/AbnDetails.aspx?callback=callback&name=${encodeURIComponent(
          orgName
        )}&abn=${encodeURIComponent(abn)}&guid=${ABN_LOOKUP_GUID}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      const text = await response.text();
      const jsonStr = text.replace(/^callback\(|\)$/g, "");
      const data = JSON.parse(jsonStr);
      console.log("ABN Lookup Response:", data);

      if (data.Abn) {
        const status =
          data.AbnStatus?.toLowerCase() === "active" ? "active" : "inactive";
        setAbnStatus(status);
      } else {
        setAbnError("ABN not found or invalid during lookup.");
        setAbnStatus("inactive");
      }
    } catch (error) {
      setAbnError("Error looking up ABN.");
      Alert.alert(
        "ABN Lookup Error",
        error.message || "Failed to perform ABN lookup."
      );
      setAbnStatus("inactive");
    } finally {
      setAbnLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orgData?.abn && orgData?.name) {
      handleAbnLookup(orgData.abn, orgData.name);
    } else {
      setAbnStatus(null);
    }
  }, [orgData?.abn, orgData?.name, handleAbnLookup]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#334eb8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchOrganizationProfile}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!orgData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Organization profile not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Organization Header Card */}
      <View style={styles.orgHeaderCard}>
        <View style={styles.orgHeaderContent}>
          <View style={styles.orgLogoPlaceholder}>
            <Text style={styles.orgLogoText}>
              {orgData.name?.[0]?.toUpperCase() || "O"}
            </Text>
          </View>
          <View style={styles.orgInfoText}>
            <Text style={styles.orgName}>{orgData.name}</Text>
            <Text style={styles.orgType}>Organization</Text>
          </View>
        </View>
        {/* <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("EditOrganizationProfile")} // Ensure this route exists
        >
          <Feather name="edit-3" size={16} color="#fff" />
        </TouchableOpacity> */}
      </View>

      {/* Business Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ABN</Text>
            <Text style={styles.detailValue}>{orgData.abn}</Text>
            {abnLookupLoading ? (
              <Text style={styles.abnStatusLoading}>Loading ABN status...</Text>
            ) : abnError ? (
              <Text style={styles.abnStatusError}>Error: {abnError}</Text>
            ) : (
              <Text
                style={[
                  styles.abnStatusBadge,
                  abnStatus === "active" && styles.abnStatusActive,
                  abnStatus === "inactive" && styles.abnStatusInactive,
                ]}
              >
                ABN{" "}
                {abnStatus === "active"
                  ? "Active"
                  : abnStatus === "inactive"
                  ? "Inactive"
                  : "N/A"}
              </Text>
            )}
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{orgData.phone}</Text>
          </View>
          <View style={styles.detailItemFullWidth}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{orgData.address}</Text>
            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder}>
              {mapUrl ? (
                <Image
                  source={{ uri: mapUrl }}
                  style={{ width: "100%", height: 150, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Feather name="map-pin" size={24} color="#aaa" />
                  <Text style={styles.mapPlaceholderText}>
                    Map not available
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.detailItemFullWidth}>
            <Text style={styles.detailLabel}>Website</Text>
            <Text style={styles.detailValue}>
              {orgData.website || "Not provided"}
            </Text>
          </View>
        </View>
      </View>

      {/* Statistics Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics Overview</Text>
        <View style={styles.statsGrid}>
          {/* Shifts Posted Graph Placeholder */}
          <View style={styles.statCard}>
  <Text style={styles.statCardTitle}>Shifts Posted Over Time</Text>
  {bookingsLoading ? (
    <ActivityIndicator size="small" color="#334eb8" />
  ) : (
    <>
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
        Total Shifts: {totalShifts}
      </Text>
      <BarChart
        data={{
          labels: monthlyShiftData.map(item => {
            const [year, month] = item.month.split("-");
            return `${month}/${year.slice(-2)}`;
          }),
          datasets: [
            {
              data: monthlyShiftData.map(item => item.shifts),
            },
          ],
        }}
        width={width - 48} // Adjust for padding
        height={180}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(51, 78, 184, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
          style: { borderRadius: 8 },
          propsForBackgroundLines: { stroke: "#eee" },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 8,
        }}
        fromZero
        showValuesOnTopOfBars
      />
    </>
  )}
</View>

          {/* Worker Interactions Graph Placeholder 
          <View style={styles.statCard}>
            <Text style={styles.statCardTitle}>Worker Interactions</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>
                [Bar Chart Placeholder]
              </Text>
            </View>
          </View>*/}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40, // Add some padding at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#334eb8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orgHeaderCard: {
    backgroundColor: "#2954bd",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Aligns content and button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  orgHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1, // Allows text to wrap
    paddingRight: 10, // Space before edit button
  },
  orgLogoPlaceholder: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  orgLogoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  orgInfoText: {
    flexShrink: 1,
  },
  orgName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flexWrap: "wrap", // Allow name to wrap
  },
  orgType: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  editProfileButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10, // Make it a square button
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Spreads items out
  },
  detailItem: {
    width: "48%", // Two columns
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailItemFullWidth: {
    width: "100%", // Full width for address and website
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  abnStatusLoading: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  abnStatusError: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 5,
  },
  abnStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    alignSelf: "flex-start",
    minWidth: 80,
    textAlign: "center",
  },
  abnStatusActive: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  abnStatusInactive: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  mapPlaceholder: {
    height: 150, // Smaller map for mobile
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  mapPlaceholderText: {
    marginTop: 5,
    color: "#555",
    fontSize: 14,
  },
  statsGrid: {
    // For mobile, stack graphs vertically
    flexDirection: "column",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    width: "100%", // Each card takes full width
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: "#f0f4f7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
});

export default ProfileScreenOrg;
