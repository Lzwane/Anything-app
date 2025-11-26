import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Camera,
  Image,
  Utensils,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";

export default function FoodTrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();
  const queryClient = useQueryClient();

  const USER_ID = 1;

  const [analyzing, setAnalyzing] = useState(false);

  // Fetch food logs
  const { data: foodLogsData, refetch } = useQuery({
    queryKey: ["food-logs", USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/food-analysis?user_id=${USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch food logs");
      return response.json();
    },
  });

  const foodLogs = foodLogsData?.food_logs || [];

  // Analyze food mutation
  const analyzeFood = useMutation({
    mutationFn: async ({ imageBase64, mealType, description }) => {
      const response = await fetch("/api/food-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          user_id: USER_ID,
          meal_type: mealType,
          description,
        }),
      });
      if (!response.ok) throw new Error("Failed to analyze food");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["food-logs"]);
    },
  });

  const takePicture = async () => {
    try {
      // Request camera permissions
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take photos of your food.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setAnalyzing(true);

        try {
          const currentHour = new Date().getHours();
          let mealType = "snack";
          if (currentHour < 11) mealType = "breakfast";
          else if (currentHour < 16) mealType = "lunch";
          else if (currentHour < 21) mealType = "dinner";

          const analysisResult = await analyzeFood.mutateAsync({
            imageBase64: result.assets[0].base64,
            mealType,
            description: "Photo captured from camera",
          });

          Alert.alert(
            "Food Analysis Complete! 📊",
            `Health Rating: ${analysisResult.analysis.health_rating}/10\nSodium Level: ${analysisResult.analysis.sodium_level}\n\n${analysisResult.analysis.recommendations}`,
            [{ text: "View Details", onPress: () => refetch() }],
          );
        } catch (error) {
          Alert.alert(
            "Analysis Failed",
            "Could not analyze the food image. Please try again.",
          );
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Camera Error", "Could not access camera. Please try again.");
      setAnalyzing(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setAnalyzing(true);

        try {
          const currentHour = new Date().getHours();
          let mealType = "snack";
          if (currentHour < 11) mealType = "breakfast";
          else if (currentHour < 16) mealType = "lunch";
          else if (currentHour < 21) mealType = "dinner";

          const analysisResult = await analyzeFood.mutateAsync({
            imageBase64: result.assets[0].base64,
            mealType,
            description: "Photo selected from gallery",
          });

          Alert.alert(
            "Food Analysis Complete! 📊",
            `Health Rating: ${analysisResult.analysis.health_rating}/10\nSodium Level: ${analysisResult.analysis.sodium_level}\n\n${analysisResult.analysis.recommendations}`,
            [{ text: "View Details", onPress: () => refetch() }],
          );
        } catch (error) {
          Alert.alert(
            "Analysis Failed",
            "Could not analyze the food image. Please try again.",
          );
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert(
        "Gallery Error",
        "Could not access photo library. Please try again.",
      );
      setAnalyzing(false);
    }
  };

  const showAddOptions = () => {
    Alert.alert("Add Food Entry", "How would you like to log your food?", [
      { text: "Take Photo", onPress: takePicture },
      { text: "Choose from Gallery", onPress: pickFromGallery },
      { text: "Manual Entry", onPress: () => router.push("/add-food-manual") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getHealthRatingColor = (rating) => {
    if (rating >= 8) return colors.success;
    if (rating >= 6) return colors.warning;
    return colors.error;
  };

  const getSodiumLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case "low":
        return <CheckCircle size={16} color={colors.success} />;
      case "medium":
        return <AlertTriangle size={16} color={colors.warning} />;
      case "high":
        return <AlertTriangle size={16} color={colors.error} />;
      default:
        return <Clock size={16} color={colors.textTertiary} />;
    }
  };

  const FoodLogCard = ({ log }) => {
    const logDate = new Date(log.logged_at);
    const isToday = logDate.toDateString() === new Date().toDateString();

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
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 14,
              color: colors.text,
              textTransform: "capitalize",
            }}
          >
            {log.meal_type || "Unknown"}
          </Text>
          <Text
            style={{
              fontWeight: "400",
              fontSize: 12,
              color: colors.textTertiary,
            }}
          >
            {isToday
              ? logDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : logDate.toLocaleDateString()}
          </Text>
        </View>

        <Text
          style={{
            fontWeight: "400",
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 12,
          }}
        >
          {log.food_description}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {log.sodium_content && (
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 11,
                  color: colors.text,
                  marginRight: 4,
                }}
              >
                {log.sodium_content}mg sodium
              </Text>
            </View>
          )}

          {log.calories && (
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 11,
                  color: colors.text,
                }}
              >
                {log.calories} cal
              </Text>
            </View>
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
            Food Tracker
          </Text>
          <TouchableOpacity onPress={showAddOptions} disabled={analyzing}>
            <View
              style={{
                backgroundColor: analyzing
                  ? colors.surfaceElevated
                  : colors.primary,
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {analyzing ? (
                <Sparkles size={18} color={colors.textTertiary} />
              ) : (
                <Plus size={18} color="#FFFFFF" />
              )}
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
        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={takePicture}
              disabled={analyzing}
            >
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  opacity: analyzing ? 0.7 : 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Camera size={20} color={colors.primary} />
                </View>
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 12,
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  Take Photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={pickFromGallery}
              disabled={analyzing}
            >
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  opacity: analyzing ? 0.7 : 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.warning + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Image size={20} color={colors.warning} />
                </View>
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 12,
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  From Gallery
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis Status */}
        {analyzing && (
          <View
            style={{
              backgroundColor: colors.primary + "20",
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 20,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Sparkles
              size={20}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                fontWeight: "500",
                fontSize: 14,
                color: colors.primary,
              }}
            >
              AI is analyzing your food... This may take a moment.
            </Text>
          </View>
        )}

        {/* Today's Food Summary */}
        {foodLogs.length > 0 && (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Recent Food Logs
              </Text>
            </View>

            {foodLogs.map((log) => (
              <FoodLogCard key={log.id} log={log} />
            ))}
          </>
        )}

        {/* Empty State */}
        {foodLogs.length === 0 && !analyzing && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              marginHorizontal: 20,
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
              <Utensils size={40} color={colors.textTertiary} />
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
              Start tracking your food
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
              Take photos of your meals and get AI-powered analysis for better
              hypertension management
            </Text>

            <TouchableOpacity
              onPress={takePicture}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Camera size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Take First Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
