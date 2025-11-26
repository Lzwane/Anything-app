import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  BookOpen,
  Play,
  Award,
  CheckCircle,
  Lock,
  Brain,
  Heart,
  Target,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";
import SelectionPill from "@/components/SelectionPill";

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();
  const [selectedCategory, setSelectedCategory] = useState("Lessons");

  const categories = ["Lessons", "Mini Games", "Progress"];

  // Mock data for lessons
  const lessons = [
    {
      id: 1,
      title: "Understanding Hypertension",
      description: "Learn what blood pressure is and why it matters",
      duration: "5 min",
      completed: true,
      progress: 100,
    },
    {
      id: 2,
      title: "Reading Blood Pressure",
      description: "How to interpret systolic and diastolic numbers",
      duration: "4 min",
      completed: true,
      progress: 100,
    },
    {
      id: 3,
      title: "Lifestyle Changes",
      description: "Diet and exercise tips for managing hypertension",
      duration: "6 min",
      completed: false,
      progress: 30,
    },
    {
      id: 4,
      title: "Medication Basics",
      description: "Understanding common hypertension medications",
      duration: "5 min",
      completed: false,
      progress: 0,
    },
    {
      id: 5,
      title: "When to Seek Help",
      description: "Recognizing emergency situations",
      duration: "4 min",
      completed: false,
      progress: 0,
      locked: true,
    },
  ];

  // Mock data for mini games
  const miniGames = [
    {
      id: 1,
      title: "BP Number Match",
      description: "Match blood pressure readings with their categories",
      difficulty: "Easy",
      completed: true,
      bestScore: 85,
      icon: Target,
    },
    {
      id: 2,
      title: "Heart Health Quiz",
      description: "Test your knowledge about cardiovascular health",
      difficulty: "Medium",
      completed: true,
      bestScore: 92,
      icon: Heart,
    },
    {
      id: 3,
      title: "Lifestyle Challenge",
      description: "Interactive scenarios about healthy choices",
      difficulty: "Medium",
      completed: false,
      bestScore: 0,
      icon: Brain,
      locked: false,
    },
    {
      id: 4,
      title: "Medication Memory",
      description: "Remember medication schedules and dosages",
      difficulty: "Hard",
      completed: false,
      bestScore: 0,
      icon: Brain,
      locked: true,
    },
  ];

  const completedLessons = lessons.filter((lesson) => lesson.completed).length;
  const completedGames = miniGames.filter((game) => game.completed).length;
  const totalProgress = Math.round(
    ((completedLessons + completedGames) /
      (lessons.length + miniGames.length)) *
      100,
  );

  const LessonCard = ({ lesson }) => (
    <TouchableOpacity
      disabled={lesson.locked}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        opacity: lesson.locked ? 0.6 : 1,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: lesson.completed
              ? colors.success + "20"
              : colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {lesson.locked ? (
            <Lock size={20} color={colors.textTertiary} />
          ) : lesson.completed ? (
            <CheckCircle size={20} color={colors.success} />
          ) : (
            <BookOpen size={20} color={colors.primary} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 16,
              color: colors.text,
              marginBottom: 2,
            }}
          >
            {lesson.title}
          </Text>
          <Text
            style={{
              fontWeight: "400",
              fontSize: 12,
              color: colors.textTertiary,
            }}
          >
            {lesson.duration} •{" "}
            {lesson.completed
              ? "Completed"
              : lesson.locked
                ? "Locked"
                : "Available"}
          </Text>
        </View>

        {!lesson.locked && !lesson.completed && lesson.progress > 0 && (
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontWeight: "500",
                fontSize: 10,
                color: "#FFFFFF",
              }}
            >
              {lesson.progress}%
            </Text>
          </View>
        )}
      </View>

      <Text
        style={{
          fontWeight: "400",
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 8,
        }}
      >
        {lesson.description}
      </Text>

      {!lesson.completed && lesson.progress > 0 && (
        <View style={{ marginTop: 8 }}>
          <View
            style={{
              height: 4,
              backgroundColor: colors.surfaceElevated,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${lesson.progress}%`,
                height: "100%",
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const GameCard = ({ game }) => (
    <TouchableOpacity
      disabled={game.locked}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        opacity: game.locked ? 0.6 : 1,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: game.completed
              ? colors.success + "20"
              : colors.warning + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {game.locked ? (
            <Lock size={20} color={colors.textTertiary} />
          ) : (
            <game.icon
              size={20}
              color={game.completed ? colors.success : colors.warning}
            />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 16,
              color: colors.text,
              marginBottom: 2,
            }}
          >
            {game.title}
          </Text>
          <Text
            style={{
              fontWeight: "400",
              fontSize: 12,
              color: colors.textTertiary,
            }}
          >
            {game.difficulty} •{" "}
            {game.completed
              ? `Best: ${game.bestScore}%`
              : game.locked
                ? "Locked"
                : "Not played"}
          </Text>
        </View>

        {!game.locked && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={{
          fontWeight: "400",
          fontSize: 14,
          color: colors.textSecondary,
        }}
      >
        {game.description}
      </Text>
    </TouchableOpacity>
  );

  const ProgressOverview = () => (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Overall Progress */}
      <LinearGradient
        colors={[colors.successGradientStart, colors.successGradientEnd]}
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
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Award size={24} color="#FFFFFF" />
          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              color: "#FFFFFF",
              marginLeft: 12,
            }}
          >
            Learning Progress
          </Text>
        </View>

        <Text
          style={{
            fontWeight: "800",
            fontSize: 32,
            color: "#FFFFFF",
            marginBottom: 4,
          }}
        >
          {totalProgress}%
        </Text>

        <Text
          style={{
            fontWeight: "400",
            fontSize: 14,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {completedLessons + completedGames} of{" "}
          {lessons.length + miniGames.length} activities completed
        </Text>
      </LinearGradient>

      {/* Detailed Stats */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            fontSize: 16,
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Activity Breakdown
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 24,
                color: colors.text,
              }}
            >
              {completedLessons}
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 12,
                color: colors.textTertiary,
              }}
            >
              Lessons
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 24,
                color: colors.text,
              }}
            >
              {completedGames}
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 12,
                color: colors.textTertiary,
              }}
            >
              Games
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 24,
                color: colors.text,
              }}
            >
              {miniGames
                .filter((g) => g.completed)
                .reduce((sum, g) => sum + g.bestScore, 0) /
                Math.max(completedGames, 1)}
              %
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 12,
                color: colors.textTertiary,
              }}
            >
              Avg Score
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case "Lessons":
        return (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Hypertension Education
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: colors.textTertiary,
                  marginTop: 4,
                }}
              >
                Learn about managing your blood pressure effectively
              </Text>
            </View>
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </>
        );

      case "Mini Games":
        return (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Interactive Games
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 14,
                  color: colors.textTertiary,
                  marginTop: 4,
                }}
              >
                Test your knowledge in a fun, engaging way
              </Text>
            </View>
            {miniGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </>
        );

      case "Progress":
        return <ProgressOverview />;

      default:
        return null;
    }
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
        <Text
          style={{
            fontWeight: "600",
            fontSize: 28,
            color: colors.text,
          }}
        >
          Learn
        </Text>
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
        {/* Category Selector */}
        <ScrollView
          horizontal
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => (
            <SelectionPill
              key={category}
              title={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>

        {renderContent()}
      </ScrollView>
    </View>
  );
}
