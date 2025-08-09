import { Feather, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import Date/Time Picker
import DateTimePicker from "@react-native-community/datetimepicker";

// Import GeoapifyAutocomplete from your components folder
import GeoapifyAutocomplete from "../components/GeoapifyAutocomplete";

// Import Australian states and suburbs data
import {
  AU_STATES_SUBURBS,
  AU_STATE_LABELS,
} from "../../assets/au-states-suburbs";


// API Utility - Now uses actual endpoints
const BASE_URL = "https://api.theopenshift.com";

const FORM_NAV_HEIGHT = 140;

const api = {
  getToken: async () => {
    return await SecureStore.getItemAsync("access_token");
  },
  fetchWithAuth: async (url, options = {}) => {
    const token = await api.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    };

    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
      });
      const text = await response.text(); // Get raw response text
      let data;
      try {
        data = text ? JSON.parse(text) : {}; // Attempt to parse if not empty
      } catch (e) {
        //console.warn("API Response not JSON:", text);
        data = { message: "Invalid JSON response from server", raw: text };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `API error: ${response.status} - ${
              response.statusText || "Unknown Error"
            }`
        );
      }
      return data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  },

  getMyBookings: async () => {
    return api.fetchWithAuth("/v1/bookings/my_bookings");
  },
  getBookingById: async (bookingId) => {
    return api.fetchWithAuth(`/v1/bookings/${bookingId}`);
  },
  createBooking: async (payload) => {
    return api.fetchWithAuth("/v1/bookings/new", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  editBooking: async (bookingId, payload) => {
    return api.fetchWithAuth(`/v1/bookings/${bookingId}`, {
      method: "PATCH", // Changed to PATCH
      body: JSON.stringify(payload),
    });
  },
  cancelBooking: async (bookingId) => {
    // Changed to PATCH with booking_id as query
    return api.fetchWithAuth(`/v1/bookings/cancel?booking_id=${bookingId}`, {
      method: "PATCH",
    });
  },
  getApplicantsForJob: async (bookingId) => {
    return api.fetchWithAuth(
      `/v1/bookings/my_requests?booking_id=${bookingId}`
    );
  },
  getUserProfileById: async (userId) => {
    return api.fetchWithAuth(`/v1/users/${userId}`);
  },
  respondToRequest: async (requestId, approve) => {
    return api.fetchWithAuth(
      `/v1/bookings/request_response/${requestId}?approve=${encodeURIComponent(
        approve
      )}`,
      {
        method: "POST",
        //body: JSON.stringify({ status: approve ? "approved" : "rejected" }),
      }
    );
  },
  respondToTimesheetRequest: async (bookingId, approve, amount) => {
    // This is for timesheet approval/rejection
    return api.fetchWithAuth(
      `/v1/bookings/timesheet/request_response/${bookingId}?approve=${encodeURIComponent(
        approve
      )}`,
      {
        method: "POST", 
        body: JSON.stringify({
          status: approve ? "approved" : "rejected",
          amount: parseFloat(amount), // Ensure amount is number
        }),
      }
    );
  },
  createBookingPaymentSession: async (bookingId) => {
    return api.fetchWithAuth(
      `/v1/payments/booking_payment?booking_id=${bookingId}`,
      {
        method: "POST",
      }
    );
  },
};

const SERVICE_TYPES = [
  // {
  //   key: "everyday",
  //   label: "Daily living, social and community activities",
  //   icon: ({ style }) => (
  //     <MaterialCommunityIcons
  //       name="home-outline"
  //       size={24}
  //       color="#2954bd"
  //       style={style}
  //     />
  //   ),
  //   description:
  //     "Social support, housework, gardening, transport, meal prep and more.",
  // },
  {
    key: "self_care",
    label: "Personal Care Worker",
    icon: ({ style }) => (
      <Ionicons name="heart-outline" size={24} color="#2954bd" style={style} />
    ),
    description:
      "Showering, hoist and transfer, assistance with medication and more.",
    badge: "Certification Required",
  },
  {
    key: "nursing",
    label: "Nursing",
    icon: ({ style }) => (
      <Feather name="clipboard" size={24} color="#2954bd" style={style} />
    ),
    description: "Wound care, catheter care and more.",
    badge: "Certification Required",
  },
  // {
  //   key: "allied_health",
  //   label: "Allied Health",
  //   icon: ({ style }) => (
  //     <Feather name="briefcase" size={24} color="#2954bd" style={style} />
  //   ),
  //   description:
  //     "Occupational therapy, psychology, physiotherapy and speech therapy.",
  //   badge: "Certification Required",
  // },
];

const ManageJob = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("active");
  const [showJobForm, setShowJobForm] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [selectedService, setSelectedService] = useState(null);
  const [location, setLocation] = useState("");
  const [suburb, setSuburb] = useState("");
  const [day, setDay] = useState(""); // Stores YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // Stores HH:MM
  const [endTime, setEndTime] = useState(""); // Stores HH:MM
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState({ title: false, description: false });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeJobs, setActiveJobs] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [applicantsLoading, setApplicantsLoading] = useState({});
  const [applicantsError, setApplicantsError] = useState({});
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [profileLoading, setProfileLoading] = useState({});
  const [timesheetActionLoading, setTimesheetActionLoading] = useState({});
  const [timesheetActionSuccess, setTimesheetActionSuccess] = useState({});
  const [paymentActionLoading, setPaymentActionLoading] = useState({});
  const [paymentActionError, setPaymentActionError] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Date/Time Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePickerStart, setShowTimePickerStart] = useState(false);
  const [showTimePickerEnd, setShowTimePickerEnd] = useState(false);
  const [currentPickerDate, setCurrentPickerDate] = useState(new Date()); // For date picker initial value
  const [currentPickerTime, setCurrentPickerTime] = useState(new Date()); // For time picker initial value

  // Fetch jobs from backend on mount and tab change
  const fetchJobs = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const data = await api.getMyBookings();
      setActiveJobs(Array.isArray(data) ? data : data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setErrorMessage(err.message || "Failed to fetch jobs");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Utility to get correct start and end Date objects for overnight shifts
  const getShiftDateTimes = (dateStr, startTime, endTime) => {
    // dateStr: YYYY-MM-DD, startTime/endTime: HH:MM
    const [year, month, day] = dateStr.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = new Date(year, month - 1, day, startHour, startMinute);
    let end = new Date(year, month - 1, day, endHour, endMinute);

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    return { start, end };
  };

  const handleSubmitJob = async () => {
    setErrorMessage("");
    setActionLoading(true);
    if (
      !selectedService ||
      !location ||
      !suburb ||
      !day ||
      !startTime ||
      !endTime ||
      !title ||
      description.length < 10
    ) {
      setErrorMessage(
        "All fields are required and description must be at least 10 characters."
      );
      Alert.alert(
        "Validation Error",
        "All fields are required and description must be at least 10 characters."
      );
      setActionLoading(false);
      return;
    }
    try {
      const { start, end } = getShiftDateTimes(day, startTime, endTime);
      const payload = {
        service: selectedService,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        address: location,
        suburb: suburb,
        title: title,
        description: description,
        notes: description,
      };
      if (editJob) {
        await api.editBooking(editJob.id, payload);
      } else {
        await api.createBooking(payload);
      }
      setShowSuccessMessage(true);
      // Reset form fields
      setShowJobForm(false);
      setStep(1);
      setSelectedService(null);
      setLocation("");
      setSuburb("");
      setDay("");
      setStartTime("");
      setEndTime("");
      setTitle("");
      setDescription("");
      setTouched({ title: false, description: false });
      setEditJob(null);
      setSelectedState(""); // Reset state picker
      fetchJobs();
      setTimeout(() => {
        setShowSuccessMessage(false);
        setActiveTab("active");
      }, 3000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to save job");
      Alert.alert("API Error", err.message || "Failed to save job");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    setActionLoading(true);
    setErrorMessage("");
    try {
      await api.cancelBooking(jobId);
      Alert.alert("Success", "Job cancelled successfully.");
      fetchJobs();
      setExpandedApplicantsJobId(null);
    } catch (err) {
      setErrorMessage(err.message || "Failed to cancel job");
      Alert.alert("API Error", err.message || "Failed to cancel job");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditJob = async (job) => {
    setActionLoading(true);
    setErrorMessage("");
    try {
      // Fetch the latest job details to ensure we have all fields
      const fullJobDetails = await api.getBookingById(job.id);

      setEditJob(fullJobDetails);
      setShowJobForm(true);
      setStep(1);
      setSelectedService(fullJobDetails.service);
      setLocation(fullJobDetails.address || "");
      setSuburb(fullJobDetails.suburb || "");

      let foundState = "";
      if (fullJobDetails.suburb) {
        Object.entries(AU_STATES_SUBURBS).forEach(([state, suburbs]) => {
          if (suburbs.includes(fullJobDetails.suburb)) foundState = state;
        });
      }
      setSelectedState(foundState);

      if (fullJobDetails.start_time) {
        const startDate = new Date(fullJobDetails.start_time);
        setDay(startDate.toISOString().split("T")[0]); // YYYY-MM-DD
        setStartTime(
          startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        ); // HH:MM
      } else {
        setDay("");
        setStartTime("");
      }
      if (fullJobDetails.end_time) {
        const endDate = new Date(fullJobDetails.end_time);
        setEndTime(
          endDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        ); // HH:MM
      } else {
        setEndTime("");
      }

      setTitle(fullJobDetails.title || "");
      setDescription(fullJobDetails.notes || "");
      setTouched({ title: false, description: false });
      setExpandedApplicantsJobId(null);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load job for editing");
      Alert.alert(
        "API Error",
        err.message || "Failed to load job for editing."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const activeJobsList = activeJobs.filter((job) =>
    ["pending", "confirmed", "checked_in", "checked_out"].includes(job.status)
  );

  const timesheetApprovalJobs = activeJobs.filter(
    (job) => job.status === "sent_for_approval"
  );
  const paymentsJobs = activeJobs.filter((job) =>
    ["pending_payment", "payment_failed"].includes(job.status)
  );
  const historyJobsList = activeJobs.filter((job) =>
    [
      "completed",
      "cancelled",
      "expired",
      "payment_received",
      "no_show",
    ].includes(job.status)
  );

  const handleViewApplicants = async (jobId) => {
    if (expandedApplicantsJobId === jobId) {
      setExpandedApplicantsJobId(null);
      return;
    }
    setExpandedApplicantsJobId(jobId);
    if (!applicants[jobId]) {
      setApplicantsLoading((a) => ({ ...a, [jobId]: true }));
      setApplicantsError((a) => ({ ...a, [jobId]: "" }));
      try {
        const data = await api.getApplicantsForJob(jobId);
        setApplicants((a) => ({
          ...a,
          [jobId]: Array.isArray(data) ? data : data.items || [],
        }));
      } catch (e) {
        setApplicantsError((a) => ({
          ...a,
          [jobId]: e.message || "Failed to fetch applicants",
        }));
        Alert.alert("API Error", e.message || "Failed to fetch applicants");
      } finally {
        setApplicantsLoading((a) => ({ ...a, [jobId]: false }));
      }
    }
  };

  const fetchApplicantProfile = async (userId) => {
    if (applicantProfiles[userId] || profileLoading[userId]) return;
    setProfileLoading((p) => ({ ...p, [userId]: true }));
    try {
      const profile = await api.getUserProfileById(userId);
      setApplicantProfiles((p) => ({
        ...p,
        [userId]: { fname: profile.fname, lname: profile.lname },
      }));
    } catch {
      setApplicantProfiles((p) => ({ ...p, [userId]: null }));
    } finally {
      setProfileLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  useEffect(() => {
    if (!expandedApplicantsJobId || typeof expandedApplicantsJobId !== "number")
      return;
    const applicantList = applicants[expandedApplicantsJobId] || [];
    applicantList.forEach((applicant) => {
      if (
        applicant.user_id &&
        !applicantProfiles[applicant.user_id] &&
        !profileLoading[applicant.user_id]
      ) {
        fetchApplicantProfile(applicant.user_id);
      }
    });
  }, [expandedApplicantsJobId, applicants, applicantProfiles, profileLoading]);

  const handleRespondToApplicant = async (requestId, approve, jobId) => {
    setApplicantsLoading((a) => ({ ...a, [jobId]: true }));
    try {
      await api.respondToRequest(requestId, approve);
      Alert.alert(
        "Success",
        `Applicant request ${approve ? "approved" : "rejected"} successfully.`
      );
      const data = await api.getApplicantsForJob(jobId);
      setApplicants((a) => ({
        ...a,
        [jobId]: Array.isArray(data) ? data : data.items || [],
      }));
      fetchJobs();
    } catch (e) {
      if (e.raw) {
      console.log("API error raw response:", e.raw);
    }
      setApplicantsError((a) => ({
        ...a,
        [jobId]: e.message || "Failed to update applicant",
      }));
      Alert.alert("API Error", e.message || "Failed to update applicant");
    } finally {
      setApplicantsLoading((a) => ({ ...a, [jobId]: false }));
    }
  };

  const downloadTimesheetPDF = (details) => {
    Alert.alert(
      "PDF Download",
      "PDF generation is in progress. This will be available soon."
    );
    console.log("Attempting to download PDF for:", details);
  };

  const getAmountForJob = (job) => {
    const checkIn = job.check_in_time ? new Date(job.check_in_time) : null;
    const checkOut = job.check_out_time ? new Date(job.check_out_time) : null;
    if (checkIn && checkOut && job.rate) {
      const durationMs = checkOut.getTime() - checkIn.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      return (job.rate * durationHours).toFixed(2);
    }
    return "0.00";
  };

  const handleTimesheetApproval = async (jobId, approve) => {
    setTimesheetActionLoading((l) => ({ ...l, [jobId]: true }));
    setTimesheetActionSuccess((s) => ({ ...s, [jobId]: false }));
    try {
      const jobToApprove = activeJobs.find((j) => j.id === jobId);
      if (!jobToApprove)
        throw new Error("Job not found for timesheet approval.");
      const amount = getAmountForJob(jobToApprove);
      await api.respondToTimesheetRequest(jobId, approve, amount); 
      setTimesheetActionSuccess((s) => ({ ...s, [jobId]: true }));
      Alert.alert(
        "Success",
        `Timesheet ${approve ? "approved" : "rejected"} successfully.`
      );
      fetchJobs();
    } catch (e) {
      Alert.alert(
        "API Error",
        e.message || `Failed to ${approve ? "approve" : "reject"} timesheet.`
      );
    } finally {
      setTimesheetActionLoading((l) => ({ ...l, [jobId]: false }));
      setTimeout(
        () => setTimesheetActionSuccess((s) => ({ ...s, [jobId]: false })),
        2000
      );
    }
  };

  const handleProceedToPay = async (jobId) => {
    setPaymentActionLoading((l) => ({ ...l, [jobId]: true }));
    setPaymentActionError((s) => ({ ...s, [jobId]: "" }));
    try {
      const response = await api.createBookingPaymentSession(jobId);
      if (response && response.url) {
        Alert.alert(
          "Payment Redirect",
          "You will be redirected to the payment gateway.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Proceed", onPress: () => Linking.openURL(response.url) },
          ]
        );
        fetchJobs();
      } else {
        setPaymentActionError((s) => ({
          ...s,
          [jobId]: "Failed to get payment URL.",
        }));
        Alert.alert("API Error", "Failed to get payment URL.");
      }
    } catch (e) {
      setPaymentActionError((s) => ({
        ...s,
        [jobId]: e.message || "Failed to initiate payment.",
      }));
      Alert.alert("API Error", e.message || "Failed to initiate payment.");
    } finally {
      setPaymentActionLoading((l) => ({ ...l, [jobId]: false }));
    }
  };

  // Date Picker Handler
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDay(selectedDate.toISOString().split("T")[0]); // YYYY-MM-DD
    }
  };

  // Time Picker Handler
  const onTimeChange = (event, selectedTime) => {
    if (showTimePickerStart) {
      setShowTimePickerStart(false);
      if (selectedTime) {
        setStartTime(
          selectedTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }
    } else if (showTimePickerEnd) {
      setShowTimePickerEnd(false);
      if (selectedTime) {
        setEndTime(
          selectedTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }
    }
  };

  const renderJobItem = ({ item: job, type }) => {
    const applicantList = applicants[job.id] || [];
    const applicantCount = applicantList.length;
    const profile = applicantProfiles[job.worker_id]; // Assuming 'worker_id' for timesheets/payments
    const profileLoadingStatus = profileLoading[job.worker_id];

    const getStatusBadgeStyle = (status) => {
      switch (status) {
        case "active":
        case "approved":
        case "confirmed":
          return { backgroundColor: "#d4edda", color: "#155724" }; // Green
        case "pending":
          return { backgroundColor: "#ffeeba", color: "#856404" }; // Yellow
        case "sent_for_approval":
          return { backgroundColor: "#e2d9f3", color: "#4f3a7a" }; // Purple
        case "pending_payment":
          return { backgroundColor: "#ffe0b2", color: "#e65100" }; // Orange
        case "completed":
        case "paid":
          return { backgroundColor: "#e9ecef", color: "#495057" }; // Gray
        case "cancelled":
        case "rejected":
          return { backgroundColor: "#f8d7da", color: "#721c24" }; // Red
        default:
          return { backgroundColor: "#e9ecef", color: "#495057" }; // Default gray
      }
    };

    const statusStyle = getStatusBadgeStyle(job.status);

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobCardHeader}>
          <Text style={styles.jobTitle}>{job.title || "Untitled Job"}</Text>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text
              style={[styles.statusBadgeText, { color: statusStyle.color }]}
            >
              {job.status ? job.status.replace(/_/g, " ").toUpperCase() : "N/A"}
            </Text>
          </View>
        </View>

        <Text style={styles.jobInfo}>
          Service:
          {SERVICE_TYPES.find((s) => s.key === job.service)?.label ||
            job.service}
        </Text>
        <Text style={styles.jobInfo}>Location: {job.suburb}</Text>
        <Text style={styles.jobInfo}>
          Date:
          {job.start_time
            ? new Date(job.start_time).toLocaleDateString()
            : "N/A"}
        </Text>
        <Text style={styles.jobInfo}>
          Time:
          {job.start_time && job.end_time
            ? `${new Date(job.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${new Date(job.end_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "N/A"}
        </Text>

        {/* Conditional content based on tab type */}
        {type === "active" && (
          <View style={styles.jobCardSection}>
            <Text style={styles.sectionSubTitle}>Applicants</Text>
            <TouchableOpacity
              style={styles.applicantButton}
              onPress={() => handleViewApplicants(job.id)}
            >
              <Text style={styles.applicantButtonText}>
                {applicantCount > 0
                  ? `${applicantCount} Applicant${
                      applicantCount > 1 ? "s" : ""
                    }`
                  : "Show Applicants"}
                {expandedApplicantsJobId === job.id ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {expandedApplicantsJobId === job.id && (
              <View style={styles.applicantsListContainer}>
                {applicantsLoading[job.id] ? (
                  <ActivityIndicator size="small" color="#334eb8" />
                ) : applicantsError[job.id] ? (
                  <Text style={styles.errorTextSmall}>
                    {applicantsError[job.id]}
                  </Text>
                ) : applicantList.length === 0 ? (
                  <Text style={styles.emptyText}>No applicants yet.</Text>
                ) : (
                  applicantList.map((applicant) => (
                    <View key={applicant.id} style={styles.applicantCard}>
                      <View>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("UserProfile", {
                              userId: applicant.user_id,
                            })
                          }
                        >
                          <Text style={styles.applicantName}>
                            Applicant:{" "}
                            {profileLoading[applicant.user_id]
                              ? "Loading..."
                              : applicantProfiles[applicant.user_id]?.fname ||
                                "Unknown User"}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.applicantComment}>
                          Comment: {applicant.comment || "No comment"}
                        </Text>
                        <Text style={styles.applicantRate}>
                          Rate: ${applicant.rate}
                        </Text>
                        <Text style={styles.applicantStatus}>
                          Status: {applicant.status}
                        </Text>
                      </View>
                      <View style={styles.applicantActions}>
                        <TouchableOpacity
                          style={[
                            styles.actionButtonSmall,
                            styles.approveButton,
                          ]}
                          onPress={() =>
                            handleRespondToApplicant(applicant.id, true, job.id)
                          }
                          disabled={
                            applicant.status !== "pending" ||
                            applicantsLoading[job.id]
                          }
                        >
                          <Text style={styles.actionButtonTextSmall}>
                            Approve
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButtonSmall,
                            styles.rejectButton,
                          ]}
                          onPress={() =>
                            handleRespondToApplicant(
                              applicant.id,
                              false,
                              job.id
                            )
                          }
                          disabled={
                            applicant.status !== "pending" ||
                            applicantsLoading[job.id]
                          }
                        >
                          <Text style={styles.actionButtonTextSmall}>
                            Reject
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {type === "timesheet" && (
          <View style={styles.jobCardSection}>
            <Text style={styles.sectionSubTitle}>Timesheet Details</Text>
            <Text style={styles.jobInfo}>
              Worker:
              {profileLoading[job.worker_id]
                ? "Loading..."
                : applicantProfiles[job.worker_id]?.fname || "N/A"}
            </Text>
            <Text style={styles.jobInfo}>
              Check-in:
              {job.check_in_time
                ? new Date(job.check_in_time).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.jobInfo}>
              Check-out:
              {job.check_out_time
                ? new Date(job.check_out_time).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.jobInfo}>Rate: ${job.rate}</Text>
            <Text style={styles.jobInfo}>
              Calculated Amount: ${getAmountForJob(job)}
            </Text>
            <View style={styles.timesheetActions}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadTimesheetPDF(job)}
              >
                <Text style={styles.actionButtonText}>Download Timesheet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleTimesheetApproval(job.id, true)}
                disabled={timesheetActionLoading[job.id]}
              >
                <Text style={styles.actionButtonText}>
                  {timesheetActionLoading[job.id]
                    ? "Approving..."
                    : "Approve Timesheet"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleTimesheetApproval(job.id, false)}
                disabled={timesheetActionLoading[job.id]}
              >
                <Text style={styles.actionButtonText}>
                  {timesheetActionLoading[job.id]
                    ? "Rejecting..."
                    : "Reject Timesheet"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {type === "payments" && (
          <View style={styles.jobCardSection}>
            <Text style={styles.sectionSubTitle}>Payment Details</Text>
            <Text style={styles.jobInfo}>
              Worker:
              {profileLoading[job.worker_id]
                ? "Loading..."
                : applicantProfiles[job.worker_id]?.fname || "N/A"}
            </Text>
            <Text style={styles.jobInfo}>
              Check-in:
              {job.check_in_time
                ? new Date(job.check_in_time).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.jobInfo}>
              Check-out:
              {job.check_out_time
                ? new Date(job.check_out_time).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.jobInfo}>Rate: ${job.rate}</Text>
            <Text style={styles.jobInfo}>
              Amount Due: ${getAmountForJob(job)}
            </Text>
            <View style={styles.timesheetActions}>
              {/*<TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadTimesheetPDF(job)}
              >
                <Text style={styles.actionButtonText}>Download Timesheet</Text>
              </TouchableOpacity>*/}
              <TouchableOpacity
                style={[styles.actionButton, styles.proceedToPayButton]}
                onPress={() => handleProceedToPay(job.id)}
                disabled={paymentActionLoading[job.id]}
              >
                <Text style={styles.actionButtonText}>
                  {paymentActionLoading[job.id]
                    ? "Redirecting..."
                    : "Proceed to Pay"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {type === "history" && (
          <View style={styles.jobCardSection}>
            <Text style={styles.sectionSubTitle}>Job Outcome</Text>
            <Text style={styles.jobInfo}>Status: {job.status}</Text>
            {job.check_in_time && (
              <>
                <Text style={styles.jobInfo}>
                  Check-in: {new Date(job.check_in_time).toLocaleString()}
                </Text>
                <Text style={styles.jobInfo}>
                  Check-out: {new Date(job.check_out_time).toLocaleString()}
                </Text>
                <Text style={styles.jobInfo}>Rate: ${job.rate}</Text>
                <Text style={styles.jobInfo}>
                  Amount: ${getAmountForJob(job)}
                </Text>
              </>
            )}
            {(job.status === "completed" || job.status === "paid") && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadTimesheetPDF(job)}
              >
                <Text style={styles.actionButtonText}>Download Timesheet</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action buttons for Active Jobs tab */}
        {type === "active" && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleEditJob(job)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Edit Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() =>
                Alert.alert(
                  "Confirm Cancellation",
                  "Are you sure you want to cancel this job?",
                  [
                    { text: "No", style: "cancel" },
                    { text: "Yes", onPress: () => handleCancelJob(job.id) },
                  ]
                )
              }
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Cancel Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer} 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} 
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Jobs</Text>
          <TouchableOpacity
            style={styles.createJobButton}
            onPress={() => {
              setShowJobForm(true);
              setEditJob(null);
              setStep(1);
              setSelectedService(null);
              setLocation("");
              setSuburb("");
              setDay("");
              setStartTime("");
              setEndTime("");
              setTitle("");
              setDescription("");
              setTouched({ title: false, description: false });
              setSelectedState("");
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.createJobButtonText}>Create Job</Text>
          </TouchableOpacity>
        </View>
        {/* Main Scrollable Content Area */}
        <ScrollView
          style={styles.scrollableArea} // This ScrollView takes up remaining vertical space
          contentContainerStyle={[
            styles.scrollableAreaContent, // Base content padding
            showJobForm && {
              paddingBottom: FORM_NAV_HEIGHT + (Platform.OS === "ios" ? 0 : 10),
            }, // Add padding only when form is active, + extra for Android if needed
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchJobs} />
          }
        >
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Error: {errorMessage}</Text>
            </View>
          )}
          {showSuccessMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>
                Job listed successfully!
              </Text>
            </View>
          )}

          {!showJobForm ? (
            <>
              {/* Tabs - These can be inside the ScrollView if they scroll with the lists */}
              <View style={styles.tabsContainer}>
                {["active", "history", "timesheet", "payments"].map((tab) => (
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
                      {tab.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Job Lists */}
              {activeTab === "active" && (
                <FlatList
                  data={activeJobsList}
                  renderItem={({ item }) =>
                    renderJobItem({ item, type: "active" })
                  }
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>
                        No active job listings.
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={styles.flatListInnerContent} // Use inner content style
                />
              )}
              {activeTab === "history" && (
                <FlatList
                  data={historyJobsList}
                  renderItem={({ item }) =>
                    renderJobItem({ item, type: "history" })
                  }
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>
                        No job history yet.
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={styles.flatListInnerContent} // Use inner content style
                />
              )}
              {activeTab === "timesheet" && (
                <FlatList
                  data={timesheetApprovalJobs}
                  renderItem={({ item }) =>
                    renderJobItem({ item, type: "timesheet" })
                  }
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>
                        No timesheet approval requests.
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={styles.flatListInnerContent} // Use inner content style
                />
              )}
              {activeTab === "payments" && (
                <FlatList
                  data={paymentsJobs}
                  renderItem={({ item }) =>
                    renderJobItem({ item, type: "payments" })
                  }
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>
                        No pending payments.
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={styles.flatListInnerContent} // Use inner content style
                />
              )}
            </>
          ) : (
            // Job Creation/Edit Form Steps Content (excluding its own navigation)
            // This is now just a normal View, not a KeyboardAvoidingView
            <View style={styles.formContentWrapper}>
              <View style={styles.stepperHeader}>
                <Text style={styles.stepperTitle}>
                  {editJob ? "Edit Job" : "Post a Job"}
                </Text>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={() => setShowJobForm(false)}
                >
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stepperProgress}>
                {[1, 2, 3, 4].map((s) => (
                  <View key={s} style={styles.stepperStep}>
                    <View
                      style={[
                        styles.stepperCircle,
                        step >= s && styles.stepperCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepperCircleText,
                          step >= s && styles.stepperCircleTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepperLabel,
                        step >= s && styles.stepperLabelActive,
                      ]}
                    >
                      {s === 1
                        ? "Service Types"
                        : s === 2
                        ? "Location & Time"
                        : s === 3
                        ? "Details"
                        : "Preview"}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.formStepContent}>
                {step === 1 && (
                  <View>
                    <Text style={styles.sectionTitle}>Service Types</Text>
                    <Text style={styles.sectionDescription}>
                      Select the support service you want to include.
                    </Text>
                    {SERVICE_TYPES.map((service) => (
                      <TouchableOpacity
                        key={service.key}
                        style={[
                          styles.serviceOption,
                          selectedService === service.key &&
                            styles.serviceOptionActive,
                        ]}
                        onPress={() => setSelectedService(service.key)}
                      >
                        <View style={styles.serviceOptionIconContainer}>
                          {service.icon({ style: styles.serviceOptionIcon })}
                        </View>
                        <View style={styles.serviceOptionTextContainer}>
                          <Text style={styles.serviceOptionLabel}>
                            {service.label}
                          </Text>
                          {service.badge && (
                            <View style={styles.serviceOptionBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={12}
                                color="#f9a825"
                              />
                              <Text style={styles.serviceOptionBadgeText}>
                                {service.badge}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.serviceOptionDescription}>
                            {service.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {step === 2 && (
                  <View>
                    <Text style={styles.sectionTitle}>Location & Time</Text>
                    <Text style={styles.sectionDescription}>
                      The starting suburb where support will take place. Start
                      typing the suburb or postcode and select from the list.
                    </Text>

                    <Text style={styles.inputLabel}>State</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedState}
                        onValueChange={(itemValue) => {
                          setSelectedState(itemValue);
                          setSuburb(""); // Reset suburb when state changes
                        }}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                      >
                        <Picker.Item label="Select state" value="" />
                        {Object.entries(AU_STATE_LABELS).map(
                          ([code, label]) => (
                            <Picker.Item
                              key={code}
                              label={label}
                              value={code}
                            />
                          )
                        )}
                      </Picker>
                    </View>

                    {selectedState && (
                      <>
                        <Text style={styles.inputLabel}>Suburb</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={suburb}
                            onValueChange={(itemValue) => setSuburb(itemValue)}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
                          >
                            <Picker.Item label="Select suburb" value="" />
                            {(AU_STATES_SUBURBS[selectedState] || []).map(
                              (s) => (
                                <Picker.Item key={s} label={s} value={s} />
                              )
                            )}
                          </Picker>
                        </View>
                      </>
                    )}

                    <Text style={styles.inputLabel}>
                      Where do you want support?
                    </Text>
                    <GeoapifyAutocomplete
                      apiKey="4195db721fdd4b71bae0b85ead1327c3"
                      value={location}
                      onSelect={(selectedAddress) => {
                        setLocation(selectedAddress.formatted); // Assuming you want the formatted address
                        // If you need to populate suburb or state from the selection:
                        // setSuburb(selectedAddress.properties.suburb || '');
                        // setSelectedState(selectedAddress.properties.state_code || '');
                      }}
                      placeholder="Start typing address..."
                    />

                    <Text style={styles.inputLabel}>Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.datePickerButton}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {day || "Select Date"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#2954bd"
                      />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={day ? new Date(day) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()} // Cannot select past dates
                      />
                    )}

                    <View style={styles.timeInputsContainer}>
                      <View style={styles.timeInputWrapper}>
                        <Text style={styles.inputLabel}>Start Time</Text>
                        <TouchableOpacity
                          onPress={() => setShowTimePickerStart(true)}
                          style={styles.datePickerButton}
                        >
                          <Text style={styles.datePickerButtonText}>
                            {startTime || "Select Time"}
                          </Text>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#2954bd"
                          />
                        </TouchableOpacity>
                        {showTimePickerStart && (
                          <DateTimePicker
                            value={
                              startTime
                                ? new Date(`2000-01-01T${startTime}`)
                                : new Date()
                            }
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                          />
                        )}
                      </View>
                      <View style={styles.timeInputWrapper}>
                        <Text style={styles.inputLabel}>End Time</Text>
                        <TouchableOpacity
                          onPress={() => setShowTimePickerEnd(true)}
                          style={styles.datePickerButton}
                        >
                          <Text style={styles.datePickerButtonText}>
                            {endTime || "Select Time"}
                          </Text>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#2954bd"
                          />
                        </TouchableOpacity>
                        {showTimePickerEnd && (
                          <DateTimePicker
                            value={
                              endTime
                                ? new Date(`2000-01-01T${endTime}`)
                                : new Date()
                            }
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {step === 3 && (
                  <View>
                    <Text style={styles.sectionTitle}>Support details</Text>
                    <Text style={styles.sectionDescription}>
                      Summarise the support activities you want e.g. 'Help a
                      female teenager get ready for school and share a passion
                      for Star Wars!'
                    </Text>

                    <Text style={styles.inputLabel}>Job Title</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.title && !title && styles.inputError,
                      ]}
                      placeholder="E.g. personal carer for an adult"
                      value={title}
                      onChangeText={setTitle}
                      onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                      maxLength={100}
                    />
                    {touched.title && !title && (
                      <Text style={styles.errorTextSmall}>
                        ⚠️ Please enter a title
                      </Text>
                    )}

                    <Text style={styles.inputLabel}>
                      What will the support worker do?
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        touched.description &&
                          description.length < 10 &&
                          styles.inputError,
                      ]}
                      placeholder="To help..."
                      value={description}
                      onChangeText={setDescription}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, description: true }))
                      }
                      maxLength={1500}
                      multiline
                    />
                    <View style={styles.charCountContainer}>
                      <Text style={styles.charCountText}>
                        Minimum 10 characters
                      </Text>
                      <Text style={styles.charCountText}>
                        {description.length}/1500
                      </Text>
                    </View>
                    {touched.description && description.length < 10 && (
                      <Text style={styles.errorTextSmall}>
                        ⚠️ Please enter a description (min 10 characters)
                      </Text>
                    )}

                    <View style={styles.tipsBox}>
                      <Text style={styles.tipsTitle}>
                        💡 Tips for writing support details
                      </Text>
                      <Text style={styles.tipsListItem}>
                        •
                        <Text style={{ fontWeight: "bold" }}>
                          Include all relevant information
                        </Text>
                        – The more information you provide, the better your
                        matches will be. Workers can't read your profile until
                        you enter an agreement with them.
                      </Text>
                      <Text style={styles.tipsListItem}>
                        •
                        <Text style={{ fontWeight: "bold" }}>
                          Read the examples
                        </Text>
                        – Below each text box are example responses to use as a
                        guide.
                      </Text>
                      <Text style={styles.tipsListItem}>
                        •
                        <Text style={{ fontWeight: "bold" }}>
                          Use dot points
                        </Text>
                        – If you prefer, you can write your support details in
                        short dot points.
                      </Text>
                    </View>
                  </View>
                )}

                {step === 4 && (
                  <View>
                    <Text style={styles.sectionTitle}>Preview Your Job</Text>
                    <View style={styles.previewCard}>
                      <Text style={styles.previewTitle}>{title}</Text>
                      <Text style={styles.previewDescription}>
                        {description}
                      </Text>

                      <View style={styles.previewDetailsGrid}>
                        <View style={styles.previewDetailItem}>
                          <Text style={styles.previewDetailLabel}>
                            Service Type
                          </Text>
                          <Text style={styles.previewDetailValue}>
                            {
                              SERVICE_TYPES.find(
                                (s) => s.key === selectedService
                              )?.label
                            }
                          </Text>
                        </View>
                        <View style={styles.previewDetailItem}>
                          <Text style={styles.previewDetailLabel}>
                            Location
                          </Text>
                          <Text style={styles.previewDetailValue}>
                            {location}
                          </Text>
                        </View>
                        <View style={styles.previewDetailItem}>
                          <Text style={styles.previewDetailLabel}>Date</Text>
                          <Text style={styles.previewDetailValue}>{day}</Text>
                        </View>
                        <View style={styles.previewDetailItem}>
                          <Text style={styles.previewDetailLabel}>Time</Text>
                          <Text style={styles.previewDetailValue}>
                            {startTime} - {endTime}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
        {/* Fixed Form Navigation Buttons (only visible when showJobForm is true) */}
        {showJobForm && (
          <View style={styles.formNavContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(step / totalSteps) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((step / totalSteps) * 100)}% complete
            </Text>
            <View style={styles.formNavButtons}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                  step === 1 ? setShowJobForm(false) : setStep(step - 1)
                }
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                disabled={
                  actionLoading || // Disable while any action is loading
                  (step === 1 && !selectedService) ||
                  (step === 2 &&
                    (!location ||
                      !suburb ||
                      !day ||
                      !startTime ||
                      !endTime ||
                      !selectedState)) ||
                  (step === 3 && (!title || description.length < 10))
                }
                onPress={() => {
                  // Optional: Add logging here to see current values before continuing
                  console.log("Step 2 Validation Check:");
                  console.log("location:", location);
                  console.log("selectedState:", selectedState);
                  console.log("suburb:", suburb);
                  console.log("day:", day);
                  console.log("startTime:", startTime);
                  console.log("endTime:", endTime);

                  step === totalSteps ? handleSubmitJob() : setStep(step + 1);
                }}
              >
                <Text style={styles.continueButtonText}>
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : step === totalSteps ? (
                    "Submit Job"
                  ) : (
                    "Continue"
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Success/Error Modals */}
        <Modal
          visible={showSuccessMessage || !!errorMessage}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSuccessMessage(false);
            setErrorMessage("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {showSuccessMessage ? (
                <>
                  <Feather name="check-circle" size={60} color="#2e7d32" />
                  <Text style={styles.modalTitleSuccess}>Success!</Text>
                  <Text style={styles.modalText}>
                    Your job has been listed successfully.
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="alert-triangle" size={60} color="#e53935" />
                  <Text style={styles.modalTitleError}>Error!</Text>
                  <Text style={styles.modalText}>{errorMessage}</Text>
                </>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowSuccessMessage(false);
                  setErrorMessage("");
                }}
              >
                <Text style={styles.modalCloseButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20, // Adjust for status bar
    paddingBottom: 15,
    backgroundColor: "#123456",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  createJobButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5cb85c", // Green button
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  createJobButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  errorBanner: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    marginTop: 10,
  },
  errorBannerText: {
    color: "#721c24",
    fontSize: 14,
    textAlign: "center",
  },
  successBanner: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    marginTop: 10,
  },
  successBannerText: {
    color: "#155724",
    fontSize: 14,
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 15,
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#2954bd",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#777",
  },
  tabButtonTextActive: {
    color: "#2954bd",
  },
  flatListContent: {
    paddingBottom: 20, // Space for the bottom of the list
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
    marginRight: 10,
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
    textTransform: "uppercase",
  },
  jobInfo: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  jobCardSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  applicantButton: {
    backgroundColor: "#e6edff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  applicantButtonText: {
    color: "#2954bd",
    fontWeight: "bold",
    fontSize: 13,
  },
  applicantsListContainer: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#2954bd",
  },
  applicantCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  applicantName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  applicantComment: {
    fontSize: 13,
    color: "#666",
  },
  applicantRate: {
    fontSize: 13,
    color: "#666",
  },
  applicantStatus: {
    fontSize: 13,
    color: "#666",
    fontWeight: "bold",
  },
  applicantActions: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-end",
  },
  actionButtonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 8,
  },
  actionButtonTextSmall: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  approveButton: {
    backgroundColor: "#28a745", // Green
  },
  rejectButton: {
    backgroundColor: "#dc3545", // Red
  },
  timesheetActions: {
    marginTop: 10,
    flexDirection: "column", // Stack buttons vertically
    gap: 10, // Space between buttons
  },
  scrollableAreaContent: {
    paddingHorizontal: 15, // Apply horizontal padding to the content *inside* the ScrollView
    paddingBottom: 20, // Default padding for when the form is not active or for lists
    // The dynamic paddingBottom is applied via inline style in the component
  },
  flatListInnerContent: {
    // A new style for FlatList contentContainerStyle
    paddingBottom: 0, // FlatLists often have default padding, reset it here
    // And let scrollableAreaContent handle the main padding
  },
  downloadButton: {
    backgroundColor: "#6c757d", // Gray/Darker
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  proceedToPayButton: {
    backgroundColor: "#007bff", // Blue
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5, // Space between stacked buttons
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#6c757d", // Gray
  },
  dangerButton: {
    backgroundColor: "#dc3545", // Red
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  emptyListText: {
    fontSize: 16,
    color: "#777",
    marginTop: 10,
    textAlign: "center",
  },

  stepperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  stepperTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  exitButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: "#f8d7da",
  },
  exitButtonText: {
    color: "#dc3545",
    fontWeight: "bold",
  },
  stepperProgress: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
    width: "100%",
  },
  stepperStep: {
    alignItems: "center",
    flex: 1,
  },
  stepperCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#2954bd",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  stepperCircleActive: {
    backgroundColor: "#2954bd",
  },
  stepperCircleText: {
    color: "#2954bd",
    fontWeight: "bold",
  },
  stepperCircleTextActive: {
    color: "#fff",
  },
  stepperLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#777",
  },
  stepperLabelActive: {
    fontWeight: "bold",
    color: "#2954bd",
  },
  formStepContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20, // Keep this padding internal to the content box
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 15,
    marginBottom: 10,
  },
  serviceOptionActive: {
    borderColor: "#2954bd",
    backgroundColor: "#e6edff",
  },
  serviceOptionIconContainer: {
    marginRight: 15,
    marginTop: 5,
  },
  serviceOptionIcon: {
    // Styles for the icon itself, if needed
  },
  serviceOptionTextContainer: {
    flex: 1,
  },
  serviceOptionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  serviceOptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbe0",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  serviceOptionBadgeText: {
    fontSize: 10,
    color: "#b45309",
    fontWeight: "bold",
    marginLeft: 4,
  },
  serviceOptionDescription: {
    fontSize: 13,
    color: "#666",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
    marginTop: 15,
  },
  formContentWrapper: {
    backgroundColor: "#f8f9fa",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  inputError: {
    borderColor: "#e53935",
  },
  scrollableArea: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden", // Ensures picker content stays within bounds
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  pickerItem: {
    // Style for individual picker items on iOS
    fontSize: 16,
    color: "#333",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  timeInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10, // Space between time inputs
  },
  timeInputWrapper: {
    flex: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top", // For Android
  },
  charCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  charCountText: {
    fontSize: 12,
    color: "#777",
  },
  tipsBox: {
    backgroundColor: "#e6edff",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#cce0ff",
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2954bd",
    marginBottom: 8,
  },
  tipsListItem: {
    fontSize: 13,
    color: "#555",
    marginBottom: 5,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  previewDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 20,
  },
  previewDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  previewDetailItem: {
    width: "48%", // Two columns
    marginBottom: 15,
  },
  previewDetailLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 5,
  },
  previewDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  formNavContainer: {
    position: "absolute", // This makes it fixed relative to its parent (`container`)
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: Platform.OS === "ios" ? 30 : 15, // Extra padding for iOS safe area if needed, default for Android
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2954bd",
  },
  progressText: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 15,
  },
  formNavButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    backgroundColor: "#e6edff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#2954bd",
    fontSize: 16,
    fontWeight: "bold",
  },
  continueButton: {
    backgroundColor: "#2954bd",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    width: "80%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitleSuccess: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  modalTitleError: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e53935",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: "#2954bd",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorTextSmall: {
    fontSize: 12,
    color: "#e53935",
    marginTop: -5, // Adjust to be closer to input
    marginBottom: 5,
  },
});

export default ManageJob;
