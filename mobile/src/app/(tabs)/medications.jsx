import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Pill,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();

  const USER_ID = 1;

  // Fetch medications
  const { data: medicationsData, refetch } = useQuery({
    queryKey: ["medications", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/medications?user_id=${USER_ID}&active_only=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch medications");
      return response.json();
    },
  });

  const medications = medicationsData?.medications || [];

  const getTodaysMedicationSchedule = () => {
    const schedule = [];

    medications.forEach((medication) => {
      if (medication.reminder_times) {
        medication.reminder_times.forEach((time) => {
          schedule.push({
            ...medication,
            scheduled_time: time,
            taken: Math.random() > 0.5, // Random for demo
          });
        });
      }
    });

    // Sort by time
    return schedule.sort((a, b) =>
      a.scheduled_time.localeCompare(b.scheduled_time),
    );
  };

  const todaysSchedule = getTodaysMedicationSchedule();
  const adherenceRate =
    todaysSchedule.length > 0
      ? Math.round(
          (todaysSchedule.filter((item) => item.taken).length /
            todaysSchedule.length) *
            100,
        )
      : 0;

  const MedicationCard = ({ medication }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 16,
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {medication.medication_name}
          </Text>

          <Text
            style={{
              fontWeight: "400",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            {medication.dosage} • {medication.frequency}
          </Text>

          {medication.reminder_times &&
            medication.reminder_times.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {medication.reminder_times.map((time, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "400",
                        fontSize: 11,
                        color: colors.text,
                      }}
                    >
                      {time}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {medication.prescribing_doctor && (
            <Text
              style={{
                fontWeight: "400",
                fontSize: 12,
                color: colors.textTertiary,
                marginTop: 4,
              }}
            >
              Prescribed by Dr. {medication.prescribing_doctor}
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: colors.warning + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              fontSize: 10,
              color: colors.warning,
            }}
          >
            Active
          </Text>
        </View>
      </View>
    </View>
  );

  const ScheduleItem = ({ item }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        opacity: item.taken ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: item.taken
            ? colors.success + "20"
            : colors.warning + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {item.taken ? (
          <CheckCircle size={20} color={colors.success} />
        ) : (
          <Clock size={20} color={colors.warning} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontWeight: "500",
            fontSize: 14,
            color: colors.text,
            marginBottom: 2,
          }}
        >
          {item.medication_name} - {item.dosage}
        </Text>
        <Text
          style={{
            fontWeight: "400",
            fontSize: 12,
            color: colors.textTertiary,
          }}
        >
          Scheduled for {item.scheduled_time}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: item.taken ? colors.surfaceElevated : colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 12,
            color: item.taken ? colors.text : "#FFFFFF",
          }}
        >
          {item.taken ? "Taken" : "Mark Taken"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceHighest }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surfaceHighest,
          paddingTop: insets.top + 24,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
          zIndex: 1000,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 28,
              color: colors.text,
            }}
          >
            Medications
          </Text>
          <TouchableOpacity onPress={() => router.push("/add-medication")}>
            <View
              style={{
                backgroundColor: colors.primary,
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24 + 28 + 24 + 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Adherence Summary */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginHorizontal: 20,
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
                backgroundColor: colors.warning + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Pill size={18} color={colors.warning} />
            </View>
            <Text
              style={{
                fontWeight: "500",
                fontSize: 16,
                color: colors.text,
              }}
            >
              Today's Adherence
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 32,
                  color: colors.text,
                }}
              >
                {adherenceRate}%
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Adherence Rate
              </Text>
            </View>

            <View
              style={{
                backgroundColor:
                  adherenceRate >= 80
                    ? colors.success + "20"
                    : colors.warning + "20",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 12,
                  color: adherenceRate >= 80 ? colors.success : colors.warning,
                }}
              >
                {adherenceRate >= 80 ? "Good" : "Needs Attention"}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontWeight: "400",
              fontSize: 12,
              color: colors.textTertiary,
              marginTop: 8,
            }}
          >
            {todaysSchedule.filter((item) => item.taken).length} of{" "}
            {todaysSchedule.length} doses taken today
          </Text>
        </View>

        {/* Today's Schedule */}
        {todaysSchedule.length > 0 && (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Today's Schedule
              </Text>
            </View>

            {todaysSchedule.map((item, index) => (
              <ScheduleItem key={`${item.id}-${index}`} item={item} />
            ))}
          </>
        )}

        {/* All Medications */}
        <View
          style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 20 }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 20,
              color: colors.text,
            }}
          >
            All Medications
          </Text>
        </View>

        {medications.length > 0 ? (
          medications.map((medication) => (
            <MedicationCard key={medication.id} medication={medication} />
          ))
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              marginHorizontal: 20,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Pill size={40} color={colors.textTertiary} />
            </View>

            <Text
              style={{
                fontWeight: "600",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No medications added
            </Text>

            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textTertiary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              Add your medications to track adherence and get reminders
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/add-medication")}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Add First Medication
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
