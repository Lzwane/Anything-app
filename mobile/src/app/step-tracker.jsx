import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Footprints,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  Award,
  ArrowLeft,
  Plus,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";

export default function StepTrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();
  const queryClient = useQueryClient();

  const USER_ID = 1;

  const [manualSteps, setManualSteps] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showGoalSetting, setShowGoalSetting] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  // Fetch activity data
  const { data: activityData, refetch } = useQuery({
    queryKey: ["activity", USER_ID],
    queryFn: async () => {
      const response = await fetch(
        `/api/activity-tracking?user_id=${USER_ID}&days=7`,
      );
      if (!response.ok) throw new Error("Failed to fetch activity data");
      return response.json();
    },
  });

  const activities = activityData?.activity_logs || [];
  const stats = activityData?.statistics || {};
  const currentGoal = stats.step_goal || 5000;

  // Today's steps
  const today = new Date().toISOString().split("T")[0];
  const todayActivity = activities.find((a) => a.date === today);
  const todaySteps = todayActivity?.steps_count || 0;

  // Log steps mutation
  const logSteps = useMutation({
    mutationFn: async ({ steps, date }) => {
      const response = await fetch("/api/activity-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          steps_count: steps,
          date: date || today,
        }),
      });
      if (!response.ok) throw new Error("Failed to log steps");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["activity"]);
    },
  });

  // Update goal mutation
  const updateGoal = useMutation({
    mutationFn: async (stepGoal) => {
      const response = await fetch("/api/activity-tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          step_goal: stepGoal,
        }),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["activity"]);
      setShowGoalSetting(false);
      setNewGoal("");
    },
  });

  // Simulate step detection (in real app, you'd use device sensors)
  useEffect(() => {
    let stepInterval;

    // Simulate step counting every 10 seconds (for demo purposes)
    if (todaySteps === 0) {
      stepInterval = setInterval(() => {
        // Add random steps (1-50) to simulate walking
        const randomSteps = Math.floor(Math.random() * 50) + 1;
        const newTotal = Math.min(todaySteps + randomSteps, currentGoal + 2000);

        if (newTotal > todaySteps) {
          logSteps.mutate({ steps: newTotal });
        }
      }, 30000); // Every 30 seconds for demo
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [todaySteps, currentGoal]);

  const handleManualEntry = () => {
    const steps = parseInt(manualSteps);
    if (isNaN(steps) || steps < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of steps");
      return;
    }

    logSteps.mutate({ steps });
    setManualSteps("");
    setShowManualEntry(false);

    Alert.alert(
      "Steps Updated! 🚶‍♂️",
      `Your step count has been updated to ${steps} steps for today.`,
    );
  };

  const handleGoalUpdate = () => {
    const goal = parseInt(newGoal);
    if (isNaN(goal) || goal < 1000) {
      Alert.alert("Invalid Goal", "Please enter a goal of at least 1000 steps");
      return;
    }

    updateGoal.mutate(goal);
    Alert.alert(
      "Goal Updated! 🎯",
      `Your daily step goal is now ${goal} steps.`,
    );
  };

  const getProgressPercentage = () => {
    return Math.min((todaySteps / currentGoal) * 100, 100);
  };

  const getMotivationMessage = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return "🎉 Goal achieved! Keep it up!";
    if (progress >= 75) return "💪 Almost there! You can do it!";
    if (progress >= 50) return "⚡ Great progress! Keep going!";
    if (progress >= 25) return "🚶 Good start! Let's keep moving!";
    return "🎯 Time to get moving! Every step counts!";
  };

  const StepCard = ({ activity }) => {
    const activityDate = new Date(activity.date);
    const isToday = activity.date === today;
    const dayName = isToday
      ? "Today"
      : activityDate.toLocaleDateString("en-US", { weekday: "short" });
    const progressPercent = Math.min(
      (activity.steps_count / currentGoal) * 100,
      100,
    );

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 4,
          minWidth: 120,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          {dayName}
        </Text>

        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            borderWidth: 3,
            borderColor: activity.goal_achieved
              ? colors.success
              : progressPercent > 50
                ? colors.warning
                : colors.border,
          }}
        >
          {activity.goal_achieved ? (
            <Award size={24} color={colors.success} />
          ) : (
            <Footprints size={24} color={colors.primary} />
          )}
        </View>

        <Text
          style={{
            fontWeight: "600",
            fontSize: 16,
            color: colors.text,
            marginBottom: 2,
          }}
        >
          {activity.steps_count.toLocaleString()}
        </Text>

        <Text
          style={{
            fontWeight: "400",
            fontSize: 10,
            color: colors.textTertiary,
          }}
        >
          {progressPercent.toFixed(0)}% of goal
        </Text>
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
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              color: colors.text,
            }}
          >
            Step Tracker
          </Text>
          <TouchableOpacity onPress={() => setShowGoalSetting(true)}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24 + 18 + 24 + 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Today's Progress */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            marginHorizontal: 20,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              fontSize: 16,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Today's Steps
          </Text>

          <Text
            style={{
              fontWeight: "700",
              fontSize: 48,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {todaySteps.toLocaleString()}
          </Text>

          <View
            style={{
              width: "100%",
              height: 8,
              backgroundColor: colors.surfaceElevated,
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: `${getProgressPercentage()}%`,
                height: "100%",
                backgroundColor:
                  todaySteps >= currentGoal ? colors.success : colors.primary,
                borderRadius: 4,
              }}
            />
          </View>

          <Text
            style={{
              fontWeight: "500",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 4,
            }}
          >
            Goal: {currentGoal.toLocaleString()} steps
          </Text>

          <Text
            style={{
              fontWeight: "500",
              fontSize: 14,
              color:
                todaySteps >= currentGoal ? colors.success : colors.primary,
              textAlign: "center",
            }}
          >
            {getMotivationMessage()}
          </Text>

          <TouchableOpacity
            onPress={() => setShowManualEntry(true)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
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
              Log Steps Manually
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Overview */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 20,
              color: colors.text,
              marginBottom: 16,
            }}
          >
            This Week
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {activities.map((activity) => (
              <StepCard key={activity.date} activity={activity} />
            ))}
          </ScrollView>
        </View>

        {/* Statistics */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Weekly Statistics
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                {stats.total_steps?.toLocaleString() || "0"}
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Total Steps
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                {stats.average_steps?.toLocaleString() || "0"}
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Daily Average
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 20,
                  color: colors.success,
                }}
              >
                {stats.goal_achievement_rate || 0}%
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Goal Rate
              </Text>
            </View>
          </View>
        </View>

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 24,
                marginHorizontal: 40,
                minWidth: 280,
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 18,
                  color: colors.text,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                Log Steps
              </Text>

              <TextInput
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 16,
                  textAlign: "center",
                }}
                placeholder="Enter number of steps"
                placeholderTextColor={colors.textTertiary}
                value={manualSteps}
                onChangeText={setManualSteps}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowManualEntry(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceElevated,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleManualEntry}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 14,
                      color: "#FFFFFF",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Goal Setting Modal */}
        {showGoalSetting && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 24,
                marginHorizontal: 40,
                minWidth: 280,
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 18,
                  color: colors.text,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Set Step Goal
              </Text>

              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                Current goal: {currentGoal.toLocaleString()} steps/day
              </Text>

              <TextInput
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 16,
                  textAlign: "center",
                }}
                placeholder={currentGoal.toString()}
                placeholderTextColor={colors.textTertiary}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowGoalSetting(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceElevated,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGoalUpdate}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 14,
                      color: "#FFFFFF",
                    }}
                  >
                    Update Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
