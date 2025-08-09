import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

import {
  ActivityIndicator,
  Alert,
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
import { staffServices } from "./ProfileScreen";
import StartJobPage from "./StartJob";

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
  const [jobIdToStart, setJobIdToStart] = useState(null);
  const [currentPageView, setCurrentPageView] = useState("jobsList");
  const [rateWarning, setRateWarning] = useState("");

  // Fetch access token on mount
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access_token");
      setAccessToken(token || "");
    })();
  }, []);

  // Combined fetch function for requests and bookings
  const fetchUserActivities = useCallback(async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try {
      // Fetch my requests
      const requestsRes = await fetch(MY_REQUESTS_API_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!requestsRes.ok) throw new Error("Failed to fetch my requests");
      const requestsData = await requestsRes.json();
      setMyRequests(
        Array.isArray(requestsData) ? requestsData : requestsData.items || []
      );

      // Fetch my bookings (approved requests that become jobs)
      const bookingsRes = await fetch(
        "https://api.theopenshift.com/v1/bookings/my_bookings",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!bookingsRes.ok) throw new Error("Failed to fetch my bookings");
      const bookingsData = await bookingsRes.json();
      setMyBookings(
        Array.isArray(bookingsData)
          ? bookingsData
          : bookingsData.items || bookingsData.bookings || []
      );
    } catch (e) {
      setError(e.message || "Error fetching activities");
      setMyRequests([]);
      setMyBookings([]);
    } finally {
      setRefreshing(false);
    }
  }, [accessToken]);

  // Fetch data when accessToken changes, after sending a request, or when tab changes to My Requests/History
  useEffect(() => {
    if (accessToken) {
      fetchJobs(true); // Always refresh jobs when accessToken is available
      if (activeTab === "My Requests" || activeTab === "History") {
        fetchUserActivities();
      }
    }
  }, [accessToken, requestStatus, activeTab, fetchJobs, fetchUserActivities]);

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
        if (reset) {
          setJobs(data.items || []);
        } else {
          setJobs((prev) => [...prev, ...(data.items || [])]);
        }
        setHasMore((data.items || []).length === 10);
        setError("");
      } catch (e) {
        setError(e.message || "Error fetching jobs");
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
    if (activeTab === "My Requests" || activeTab === "History") {
      fetchUserActivities();
    }
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
    //console.log("Send Request button clicked for job:", job);
    console.log("Users Service", staffServices);
    if (!accessToken || !job?.id) return;

    if (!staffServices.includes(job.service)) {
    Alert.alert(
      "Service Type Mismatch",
      "You are applying for a job that is not your type. You might get rejected.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // Do nothing, abort sending request
          },
        },
        {
          text: "Continue",
          onPress: async () => {
            // Proceed with sending the request
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
                fetchUserActivities();
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
          },
        },
      ]
    );
    return;
  }
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
        fetchUserActivities(); // Refresh all activities
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

  // Timer logic for Activity tab (unchanged)
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

  // Fetch jobs for Find Jobs tab: exclude jobs with a pending/approved/sent_for_approval/pending_payment request in myRequests (match by booking_id)
  const myPendingOrActiveBookingIds = new Set(
    myRequests
      .filter((r) =>
        [
          "pending",
          "approved",
          "sent_for_approval",
          "pending_payment",
        ].includes(r.status)
      )
      .map((r) => r.booking_id)
  );
  const jobsForFindJobs = jobs.filter(
    (j) => !myPendingOrActiveBookingIds.has(j.id)
  );

  // Render job card for "Find Jobs"
  const renderJob = ({ item }) => {
    if (!item) return null;
    const isExpanded = expandedJobId === item.id;
    const showFullDesc = !!showFullDescMap[item.id];
    const descLimit = 180;
    const desc = item.description || "No description provided.";
    const shouldTruncate = desc.length > descLimit;
    const displayDesc =
      showFullDesc || !shouldTruncate ? desc : desc.slice(0, descLimit) + "...";
    const org = item.org_id ? orgDetails[item.org_id] : null;

    // Determine if the user has an 'active' request for this job
    const myRequestForThisJob = myRequests.find(
      (r) =>
        r.booking_id === item.id &&
        [
          "pending",
          "approved",
          "sent_for_approval",
          "pending_payment",
        ].includes(r.status)
    );
    const showRequestForm = !myRequestForThisJob;

    if (!isExpanded) {
      return (
        <View style={styles.cardCollapsed}>
          <View style={styles.cardHeaderCollapsed}>
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
          <View style={styles.cardDetailsCollapsed}>
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
                <Text style={styles.pillTextExpanded}>
                  {formatDateTime(item.start_time).split(" ")[0]}{" "}
                  {formatDateTime(item.start_time).split(" ")[1]}{" "}
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
    return (
      <View style={styles.cardExpanded}>
        <View style={styles.cardHeaderExpanded}>
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
        <View style={styles.cardDetailsExpanded}>
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
          </View>

          {myRequestForThisJob ? (
            <View
              style={[
                styles.statusMessageContainer,
                {
                  backgroundColor:
                    myRequestForThisJob.status === "approved"
                      ? "#e0f2f1" // Light teal
                      : myRequestForThisJob.status === "pending"
                      ? "#fffde7" // Light yellow
                      : myRequestForThisJob.status === "sent_for_approval"
                      ? "#ede7f6" // Light purple
                      : myRequestForThisJob.status === "pending_payment"
                      ? "#fff3e0" // Light orange
                      : "#ffebee", // Light red for rejected/cancelled
                  borderColor:
                    myRequestForThisJob.status === "approved"
                      ? "#26a69a"
                      : myRequestForThisJob.status === "pending"
                      ? "#ffb300"
                      : myRequestForThisJob.status === "sent_for_approval"
                      ? "#7e57c2"
                      : myRequestForThisJob.status === "pending_payment"
                      ? "#ff9800"
                      : "#ef5350",
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={
                  myRequestForThisJob.status === "approved"
                    ? "#26a69a"
                    : myRequestForThisJob.status === "pending"
                    ? "#ffb300"
                    : myRequestForThisJob.status === "sent_for_approval"
                    ? "#7e57c2"
                    : myRequestForThisJob.status === "pending_payment"
                    ? "#ff9800"
                    : "#ef5350"
                }
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.statusMessageText,
                  {
                    color:
                      myRequestForThisJob.status === "approved"
                        ? "#26a69a"
                        : myRequestForThisJob.status === "pending"
                        ? "#ffb300"
                        : myRequestForThisJob.status === "sent_for_approval"
                        ? "#7e57c2"
                        : myRequestForThisJob.status === "pending_payment"
                        ? "#ff9800"
                        : "#ef5350",
                  },
                ]}
              >
                {myRequestForThisJob.status === "approved" &&
                  "Your request for this job has been approved."}
                {myRequestForThisJob.status === "pending" &&
                  "You have a pending request for this job."}
                {myRequestForThisJob.status === "sent_for_approval" &&
                  "Timesheet sent for approval."}
                {myRequestForThisJob.status === "pending_payment" &&
                  "Timesheet approved, payment pending."}
                {myRequestForThisJob.status === "rejected" &&
                  "Your request for this job was rejected."}
                {myRequestForThisJob.status === "cancelled" &&
                  "This request has been cancelled."}
              </Text>
            </View>
          ) : (
            <>
              {showRequestForm && (
                <>
                  {rateWarning ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        marginLeft: 5,
                      }}
                    >
                      <Ionicons
                        name="warning"
                        size={18}
                        color="#e53935"
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          color: "#e53935",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        Rate should be at least $30 as per Australian standard.
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.requestFormRowExpanded}>
                    <TextInput
                      style={styles.inputExpanded}
                      placeholder="Rate"
                      keyboardType="numeric"
                      value={rateInput}
                      onChangeText={(text) => {
                        setRateInput(text);
                        if (parseFloat(text) < 30) {
                          setRateWarning("show");
                        } else {
                          setRateWarning("");
                        }
                      }}
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
                    disabled={requestStatus === "pending" || !!rateWarning}
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

  const renderMyRequest = ({ item }) => {
    if (!item) return null;
    const associatedBooking = myBookings.find((b) => b.id === item.booking_id);

    const getStatusStyles = (status) => {
      switch (status) {
        case "approved":
          return { backgroundColor: "#d4edda", color: "#155724" }; // Green
        case "pending":
          return { backgroundColor: "#ffeeba", color: "#856404" }; // Yellow
        case "sent_for_approval":
          return { backgroundColor: "#e2d9f3", color: "#4f3a7a" }; // Purple
        case "pending_payment":
          return { backgroundColor: "#ffe0b2", color: "#e65100" }; // Orange
        case "rejected":
        case "cancelled":
          return { backgroundColor: "#f8d7da", color: "#721c24" }; // Red
        default:
          return { backgroundColor: "#e9ecef", color: "#495057" }; // Gray
      }
    };

    const statusStyle = getStatusStyles(item.status);

    return (
      <View style={styles.myRequestCard}>
        <View style={styles.myRequestCardHeader}>
          <Text style={styles.myRequestTitle}>
            Request for Job ID: {item.booking_id}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusStyle.color }]}
            >
              {item.status.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.myRequestDetail}>Rate: ${item.rate}</Text>
        <Text style={styles.myRequestDetail}>
          Comment: {item.comment || "N/A"}
        </Text>

        {/* Action Buttons */}
        <View style={styles.myRequestButtonsContainer}>
          {item.status === "approved" && associatedBooking ? (
            <TouchableOpacity
              style={styles.startJobButton}
              onPress={() => {
                navigation.navigate("StartJob", {
                  bookingId: item.booking_id,
                  access_token: accessToken,
                });
              }}
            >
              <Text style={styles.startJobButtonText}>Start Job</Text>
            </TouchableOpacity>
          ) : (item.status === "pending" ||
              item.status === "sent_for_approval" ||
              item.status === "pending_payment") &&
            associatedBooking ? (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => {
                setJobIdToStart(item.booking_id);
                setCurrentPageView("startJob");
              }}
            >
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderHistoryRequest = ({ item }) => {
    if (!item) return null;

    const getStatusStyles = (status) => {
      switch (status) {
        case "rejected":
        case "cancelled":
          return { backgroundColor: "#f8d7da", color: "#721c24" }; // Red
        default:
          return { backgroundColor: "#e9ecef", color: "#495057" }; // Gray
      }
    };

    const statusStyle = getStatusStyles(item.status);

    return (
      <View style={styles.myRequestCard}>
        <View style={styles.myRequestCardHeader}>
          <Text style={styles.myRequestTitle}>
            Request for Job ID: {item.booking_id}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusStyle.color }]}
            >
              {item.status.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.myRequestDetail}>Rate: ${item.rate}</Text>
        <Text style={styles.myRequestDetail}>
          Comment: {item.comment || "N/A"}
        </Text>
        {/* No action buttons for history items */}
      </View>
    );
  };

  if (currentPageView === "startJob" && jobIdToStart) {
    const jobToDisplay =
      jobs.find((job) => job.id === jobIdToStart) ||
      myBookings.find((booking) => booking.id === jobIdToStart) ||
      myRequests.find((req) => req.booking_id === jobIdToStart);

    if (!jobToDisplay) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Job details not found.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentPageView("jobsList")}
          >
            <Text style={styles.backButtonText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <StartJobPage
        job={jobToDisplay}
        onBack={() => {
          setCurrentPageView("jobsList");
          setJobIdToStart(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Jobs</Text>
          <Text style={styles.subtitle}>
            Caring starts with the right connection, let's find yours ✨
          </Text>
        </View>
      </View>

      {/* Top Tabs + Bell Icon */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollViewContent}
        >
          {["Find Jobs", "My Requests", "History"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#334eb8" />
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering based on activeTab */}
      {activeTab === "Find Jobs" && (
        <FlatList
          data={jobsForFindJobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && hasMore ? (
              <ActivityIndicator size="large" color="#334eb8" />
            ) : null
          }
          ListEmptyComponent={
            !loading && !error && jobsForFindJobs.length === 0 ? (
              <Text style={styles.emptyListText}>No jobs found.</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === "My Requests" && (
        <FlatList
          data={myRequests.filter((r) =>
            [
              "pending",
              "approved",
              "sent_for_approval",
              "pending_payment",
            ].includes(r.status)
          )}
          renderItem={renderMyRequest}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !refreshing &&
            myRequests.filter((r) =>
              [
                "pending",
                "approved",
                "sent_for_approval",
                "pending_payment",
              ].includes(r.status)
            ).length === 0 ? (
              <Text style={styles.emptyListText}>
                No active requests found.
              </Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === "History" && (
        <FlatList
          data={myRequests.filter((r) =>
            ["rejected", "cancelled"].includes(r.status)
          )}
          renderItem={renderHistoryRequest}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !refreshing &&
            myRequests.filter((r) =>
              ["rejected", "cancelled"].includes(r.status)
            ).length === 0 ? (
              <Text style={styles.emptyListText}>
                No historical requests found.
              </Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

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
                      filters.service.includes(s.key) && styles.pillTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Day of Week</Text>
            <View style={styles.pillsRow}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.pill,
                    filters.day.includes(d) && styles.pillActive,
                  ]}
                  onPress={() => {
                    setFilters((f) => ({
                      ...f,
                      day: f.day.includes(d)
                        ? f.day.filter((k) => k !== d)
                        : [...f.day, d],
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      filters.day.includes(d) && styles.pillTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyFiltersBtn}
              onPress={() => {
                setFilterModalVisible(false);
                setPage(1); // Reset page to 1 on applying new filters
                fetchJobs(true); // Re-fetch jobs with new filters from page 1
              }}
            >
              <Text style={styles.applyFiltersBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request Confirmation Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRequestModalVisible(false)}
        />
        <View style={styles.requestModalContent}>
          <View style={styles.requestModalBody}>
            {requestStatus === "success" ? (
              <LottieView
                source={require("../../assets/lotties/success_request.json")} // Make sure you have a success animation
                autoPlay
                loop={false}
                style={{ width: 150, height: 150 }}
              />
            ) : (
              <Ionicons name="close-circle" size={80} color="#e53935" />
            )}
            <Text
              style={
                requestStatus === "success"
                  ? styles.requestModalTextSuccess
                  : styles.requestModalText
              }
            >
              {requestStatus === "success"
                ? "Request Sent Successfully!"
                : requestResponse?.error ||
                  "Failed to send request. Please try again."}
            </Text>
            <TouchableOpacity
              style={styles.requestModalButton}
              onPress={() => setRequestModalVisible(false)}
            >
              <Text style={styles.requestModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkout Message */}
      {checkoutMessage ? (
        <View style={styles.checkoutMessageContainer}>
          <Text style={styles.checkoutMessageText}>{checkoutMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffbd59",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  titleContainer: {
    width: "100%",
  },
  title: {
    color: "#1d3491",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#1d3491",
    fontSize: 13,
    textAlign: "left",
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  tabsScrollViewContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#e6edff",
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonActive: {
    backgroundColor: "#334eb8",
  },
  tabButtonText: {
    color: "#334eb8",
    fontWeight: "bold",
    fontSize: 15,
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  bellBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#e6edff",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 10,
  },
  cardCollapsed: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  jobTitleCollapsed: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  cardDetailsCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pillCollapsed: {
    backgroundColor: "#e6edff",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  pillCollapsedDateandTime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6edff",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pillTextCollapsed: {
    color: "#334eb8",
    fontSize: 12,
    fontWeight: "600",
  },
  footerRowCollapsed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  postedAgoCollapsed: {
    fontSize: 12,
    color: "#888",
  },
  seeMoreCollapsed: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "600",
  },
  cardExpanded: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardHeaderExpanded: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  jobTitleExpanded: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  companyLineExpanded: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  cardDetailsExpanded: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pillExpanded: {
    backgroundColor: "#e6edff",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  pillExpandedDateandTime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6edff",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillTextExpanded: {
    color: "#334eb8",
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionExpanded: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 10,
  },
  readMoreExpanded: {
    fontSize: 14,
    color: "#334eb8",
    fontWeight: "500",
    marginBottom: 15,
  },
  orgDetailsBox: {
    backgroundColor: "#f0f4f7",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  orgDetailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  orgNameExpanded: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  orgDescExpanded: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  orgAddressExpanded: {
    fontSize: 14,
    color: "#666",
  },
  requestFormRowExpanded: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  inputExpanded: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  sendBtnExpanded: {
    backgroundColor: "#334eb8",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  sendBtnTextExpanded: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerRowExpanded: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
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
  emptyListText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#777",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "red",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContentWrap: {
    justifyContent: "flex-end",
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  pill: {
    backgroundColor: "#f0f4f7",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pillActive: {
    backgroundColor: "#334eb8",
    borderColor: "#334eb8",
  },
  pillText: {
    color: "#555",
    fontSize: 14,
  },
  pillTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  applyFiltersBtn: {
    backgroundColor: "#334eb8",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  applyFiltersBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  requestModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  requestModalBody: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  requestModalText: {
    fontSize: 18,
    color: "#e53935",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 25,
    fontWeight: "500",
  },
  requestModalTextSuccess: {
    fontSize: 20,
    color: "#2e7d32",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 25,
  },
  requestModalButton: {
    backgroundColor: "#334eb8",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  requestModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkoutMessageContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  checkoutMessageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  myRequestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  myRequestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  myRequestTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  myRequestDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    minWidth: 80,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  myRequestButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  startJobButton: {
    backgroundColor: "#28a745", // Green for Start Job
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  startJobButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  viewDetailsButton: {
    backgroundColor: "#007bff", // Blue for View Details
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 15,
    justifyContent: "center",
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    backgroundColor: "#334eb8",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default JobScreenStaff;
