import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  projectId: string;
  dueDate?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  description?: string;
  color: string;
  allDay: boolean;
}

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  label?: string;
}

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  events: CalendarEvent[];
  emails: Email[];
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  markEmailRead: (id: string) => void;
  toggleEmailStar: (id: string) => void;
  deleteEmail: (id: string) => void;
  sendEmail: (to: string, subject: string, body: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const PROJECTS_KEY = "@projects";
const TASKS_KEY = "@tasks";
const EVENTS_KEY = "@events";
const EMAILS_KEY = "@emails";

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

const PROJECT_COLORS = [
  "#6C63FF", "#F59E0B", "#10B981", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Work",
    color: "#6C63FF",
    emoji: "💼",
    description: "Professional tasks and deadlines",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Personal",
    color: "#10B981",
    emoji: "🏡",
    description: "Personal goals and errands",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Health",
    color: "#EF4444",
    emoji: "❤️",
    description: "Fitness and wellbeing",
    createdAt: new Date().toISOString(),
  },
];

const SEED_TASKS: Task[] = [
  {
    id: "t1",
    title: "Q2 Report Review",
    description: "Review and finalize the Q2 financial report",
    priority: "high",
    status: "in_progress",
    projectId: "p1",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    title: "Team Standup Notes",
    description: "Compile team standup meeting notes",
    priority: "medium",
    status: "todo",
    projectId: "p1",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "t3",
    title: "Grocery Shopping",
    description: "Weekly grocery run",
    priority: "low",
    status: "todo",
    projectId: "p2",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "t4",
    title: "Morning Workout",
    description: "30 min cardio + strength",
    priority: "medium",
    status: "done",
    projectId: "p3",
    createdAt: new Date().toISOString(),
  },
];

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "Team Meeting",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    endTime: "11:00",
    description: "Weekly all-hands meeting",
    color: "#6C63FF",
    allDay: false,
  },
  {
    id: "e2",
    title: "Lunch with Sarah",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "12:30",
    endTime: "13:30",
    description: "Catch up over lunch",
    color: "#10B981",
    allDay: false,
  },
  {
    id: "e3",
    title: "Product Demo",
    date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    time: "14:00",
    endTime: "15:00",
    description: "Present new features to stakeholders",
    color: "#F59E0B",
    allDay: false,
  },
  {
    id: "e4",
    title: "Company Holiday",
    date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    color: "#EF4444",
    allDay: true,
  },
];

const SEED_EMAILS: Email[] = [
  {
    id: "em1",
    from: "Alex Johnson",
    fromEmail: "alex.johnson@company.com",
    subject: "Q2 Strategy Update",
    preview: "Hi, I wanted to share the latest updates on our Q2 strategy...",
    body: "Hi,\n\nI wanted to share the latest updates on our Q2 strategy. The team has been making great progress on all fronts. I've attached the full report for your review.\n\nLet me know if you have any questions.\n\nBest,\nAlex",
    date: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    starred: true,
    label: "Work",
  },
  {
    id: "em2",
    from: "GitHub",
    fromEmail: "noreply@github.com",
    subject: "New pull request: Feature/dashboard-update",
    preview: "A new pull request has been opened in your repository...",
    body: "A new pull request has been opened in your repository.\n\nRepository: my-app\nPR: #247 Feature/dashboard-update\nOpened by: dev-contributor\n\nView the pull request on GitHub.",
    date: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    starred: false,
    label: "Dev",
  },
  {
    id: "em3",
    from: "Sarah Chen",
    fromEmail: "sarah.chen@studio.com",
    subject: "Re: Design System Proposal",
    preview: "Thanks for sending the proposal over! I've had a chance to review...",
    body: "Thanks for sending the proposal over! I've had a chance to review it with the team and we're all very excited about the direction.\n\nA few thoughts:\n1. The color palette looks great\n2. We'd like to explore more options for the typography\n3. Can we schedule a call to discuss?\n\nLooking forward to your thoughts!\n\nSarah",
    date: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    starred: false,
    label: "Design",
  },
  {
    id: "em4",
    from: "Stripe",
    fromEmail: "receipts@stripe.com",
    subject: "Payment received: $149.00",
    preview: "Your payment of $149.00 has been received for Professional Plan...",
    body: "Your payment of $149.00 has been received.\n\nPlan: Professional\nAmount: $149.00\nDate: Today\nNext billing: 30 days\n\nThank you for your business!",
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    starred: false,
    label: "Finance",
  },
  {
    id: "em5",
    from: "Mark Williams",
    fromEmail: "mark.w@partners.com",
    subject: "Partnership Opportunity",
    preview: "I hope this finds you well. I wanted to reach out about an exciting...",
    body: "I hope this finds you well. I wanted to reach out about an exciting partnership opportunity that could be mutually beneficial.\n\nOur company specializes in AI-driven solutions and we believe there's a strong synergy with your team's work.\n\nWould you be open to a brief call this week?\n\nBest regards,\nMark",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    read: false,
    starred: true,
    label: "Important",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, t, e, em] = await Promise.all([
          AsyncStorage.getItem(PROJECTS_KEY),
          AsyncStorage.getItem(TASKS_KEY),
          AsyncStorage.getItem(EVENTS_KEY),
          AsyncStorage.getItem(EMAILS_KEY),
        ]);
        setProjects(p ? JSON.parse(p) : SEED_PROJECTS);
        setTasks(t ? JSON.parse(t) : SEED_TASKS);
        setEvents(e ? JSON.parse(e) : SEED_EVENTS);
        setEmails(em ? JSON.parse(em) : SEED_EMAILS);
      } catch {
        setProjects(SEED_PROJECTS);
        setTasks(SEED_TASKS);
        setEvents(SEED_EVENTS);
        setEmails(SEED_EMAILS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
  }, [emails, loaded]);

  const addProject = useCallback(
    (project: Omit<Project, "id" | "createdAt">) => {
      const newProject: Project = {
        ...project,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProject]);
    },
    []
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
  }, []);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addEvent = useCallback((event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = { ...event, id: generateId() };
    setEvents((prev) => [...prev, newEvent]);
  }, []);

  const updateEvent = useCallback(
    (id: string, updates: Partial<CalendarEvent>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    []
  );

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const markEmailRead = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    );
  }, []);

  const toggleEmailStar = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  }, []);

  const deleteEmail = useCallback((id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const sendEmail = useCallback(
    (to: string, subject: string, body: string) => {
      const sentEmail: Email = {
        id: generateId(),
        from: "Me",
        fromEmail: "me@myemail.com",
        subject,
        preview: body.slice(0, 80),
        body,
        date: new Date().toISOString(),
        read: true,
        starred: false,
        label: "Sent",
      };
      setEmails((prev) => [sentEmail, ...prev]);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        projects,
        tasks,
        events,
        emails,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        markEmailRead,
        toggleEmailStar,
        deleteEmail,
        sendEmail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
