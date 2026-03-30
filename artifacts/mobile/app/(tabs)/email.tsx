import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp, type Email } from "@/context/AppContext";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "#6C63FF",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function EmailRow({
  email,
  colors,
  onPress,
  onStar,
  onDelete,
}: {
  email: Email;
  colors: typeof Colors.light;
  onPress: () => void;
  onStar: () => void;
  onDelete: () => void;
}) {
  const avatarColor = getAvatarColor(email.from);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Email", email.subject, [
          { text: "Cancel", style: "cancel" },
          {
            text: email.starred ? "Unstar" : "Star",
            onPress: onStar,
          },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }}
      style={({ pressed }) => [
        styles.emailRow,
        {
          backgroundColor: !email.read ? colors.tint + "08" : colors.surface,
          opacity: pressed ? 0.85 : 1,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{getInitials(email.from)}</Text>
      </View>

      {/* Content */}
      <View style={styles.emailContent}>
        <View style={styles.emailTopRow}>
          <Text
            style={[
              styles.emailFrom,
              {
                color: colors.text,
                fontFamily: !email.read
                  ? "Inter_600SemiBold"
                  : "Inter_500Medium",
              },
            ]}
            numberOfLines={1}
          >
            {email.from}
          </Text>
          <Text style={[styles.emailTime, { color: colors.textSecondary }]}>
            {timeAgo(email.date)}
          </Text>
        </View>
        <Text
          style={[
            styles.emailSubject,
            {
              color: !email.read ? colors.text : colors.textSecondary,
              fontFamily: !email.read ? "Inter_500Medium" : "Inter_400Regular",
            },
          ]}
          numberOfLines={1}
        >
          {email.subject}
        </Text>
        <Text
          style={[styles.emailPreview, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {email.preview}
        </Text>
      </View>

      {/* Right indicators */}
      <View style={styles.emailRight}>
        {!email.read && (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.emailUnread }]}
          />
        )}
        <Pressable
          onPress={onStar}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons
            name={email.starred ? "star" : "star-outline"}
            size={16}
            color={email.starred ? colors.warning : colors.border}
          />
        </Pressable>
        {email.label && (
          <View
            style={[styles.labelBadge, { backgroundColor: colors.tint + "15" }]}
          >
            <Text style={[styles.labelText, { color: colors.tint }]}>
              {email.label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function EmailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { emails, markEmailRead, toggleEmailStar, deleteEmail, sendEmail } =
    useApp();

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [search, setSearch] = useState("");

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const filteredEmails = emails.filter((e) => {
    if (filterStarred && !e.starred) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.from.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = emails.filter((e) => !e.read).length;

  const handleOpenEmail = useCallback(
    (email: Email) => {
      setSelectedEmail(email);
      if (!email.read) markEmailRead(email.id);
    },
    [markEmailRead]
  );

  const handleSend = useCallback(() => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      Alert.alert("Missing fields", "Please fill in To and Subject.");
      return;
    }
    // sendEmail is not implemented - show dev warning and close modal
    if (__DEV__) {
      console.warn("sendEmail: not implemented");
    }
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setShowCompose(false);
  }, [composeTo, composeSubject]);

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
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Inbox
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadBadge, { color: colors.tint }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setFilterStarred(!filterStarred)}
            style={({ pressed }) => [
              styles.filterBtn,
              {
                backgroundColor: filterStarred
                  ? colors.warning + "20"
                  : colors.surface,
                borderColor: filterStarred ? colors.warning : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="star"
              size={14}
              color={filterStarred ? colors.warning : colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowCompose(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="edit-2" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="search" size={14} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search emails..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Email List */}
      <FlatList
        data={filteredEmails}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EmailRow
            email={item}
            colors={colors}
            onPress={() => handleOpenEmail(item)}
            onStar={() => toggleEmailStar(item.id)}
            onDelete={() => deleteEmail(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filterStarred ? "No starred emails" : "No emails"}
            </Text>
          </View>
        }
      />

      {/* Email Detail Modal */}
      <Modal
        visible={!!selectedEmail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEmail(null)}
      >
        {selectedEmail && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Pressable
                onPress={() => setSelectedEmail(null)}
                style={({ pressed }) => [
                  styles.backBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="x" size={22} color={colors.text} />
              </Pressable>
              <View style={styles.modalHeaderActions}>
                <Pressable
                  onPress={() => {
                    toggleEmailStar(selectedEmail.id);
                    setSelectedEmail((prev) =>
                      prev ? { ...prev, starred: !prev.starred } : null
                    );
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather
                    name="star"
                    size={20}
                    color={
                      selectedEmail.starred
                        ? colors.warning
                        : colors.textSecondary
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    deleteEmail(selectedEmail.id);
                    setSelectedEmail(null);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather
                    name="trash-2"
                    size={20}
                    color={colors.destructive}
                  />
                </Pressable>
              </View>
            </View>
            <ScrollView
              style={styles.emailDetailBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.emailDetailSubject, { color: colors.text }]}>
                {selectedEmail.subject}
              </Text>
              <View style={styles.emailDetailMeta}>
                <View
                  style={[
                    styles.detailAvatar,
                    { backgroundColor: getAvatarColor(selectedEmail.from) },
                  ]}
                >
                  <Text style={styles.detailAvatarText}>
                    {getInitials(selectedEmail.from)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.detailFrom, { color: colors.text }]}>
                    {selectedEmail.from}
                  </Text>
                  <Text
                    style={[
                      styles.detailFromEmail,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedEmail.fromEmail}
                  </Text>
                </View>
                <Text
                  style={[styles.detailTime, { color: colors.textSecondary }]}
                >
                  {timeAgo(selectedEmail.date)}
                </Text>
              </View>
              <Text style={[styles.emailDetailBody2, { color: colors.text }]}>
                {selectedEmail.body}
              </Text>
              <Pressable
                onPress={() => {
                  setSelectedEmail(null);
                  setComposeTo(selectedEmail.fromEmail);
                  setComposeSubject(`Re: ${selectedEmail.subject}`);
                  setShowCompose(true);
                }}
                style={({ pressed }) => [
                  styles.replyBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="corner-up-left" size={16} color="#FFF" />
                <Text style={styles.replyBtnText}>Reply</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Compose Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompose(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable
              onPress={() => setShowCompose(false)}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text
                style={[styles.modalCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Message
            </Text>
            <Pressable
              onPress={handleSend}
              disabled={!composeTo.trim() || !composeSubject.trim()}
              style={({ pressed }) => [
                {
                  opacity:
                    !composeTo.trim() || !composeSubject.trim()
                      ? 0.4
                      : pressed
                        ? 0.6
                        : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalSave,
                  {
                    color:
                      composeTo.trim() && composeSubject.trim()
                        ? colors.tint
                        : colors.border,
                  },
                ]}
              >
                Send
              </Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.composeField,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.composeLabel, { color: colors.textSecondary }]}
              >
                To
              </Text>
              <TextInput
                style={[styles.composeInput, { color: colors.text }]}
                placeholder="recipient@email.com"
                placeholderTextColor={colors.textSecondary}
                value={composeTo}
                onChangeText={setComposeTo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View
              style={[
                styles.composeField,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.composeLabel, { color: colors.textSecondary }]}
              >
                Subject
              </Text>
              <TextInput
                style={[styles.composeInput, { color: colors.text }]}
                placeholder="Subject"
                placeholderTextColor={colors.textSecondary}
                value={composeSubject}
                onChangeText={setComposeSubject}
              />
            </View>
            <TextInput
              style={[styles.composeBodyInput, { color: colors.text }]}
              placeholder="Write your message..."
              placeholderTextColor={colors.textSecondary}
              value={composeBody}
              onChangeText={setComposeBody}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  unreadBadge: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  emailContent: { flex: 1, minWidth: 0 },
  emailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  emailFrom: { fontSize: 14, flex: 1, marginRight: 4 },
  emailTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emailSubject: { fontSize: 13, marginBottom: 2 },
  emailPreview: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emailRight: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  labelText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalCancel: { fontSize: 16, fontFamily: "Inter_400Regular" },
  modalSave: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  modalHeaderActions: { flexDirection: "row", gap: 16 },
  modalBody: { flex: 1, paddingHorizontal: 16 },
  emailDetailBody: { flex: 1, paddingHorizontal: 16 },
  emailDetailSubject: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    paddingTop: 20,
    paddingBottom: 12,
  },
  emailDetailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  detailAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailAvatarText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  detailFrom: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  detailFromEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  detailTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  emailDetailBody2: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginBottom: 32,
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 40,
  },
  replyBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  composeField: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  composeLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    width: 50,
  },
  composeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  composeBodyInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingTop: 16,
    lineHeight: 22,
    minHeight: 300,
  },
});
