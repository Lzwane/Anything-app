import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  Heart,
  MoreHorizontal,
  Activity,
  Pill,
  Plus,
  TrendingUp,
  Clock,
  Footprints,
  Utensils,
  MapPin,
  Share2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";
import StatCard from "@/components/StatCard";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();

  // For demo purposes, using hardcoded user ID
  const USER_ID = 1;

  // Fetch latest BP readings
  const { data: bpData } = useQuery({
    queryKey: ["bp-readings", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/bp-readings?user_id=${USER_ID}&limit=3`,
      );
      if (!response.ok) throw new Error("Failed to fetch BP readings");
      return response.json();
    },
  });

  // Fetch medications
  const { data: medicationsData } = useQuery({
    queryKey: ["medications", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/medications?user_id=${USER_ID}&active_only=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch medications");
      return response.json();
    },
  });

  // Fetch activity data
  const { data: activityData } = useQuery({
    queryKey: ["activity", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/activity-tracking?user_id=${USER_ID}&days=1`,
      );
      if (!response.ok) throw new Error("Failed to fetch activity data");
      return response.json();
    },
  });

  const latestBpReading = bpData?.readings?.[0];
  const activeMedications = medicationsData?.medications || [];
  const todayActivity = activityData?.activity_logs?.[0];
  const stepGoal = activityData?.statistics?.step_goal || 5000;

  const getBpStatus = (systolic, diastolic) => {
    if (!systolic || !diastolic)
      return { status: "No data", color: colors.textTertiary };

    if (systolic >= 140 || diastolic >= 90) {
      return { status: "High", color: colors.error };
    } else if (systolic >= 130 || diastolic >= 80) {
      return { status: "Elevated", color: colors.warning };
    } else {
      return { status: "Normal", color: colors.success };
    }
  };

  const bpStatus = latestBpReading
    ? getBpStatus(latestBpReading.systolic, latestBpReading.diastolic)
    : { status: "No data", color: colors.textTertiary };

  const QuickActionCard = ({
    title,
    subtitle,
    icon,
    color,
    onPress,
    style = {},
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, marginHorizontal: 4, ...style }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          height: 80,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <View>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 12,
              color: colors.text,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontWeight: "400",
              fontSize: 10,
              color: colors.textTertiary,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: 20,
          paddingHorizontal: 24,
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
          zIndex: 1000,
        }}
      >
        {/* Top Bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Logo */}
          <View
            style={{
              width: 32,
              height: 32,
              backgroundColor: colors.primary,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={20} color="#FFFFFF" />
          </View>

          {/* Right buttons */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Notification button */}
            <View style={{ position: "relative", marginRight: 12 }}>
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={16} color={colors.text} />
              </TouchableOpacity>
              {/* Notification badge */}
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.notification,
                }}
              />
            </View>

            {/* More options */}
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MoreHorizontal size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View>
          <Text
            style={{
              fontWeight: "300",
              fontSize: 24,
              lineHeight: 28,
              color: colors.text,
            }}
          >
            Good morning,
          </Text>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 24,
              lineHeight: 28,
              color: colors.text,
            }}
          >
            John Doe
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24 + 20 + 32 + 20 + 56 + 24,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Blood Pressure Status Hero Card */}
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={20} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={() => router.push("/bp-reading")}>
              <Plus size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontWeight: "600",
              fontSize: 16,
              lineHeight: 20,
              color: "#FFFFFF",
              marginBottom: 8,
            }}
          >
            Blood Pressure Status
          </Text>

          {latestBpReading ? (
            <>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 32,
                  lineHeight: 36,
                  color: "#FFFFFF",
                  marginBottom: 4,
                }}
              >
                {latestBpReading.systolic}/{latestBpReading.diastolic}
              </Text>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: bpStatus.color,
                    marginRight: 4,
                  }}
                />
                <Text
                  style={{
                    fontWeight: "400",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {bpStatus.status}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 32,
                  lineHeight: 36,
                  color: "#FFFFFF",
                  marginBottom: 8,
                }}
              >
                --/--
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: 12,
                }}
              >
                No readings yet
              </Text>
            </>
          )}

          <TouchableOpacity
            onPress={() => router.push("/bp-reading")}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                fontSize: 12,
                color: "#FFFFFF",
              }}
            >
              Log Reading
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              fontSize: 18,
              lineHeight: 22,
              color: colors.text,
            }}
          >
            Quick Actions
          </Text>
        </View>

        {/* New Quick Action Cards */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            <QuickActionCard
              title="Food Tracker"
              subtitle="AI Analysis"
              icon={<Utensils size={14} color={colors.warning} />}
              color={colors.warning}
              onPress={() => router.push("/food-tracker")}
            />
            <QuickActionCard
              title="Step Tracker"
              subtitle={
                todayActivity
                  ? `${todayActivity.steps_count} steps`
                  : "Track activity"
              }
              icon={<Footprints size={14} color={colors.primary} />}
              color={colors.primary}
              onPress={() => router.push("/step-tracker")}
            />
            <QuickActionCard
              title="Find Pharmacy"
              subtitle="Near you"
              icon={<MapPin size={14} color={colors.success} />}
              color={colors.success}
              onPress={() => router.push("/pharmacy-locator")}
            />
          </View>
        </View>

        {/* Stat Cards Grid */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <StatCard
            title="Medications"
            value={activeMedications.length.toString()}
            unit="Active"
            iconColor={colors.warning}
            IconComponent={Pill}
            onPress={() => router.push("/(tabs)/medications")}
          />
          <StatCard
            title="Readings"
            value={bpData?.readings?.length?.toString() || "0"}
            unit="Logged"
            iconColor={colors.health}
            IconComponent={Activity}
            onPress={() => router.push("/(tabs)/bp-readings")}
          />
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "500",
              fontSize: 18,
              lineHeight: 22,
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Recent Activity
          </Text>

          {bpData?.readings?.slice(0, 2).map((reading) => {
            const readingStatus = getBpStatus(
              reading.systolic,
              reading.diastolic,
            );
            return (
              <View
                key={reading.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.health + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Heart size={20} color={colors.health} />
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
                    BP Reading: {reading.systolic}/{reading.diastolic} mmHg
                  </Text>
                  <Text
                    style={{
                      fontWeight: "400",
                      fontSize: 12,
                      color: colors.textTertiary,
                    }}
                  >
                    {new Date(reading.reading_time).toLocaleDateString()}{" "}
                    {new Date(reading.reading_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: readingStatus.color + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: 10,
                      color: readingStatus.color,
                    }}
                  >
                    {readingStatus.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
