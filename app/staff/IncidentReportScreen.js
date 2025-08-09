import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as SecureStore from "expo-secure-store";
import LottieView from "lottie-react-native";
import moment from "moment";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const IncidentReportScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [helpNeeded, setHelpNeeded] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [incidentTime, setIncidentTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal for backend response
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const [focusedField, setFocusedField] = useState(null);

  const [accessToken, setAccessToken] = useState("");

  React.useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("access_token");
      setAccessToken(token || "");
    })();
  }, []);

  const submitReport = async () => {
    if (!title || !description) {
      setResponseData({ error: "Title and Description are required." });
      setResponseModalVisible(true);
      return;
    }

    const combinedDateTime = new Date(
      incidentDate.getFullYear(),
      incidentDate.getMonth(),
      incidentDate.getDate(),
      incidentTime.getHours(),
      incidentTime.getMinutes()
    );

    setLoading(true);
    try {
      const res = await fetch(
        "https://api.theopenshift.com/v1/forms/incident-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title,
            description,
            help_needed_desc: helpNeeded,
            incident_at: combinedDateTime.toISOString(),
          }),
        }
      );

      const data = await res.json();
      setResponseData(data);
      setResponseModalVisible(true);

      // Reset form
      setTitle("");
      setDescription("");
      setHelpNeeded("");
      setIncidentDate(new Date());
      setIncidentTime(new Date());
    } catch (e) {
      setResponseData({ error: "Submission failed. Try again." });
      setResponseModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Incident Report</Text>
      </View>

      <View style={styles.innerContainer}>
        <Text style={styles.infoText}>
          Let us help you better. Tell us what went wrong.
        </Text>

        <TextInput
          style={[
            styles.input,
            focusedField === "title" && styles.inputFocused,
          ]}
          placeholder="Title *"
          value={title}
          onChangeText={setTitle}
          onFocus={() => setFocusedField("title")}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={[
            styles.input,
            { height: 90 },
            focusedField === "description" && styles.inputFocused,
          ]}
          placeholder="Description *"
          value={description}
          onChangeText={setDescription}
          multiline
          onFocus={() => setFocusedField("description")}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={[
            styles.input,
            focusedField === "helpNeeded" && styles.inputFocused,
          ]}
          placeholder="What kind of help do you need?"
          value={helpNeeded}
          onChangeText={setHelpNeeded}
          onFocus={() => setFocusedField("helpNeeded")}
          onBlur={() => setFocusedField(null)}
        />

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.dateButtonText}>
            {moment(incidentDate).format("MMMM D, YYYY")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={styles.dateButton}
        >
          <Ionicons name="time-outline" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.dateButtonText}>
            {moment(incidentTime).format("h:mm A")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={incidentDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (event?.type === "set" && selectedDate) {
                setIncidentDate(selectedDate);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={incidentTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (event?.type === "set" && selectedTime) {
                setIncidentTime(selectedTime);
              }
            }}
          />
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={submitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal to show backend response */}
      <Modal visible={responseModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalContainer}>
            {responseData?.error ? (
              <>
                <LottieView
                  source={require("../../assets/lotties/error.json")}
                  autoPlay
                  loop={false}
                  style={{ width: 80, height: 80, marginBottom: 10 }}
                />
                <Text style={[modalStyles.modalTitle, { color: "#d32f2f" }]}>
                  Incident request failed
                </Text>
                <Text style={modalStyles.modalMessage}>
                  {responseData.error}
                </Text>
              </>
            ) : responseData?.id ? (
              <>
                <LottieView
                  source={require("../../assets/lotties/success_request.json")}
                  autoPlay
                  loop={false}
                  style={{ width: 80, height: 80, marginBottom: 5 }}
                />
                <Text
                  style={[
                    modalStyles.modalTitle,
                    { color: "#388e3c", textAlign: "center" },
                  ]}
                >
                  Incident request submitted successfully
                </Text>
                <View
                  style={{
                    backgroundColor: "#f0f4ff",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{ fontSize: 15, color: "#222", marginBottom: 6 }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Report ID:</Text>{" "}
                    {responseData.id}
                  </Text>
                  <Text
                    style={{ fontSize: 15, color: "#222", marginBottom: 6 }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Title:</Text>{" "}
                    {responseData.title}
                  </Text>
                  <Text
                    style={{ fontSize: 15, color: "#222", marginBottom: 6 }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Status:</Text>{" "}
                    {responseData.status}
                  </Text>
                  <Text style={{ fontSize: 15, color: "#222" }}>
                    <Text style={{ fontWeight: "bold" }}>Created At:</Text>{" "}
                    {responseData.created_at
                      ? moment(responseData.created_at).format(
                          "MMMM D, YYYY h:mm A"
                        )
                      : ""}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={modalStyles.modalMessage}>
                No report data available.
              </Text>
            )}
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setResponseModalVisible(false)}
            >
              <Text style={modalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  backBtn: { marginRight: 12 },
  headerText: { fontSize: 20, fontWeight: "700" },
  innerContainer: { padding: 20, flexGrow: 1 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  submitBtn: {
    backgroundColor: "#334eb8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  inputFocused: {
    borderColor: "#334eb8",
    backgroundColor: "#f0f4ff",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  infoText: { fontSize: 14, color: "#555", marginBottom: 16 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: { fontSize: 14, color: "#333" },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#334eb8",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default IncidentReportScreen;
