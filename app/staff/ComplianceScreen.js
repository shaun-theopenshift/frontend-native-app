import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ComplianceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compliance</Text>
      <Text style={styles.subtitle}>
        This is the compliance screen.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcf4f2",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3565b4",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#3565b4",
    textAlign: "center",
  },
});

export default ComplianceScreen;