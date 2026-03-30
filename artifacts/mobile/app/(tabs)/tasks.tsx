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
import {
  useApp,
  type Task,
  type Project,
  type Priority,
  type TaskStatus,
} from "@/context/AppContext";
import { validateTaskInput, validateProjectInput } from "@/utils/validation";

const PRIORITY_CONFIG = {
  high: { label: "High", icon: "alert-circle" as const },
  medium: { label: "Medium", icon: "minus-circle" as const },
  low: { label: "Low", icon: "chevron-down-circle" as const },
};

const STATUS_CONFIG = {
  todo: { label: "To Do", icon: "circle" as const },
  in_progress: { label: "In Progress", icon: "loader" as const },
  done: { label: "Done", icon: "check-circle" as const },
};

const PROJECT_EMOJIS = ["💼", "🏡", "❤️", "🎯", "📚", "🚀", "💡", "🌱"];
const PROJECT_COLORS = [
  "#6C63FF",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

const TaskCard = React.memo(
  ({
    task,
    project,
    colors,
    onToggle,
    onDelete,
  }: {
    task: Task;
    project?: Project;
    colors: typeof Colors.light;
    onToggle: () => void;
    onDelete: () => void;
  }) => {
    const priorityColors: Record<Priority, string> = {
      high: colors.taskHigh,
      medium: colors.taskMedium,
      low: colors.taskLow,
    };
    const isDone = task.status === "done";

    return (
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert("Delete Task", `Delete "${task.title}"?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: onDelete,
            },
          ]);
        }}
        style={({ pressed }) => [
          styles.taskCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Pressable onPress={onToggle} style={styles.taskCheck}>
          <View
            style={[
              styles.checkbox,
              isDone
                ? { backgroundColor: colors.tint, borderColor: colors.tint }
                : { borderColor: colors.border },
            ]}
          >
            {isDone && <Feather name="check" size={12} color="#FFF" />}
          </View>
        </Pressable>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text },
              isDone && {
                textDecorationLine: "line-through",
                color: colors.textSecondary,
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            {project && (
              <View
                style={[
                  styles.projectBadge,
                  { backgroundColor: project.color + "20" },
                ]}
              >
                <Text style={{ fontSize: 10 }}>{project.emoji}</Text>
                <Text
                  style={[styles.projectBadgeText, { color: project.color }]}
                >
                  {project.name}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: priorityColors[task.priority] },
              ]}
            />
            <Text
              style={[
                styles.priorityLabel,
                { color: priorityColors[task.priority] },
              ]}
            >
              {PRIORITY_CONFIG[task.priority].label}
            </Text>
            {task.dueDate && (
              <>
                <Text style={[styles.separator, { color: colors.border }]}>
                  ·
                </Text>
                <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </>
            )}
          </View>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                task.status === "in_progress"
                  ? colors.warning + "20"
                  : task.status === "done"
                    ? colors.success + "20"
                    : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color:
                  task.status === "in_progress"
                    ? colors.warning
                    : task.status === "done"
                      ? colors.success
                      : colors.textSecondary,
              },
            ]}
          >
            {STATUS_CONFIG[task.status].label}
          </Text>
        </View>
      </Pressable>
    );
  }
);

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const {
    projects,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    deleteProject,
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">(
    "all"
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newTaskProject, setNewTaskProject] = useState<string>("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");

  const [newProjName, setNewProjName] = useState("");
  const [newProjEmoji, setNewProjEmoji] = useState("💼");
  const [newProjColor, setNewProjColor] = useState(PROJECT_COLORS[0]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProject !== "all" && t.projectId !== selectedProject)
        return false;
      if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
      return true;
    });
  }, [tasks, selectedProject, selectedStatus]);

  const handleToggleTask = useCallback(
    (task: Task) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next: TaskStatus =
        task.status === "todo"
          ? "in_progress"
          : task.status === "in_progress"
            ? "done"
            : "todo";
      updateTask(task.id, { status: next });
    },
    [updateTask]
  );

  const handleAddTask = useCallback(() => {
    const validation = validateTaskInput({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      status: newTaskStatus,
      projectId: newTaskProject,
    });

    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.errors[0]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask(validation.sanitizedTask);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("medium");
    setNewTaskStatus("todo");
    setNewTaskProject("");
    setShowAddTask(false);
  }, [
    newTaskTitle,
    newTaskDesc,
    newTaskPriority,
    newTaskStatus,
    newTaskProject,
    addTask,
  ]);

  const handleAddProject = useCallback(() => {
    const validation = validateProjectInput({
      name: newProjName,
      emoji: newProjEmoji,
      color: newProjColor,
      description: "",
    });

    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.errors[0]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addProject(validation.sanitizedProject);
    setNewProjName("");
    setNewProjEmoji("💼");
    setNewProjColor(PROJECT_COLORS[0]);
    setShowAddProject(false);
  }, [newProjName, newProjEmoji, newProjColor, addProject]);

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const todo = filteredTasks.filter((t) => t.status === "todo").length;
  const inProgress = filteredTasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const done = filteredTasks.filter((t) => t.status === "done").length;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowAddProject(true)}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather
              name="folder-plus"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowAddTask(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        {[
          { label: "To Do", count: todo, color: colors.info },
          { label: "In Progress", count: inProgress, color: colors.warning },
          { label: "Done", count: done, color: colors.success },
        ].map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={[styles.statCount, { color: stat.color }]}>
              {stat.count}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Projects filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.projectsScroll}
        contentContainerStyle={styles.projectsContent}
      >
        <Pressable
          onPress={() => setSelectedProject("all")}
          style={({ pressed }) => [
            styles.projectChip,
            {
              backgroundColor:
                selectedProject === "all" ? colors.tint : colors.surface,
              borderColor:
                selectedProject === "all" ? colors.tint : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.projectChipText,
              {
                color: selectedProject === "all" ? "#FFF" : colors.text,
              },
            ]}
          >
            All
          </Text>
        </Pressable>
        {projects.map((proj) => (
          <Pressable
            key={proj.id}
            onPress={() =>
              setSelectedProject(selectedProject === proj.id ? "all" : proj.id)
            }
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Delete Project", `Delete "${proj.name}"?`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteProject(proj.id),
                },
              ]);
            }}
            style={({ pressed }) => [
              styles.projectChip,
              {
                backgroundColor:
                  selectedProject === proj.id ? proj.color : proj.color + "18",
                borderColor:
                  selectedProject === proj.id ? proj.color : "transparent",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.projectChipEmoji}>{proj.emoji}</Text>
            <Text
              style={[
                styles.projectChipText,
                {
                  color: selectedProject === proj.id ? "#FFF" : proj.color,
                },
              ]}
            >
              {proj.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusScroll}
        contentContainerStyle={styles.projectsContent}
      >
        {(["all", "todo", "in_progress", "done"] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSelectedStatus(s)}
            style={({ pressed }) => [
              styles.statusChip,
              {
                backgroundColor:
                  selectedStatus === s ? colors.tint + "20" : "transparent",
                borderColor: selectedStatus === s ? colors.tint : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color:
                    selectedStatus === s ? colors.tint : colors.textSecondary,
                },
              ]}
            >
              {s === "all"
                ? "All"
                : s === "in_progress"
                  ? "In Progress"
                  : s === "todo"
                    ? "To Do"
                    : "Done"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(t) => t.id}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={15}
        contentContainerStyle={[
          styles.taskList,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            project={projects.find((p) => p.id === item.projectId)}
            colors={colors}
            onToggle={() => handleToggleTask(item)}
            onDelete={() => deleteTask(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="check-square" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks yet. Tap + to add one.
            </Text>
          </View>
        }
      />

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTask(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={() => setShowAddTask(false)}>
              <Text
                style={[styles.modalCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Task
            </Text>
            <Pressable onPress={handleAddTask}>
              <Text
                style={[
                  styles.modalSave,
                  {
                    color: newTaskTitle.trim() ? colors.tint : colors.border,
                  },
                ]}
              >
                Add
              </Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={[
                styles.modalInput,
                styles.modalInputLarge,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder="Task name"
              placeholderTextColor={colors.textSecondary}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newTaskDesc}
              onChangeText={setNewTaskDesc}
              multiline
            />

            <Text
              style={[styles.modalSection, { color: colors.textSecondary }]}
            >
              Priority
            </Text>
            <View style={styles.optionRow}>
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setNewTaskPriority(p)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor:
                        newTaskPriority === p
                          ? (p === "high"
                              ? colors.taskHigh
                              : p === "medium"
                                ? colors.taskMedium
                                : colors.taskLow) + "20"
                          : colors.surface,
                      borderColor:
                        newTaskPriority === p
                          ? p === "high"
                            ? colors.taskHigh
                            : p === "medium"
                              ? colors.taskMedium
                              : colors.taskLow
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          newTaskPriority === p
                            ? p === "high"
                              ? colors.taskHigh
                              : p === "medium"
                                ? colors.taskMedium
                                : colors.taskLow
                            : colors.textSecondary,
                        fontFamily:
                          newTaskPriority === p
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                      },
                    ]}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[styles.modalSection, { color: colors.textSecondary }]}
            >
              Status
            </Text>
            <View style={styles.optionRow}>
              {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setNewTaskStatus(s)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor:
                        newTaskStatus === s
                          ? colors.tint + "20"
                          : colors.surface,
                      borderColor:
                        newTaskStatus === s ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          newTaskStatus === s
                            ? colors.tint
                            : colors.textSecondary,
                        fontFamily:
                          newTaskStatus === s
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                      },
                    ]}
                  >
                    {STATUS_CONFIG[s].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[styles.modalSection, { color: colors.textSecondary }]}
            >
              Project
            </Text>
            <View style={styles.optionRow}>
              {projects.map((proj) => (
                <Pressable
                  key={proj.id}
                  onPress={() => setNewTaskProject(proj.id)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor:
                        newTaskProject === proj.id
                          ? proj.color + "20"
                          : colors.surface,
                      borderColor:
                        newTaskProject === proj.id ? proj.color : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.optionEmoji}>{proj.emoji}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          newTaskProject === proj.id
                            ? proj.color
                            : colors.textSecondary,
                        fontFamily:
                          newTaskProject === proj.id
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                      },
                    ]}
                  >
                    {proj.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Project Modal */}
      <Modal
        visible={showAddProject}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowAddProject(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={() => setShowAddProject(false)}>
              <Text
                style={[styles.modalCancel, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Project
            </Text>
            <Pressable onPress={handleAddProject}>
              <Text
                style={[
                  styles.modalSave,
                  {
                    color: newProjName.trim() ? colors.tint : colors.border,
                  },
                ]}
              >
                Add
              </Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <TextInput
              style={[
                styles.modalInput,
                styles.modalInputLarge,
                { color: colors.text, borderBottomColor: colors.border },
              ]}
              placeholder="Project name"
              placeholderTextColor={colors.textSecondary}
              value={newProjName}
              onChangeText={setNewProjName}
              autoFocus
            />

            <Text
              style={[styles.modalSection, { color: colors.textSecondary }]}
            >
              Emoji
            </Text>
            <View style={styles.emojiRow}>
              {PROJECT_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setNewProjEmoji(e)}
                  style={[
                    styles.emojiBtn,
                    {
                      backgroundColor:
                        newProjEmoji === e
                          ? colors.tint + "20"
                          : colors.surface,
                      borderColor:
                        newProjEmoji === e ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[styles.modalSection, { color: colors.textSecondary }]}
            >
              Color
            </Text>
            <View style={styles.colorRow}>
              {PROJECT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewProjColor(c)}
                  style={[
                    styles.colorBtn,
                    { backgroundColor: c },
                    newProjColor === c && styles.colorBtnSelected,
                  ]}
                >
                  {newProjColor === c && (
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
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: "center" },
  statCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  projectsScroll: { maxHeight: 52 },
  statusScroll: { maxHeight: 44 },
  projectsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  projectChipEmoji: { fontSize: 12 },
  projectChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  taskList: { paddingHorizontal: 12, paddingTop: 8 },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    gap: 10,
  },
  taskCheck: { padding: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: { flex: 1 },
  taskTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 2,
  },
  projectBadgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  separator: { fontSize: 11 },
  dueDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
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
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalCancel: { fontSize: 16, fontFamily: "Inter_400Regular" },
  modalSave: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modalBody: { flex: 1, paddingHorizontal: 16 },
  modalInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  modalInputLarge: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  modalSection: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionEmoji: { fontSize: 14 },
  optionText: { fontSize: 13 },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 22 },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
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
