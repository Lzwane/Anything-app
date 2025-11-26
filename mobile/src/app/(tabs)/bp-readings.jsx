import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Heart,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  MoreHorizontal,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";
import SelectionPill from "@/components/SelectionPill";

export default function BpReadingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();
  const [selectedPeriod, setSelectedPeriod] = useState("Weekly");

  const USER_ID = 1;
  const periods = ["Daily", "Weekly", "Monthly"];

  // Fetch BP readings
  const { data: bpData, refetch } = useQuery({
    queryKey: ["bp-readings", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/bp-readings?user_id=${USER_ID}&limit=20`,
      );
      if (!response.ok) throw new Error("Failed to fetch BP readings");
      return response.json();
    },
  });

  const readings = bpData?.readings || [];

  const getBpStatus = (systolic, diastolic) => {
    if (systolic >= 140 || diastolic >= 90) {
      return { status: "High", color: colors.error };
    } else if (systolic >= 130 || diastolic >= 80) {
      return { status: "Elevated", color: colors.warning };
    } else {
      return { status: "Normal", color: colors.success };
    }
  };

  const getAverageReading = () => {
    if (readings.length === 0) return { systolic: 0, diastolic: 0 };

    const totalSystolic = readings.reduce(
      (sum, reading) => sum + reading.systolic,
      0,
    );
    const totalDiastolic = readings.reduce(
      (sum, reading) => sum + reading.diastolic,
      0,
    );

    return {
      systolic: Math.round(totalSystolic / readings.length),
      diastolic: Math.round(totalDiastolic / readings.length),
    };
  };

  const averageReading = getAverageReading();
  const averageStatus = getBpStatus(
    averageReading.systolic,
    averageReading.diastolic,
  );

  const ReadingCard = ({ reading }) => {
    const status = getBpStatus(reading.systolic, reading.diastolic);
    const readingDate = new Date(reading.reading_time);

    return (
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
                fontSize: 18,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {reading.systolic}/{reading.diastolic} mmHg
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Clock size={12} color={colors.textTertiary} />
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textTertiary,
                  marginLeft: 4,
                }}
              >
                {readingDate.toLocaleDateString()} at{" "}
                {readingDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {reading.pulse && (
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                Pulse: {reading.pulse} bpm
              </Text>
            )}

            {reading.notes && (
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {reading.notes}
              </Text>
            )}
          </View>

          <View
            style={{
              backgroundColor: status.color + "20",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontWeight: "500",
                fontSize: 10,
                color: status.color,
              }}
            >
              {status.status}
            </Text>
          </View>
        </View>

        {/* Additional context if available */}
        <View style={{ marginTop: 8 }}>
          {reading.food_consumed && (
            <Text
              style={{
                fontSize: 11,
                color: colors.textTertiary,
                marginBottom: 2,
              }}
            >
              Food: {reading.food_consumed}
            </Text>
          )}
          {reading.activity_before && (
            <Text
              style={{
                fontSize: 11,
                color: colors.textTertiary,
                marginBottom: 2,
              }}
            >
              Activity: {reading.activity_before}
            </Text>
          )}
          {reading.stress_level && (
            <Text style={{ fontSize: 11, color: colors.textTertiary }}>
              Stress level: {reading.stress_level}/5
            </Text>
          )}
        </View>
      </View>
    );
  };

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
            BP Readings
          </Text>
          <TouchableOpacity onPress={() => router.push("/bp-reading")}>
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
        {/* Period Selector */}
        <ScrollView
          horizontal
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          showsHorizontalScrollIndicator={false}
        >
          {periods.map((period) => (
            <SelectionPill
              key={period}
              title={period}
              isSelected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              variant="outlined"
            />
          ))}
        </ScrollView>

        {/* Summary Card */}
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
                fontWeight: "500",
                fontSize: 16,
                color: colors.text,
              }}
            >
              {selectedPeriod} Average
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
                {readings.length > 0
                  ? `${averageReading.systolic}/${averageReading.diastolic}`
                  : "--/--"}
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                mmHg
              </Text>
            </View>

            {readings.length > 0 && (
              <View
                style={{
                  backgroundColor: averageStatus.color + "20",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 12,
                    color: averageStatus.color,
                  }}
                >
                  {averageStatus.status}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontWeight: "400",
              fontSize: 12,
              color: colors.textTertiary,
              marginTop: 8,
            }}
          >
            Based on {readings.length} reading{readings.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Readings List */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 20,
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Recent Readings
          </Text>
        </View>

        {readings.length > 0 ? (
          readings.map((reading) => (
            <ReadingCard key={reading.id} reading={reading} />
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
              <Heart size={40} color={colors.textTertiary} />
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
              No readings yet
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
              Start tracking your blood pressure to monitor your health progress
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/bp-reading")}
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
                Log First Reading
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
