import { Tabs } from "expo-router";
import {
  Heart,
  Activity,
  Pill,
  BookOpen,
  MessageCircle,
  Utensils,
} from "lucide-react-native";
import useTheme from "@/utils/useTheme";

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingBottom: 10,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="bp-readings"
        options={{
          title: "BP Readings",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: "Medications",
          tabBarIcon: ({ color, size }) => <Pill color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="food-tracker"
        options={{
          title: "Food",
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
