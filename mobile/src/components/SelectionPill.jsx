import React from "react";
import { TouchableOpacity, Text } from "react-native";
import useTheme from "@/utils/useTheme";

export default function SelectionPill({
  title,
  isSelected = false,
  onPress,
  variant = "default", // 'default' or 'outlined'
}) {
  const { colors } = useTheme();

  const getStyles = () => {
    if (variant === "outlined") {
      return {
        backgroundColor: isSelected ? colors.surface : "transparent",
        borderWidth: 1,
        borderColor: isSelected ? colors.border : colors.border,
      };
    }

    return {
      backgroundColor: isSelected
        ? colors.categoryActive
        : colors.categoryInactive,
      borderWidth: 0,
    };
  };

  const getTextColor = () => {
    if (variant === "outlined") {
      return isSelected ? colors.text : colors.textTertiary;
    }

    return isSelected ? colors.categoryActiveText : colors.categoryInactiveText;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          marginRight: 8,
          alignItems: "center",
          justifyContent: "center",
        },
        getStyles(),
      ]}
    >
      <Text
        style={{
          fontWeight: isSelected ? "600" : "400",
          fontSize: 14,
          color: getTextColor(),
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
