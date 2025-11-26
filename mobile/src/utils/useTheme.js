import { useColorScheme } from "react-native";

export default function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    // Core colors
    primary: isDark ? "#5A8AFF" : "#3366FF",
    primaryGradientStart: isDark ? "#5A8AFF" : "#3366FF",
    primaryGradientEnd: isDark ? "#8BB7FF" : "#6B8DFF",

    // Health-specific colors
    health: isDark ? "#FF6B9D" : "#FF3B71",
    warning: isDark ? "#FFB347" : "#FF9500",
    success: isDark ? "#4CAF50" : "#34C759",
    error: isDark ? "#F44336" : "#FF3B30",

    // Activity colors
    fitness: isDark ? "#9C88FF" : "#7B68EE",
    calories: isDark ? "#FF6B47" : "#FF5722",
    hydration: isDark ? "#47D7FF" : "#00BCD4",
    nutrition: isDark ? "#66BB6A" : "#4CAF50",

    // Gradient colors for cards
    successGradientStart: isDark ? "#4CAF50" : "#34C759",
    successGradientEnd: isDark ? "#66BB6A" : "#4CAF50",

    // Background colors
    background: isDark ? "#000000" : "#FFFFFF",
    surface: isDark ? "#1C1C1E" : "#FFFFFF",
    surfaceElevated: isDark ? "#2C2C2E" : "#F2F2F7",
    surfaceHighest: isDark ? "#000000" : "#F8F9FA",

    // Text colors
    text: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#99999B" : "#6B6B6B",
    textTertiary: isDark ? "#6B6B6B" : "#99999B",

    // UI colors
    border: isDark ? "#2C2C2E" : "#E5E7EB",
    notification: isDark ? "#FF453A" : "#FF3B30",

    // Category colors
    categoryActive: isDark ? "#5A8AFF" : "#3366FF",
    categoryActiveText: "#FFFFFF",
    categoryInactive: isDark ? "#2C2C2E" : "#F2F2F7",
    categoryInactiveText: isDark ? "#99999B" : "#6B6B6B",

    // Warning backgrounds
    warningBackground: isDark
      ? "rgba(255, 179, 71, 0.2)"
      : "rgba(255, 149, 0, 0.1)",

    // Special properties
    isDark,
  };

  return { colors, isDark };
}
