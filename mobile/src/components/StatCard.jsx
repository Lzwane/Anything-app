import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import useTheme from "@/utils/useTheme";

export default function StatCard({
  title,
  value,
  unit,
  iconColor,
  IconComponent,
  isWide = false,
  onPress,
}) {
  const { colors } = useTheme();

  const CardContent = () => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        width: isWide ? "100%" : "48%",
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: iconColor,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <IconComponent size={20} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontWeight: "500",
              fontSize: 13,
              color: colors.text,
            }}
          >
            {title}
          </Text>
        </View>
        {isWide && (
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 32,
                lineHeight: 34,
                color: colors.text,
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 13,
                color: colors.textSecondary,
                marginLeft: 4,
              }}
            >
              {unit}
            </Text>
          </View>
        )}
      </View>
      {!isWide && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 32,
              lineHeight: 34,
              color: colors.text,
            }}
          >
            {value}
          </Text>
          <Text
            style={{
              fontWeight: "400",
              fontSize: 13,
              color: colors.textSecondary,
              marginLeft: 4,
            }}
          >
            {unit}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}
