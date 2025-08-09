import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const StartJob = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [booking, setBooking] = useState(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");
  const [editedRate, setEditedRate] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const bookingId = route.params?.bookingId;
        const accessToken = route.params?.access_token;
        const response = await fetch(
          `https://api.theopenshift.com/v1/bookings/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
      }
    }
    fetchBooking();
  }, [route.params?.bookingId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const checkIn = async () => {
    try {
      const bookingId = booking?.id;
      const accessToken = route.params?.access_token;
      const response = await fetch(
        `https://api.theopenshift.com/v1/bookings/timesheet/check_in/${bookingId}?check_out=false`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
        setRunning(true);
      } else {
        alert("Failed to check in.");
      }
    } catch (err) {
      alert("Error during check in.");
    }
  };

  const checkOut = async () => {
    try {
      const bookingId = booking?.id;
      const accessToken = route.params?.access_token;
      const response = await fetch(
        `https://api.theopenshift.com/v1/bookings/timesheet/check_in/${bookingId}?check_out=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
        setRunning(false);
      } else {
        alert("Failed to check out.");
      }
    } catch (err) {
      alert("Error during check out.");
    }
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const plannedSeconds =
    (booking?.planned_hours ? parseFloat(booking.planned_hours) : 2) * 3600;
  const progress = Math.min(timer / plannedSeconds, 1);

  const getDay = (dateStr) => {
    if (!dateStr) return "";
    return moment(dateStr).format("dddd, DD MMM YYYY");
  };
  const getTime = (dateStr) => {
    if (!dateStr) return "";
    return moment(dateStr).format("HH:mm");
  };
  const getDuration = (start, end) => {
    if (!start || !end) return "";
    const diff = moment(end).diff(moment(start), "minutes");
    const h = Math.floor(diff / 60)
      .toString()
      .padStart(2, "0");
    const m = (diff % 60).toString().padStart(2, "0");
    return `${h}:${m} h`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color="#1d3491" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Hero block */}
      <View style={styles.hero}>
        <Text style={styles.windowText}>
          {getDay(booking?.start_time)} {getTime(booking?.start_time)} →{" "}
          {getTime(booking?.end_time)}
        </Text>

        {/* Timer card */}
        {booking?.status !== "checked_out" &&
          booking?.status !== "sent_for_approval" &&
          booking?.status !== "pending_payment" &&
          booking?.status !== "payment_received" && (
            <View style={styles.timerCard}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerValue}>{formatTime(timer)}</Text>
              </View>
              <View style={styles.progressWrap}>
                <View
                  style={[styles.progressBar, { width: `${progress * 100}%` }]}
                />
              </View>
              {!running ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={checkIn}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Check In</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.dangerBtn]}
                  onPress={checkOut}
                >
                  <Ionicons name="stop" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Check Out</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {booking?.status === "checked_out" && (
          <View style={styles.stateBlock}>
            <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
            <Text style={styles.stateTitle}>Job Completed!</Text>
            <Text style={styles.stateHelp}>
              You can now send your timesheet for approval.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 12 }]}
              onPress={() => {
                setEditedStartTime(booking?.check_in_time || "");
                setEditedEndTime(booking?.check_out_time || "");
                setEditedRate(booking?.rate ? booking.rate.toString() : "");
                setShowTimesheetModal(true);
              }}
            >
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>
                Send Timesheet for Approval
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {booking?.status === "sent_for_approval" && (
          <View style={styles.stateBlock}>
            <Ionicons name="time-outline" size={56} color="#f59e0b" />
            <Text style={styles.stateTitle}>Timesheet Sent</Text>
            <Text style={styles.stateHelp}>
              We will notify you once it is approved.
            </Text>
          </View>
        )}

        {booking?.status === "pending_payment" && (
          <View style={styles.stateBlock}>
            <Ionicons name="cash-outline" size={56} color="#f59e0b" />
            <Text style={styles.stateTitle}>Payment Pending</Text>
            <Text style={styles.stateHelp}>
              Your payment for this job is on the way.
            </Text>
          </View>
        )}

        {booking?.status === "payment_received" && (
          <View style={styles.stateBlock}>
            <Ionicons name="card-outline" size={56} color="#7c3aed" />
            <Text style={[styles.stateTitle, { color: "#7c3aed" }]}>
              Payment Received
            </Text>
            <Text style={styles.stateHelp}>
              You have received your payment for this job.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: "#7c3aed", marginTop: 12 },
              ]}
              onPress={async () => {
                try {
                  const accessToken = route.params?.access_token;
                  const response = await fetch(
                    "https://api.theopenshift.com/v1/payments/dashboard",
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  const data = await response.json();
                  if (data?.url) Linking.openURL(data.url);
                } catch (err) {
                  alert("Unable to open Stripe Dashboard");
                }
              }}
            >
              <Ionicons name="open" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Stripe Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Details sheet */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Details</Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={22}
            color="#334eb8"
            style={styles.infoIcon}
          />
          <View>
            <Text style={styles.infoLabel}>Shift hours</Text>
            <Text style={styles.infoValue}>
              {getDuration(booking?.start_time, booking?.end_time)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color="#334eb8"
            style={styles.infoIcon}
          />
          <View>
            <Text style={styles.infoLabel}>Day</Text>
            <Text style={styles.infoValue}>{getDay(booking?.start_time)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={22}
            color="#334eb8"
            style={styles.infoIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>
              {booking?.address || "No Address Provided"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#b0b6c3" />
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons
            name="campaign"
            size={22}
            color="#334eb8"
            style={styles.infoIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {booking?.description || "No description provided."}
            </Text>
          </View>
        </View>
      </View>

      {/* Timesheet Modal */}
      <Modal visible={showTimesheetModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Timesheet</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Check In Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.inputText}>
                  {editedStartTime
                    ? moment(editedStartTime).format("YYYY-MM-DD HH:mm")
                    : "Select Check In Time"}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={
                    editedStartTime ? new Date(editedStartTime) : new Date()
                  }
                  mode="datetime"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setEditedStartTime(date.toISOString());
                  }}
                />
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Check Out Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.inputText}>
                  {editedEndTime
                    ? moment(editedEndTime).format("YYYY-MM-DD HH:mm")
                    : "Select Check Out Time"}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={editedEndTime ? new Date(editedEndTime) : new Date()}
                  mode="datetime"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEditedEndTime(date.toISOString());
                  }}
                />
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Rate</Text>
              <TextInput
                style={[styles.input, { paddingVertical: 12 }]}
                value={editedRate}
                onChangeText={setEditedRate}
                placeholder="Rate"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { alignSelf: "stretch", marginBottom: 8 },
              ]}
              onPress={async () => {
                try {
                  const bookingId = booking?.id;
                  const accessToken = route.params?.access_token;
                  const payload = {
                    check_in_time: editedStartTime,
                    check_out_time: editedEndTime,
                    rate: Number(editedRate),
                  };
                  const response = await fetch(
                    `https://api.theopenshift.com/v1/bookings/timesheet/request/${bookingId}`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    }
                  );
                  if (response.ok) {
                    setShowTimesheetModal(false);
                    setShowSuccessModal(true);
                  } else {
                    alert("Failed to submit timesheet for approval.");
                  }
                } catch (err) {
                  alert("Error submitting timesheet.");
                }
              }}
            >
              <Text style={styles.primaryBtnText}>Submit for Approval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={() => setShowTimesheetModal(false)}
            >
              <Text style={{ color: "#8a8a8a", fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9f1ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffbd59",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,52,145,0.15)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1d3491",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  windowText: {
    textAlign: "center",
    color: "#244ea8",
    fontWeight: "600",
    marginBottom: 10,
  },
  timerCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 6,
  },
  timerCircle: {
    width: 160, // circle diameter
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f7ff",
    borderWidth: 2,
    borderColor: "#dbe4ff",
    marginBottom: 16,
  },
  timerValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2a43b0",
  },
  progressWrap: {
    width: "90%",
    height: 10,
    backgroundColor: "#edf2ff",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#2a43b0",
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#2a43b0",
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    textAlign: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  dangerBtn: {
    backgroundColor: "#e23a3a",
  },
  stateBlock: {
    alignItems: "center",
    marginTop: 16,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#244ea8",
    marginTop: 8,
  },
  stateHelp: {
    fontSize: 14,
    color: "#5b5b5b",
    marginTop: 6,
    textAlign: "center",
    maxWidth: 320,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2d5c",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  infoLabel: {
    color: "#9aa2b1",
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "600",
    flexWrap: "wrap",
    maxWidth: "95%",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  inputLabel: { color: "#8a8a8a", fontSize: 14, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fb",
    height: 44,
    justifyContent: "center",
  },
  inputText: { fontSize: 16, color: "#222" },
});

export default StartJob;
