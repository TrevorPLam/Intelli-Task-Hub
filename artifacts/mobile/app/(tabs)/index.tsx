import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAvoidingView as KBAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  useCreateOpenaiConversation,
  useListOpenaiConversations,
  useGetOpenaiConversation,
  parseSseChunk,
  readSseData,
} from "@workspace/api-client-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showConversations, setShowConversations] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const { data: conversations, refetch: refetchConversations } =
    useListOpenaiConversations();

  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const startNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation({
        data: { title: "New Chat" },
      });
      setConversationId(conv.id);
      setMessages([]);
      setShowConversations(false);
      refetchConversations();
    } catch {
      Alert.alert("Error", "Could not start a new conversation.");
    }
  }, [createConversation, refetchConversations]);

  useEffect(() => {
    startNewConversation();
  }, [startNewConversation]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isSending || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const currentInput = input.trim();
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setStreamingContent("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let assembled = "";

    const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB max buffer for DoS protection

    try {
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      const abortController = new AbortController();
      const response = await fetch(
        `${baseUrl}/api/openai/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: currentInput }),
          signal: abortController.signal,
        }
      );

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert Uint8Array to string manually for React Native compatibility
        const chunk = String.fromCharCode.apply(null, Array.from(value));
        buffer += chunk;

        // DoS protection: limit buffer size
        if (buffer.length > MAX_BUFFER_SIZE) {
          throw new Error("SSE buffer exceeded maximum size");
        }

        const { events, remaining } = parseSseChunk(buffer);
        buffer = remaining;

        for (const event of events) {
          const data = readSseData(event);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // Validate expected shape: {content?: string, done?: boolean}
              if (typeof parsed !== "object" || parsed === null) {
                throw new Error("Invalid SSE data: not an object");
              }
              if (parsed.content && typeof parsed.content !== "string") {
                throw new Error("Invalid SSE data: content must be string");
              }
              if (parsed.done && typeof parsed.done !== "boolean") {
                throw new Error("Invalid SSE data: done must be boolean");
              }
              if (parsed.content) {
                assembled += parsed.content;
                setStreamingContent(assembled);
              }
              if (parsed.done) {
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: "assistant",
                  content: assembled,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
                assembled = "";
              }
            } catch (err) {
              if (__DEV__) {
                console.warn(
                  "SSE parse error:",
                  err instanceof Error ? err.message : String(err)
                );
              }
            }
          }
        }
      }

      // Process final buffer
      buffer += ""; // No decoder needed for final buffer
      const { events, remaining } = parseSseChunk(buffer);

      for (const event of events) {
        const data = readSseData(event);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assembled += parsed.content;
              setStreamingContent(assembled);
            }
            if (parsed.done) {
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: assembled,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent("");
              assembled = "";
            }
          } catch {
            // Ignore parse errors for malformed chunks
          }
        }
      }

      // Handle any final unterminated event
      if (remaining.trim()) {
        const data = readSseData(remaining);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assembled += parsed.content;
              setStreamingContent(assembled);
            }
            if (parsed.done) {
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: assembled,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent("");
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch {
      Alert.alert("Error", "Could not send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, conversationId]);

  // Use React Query to fetch conversation details when conversationId changes
  const { data: conversationData } = useGetOpenaiConversation(
    conversationId ?? 0,
    {
      query: {
        enabled: !!conversationId,
        queryKey: ["conversation", conversationId],
      },
    }
  );

  // Sync messages from fetched conversation data
  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(
        conversationData.messages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [conversationData]);

  const loadConversation = useCallback(async (conv: Conversation) => {
    setConversationId(conv.id);
    setShowConversations(false);
    // Messages will be loaded by the useGetOpenaiConversation hook
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isUser = item.role === "user";
      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isUser
              ? { backgroundColor: colors.chatUser }
              : { backgroundColor: colors.chatAssistant },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isUser ? colors.chatUserText : colors.chatAssistantText,
              },
            ]}
          >
            {item.content}
          </Text>
        </View>
      );
    },
    [colors]
  );

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.aiDot, { backgroundColor: colors.tint }]} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Assistant
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setShowConversations(!showConversations)}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="clock" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={startNewConversation}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="edit-2" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Conversations List */}
      {showConversations && (
        <View
          style={[
            styles.conversationsList,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.convListTitle, { color: colors.textSecondary }]}>
            Recent Conversations
          </Text>
          {(conversations ?? []).map((conv) => (
            <Pressable
              key={conv.id}
              onPress={() => loadConversation(conv)}
              style={({ pressed }) => [
                styles.convItem,
                {
                  backgroundColor:
                    conv.id === conversationId
                      ? colors.tint + "20"
                      : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name="message-square"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.convItemText, { color: colors.text }]}
                numberOfLines={1}
              >
                {conv.title}
              </Text>
            </Pressable>
          ))}
          {(!conversations || conversations.length === 0) && (
            <Text style={[styles.convEmpty, { color: colors.textSecondary }]}>
              No previous conversations
            </Text>
          )}
        </View>
      )}

      {/* Messages */}
      <KBAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: bottomInset + 80 },
          ]}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.tint + "20" },
                ]}
              >
                <Feather name="cpu" size={32} color={colors.tint} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                How can I help?
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Ask me anything — tasks, scheduling, emails, or just chat
              </Text>
              {[
                "What tasks are due today?",
                "Summarize my emails",
                "Schedule a meeting for tomorrow",
              ].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setInput(s)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
          ListFooterComponent={
            !!streamingContent ? (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  { backgroundColor: colors.chatAssistant },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: colors.chatAssistantText },
                  ]}
                >
                  {streamingContent}
                </Text>
              </View>
            ) : isSending && !streamingContent ? (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  { backgroundColor: colors.chatAssistant },
                ]}
              >
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomInset + 8,
            },
          ]}
        >
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Message your assistant..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={2000}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!input.trim() || isSending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    !input.trim() || isSending ? colors.border : colors.tint,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KBAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerRight: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 8 },
  conversationsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 200,
  },
  convListTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  convItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  convEmpty: { fontSize: 13, fontFamily: "Inter_400Regular" },
  messagesList: { paddingHorizontal: 16, paddingTop: 16 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    minWidth: 60,
    alignItems: "center",
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "stretch",
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
