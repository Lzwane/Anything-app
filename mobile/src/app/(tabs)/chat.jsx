import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MessageCircle, Send, Bot, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import useTheme from "@/utils/useTheme";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your health assistant. I'm here to help you with questions about managing your hypertension, provide encouragement, and offer guidance. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: message,
        timestamp: new Date(),
      },
    ]);
    setStreamingMessage("");
    setIsLoading(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Clear input
    const messageToSend = inputMessage.trim();
    setInputMessage("");

    try {
      // Prepare messages for API (exclude timestamp)
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add health assistant system message
      const systemMessage = {
        role: "system",
        content:
          "You are a compassionate health assistant specialized in hypertension management. Provide empathetic, supportive, and medically accurate information. Always encourage users to consult with their healthcare providers for medical decisions. Be warm, understanding, and motivating in your responses. Focus on lifestyle management, medication adherence, stress reduction, and emotional support.",
      };

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [systemMessage, ...apiMessages],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      handleStreamResponse(response);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === "user";
    const isStreaming =
      message.role === "assistant" && !message.content && streamingMessage;

    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: 16,
          paddingHorizontal: 20,
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <Bot size={18} color={colors.primary} />
          </View>
        )}

        <View
          style={{
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderRadius: 16,
            padding: 12,
            maxWidth: "75%",
            borderBottomLeftRadius: !isUser ? 4 : 16,
            borderBottomRightRadius: isUser ? 4 : 16,
          }}
        >
          <Text
            style={{
              fontWeight: "400",
              fontSize: 16,
              color: isUser ? "#FFFFFF" : colors.text,
              lineHeight: 22,
            }}
          >
            {message.content || streamingMessage}
          </Text>

          {message.timestamp && (
            <Text
              style={{
                fontWeight: "400",
                fontSize: 11,
                color: isUser ? "rgba(255,255,255,0.7)" : colors.textTertiary,
                marginTop: 4,
              }}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>

        {isUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            <User size={18} color={colors.text} />
          </View>
        )}
      </View>
    );
  };

  // Quick suggestion buttons
  const suggestions = [
    "How can I lower my blood pressure naturally?",
    "I'm feeling stressed about my readings",
    "Help me stay motivated with my medications",
    "What foods should I avoid?",
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <MessageCircle size={20} color={colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "600",
                fontSize: 18,
                color: colors.text,
              }}
            >
              Health Assistant
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textTertiary,
              }}
            >
              {isLoading
                ? "Typing..."
                : "Online • Ask me anything about hypertension"}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <MessageBubble
            message={{ role: "assistant", content: streamingMessage }}
          />
        )}

        {/* Quick suggestions (only show when no messages yet) */}
        {messages.length <= 1 && !isLoading && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text
              style={{
                fontWeight: "500",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Try asking:
            </Text>

            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setInputMessage(suggestion)}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontWeight: "400",
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  "{suggestion}"
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: colors.surfaceElevated,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: colors.text,
              paddingVertical: 8,
              paddingRight: 8,
              maxHeight: 100,
            }}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor:
                inputMessage.trim() && !isLoading
                  ? colors.primary
                  : colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send
              size={16}
              color={
                inputMessage.trim() && !isLoading
                  ? "#FFFFFF"
                  : colors.textTertiary
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
