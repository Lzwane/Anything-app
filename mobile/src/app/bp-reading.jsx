import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Heart,
  Save,
  X,
  Bluetooth,
  Activity,
  CheckCircle,
  Loader,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useTheme from "@/utils/useTheme";

export default function BpReadingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    systolic: "",
    diastolic: "",
    pulse: "",
    notes: "",
    food_consumed: "",
    activity_before: "",
    stress_level: "",
  });

  // Bluetooth states
  const [isBluetoothMode, setIsBluetoothMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const USER_ID = 1;

  // Simulate Bluetooth connection
  const connectBluetooth = async () => {
    setIsConnecting(true);

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsConnecting(false);
    setIsConnected(true);
    setIsBluetoothMode(true);

    Alert.alert(
      "Bluetooth Connected! 📱",
      "Your BP cuff is now connected. Tap 'Start Measurement' when ready.",
    );
  };

  // Simulate Bluetooth measurement
  const startBluetoothMeasurement = async () => {
    if (!isConnected) {
      Alert.alert("Not Connected", "Please connect your BP cuff first.");
      return;
    }

    setIsMeasuring(true);

    // Simulate measurement process (30 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulate realistic BP readings
    const simulatedSystolic = Math.floor(Math.random() * (140 - 100) + 100);
    const simulatedDiastolic = Math.floor(Math.random() * (90 - 60) + 60);
    const simulatedPulse = Math.floor(Math.random() * (100 - 60) + 60);

    setFormData((prev) => ({
      ...prev,
      systolic: simulatedSystolic.toString(),
      diastolic: simulatedDiastolic.toString(),
      pulse: simulatedPulse.toString(),
    }));

    setIsMeasuring(false);

    Alert.alert(
      "Measurement Complete! ✅",
      `BP: ${simulatedSystolic}/${simulatedDiastolic} mmHg\nPulse: ${simulatedPulse} bpm\n\nYou can add notes and save the reading.`,
    );
  };

  const saveBpReading = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/bp-readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          ...data,
          systolic: parseInt(data.systolic),
          diastolic: parseInt(data.diastolic),
          pulse: data.pulse ? parseInt(data.pulse) : null,
          stress_level: data.stress_level ? parseInt(data.stress_level) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save BP reading");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch BP readings
      queryClient.invalidateQueries(["bp-readings"]);
      router.back();
      Alert.alert("Success", "Blood pressure reading saved successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to save reading");
    },
  });

  const handleSave = () => {
    if (!formData.systolic || !formData.diastolic) {
      Alert.alert(
        "Missing Information",
        "Please enter both systolic and diastolic values",
      );
      return;
    }

    if (parseInt(formData.systolic) < 70 || parseInt(formData.systolic) > 250) {
      Alert.alert(
        "Invalid Value",
        "Systolic value should be between 70 and 250",
      );
      return;
    }

    if (
      parseInt(formData.diastolic) < 40 ||
      parseInt(formData.diastolic) > 150
    ) {
      Alert.alert(
        "Invalid Value",
        "Diastolic value should be between 40 and 150",
      );
      return;
    }

    saveBpReading.mutate(formData);
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
  }) => (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontWeight: "500",
          fontSize: 14,
          color: colors.text,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: multiline ? 80 : 50,
          textAlignVertical: multiline ? "top" : "center",
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={!isMeasuring}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              color: colors.text,
            }}
          >
            Blood Pressure Reading
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saveBpReading.isPending}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              opacity: saveBpReading.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                fontSize: 14,
                color: "#FFFFFF",
              }}
            >
              {saveBpReading.isPending ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Bluetooth Connection Card */}
          <View
            style={{
              backgroundColor: isConnected
                ? colors.success + "10"
                : colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: isConnected ? 1 : 0,
              borderColor: isConnected ? colors.success : "transparent",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isConnected
                    ? colors.success + "20"
                    : colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {isConnecting ? (
                  <Loader size={18} color={colors.primary} />
                ) : isConnected ? (
                  <CheckCircle size={18} color={colors.success} />
                ) : (
                  <Bluetooth size={18} color={colors.primary} />
                )}
              </View>
              <Text
                style={{ fontWeight: "600", fontSize: 16, color: colors.text }}
              >
                {isConnected ? "BP Cuff Connected" : "Connect BP Cuff"}
              </Text>
            </View>

            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 16,
              }}
            >
              {isConnected
                ? "Your Bluetooth BP cuff is connected and ready for measurement."
                : "Connect your Bluetooth BP cuff for automatic readings with higher accuracy."}
            </Text>

            {!isConnected ? (
              <TouchableOpacity
                onPress={connectBluetooth}
                disabled={isConnecting}
                style={{
                  backgroundColor: isConnecting
                    ? colors.surfaceElevated
                    : colors.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isConnecting ? (
                  <Loader
                    size={16}
                    color={colors.textTertiary}
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Bluetooth
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 14,
                    color: isConnecting ? colors.textTertiary : "#FFFFFF",
                  }}
                >
                  {isConnecting ? "Connecting..." : "Connect Cuff"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startBluetoothMeasurement}
                disabled={isMeasuring}
                style={{
                  backgroundColor: isMeasuring
                    ? colors.surfaceElevated
                    : colors.success,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isMeasuring ? (
                  <Loader
                    size={16}
                    color={colors.textTertiary}
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Activity
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 14,
                    color: isMeasuring ? colors.textTertiary : "#FFFFFF",
                  }}
                >
                  {isMeasuring ? "Measuring..." : "Start Measurement"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Manual Entry Toggle */}
          {!isBluetoothMode && (
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surfaceElevated,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 12,
                    color: colors.text,
                  }}
                >
                  Or enter manually below
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main BP Values */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.health + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Heart size={18} color={colors.health} />
              </View>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                Blood Pressure Values
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ width: "48%" }}>
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 14,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Systolic (mmHg)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: colors.text,
                    textAlign: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  value={formData.systolic}
                  onChangeText={(value) => updateFormData("systolic", value)}
                  placeholder="120"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  editable={!isMeasuring}
                />
              </View>

              <View style={{ width: "48%" }}>
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 14,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Diastolic (mmHg)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: colors.text,
                    textAlign: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  value={formData.diastolic}
                  onChangeText={(value) => updateFormData("diastolic", value)}
                  placeholder="80"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  editable={!isMeasuring}
                />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 14,
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Pulse (BPM) - Optional
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={formData.pulse}
                onChangeText={(value) => updateFormData("pulse", value)}
                placeholder="72"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                editable={!isMeasuring}
              />
            </View>
          </View>

          {/* Context Information */}
          <InputField
            label="What did you last eat/drink?"
            value={formData.food_consumed}
            onChangeText={(value) => updateFormData("food_consumed", value)}
            placeholder="e.g., Coffee and toast, Light breakfast"
          />

          <InputField
            label="What were you doing before this reading?"
            value={formData.activity_before}
            onChangeText={(value) => updateFormData("activity_before", value)}
            placeholder="e.g., Sitting for 2 hours, Morning walk, Working"
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ width: "48%" }}>
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 14,
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Stress Level (1-5)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={formData.stress_level}
                onChangeText={(value) => updateFormData("stress_level", value)}
                placeholder="3"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                editable={!isMeasuring}
              />
            </View>
            <View
              style={{
                width: "48%",
                justifyContent: "flex-end",
                paddingBottom: 16,
              }}
            >
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textTertiary,
                  textAlign: "center",
                }}
              >
                1 = Very calm{"\n"}5 = Very stressed
              </Text>
            </View>
          </View>

          <InputField
            label="Additional Notes"
            value={formData.notes}
            onChangeText={(value) => updateFormData("notes", value)}
            placeholder="Any additional observations or symptoms..."
            multiline={true}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
