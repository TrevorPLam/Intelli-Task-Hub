import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback, useMemo } from "react";
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
import { useApp, type CalendarEvent } from "@/context/AppContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_COLORS = [
  "#6C63FF", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { events, addEvent, deleteEvent } = useApp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [showAddEvent, setShowAddEvent] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(EVENT_COLORS[0]);
  const [newAllDay, setNewAllDay] = useState(false);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => eventsByDate[selectedDate] ?? [],
    [eventsByDate, selectedDate]
  );

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleAddEvent = useCallback(() => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addEvent({
      title: newTitle.trim(),
      date: selectedDate,
      time: newAllDay ? undefined : newTime,
      endTime: newAllDay ? undefined : newEndTime,
      description: newDesc.trim(),
      color: newColor,
      allDay: newAllDay,
    });
    setNewTitle("");
    setNewTime("09:00");
    setNewEndTime("10:00");
    setNewDesc("");
    setNewColor(EVENT_COLORS[0]);
    setNewAllDay(false);
    setShowAddEvent(false);
  }, [
    newTitle,
    selectedDate,
    newTime,
    newEndTime,
    newDesc,
    newColor,
    newAllDay,
    addEvent,
  ]);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const calendarGrid: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarGrid.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarGrid.push(d);
  while (calendarGrid.length % 7 !== 0) calendarGrid.push(null);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Calendar
        </Text>
        <Pressable
          onPress={() => setShowAddEvent(true)}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={prevMonth}
            style={({ pressed }) => [
              styles.navBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="chevron-left" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => {
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
              setSelectedDate(today.toISOString().split("T")[0]);
            }}
          >
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
          </Pressable>
          <Pressable
            onPress={nextMonth}
            style={({ pressed }) => [
              styles.navBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="chevron-right" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((d) => (
            <Text
              key={d}
              style={[styles.dayHeader, { color: colors.textSecondary }]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {calendarGrid.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.cell} />;
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday =
              dateStr === today.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const hasEvents = !!(eventsByDate[dateStr]?.length);

            return (
              <Pressable
                key={dateStr}
                onPress={() => {
                  setSelectedDate(dateStr);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.cell,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && {
                      backgroundColor: colors.tint,
                    },
                    isToday && !isSelected && {
                      borderWidth: 2,
                      borderColor: colors.tint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? "#FFF" : colors.text },
                      isToday &&
                        !isSelected && { color: colors.tint },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasEvents && (
                  <View style={styles.dotRow}>
                    {(eventsByDate[dateStr] ?? []).slice(0, 3).map((e) => (
                      <View
                        key={e.id}
                        style={[styles.dot, { backgroundColor: e.color }]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Selected date events */}
        <View style={styles.eventsSection}>
          <Text style={[styles.eventsSectionTitle, { color: colors.text }]}>
            {selectedDate === today.toISOString().split("T")[0]
              ? "Today"
              : new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
          </Text>

          {selectedDateEvents.length === 0 ? (
            <View style={styles.noEventsRow}>
              <Text style={[styles.noEvents, { color: colors.textSecondary }]}>
                No events — tap + to add one
              </Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <Pressable
                key={event.id}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Delete Event", `Delete "${event.title}"?`, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteEvent(event.id),
                    },
                  ]);
                }}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: event.color,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>
                    {event.title}
                  </Text>
                  {event.allDay ? (
                    <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                      All day
                    </Text>
                  ) : event.time ? (
                    <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                      {event.time}
                      {event.endTime ? ` – ${event.endTime}` : ""}
                    </Text>
                  ) : null}
                  {event.description ? (
                    <Text
                      style={[styles.eventDesc, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {event.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddEvent(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={() => setShowAddEvent(false)}>
              <Text
                style={[styles.modalCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Event
            </Text>
            <Pressable onPress={handleAddEvent}>
              <Text
                style={[
                  styles.modalSave,
                  {
                    color: newTitle.trim() ? colors.tint : colors.border,
                  },
                ]}
              >
                Add
              </Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <TextInput
              style={[
                styles.modalInput,
                styles.modalInputLarge,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>

            <View
              style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                All Day
              </Text>
              <Pressable
                onPress={() => setNewAllDay(!newAllDay)}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: newAllDay ? colors.tint : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: newAllDay ? 20 : 2 }] },
                  ]}
                />
              </Pressable>
            </View>

            {!newAllDay && (
              <>
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                      Start
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      value={newTime}
                      onChangeText={setNewTime}
                      placeholder="09:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                      End
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBackground,
                        },
                      ]}
                      value={newEndTime}
                      onChangeText={setNewEndTime}
                      placeholder="10:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </>
            )}

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />

            <Text style={[styles.modalSection, { color: colors.textSecondary }]}>
              Color
            </Text>
            <View style={styles.colorRow}>
              {EVENT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={[
                    styles.colorBtn,
                    { backgroundColor: c },
                    newColor === c && styles.colorBtnSelected,
                  ]}
                >
                  {newColor === c && (
                    <Feather name="check" size={14} color="#FFF" />
                  )}
                </Pressable>
              ))}
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 4 },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    paddingBottom: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 },
  cell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 4,
    minHeight: 48,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    justifyContent: "center",
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventsSection: { paddingHorizontal: 16, paddingTop: 20 },
  eventsSectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  noEventsRow: { paddingVertical: 20, alignItems: "center" },
  noEvents: { fontSize: 14, fontFamily: "Inter_400Regular" },
  eventCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    overflow: "hidden",
  },
  eventColorBar: { width: 4 },
  eventContent: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  eventTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  eventDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
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
  modalBody: { flex: 1, paddingHorizontal: 16 },
  modalInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalInputLarge: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  timeInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalSection: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorBtnSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
});
