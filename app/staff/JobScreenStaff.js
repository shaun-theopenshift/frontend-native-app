import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const JOBS_API_URL = "https://api.theopenshift.com/v1/users/search_bookings";
const MY_REQUESTS_API_URL =
  "https://api.theopenshift.com/v1/bookings/my_requests";

const SERVICE_TYPES = [
  { key: "everyday", label: "Daily Living" },
  { key: "personal_care", label: "Personal Care" },
  { key: "nursing", label: "Nursing" },
  { key: "allied_health", label: "Allied Health" },
];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const JobScreenStaff = (props) => {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [filters, setFilters] = useState({ suburb: "", service: [], day: [] });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [showFullDescMap, setShowFullDescMap] = useState({});
  const [orgDetails, setOrgDetails] = useState({});
  const [rateInput, setRateInput] = useState("");
  const [fitMsgInput, setFitMsgInput] = useState("");
  const [activeTab, setActiveTab] = useState("Find Jobs");
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestResponse, setRequestResponse] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activityTimers, setActivityTimers] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const timerInterval = useRef(null);
  const orgFetchInProgress = useRef({});

  // Fetch access token on mount
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access_token");
      console.log("[JobScreenStaff] Resolved access_token:", token);
      setAccessToken(token || "");
    })();
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(
    async (reset = false) => {
      if (!accessToken) {
        setError("No access token found. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (reset) setPage(1);
      setLoading(!reset);
      setRefreshing(reset);
      setError("");
      try {
        const params = [];
        if (filters.suburb)
          params.push(`suburb=${encodeURIComponent(filters.suburb)}`);
        if (filters.service.length)
          filters.service.forEach((s) =>
            params.push(`service=${encodeURIComponent(s)}`)
          );
        if (filters.day.length)
          filters.day.forEach((d) =>
            params.push(`day=${encodeURIComponent(d)}`)
          );
        params.push(`page=${reset ? 1 : page}`);
        params.push("limit=10");
        const url = `${JOBS_API_URL}?${params.join("&")}`;
        //console.log('[JobScreenStaff] Fetching jobs from:', url);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 403) {
          setError("Access denied (403). Please log in again.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        //console.log('[JobScreenStaff] API response:', JSON.stringify(data));
        if (reset) {
          setJobs(data.items || []);
        } else {
          setJobs((prev) => [...prev, ...(data.items || [])]);
        }
        setHasMore((data.items || []).length === 10);
        setError("");
      } catch (e) {
        setError(e.message || "Error fetching jobs");
        console.log("[JobScreenStaff] Fetch error:", e);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [accessToken, filters, page]
  );

  // Fetch jobs when accessToken, filters, or page changes
  useEffect(() => {
    if (accessToken) fetchJobs(page === 1);
  }, [accessToken, filters, page]);

  // Pull to refresh
  const onRefresh = () => {
    setPage(1);
    fetchJobs(true);
  };

  // Load more for pagination
  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  // Helper to get days ago
  const getDaysAgo = (createdAt) => {
    if (!createdAt) return "";
    const created = new Date(createdAt);
    const now = new Date();
    // Zero out time for both dates
    created.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "posted today";
    if (diffDays === 1) return "posted 1 day ago";
    return `posted ${diffDays} days ago`;
  };

  // Helper to format time range
  const formatTimeRange = (start, end) => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const pad = (n) => n.toString().padStart(2, "0");
    const startStr = `${pad(startDate.getHours())}:${pad(
      startDate.getMinutes()
    )}`;
    const endStr = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
    return `${startStr} - ${endStr}`;
  };

  // Helper to format date and time as 'Month DD, YYYY HH:mm'
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const pad = (n) => n.toString().padStart(2, "0");
    const dateStr = `${
      months[d.getMonth()]
    } ${d.getDate()}, ${d.getFullYear()}`;
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${dateStr} ${timeStr}`;
  };

  // Fetch org details by org_id
  const fetchOrgDetails = async (org_id) => {
    if (!org_id || orgDetails[org_id] || orgFetchInProgress.current[org_id])
      return;
    orgFetchInProgress.current[org_id] = true;
    try {
      // Replace with your actual org API endpoint
      const res = await fetch(`https://api.theopenshift.com/v1/orgs/${org_id}`);
      if (res.ok) {
        const data = await res.json();
        setOrgDetails((prev) => ({ ...prev, [org_id]: data }));
      }
    } catch (e) {
      // fallback: do nothing
    } finally {
      orgFetchInProgress.current[org_id] = false;
    }
  };

  // Send booking request
  const sendBookingRequest = async (job) => {
    if (!accessToken || !job?.id) return;
    setRequestStatus("pending");
    try {
      const res = await fetch(
        "https://api.theopenshift.com/v1/bookings/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            booking_id: job.id,
            rate: rateInput,
            comment: fitMsgInput,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setRequestResponse(data);
        setRequestStatus("success");
        setRequestModalVisible(true);
        // Always fetch latest requests from backend after sending a request
        fetchMyRequests();
      } else {
        setRequestResponse(data);
        setRequestStatus("error");
        setRequestModalVisible(true);
      }
    } catch (e) {
      setRequestResponse({ error: e.message });
      setRequestStatus("error");
      setRequestModalVisible(true);
    }
  };

  // Fetch my requests from backend and display in My Requests tab
  const fetchMyRequests = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(MY_REQUESTS_API_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch my requests");
      const data = await res.json();
      // data.items should be an array of requests with booking_id, status, etc.
      setMyRequests(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setMyRequests([]); // fallback: show empty if error
    }
  }, [accessToken]);

  // Fetch my requests when accessToken changes or after sending a request
  useEffect(() => {
    if (accessToken) fetchMyRequests();
  }, [accessToken, fetchMyRequests, requestStatus]);

  // Fetch my bookings for Activity tab
  const fetchMyBookings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(
        "https://api.theopenshift.com/v1/bookings/my_bookings",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch my bookings");
      const data = await res.json();
      setMyBookings(
        Array.isArray(data) ? data : data.items || data.bookings || []
      );
    } catch (e) {
      // fallback: do nothing
    }
  }, [accessToken]);

  // Fetch my bookings on mount and when accessToken changes
  useEffect(() => {
    if (accessToken) fetchMyBookings();
  }, [accessToken, fetchMyBookings]);

  // Timer logic for Activity tab
  const startTimer = (bookingId) => {
    setActivityTimers((prev) => ({
      ...prev,
      [bookingId]: {
        running: true,
        start: Date.now(),
        elapsed: prev[bookingId]?.elapsed || 0,
      },
    }));
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setActivityTimers((prev) => {
        const timer = prev[bookingId];
        if (!timer || !timer.running) return prev;
        return {
          ...prev,
          [bookingId]: {
            ...timer,
            elapsed: timer.elapsed + 1,
          },
        };
      });
    }, 1000);
  };
  const stopTimer = (bookingId) => {
    setActivityTimers((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        running: false,
      },
    }));
    if (timerInterval.current) clearInterval(timerInterval.current);
    setCheckoutMessage("Successfully checked out!");
    setTimeout(() => setCheckoutMessage(""), 3000);
  };

  // Fetch jobs for Find Jobs tab: exclude jobs with a pending/approved request in myRequests (match by booking_id)
  const myPendingOrApprovedBookingIds = new Set(
    myRequests
      .filter((r) => r.status === "pending" || r.status === "approved")
      .map((r) => r.booking_id)
  );
  const jobsForFindJobs = jobs.filter(
    (j) => !myPendingOrApprovedBookingIds.has(j.id)
  );

  // Render job card
  const renderJob = ({ item }) => {
    if (!item) return null; // Defensive: skip if item is undefined/null
    const isExpanded = expandedJobId === item.id;
    const showFullDesc = !!showFullDescMap[item.id];
    const descLimit = 180;
    const desc = item.description || "No description provided.";
    const shouldTruncate = desc.length > descLimit;
    const displayDesc =
      showFullDesc || !shouldTruncate ? desc : desc.slice(0, descLimit) + "...";
    const org = item.org_id ? orgDetails[item.org_id] : null;
    // Collapsed card
    if (!isExpanded) {
      return (
        <View style={styles.cardCollapsed}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <FontAwesome
              name="briefcase"
              size={24}
              color="#334eb8"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.jobTitleCollapsed}>
              {item.title || "Untitled Job"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={styles.pillCollapsed}>
              <Text style={styles.pillTextCollapsed}>{item.service}</Text>
            </View>
            {item.start_time && item.end_time && (
              <View style={styles.pillCollapsedDateandTime}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color="#334eb8"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.pillTextCollapsed}>
                  {formatDateTime(item.start_time).split(" ")[0]}{" "}
                  {formatTimeRange(item.start_time, item.end_time)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.footerRowCollapsed}>
            <Text style={styles.postedAgoCollapsed}>
              {getDaysAgo(item.created_at)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setExpandedJobId(item.id);
                setShowFullDescMap((prev) => ({ ...prev, [item.id]: false }));
                setRateInput("");
                setFitMsgInput("");
                if (item.org_id) fetchOrgDetails(item.org_id);
              }}
            >
              <Text style={styles.seeMoreCollapsed}>See more</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // Expanded card
    // Always get the request for this job from myRequests (fetched from backend) using booking_id
    const myRequestForThisJob = myRequests.find(
      (r) =>
        r.booking_id === item.id &&
        (r.status === "pending" || r.status === "approved")
    );
    const showRequestForm = !myRequestForThisJob;
    return (
      <View style={styles.cardExpanded}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <FontAwesome
            name="briefcase"
            size={28}
            color="#334eb8"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.jobTitleExpanded}>
            {item.title || "Untitled Job"}
          </Text>
        </View>
        <Text style={styles.companyLineExpanded}>
          {org?.name || item.company || "Company Name"}
          {item.suburb ? ` · ${item.suburb}` : ""}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View style={styles.pillExpanded}>
            <Text style={styles.pillTextExpanded}>{item.service}</Text>
          </View>
          {item.start_time && item.end_time && (
            <View style={styles.pillExpandedDateandTime}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#334eb8"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.pillTextExpanded}>
                {formatDateTime(item.start_time).split(" ")[0]}{" "}
                {formatTimeRange(item.start_time, item.end_time)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.descriptionExpanded}>{displayDesc}</Text>
        {shouldTruncate && (
          <TouchableOpacity
            onPress={() =>
              setShowFullDescMap((prev) => ({
                ...prev,
                [item.id]: !showFullDesc,
              }))
            }
          >
            <Text style={styles.readMoreExpanded}>
              {showFullDesc ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.orgDetailsBox}>
          <Text style={styles.orgDetailsTitle}>Organisation Details</Text>
          <Text style={styles.orgNameExpanded}>
            {org?.name || item.company || "Company Name"}
          </Text>
          <Text style={styles.orgDescExpanded}>
            {org?.description || "No org description"}
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            <Text style={styles.orgAddressExpanded}>
              Address: {org?.address || item.address || "N/A"}
            </Text>
            <Text style={styles.orgAddressExpanded}></Text>
          </View>
          {myRequestForThisJob ? (
            <View style={{ alignItems: "center", marginVertical: 12 }}>
              <Text
                style={{
                  color:
                    myRequestForThisJob.status === "approved"
                      ? "#5bb780"
                      : myRequestForThisJob.status === "pending"
                      ? "#f9a825"
                      : "#e53935",
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                Status: {myRequestForThisJob.status}
              </Text>
            </View>
          ) : (
            <>
              {showRequestForm && (
                <>
                  <View style={styles.requestFormRowExpanded}>
                    <TextInput
                      style={styles.inputExpanded}
                      placeholder="Rate"
                      keyboardType="numeric"
                      value={rateInput}
                      onChangeText={setRateInput}
                    />
                    <TextInput
                      style={styles.inputExpanded}
                      placeholder="Comment (optional)"
                      value={fitMsgInput}
                      onChangeText={setFitMsgInput}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sendBtnExpanded}
                    onPress={() => sendBookingRequest(item)}
                    disabled={requestStatus === "pending"}
                  >
                    <Text style={styles.sendBtnTextExpanded}>
                      {requestStatus === "pending"
                        ? "Sending..."
                        : "Send Request"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
        <View style={styles.footerRowExpanded}>
          <Text style={styles.postedAgoExpanded}>
            {getDaysAgo(item.created_at)}
          </Text>
          <TouchableOpacity onPress={() => setExpandedJobId(null)}>
            <Text style={styles.seeMoreExpanded}>Show less</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- UI ---
  return (
    <View style={{ flex: 1, backgroundColor: "#fff8f7" }}>
      <View
        style={{
          backgroundColor: "#123456",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          height: 100,
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        {/* Left-aligned title */}
        <View style={{ width: "100%" }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 30,
              fontWeight: "bold",
              paddingTop: 15,
              paddingBottom: 8,
            }}
          >
            Jobs
          </Text>
          <View>
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                textAlign: "left",
                fontWeight: "120",
              }}
            >
              Caring starts with the right connection, let's find yours ✨
            </Text>
          </View>
        </View>
      </View>

      {/* Top Tabs + Bell */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
          marginBottom: 4,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
          }}
        >
          {["Find Jobs", "My Requests", "History"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 18,
                backgroundColor: activeTab === tab ? "#334eb8" : "#e6edff",
                marginHorizontal: 6,
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={{
                  color: activeTab === tab ? "#fff" : "#334eb8",
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.bellBtn, { marginLeft: 8 }]}>
          <Ionicons name="notifications-outline" size={22} color="#334eb8" />
        </TouchableOpacity>
      </View>
      {/* Only show job list if Find Jobs is active */}
      {activeTab === "Find Jobs" && (
        <>
          {/* Header */}
          <View style={styles.headerWrap}></View>
          {/* Search & Filter Bar */}
          <View style={styles.searchBarWrap}>
            <Ionicons
              name="search"
              size={20}
              color="#334eb8"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Suburb"
              value={filters.suburb}
              onChangeText={(t) => setFilters((f) => ({ ...f, suburb: t }))}
            />
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setFilterModalVisible(true)}
              >
                <Feather name="sliders" size={18} color="#334eb8" />
                {(filters.service.length > 0 || filters.day.length > 0) && (
                  <View style={styles.filterDot} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          {/* Clear Filters Button */}
          {(filters.service.length > 0 || filters.day.length > 0) && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() =>
                setFilters((f) => ({ ...f, service: [], day: [] }))
              }
            >
              <Text style={styles.clearFiltersText}>Clear filters ✕</Text>
            </TouchableOpacity>
          )}
          {/* Filter Modal */}
          <Modal
            visible={filterModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setFilterModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setFilterModalVisible(false)}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalContentWrap}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Filter Jobs</Text>
                <Text style={styles.modalLabel}>Service Type</Text>
                <View style={styles.pillsRow}>
                  {SERVICE_TYPES.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.pill,
                        filters.service.includes(s.key) && styles.pillActive,
                      ]}
                      onPress={() => {
                        setFilters((f) => ({
                          ...f,
                          service: f.service.includes(s.key)
                            ? f.service.filter((k) => k !== s.key)
                            : [...f.service, s.key],
                        }));
                      }}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          filters.service.includes(s.key) &&
                            styles.pillTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalLabel}>Day</Text>
                <View style={styles.pillsRow}>
                  {DAYS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pill,
                        filters.day.includes(day) && styles.pillActive,
                      ]}
                      onPress={() => {
                        setFilters((f) => ({
                          ...f,
                          day: f.day.includes(day)
                            ? f.day.filter((d) => d !== day)
                            : [...f.day, day],
                        }));
                      }}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          filters.day.includes(day) && styles.pillTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.modalApplyBtn}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
          {/* Job List */}
          {loading && page === 1 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#334eb8" />
            </View>
          ) : error ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#e53935", fontSize: 16 }}>{error}</Text>
              {error.includes("log in") && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Profile")}
                  style={{
                    marginTop: 16,
                    backgroundColor: "#334eb8",
                    borderRadius: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Go to Profile / Log in
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={jobsForFindJobs}
              keyExtractor={(item, index) =>
                item.id ? `job-${item.id}` : `job-${index}`
              }
              renderItem={renderJob}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.2}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={
                hasMore && !loading ? (
                  <TouchableOpacity
                    onPress={loadMore}
                    style={styles.loadMoreBtn}
                  >
                    <Feather
                      name="chevron-down"
                      size={18}
                      color="#334eb8"
                      style={{ marginBottom: -2 }}
                    />
                    <Text style={{ color: "#334eb8", fontWeight: "bold" }}>
                      Load More
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        </>
      )}
      {activeTab === "My Requests" && (
        <View style={{ flex: 1 }}>
          {myRequests.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#334eb8", fontSize: 18, fontWeight: "bold" }}
              >
                No requests yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={myRequests}
              keyExtractor={(item, index) =>
                item.id ? `reqid-${item.id}` : `req-${index}`
              }
              renderItem={({ item }) => {
                return (
                  <View style={styles.cardExpanded}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.jobTitleExpanded, { marginBottom: 4 }]}
                        >
                          Request for Booking #{item.booking_id}
                        </Text>
                        <Text
                          style={{
                            color: "#666",
                            fontSize: 14,
                            marginBottom: 2,
                          }}
                        >
                          Comment:{" "}
                          <Text
                            style={{
                              fontStyle: item.comment ? "normal" : "italic",
                              color: item.comment ? "#333" : "#bbb",
                            }}
                          >
                            {item.comment || "No comment"}
                          </Text>
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#666",
                              marginRight: 10,
                            }}
                          >
                            Rate:{" "}
                            <Text style={{ color: "#111", fontWeight: "bold" }}>
                              {item.rate}
                            </Text>
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#666",
                              marginRight: 10,
                            }}
                          >
                            Status:{" "}
                            <Text
                              style={{
                                backgroundColor:
                                  item.status === "approved"
                                    ? "#d1fae5"
                                    : item.status === "rejected"
                                    ? "#fee2e2"
                                    : item.status === "pending"
                                    ? "#fef9c3"
                                    : "#f3f4f6",
                                color:
                                  item.status === "approved"
                                    ? "#059669"
                                    : item.status === "rejected"
                                    ? "#dc2626"
                                    : item.status === "pending"
                                    ? "#b45309"
                                    : "#374151",
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                fontWeight: "bold",
                              }}
                            >
                              {item.status}
                            </Text>
                          </Text>
                          <Text style={{ fontSize: 13, color: "#666" }}>
                            Request ID:{" "}
                            <Text style={{ color: "#111", fontWeight: "bold" }}>
                              {item.id}
                            </Text>
                          </Text>
                        </View>
                        {item.status === "approved" && (
                          <TouchableOpacity
                            style={{
                              backgroundColor: "#334eb8",
                              borderRadius: 8,
                              paddingVertical: 10,
                              paddingHorizontal: 24,
                              marginTop: 12,
                              alignSelf: "flex-start",
                            }}
                            onPress={() => {
                              const shift =
                                jobs.find((j) => j.id == item.booking_id) ||
                                myBookings.find((j) => j.id == item.booking_id);
                              if (!shift) {
                                Alert.alert(
                                  "Error",
                                  "Shift details not found."
                                );
                                return;
                              }
                              navigation.navigate("StartJob", {
                                booking: shift,
                              });
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "bold",
                                fontSize: 15,
                              }}
                            >
                              Start Job
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
          )}
        </View>
      )}
      {activeTab === "History" && (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#334eb8", fontSize: 18, fontWeight: "bold" }}>
            History (Coming soon)
          </Text>
        </View>
      )}
      {/* Request Response Modal */}
      <Modal
        visible={requestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              width: 320,
              maxWidth: "90%",
            }}
          >
            {requestStatus === "success" && (
              <LottieView
                source={require("../../assets/lotties/success_request.json")}
                autoPlay
                loop={false}
                style={{ width: 120, height: 120, marginBottom: 12 }}
              />
            )}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: requestStatus === "success" ? "#5bb780" : "#e53935",
                marginBottom: 8,
              }}
            >
              {requestStatus === "success" ? "Request Sent!" : "Request Failed"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#333",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {requestStatus === "success"
                ? "Your booking request was sent successfully."
                : requestResponse?.error || "Something went wrong."}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#334eb8",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginTop: 8,
              }}
              onPress={() => setRequestModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    padding: 5,
    borderBottomColor: "#e0e0e0",
    alignItems: "left",
  },
  bellBtn: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: "#e6edff",
    marginRight: 10,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#334eb8",
    padding: 10,
  },
  filterBtn: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#e6edff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e53935",
  },
  clearFiltersBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#334eb8",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  clearFiltersText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContentWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    color: "#334eb8",
    fontWeight: "bold",
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 15,
    color: "#666",
    marginBottom: 10,
    fontWeight: "bold",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 6, // reduce gap between pills
  },
  pill: {
    backgroundColor: "#e6edff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 6,
    marginBottom: 6,
    minWidth: 80,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: "#334eb8",
  },
  pillText: {
    fontSize: 15,
    color: "#334eb8",
    fontWeight: "bold",
  },
  pillTextActive: {
    color: "#fff",
  },
  modalApplyBtn: {
    backgroundColor: "#334eb8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
    width: "100%",
  },
  cardCollapsed: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  jobTitleCollapsed: {
    fontSize: 16,
    color: "#334eb8",
    fontWeight: "500",
    marginBottom: 2,
  },
  pillCollapsed: {
    backgroundColor: "#e6edff",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  pillTextCollapsed: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
  },
  pillCollapsedDateandTime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6edff",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  footerRowCollapsed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 2,
  },
  postedAgoCollapsed: {
    fontSize: 12,
    color: "#999",
    marginLeft: 2,
  },
  seeMoreCollapsed: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
    marginRight: 2,
  },
  cardExpanded: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jobTitleExpanded: {
    fontSize: 18,
    color: "#334eb8",
    fontWeight: "bold",
    marginBottom: 2,
  },
  companyLineExpanded: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    marginLeft: 2,
  },
  pillExpanded: {
    backgroundColor: "#e6edff",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  pillTextExpanded: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
  },
  pillExpandedDateandTime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6edff",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  descriptionExpanded: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 14,
    marginTop: 2,
  },
  readMoreExpanded: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 8,
  },
  orgDetailsBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 18,
    marginTop: 14,
    marginBottom: 8,
  },
  orgDetailsTitle: {
    fontSize: 16,
    color: "#334eb8",
    fontWeight: "bold",
    marginBottom: 10,
  },
  orgNameExpanded: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    marginBottom: 6,
  },
  orgDescExpanded: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  orgAddressExpanded: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginBottom: 2,
  },
  requestFormRowExpanded: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 2,
  },
  inputExpanded: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#334eb8",
    marginRight: 8,
    marginTop: 2,
  },
  sendBtnExpanded: {
    backgroundColor: "#334eb8",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 4,
  },
  sendBtnTextExpanded: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  footerRowExpanded: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 2,
  },
  postedAgoExpanded: {
    fontSize: 12,
    color: "#999",
    marginLeft: 2,
  },
  seeMoreExpanded: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
    marginRight: 2,
  },
  loadMoreBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  requestModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  requestModalBody: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    marginBottom: 24,
  },
  requestModalText: {
    fontSize: 16,
    color: "#334eb8",
    textAlign: "center",
    marginTop: 12,
  },
  requestModalTextSuccess: {
    fontSize: 18,
    color: "#2e7d32",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
  },
  requestModalTextError: {
    fontSize: 18,
    color: "#e53935",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
  },
  requestModalBtn: {
    backgroundColor: "#334eb8",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  requestModalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default JobScreenStaff;
