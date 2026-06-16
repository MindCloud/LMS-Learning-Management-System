// src/pages/Home.jsx
// Redesigned: Modern aesthetic, tabbed layout, gamification widgets (Pomodoro & Notepad), interactive performance chart

import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  documentId,
  limit,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import TeacherModal from "../components/TeacherModal.jsx";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  User,
  School,
  Cake,
  Phone,
  MapPin,
  Users,
  Megaphone,
  NotebookPen,
  BookOpen,
  Bell,
  Mail,
  X,
  Link as LinkIcon,
  LogOut,
  ExternalLink,
  Bot,
  Award,
  ChevronRight,
  Calendar,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  ChevronDown,
  Check,
  BookOpenText,
  Edit3,
} from "lucide-react";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const subjectHue = (s = "") => {
  const t = s.toLowerCase();
  if (t.includes("math")) return "indigo";
  if (t.includes("science") || t.includes("biology") || t.includes("physics"))
    return "emerald";
  if (t.includes("english")) return "violet";
  if (t.includes("history")) return "amber";
  if (t.includes("ict") || t.includes("it") || t.includes("computer"))
    return "cyan";
  if (t.includes("music")) return "rose";
  return "sky";
};

const badgeByHue = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
};

const getPerformanceBadge = (score) => {
  if (score >= 90) return "bg-emerald-100 text-emerald-800 ring-emerald-300";
  if (score >= 75) return "bg-blue-100 text-blue-800 ring-blue-300";
  if (score >= 60) return "bg-amber-100 text-amber-800 ring-amber-300";
  return "bg-red-100 text-red-800 ring-red-300";
};

const getPerformanceLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Average";
  return "Needs Improvement";
};

const quotes = [
  "The expert in anything was once a beginner. Keep learning! 🌟",
  "Believe you can and you're halfway there. 💪",
  "Education is the most powerful weapon which you can use to change the world. 🌍",
  "Success is the sum of small efforts, repeated day in and day out. 🎯",
  "Your focus determines your reality. Stay focused! 🚀",
  "Mistakes are proof that you are trying. Don't give up! 🌱",
  "The beautiful thing about learning is that no one can take it away from you. 📚",
];

function Home() {
  const [profile, setProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [notices, setNotices] = useState({});
  const [homework, setHomework] = useState({});
  const [materials, setMaterials] = useState({});
  const [marks, setMarks] = useState([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "teachers", "grades", "ai-chat"

  // Widget States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quote, setQuote] = useState("");
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem("student_notes") || "";
  });

  // Pomodoro Focus Timer
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState("focus"); // "focus", "short", "long"
  const [pomodoroTotal, setPomodoroTotal] = useState(25 * 60);

  // AI Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [marksModalOpen, setMarksModalOpen] = useState(false);

  // Per-Teacher Active Category inside My Teachers
  // maps teacherId -> "materials" | "homework" | "notices"
  const [teacherInnerTabs, setTeacherInnerTabs] = useState({});

  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  // Live Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quotes rotation
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIdx]);
  }, []);

  const refreshQuote = () => {
    const randomIdx = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIdx]);
    toast.success("Quote refreshed! Keep inspired.");
  };

  // Notes update
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    localStorage.setItem("student_notes", e.target.value);
  };

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [editForm, setEditForm] = useState({
    contactNumber: "",
    birthday: "",
    guardianName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    studentImage: "",
  });

  const startEditing = () => {
    setEditForm({
      contactNumber: profile.contactNumber || "",
      birthday: profile.birthday || "",
      guardianName: profile.guardianName || "",
      email: auth.currentUser?.email || profile.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      studentImage: profile.studentImage || "",
    });
    setChangePassword(false);
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    // Basic verification
    const emailChanged = editForm.email !== (auth.currentUser?.email || profile.email || "");
    const passwordChanged = changePassword && editForm.newPassword.length > 0;

    if (emailChanged || passwordChanged) {
      if (!editForm.currentPassword) {
        toast.error("Current password is required to update email or password.");
        return;
      }
      if (passwordChanged) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          toast.error("New password and confirmation password do not match.");
          return;
        }
        if (editForm.newPassword.length < 6) {
          toast.error("New password must be at least 6 characters.");
          return;
        }
      }
    }

    toast.loading("Saving changes...", { id: "saving-profile" });
    try {
      const user = auth.currentUser;

      // If email or password is being changed, re-authenticate first
      if (emailChanged || passwordChanged) {
        const credential = EmailAuthProvider.credential(user.email, editForm.currentPassword);
        await reauthenticateWithCredential(user, credential);

        if (emailChanged) {
          await updateEmail(user, editForm.email);
        }
        if (passwordChanged) {
          await updatePassword(user, editForm.newPassword);
        }
      }

      // Update Firestore document
      const studentDocRef = doc(db, "students", user.uid);
      const updates = {
        contactNumber: editForm.contactNumber,
        birthday: editForm.birthday,
        guardianName: editForm.guardianName,
        studentImage: editForm.studentImage,
      };

      if (profile.email !== undefined || emailChanged) {
        updates.email = editForm.email;
      }

      await updateDoc(studentDocRef, updates);

      setProfile((prev) => ({
        ...prev,
        ...updates,
      }));
      setIsEditingProfile(false);
      toast.dismiss("saving-profile");
      toast.success("Profile updated successfully!");
    } catch (e) {
      console.error("Failed to update profile:", e);
      toast.dismiss("saving-profile");

      let errMsg = "Failed to update profile. Please try again.";
      if (e.code === "auth/wrong-password") {
        errMsg = "Incorrect current password.";
      } else if (e.code === "auth/invalid-email") {
        errMsg = "Invalid email format.";
      } else if (e.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use by another account.";
      } else if (e.message) {
        errMsg = e.message;
      }
      toast.error(errMsg);
    }
  };

  // Synthesize Alarm audio via Web Audio API (no external file dependencies)
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      osc.start();

      // Second note chime
      setTimeout(() => {
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note
      }, 250);

      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 600);
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  };

  // Pomodoro Focus Timer effect
  useEffect(() => {
    let timer = null;
    if (pomodoroActive && pomodoroTime > 0) {
      timer = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroActive && pomodoroTime === 0) {
      setPomodoroActive(false);
      playAlarm();
      if (pomodoroMode === "focus") {
        toast.success("Focus session complete! Time for a short break. ☕");
        changePomodoroMode("short");
      } else {
        toast.success("Break finished! Let's resume studying. 💪");
        changePomodoroMode("focus");
      }
    }
    return () => clearInterval(timer);
  }, [pomodoroActive, pomodoroTime, pomodoroMode]);

  const changePomodoroMode = (mode) => {
    setPomodoroActive(false);
    setPomodoroMode(mode);
    let duration = 25 * 60;
    if (mode === "short") duration = 5 * 60;
    if (mode === "long") duration = 15 * 60;
    setPomodoroTime(duration);
    setPomodoroTotal(duration);
  };

  const togglePomodoro = () => {
    setPomodoroActive(!pomodoroActive);
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    let duration = 25 * 60;
    if (pomodoroMode === "short") duration = 5 * 60;
    if (pomodoroMode === "long") duration = 15 * 60;
    setPomodoroTime(duration);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen, activeTab]);

  const openModal = useCallback((t) => {
    setSelectedTeacher(t);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
    document.body.style.overflow = "";
  }, []);

  const openAllMarksModal = () => {
    setMarksModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeMarksModal = () => {
    setMarksModalOpen(false);
    document.body.style.overflow = "";
  };

  const sendMessage = async (presetText = null) => {
    const userMessage = presetText || userInput.trim();
    if (!userMessage) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    if (!presetText) setUserInput("");

    toast.loading("AI Tutor is thinking...", { id: "ai-thinking" });

    try {
      const subjects = teachers
        .map((t) => t.subjects || t.courseName)
        .filter(Boolean)
        .join(", ");

      const systemPrompt = `You are a helpful, friendly, and knowledgeable study assistant.
The student is studying: ${subjects || "various subjects"}.
Keep responses short, clear, accurate, and educational. Use bullet points or numbered lists when helpful.`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: { parts: [{ text: systemPrompt }] },
      });

      const historyForAPI = chatMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const chatSession = model.startChat({
        history: historyForAPI,
      });

      const result = await chatSession.sendMessage(userMessage);
      const reply = result.response.text();

      toast.dismiss("ai-thinking");
      toast.success("Answer received!");

      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      console.error("AI Chat error:", err);
      toast.dismiss("ai-thinking");
      toast.error("Failed to connect. Try again.");

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't connect to my knowledge base right now. Please try again in a few moments.",
        },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      toast.error("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        closeModal();
        closeMarksModal();
      }
    };
    if (isModalOpen || marksModalOpen)
      window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, marksModalOpen]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const studentSnap = await getDoc(doc(db, "students", user.uid));
        if (!studentSnap.exists()) {
          toast.error("No student profile found.");
          return;
        }

        const studentData = studentSnap.data();
        if (isMounted) {
          setProfile(studentData);
          setMarks(studentData.marks || []);
        }

        const gradeVal = studentData.grade || "";
        const courseVal = studentData.course || "";
        let studentGrade = "";

        if (courseVal === "al-ict" || gradeVal === "al-ict" || gradeVal === "A/L") {
          studentGrade = "A/L";
        } else if (courseVal === "ol-ict" || gradeVal === "ol-ict" || gradeVal === "O/L") {
          studentGrade = "O/L";
        } else if (courseVal === "other" || gradeVal === "other" || gradeVal === "Other") {
          studentGrade = "Other";
        } else if (gradeVal) {
          const gradeStr = gradeVal.toString();
          studentGrade = gradeStr.startsWith("Grade ") ? gradeStr : `Grade ${gradeStr}`;
        }

        const isPending =
          (studentData.status || "").toLowerCase() === "pending";

        const rawTeachers = Array.isArray(studentData.preferredTeachers)
          ? studentData.preferredTeachers
          : [];
        const preferredTeacherIds = rawTeachers
          .map((t) => (typeof t === "string" ? t : t?.preferredTeacherId))
          .filter(Boolean);

        const marksTeacherIds = (studentData.marks || [])
          .map((m) => m.teacherId)
          .filter(Boolean);

        const teacherIds = Array.from(
          new Set([...preferredTeacherIds, ...marksTeacherIds])
        );

        if (teacherIds.length === 0) {
          if (isMounted) setTeachers([]);
          return;
        }

        let fetchedTeachers = [];
        const chunks = [];
        for (let i = 0; i < teacherIds.length; i += 10) {
          chunks.push(teacherIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (ids) => {
            const q = query(
              collection(db, "teachers"),
              where(documentId(), "in", ids)
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );
        fetchedTeachers = results.flat();

        if (isMounted) {
          setTeachers(fetchedTeachers);
          // Initialize local inner tab state for each teacher
          const initialInnerTabs = {};
          fetchedTeachers.forEach((t) => {
            initialInnerTabs[t.id] = "homework";
          });
          setTeacherInnerTabs(initialInnerTabs);
          toast.success(`Welcome back! Loaded profile & teachers.`);
        }

        if (!isPending) {
          const fetchAndFilter = async (colName, setter, teacherId) => {
            try {
              const q = query(
                collection(db, colName),
                where("teacherId", "==", teacherId),
                limit(50)
              );
              const snap = await getDocs(q);
              if (!isMounted) return;

              let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              list.sort(
                (a, b) =>
                  (b.createdAt?.toMillis?.() ?? 0) -
                  (a.createdAt?.toMillis?.() ?? 0)
              );

              // Filter list according to student's registered target audience
              const filteredList = list.filter((item) => {
                if (!item.grades || !Array.isArray(item.grades) || item.grades.length === 0 || item.grades.includes("All Grades")) {
                  return true;
                }
                return item.grades.includes(studentGrade);
              });

              setter((prev) => ({ ...prev, [teacherId]: filteredList }));
            } catch (e) {
              console.error(`Failed to load ${colName}:`, e);
              setter((prev) => ({ ...prev, [teacherId]: [] }));
            }
          };

          await Promise.all(
            fetchedTeachers.map((t) =>
              Promise.all([
                fetchAndFilter("homework", setHomework, t.id),
                fetchAndFilter("materials", setMaterials, t.id),
                fetchAndFilter("notices", setNotices, t.id),
              ])
            )
          );
        } else {
          setHomework({});
          setMaterials({});
          setNotices({});
        }
      } catch (err) {
        console.error("Error loading student dashboard:", err);
        toast.error("Failed to load dashboard data.");
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigate]);

  // Calculations for Widgets
  const totalHomework = Object.values(homework).flat().length;
  const totalMaterials = Object.values(materials).flat().length;
  const totalNotices = Object.values(notices).flat().length;

  const averageGrade =
    marks.length > 0
      ? Math.round(marks.reduce((acc, m) => acc + m.score, 0) / marks.length)
      : 0;

  const getGPAColor = (avg) => {
    if (avg >= 90) return "text-emerald-500 stroke-emerald-500";
    if (avg >= 75) return "text-blue-500 stroke-blue-500";
    if (avg >= 60) return "text-amber-500 stroke-amber-500";
    return "text-red-500 stroke-red-500";
  };

  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr >= 5 && hr < 12) return "Good morning 🌅";
    if (hr >= 12 && hr < 17) return "Good afternoon ⚡";
    return "Good evening 🌙";
  };

  const getGreetingEmoji = () => {
    const hr = currentTime.getHours();
    if (hr >= 5 && hr < 12) return "☀️";
    if (hr >= 12 && hr < 17) return "🔥";
    return "✨";
  };

  if (!profile)
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-60 animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-violet-100 blur-3xl opacity-60 animate-pulse" />
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <Bot className="w-8 h-8 text-blue-600 absolute top-4 left-4 animate-bounce" />
          </div>
          <p className="text-slate-600 font-semibold tracking-wide text-lg">
            Setting up your study space...
          </p>
        </div>
      </div>
    );

  const isPending = (profile.status || "").toLowerCase() === "pending";

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Background Animated Blobs for Atmosphere */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-200/40 blur-[120px] animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-rose-100/40 blur-[120px] animate-float-medium" />
      <div className="pointer-events-none absolute top-[40%] right-[10%] h-[40%] w-[40%] rounded-full bg-sky-200/30 blur-[120px] animate-float-fast" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/75 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                Ezone LMS
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">
                Student Hub
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: "overview", label: "Dashboard", icon: School },
              { id: "teachers", label: "My Teachers", icon: Users },
              { id: "grades", label: "Grades & Progress", icon: Award },
              { id: "ai-chat", label: "AI Tutor", icon: Bot },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "ai-chat") setChatOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                    }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/ask")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white ring-1 ring-slate-200 rounded-full hover:bg-slate-50 transition shadow-sm"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              <span>Ask Teacher</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-medium transition shadow-md shadow-slate-950/10"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8 z-10">
        <AnimatePresence mode="wait">
          {/* Tab contents wrapper */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* OVERVIEW / DASHBOARD TAB */}
            {activeTab === "overview" && (
              <div className="grid gap-8">
                {/* Dynamic greeting banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-8 py-8 text-white shadow-xl shadow-indigo-950/20">
                  <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                        <span>
                          {currentTime.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-blue-200">
                          {currentTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">
                        {getGreeting()}, {profile.fullName.split(" ")[0]}! {getGreetingEmoji()}
                      </h2>
                      <p className="text-slate-300 text-sm max-w-xl italic leading-relaxed">
                        "{quote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={refreshQuote}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition"
                        title="New quote"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <img
                        src={profile.studentImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                        alt="Profile avatar"
                        className="h-16 w-16 rounded-2xl border-2 border-blue-500 object-cover shadow-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Assigned Teachers",
                      value: teachers.length,
                      icon: Users,
                      color: "from-violet-500 to-purple-600",
                      lightColor: "bg-purple-50 text-purple-700 ring-purple-100",
                      action: () => setActiveTab("teachers"),
                    },
                    {
                      label: "Pending Homework",
                      value: totalHomework,
                      icon: NotebookPen,
                      color: "from-sky-500 to-blue-600",
                      lightColor: "bg-sky-50 text-sky-700 ring-sky-100",
                      action: () => setActiveTab("teachers"),
                    },
                    {
                      label: "Shared Materials",
                      value: totalMaterials,
                      icon: BookOpen,
                      color: "from-emerald-500 to-teal-600",
                      lightColor: "bg-emerald-50 text-emerald-700 ring-emerald-100",
                      action: () => setActiveTab("teachers"),
                    },
                    {
                      label: "Average Grade",
                      value: `${averageGrade}%`,
                      icon: Award,
                      color: "from-amber-500 to-orange-600",
                      lightColor: "bg-amber-50 text-amber-700 ring-amber-100",
                      action: () => setActiveTab("grades"),
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <button
                        key={i}
                        onClick={stat.action}
                        className="group flex flex-col justify-between p-5 text-left bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
                      >
                        <div className={`p-2.5 rounded-xl w-fit ${stat.lightColor} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {stat.value}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {stat.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dashboard Tools Grid (Pomodoro, Notepad, Announcements) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Column 1: Pomodoro Timer */}
                  <div className="lg:col-span-1 flex flex-col bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-500 animate-pulse" />
                        Pomodoro Timer
                      </h3>
                      <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                        {[
                          { id: "focus", label: "Focus" },
                          { id: "short", label: "Short" },
                          { id: "long", label: "Long" },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => changePomodoroMode(btn.id)}
                            className={`px-2 py-1 rounded-md transition ${pomodoroMode === btn.id
                              ? "bg-white text-red-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                              }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      {/* SVG Visual Timer Circle */}
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          {/* Track */}
                          <circle
                            cx="88"
                            cy="88"
                            r="80"
                            className="stroke-slate-100"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          {/* Value */}
                          <circle
                            cx="88"
                            cy="88"
                            r="80"
                            className="stroke-red-500 transition-all duration-1000"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 80}
                            strokeDashoffset={
                              2 * Math.PI * 80 * (1 - pomodoroTime / pomodoroTotal)
                            }
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="text-center z-10">
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {String(Math.floor(pomodoroTime / 60)).padStart(2, "0")}
                            :
                            {String(pomodoroTime % 60).padStart(2, "0")}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {pomodoroActive ? "Time to focus!" : "Paused"}
                          </p>
                        </div>
                      </div>

                      {/* Timer Controls */}
                      <div className="flex items-center gap-4 mt-8">
                        <button
                          onClick={resetPomodoro}
                          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="Reset Timer"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
                        <button
                          onClick={togglePomodoro}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-md transition transform hover:scale-105 active:scale-95 ${pomodoroActive
                            ? "bg-slate-800 shadow-slate-900/10"
                            : "bg-red-500 shadow-red-500/20"
                            }`}
                        >
                          {pomodoroActive ? (
                            <>
                              <Pause className="h-5 w-5 fill-white" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5 fill-white" />
                              <span>Start</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Personal Study Notes */}
                  <div className="lg:col-span-1 flex flex-col bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Quick Notepad
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Auto-saves
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Jot down formulas, reminders, or questions to ask your teachers.
                    </p>
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder="Write your study notes here..."
                      className="flex-1 w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none min-h-[180px] custom-scrollbar text-slate-700"
                    />
                  </div>

                  {/* Column 3: Profile Info Card */}
                  <div className="lg:col-span-1 flex flex-col bg-white border border-slate-200 rounded-3xl p-6 shadow-sm justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-500" />
                          Student Profile
                        </h3>
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                          {profile.status || "Approved"}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm text-slate-600 mt-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Class/Course</span>
                          <span className="font-semibold text-slate-800">{profile.course || profile.grade || "General"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Student ID</span>
                          <span className="font-semibold text-slate-800">{profile.studentId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Birthday</span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              placeholder="YYYY-MM-DD"
                              value={editForm.birthday}
                              onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{profile.birthday || "—"}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Emergency Contact</span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editForm.contactNumber}
                              onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{profile.contactNumber || "—"}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Guardian</span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editForm.guardianName}
                              onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{profile.guardianName || "—"}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Email</span>
                          {isEditingProfile ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={auth.currentUser?.email || profile.email}>
                              {auth.currentUser?.email || profile.email || "—"}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="font-medium text-slate-400">Profile Image URL</span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              placeholder="https://example.com/image.png"
                              value={editForm.studentImage}
                              onChange={(e) => setEditForm({ ...editForm, studentImage: e.target.value })}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={profile.studentImage || "Not set"}>
                              {profile.studentImage ? "Custom URL Link" : "Default Image"}
                            </span>
                          )}
                        </div>

                        {isEditingProfile && (
                          <div className="py-2 border-b border-slate-100 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={changePassword}
                                onChange={(e) => setChangePassword(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-400"
                              />
                              Change Password?
                            </label>

                            {(changePassword || editForm.email !== (auth.currentUser?.email || profile.email || "")) && (
                              <div className="space-y-2 pt-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-slate-400">Current Password *</span>
                                  <input
                                    type="password"
                                    placeholder="Required to save"
                                    value={editForm.currentPassword}
                                    onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                  />
                                </div>
                                {changePassword && (
                                  <>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-slate-400">New Password *</span>
                                      <input
                                        type="password"
                                        placeholder="Min 6 chars"
                                        value={editForm.newPassword}
                                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-slate-400">Confirm Password *</span>
                                      <input
                                        type="password"
                                        placeholder="Re-type new password"
                                        value={editForm.confirmPassword}
                                        onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs w-36 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {!isEditingProfile && (
                          <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-slate-400">Password</span>
                            <span className="font-semibold text-slate-800">••••••••</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                        {isEditingProfile ? (
                          <>
                            <button
                              onClick={() => setIsEditingProfile(false)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveProfile}
                              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={startEditing}
                            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3 text-slate-500" />
                            <span>Edit Details</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate" title={profile.address}>{profile.address || "Address not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MY TEACHERS TAB */}
            {activeTab === "teachers" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Study Materials & Instructors</h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Check specific teacher posts, downloaded resources, and homework instructions.
                    </p>
                  </div>
                </div>

                {teachers.length === 0 ? (
                  <div className="rounded-3xl border border-dashed bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border shadow-sm">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">
                      No Assigned Teachers
                    </h3>
                    <p className="mt-2 text-slate-600 text-sm max-w-sm mx-auto">
                      Once administrators link teachers to your profile or record scores, they will show up here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-8">
                    {teachers.map((teacher) => {
                      const teacherId = teacher.id;
                      const teacherMarks = marks.filter(
                        (mark) => mark.teacherId === teacherId
                      );

                      const highestMark =
                        teacherMarks.length > 0
                          ? teacherMarks.reduce((max, mark) =>
                            mark.score > max.score ? mark : max
                          )
                          : null;

                      const hue = subjectHue(
                        teacher.subjects || teacher.courseName || ""
                      );
                      const badge = badgeByHue[hue] || badgeByHue.sky;
                      const currentInnerTab = teacherInnerTabs[teacherId] || "homework";

                      return (
                        <div
                          key={teacherId}
                          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-3 hover:shadow-md transition-shadow"
                        >
                          {/* Left Column: Teacher profile info */}
                          <div className="p-6 md:p-8 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between col-span-1">
                            <div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => openModal(teacher)}
                                  className="group relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-blue-500 shadow-sm ring-offset-2 transition hover:scale-105"
                                  title="Click to view bio/details"
                                >
                                  <img
                                    src={teacher.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200"}
                                    alt={teacher.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                                <div>
                                  <h4 className="font-bold text-slate-900 leading-tight">
                                    {teacher.fullName}
                                  </h4>
                                  <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${badge}`}>
                                    {teacher.subjects || teacher.courseName || "Instructor"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-6 space-y-3 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{teacher.email}</span>
                                </div>
                                {teacher.contact && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    <span>{teacher.contact}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Best Subject Mark
                              </p>
                              {highestMark ? (
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-3xl font-black text-blue-600">
                                    {highestMark.score}
                                    <span className="text-xs text-slate-400 font-normal">/100</span>
                                  </span>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ring-1 ${getPerformanceBadge(highestMark.score)}`}>
                                    {getPerformanceLabel(highestMark.score)}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic mt-1.5">
                                  No marks submitted yet
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Teacher contents with switchable categories */}
                          <div className="p-6 md:p-8 col-span-2 flex flex-col justify-between">
                            <div>
                              {/* Inner Tabs for category */}
                              <div className="flex border-b border-slate-100 pb-3 mb-6">
                                {[
                                  { id: "homework", label: "Homework", icon: NotebookPen, count: homework[teacherId]?.length || 0 },
                                  { id: "materials", label: "Materials", icon: BookOpen, count: materials[teacherId]?.length || 0 },
                                  { id: "notices", label: "Notices", icon: Bell, count: notices[teacherId]?.length || 0 },
                                ].map((cat) => {
                                  const CatIcon = cat.icon;
                                  const isCatActive = currentInnerTab === cat.id;
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={() =>
                                        setTeacherInnerTabs((prev) => ({
                                          ...prev,
                                          [teacherId]: cat.id,
                                        }))
                                      }
                                      className={`mr-4 flex items-center gap-1.5 pb-2 text-sm font-semibold relative transition ${isCatActive
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                      <CatIcon className="h-4 w-4" />
                                      <span>{cat.label}</span>
                                      {cat.count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${isCatActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                                          }`}>
                                          {cat.count}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Content Display */}
                              <div className="min-h-[160px]">
                                 {!(profile?.preferredTeachers || []).some(
                                   (pt) => pt.preferredTeacherId === teacherId && pt.status === "active"
                                 ) ? (
                                  <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <AlertCircle className="h-8 w-8 text-amber-500" />
                                    <h5 className="font-semibold text-slate-800 mt-2">Approval Pending</h5>
                                    <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                                      Documents are locked until teacher or admin confirms enrollment.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {/* Homework */}
                                    {currentInnerTab === "homework" && (
                                      <div className="space-y-3">
                                        {homework[teacherId]?.length > 0 ? (
                                          homework[teacherId].map((hw) => (
                                            <div
                                              key={hw.id}
                                              className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100/50 text-slate-700 hover:bg-sky-50 transition"
                                            >
                                              <p className="text-sm font-medium">{hw.task}</p>
                                              {hw.dueDate && (
                                                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                                                  <Calendar className="h-3 w-3" />
                                                  <span>Due: {formatDate(hw.dueDate)}</span>
                                                </div>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <EmptyState
                                            icon={<NotebookPen className="h-5 w-5 text-sky-600" />}
                                            label="No homework assigned"
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Materials */}
                                    {currentInnerTab === "materials" && (
                                      <div className="space-y-3">
                                        {materials[teacherId]?.length > 0 ? (
                                          materials[teacherId].map((mat) => (
                                            <a
                                              key={mat.id}
                                              href={mat.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition"
                                            >
                                              <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 rounded-lg bg-indigo-100/60 text-indigo-700">
                                                  <LinkIcon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="text-sm font-semibold truncate">{mat.title}</p>
                                                  <p className="text-[10px] text-slate-400 mt-0.5">Click to access file</p>
                                                </div>
                                              </div>
                                              <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            </a>
                                          ))
                                        ) : (
                                          <EmptyState
                                            icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
                                            label="No materials published"
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Notices */}
                                    {currentInnerTab === "notices" && (
                                      <div className="space-y-3">
                                        {notices[teacherId]?.length > 0 ? (
                                          notices[teacherId].map((notice) => (
                                            <div
                                              key={notice.id}
                                              className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-slate-700 hover:bg-amber-50 transition"
                                            >
                                              <p className="text-sm font-medium leading-relaxed">{notice.content}</p>
                                              {notice.createdAt && (
                                                <p className="text-[10px] text-slate-400 mt-2">
                                                  Posted {formatDate(notice.createdAt.toDate ? notice.createdAt.toDate() : notice.createdAt)}
                                                </p>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <EmptyState
                                            icon={<Megaphone className="h-5 w-5 text-amber-600" />}
                                            label="No notifications from teacher"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs">
                              <span className="text-slate-400">Questions? Use the AI Tutor tool or ask email directly.</span>
                              <button
                                onClick={() => openModal(teacher)}
                                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                              >
                                View Biography <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* GRADES & PROGRESS TAB */}
            {activeTab === "grades" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Academic Analytics & Grades</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Visual tracker representing your marks, GPA rating, and subject performance.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Overall GPA Radial Gauge */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="font-bold text-slate-800 mb-6 w-full text-left flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Academic Summary
                    </h3>

                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className="stroke-slate-100"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className={`transition-all duration-1000 ${getGPAColor(averageGrade)}`}
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 70}
                          strokeDashoffset={
                            2 * Math.PI * 70 * (1 - averageGrade / 100)
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">
                          {averageGrade}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          Average Grade
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <p className="font-bold text-slate-800 text-lg">
                        {averageGrade >= 90
                          ? "Academic Excellence! 🏆"
                          : averageGrade >= 75
                            ? "Great Standing! 🌟"
                            : averageGrade >= 60
                              ? "Steady Competency! 🌱"
                              : "Room to grow! 💪"}
                      </p>
                      <p className="text-xs text-slate-500 max-w-[220px]">
                        {averageGrade >= 75
                          ? "Your progress shows exemplary understanding. Keep this consistency!"
                          : "Review your study materials and homework regularly to build confidence."}
                      </p>
                    </div>
                  </div>

                  {/* SVG Bar Chart Comparing Subjects */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-500" />
                        Grade Comparison By Subject
                      </h3>
                      <p className="text-xs text-slate-400 mb-6">
                        Compares your highest score recorded for each distinct subject.
                      </p>

                      {marks.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                          <AlertCircle className="h-10 w-10 text-slate-300" />
                          <p className="text-sm text-slate-500 mt-2 font-medium">No assessment history found.</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* Subject Rows */}
                          {Array.from(new Set(marks.map((m) => m.subject))).map((subj, i) => {
                            const subjMarks = marks.filter((m) => m.subject === subj);
                            const topScore = Math.max(...subjMarks.map((m) => m.score));

                            // Visual color tag based on subject
                            const hue = subjectHue(subj);
                            const accentColors = {
                              indigo: "bg-indigo-500",
                              emerald: "bg-emerald-500",
                              violet: "bg-violet-500",
                              amber: "bg-amber-500",
                              cyan: "bg-cyan-500",
                              rose: "bg-rose-500",
                              sky: "bg-sky-500",
                            };
                            const colorClass = accentColors[hue] || accentColors.sky;

                            return (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                  <span className="text-slate-700">{subj}</span>
                                  <span className="text-slate-900">{topScore}/100</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${topScore}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className={`h-full rounded-full ${colorClass}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={openAllMarksModal}
                      disabled={marks.length === 0}
                      className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View All Assessment History</span>
                    </button>
                  </div>
                </div>

                {/* Grade History Quick Feed */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Recent Assessments
                  </h3>

                  {marks.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No records yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {[...marks]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map((mark, idx) => (
                          <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{mark.subject}</p>
                              <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(mark.date)}</span>
                                <span>•</span>
                                <span>
                                  Instructor:{" "}
                                  {teachers.find((t) => t.id === mark.teacherId)?.fullName ||
                                    "Administrator"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black text-slate-900">{mark.score}</span>
                              <span className="text-xs text-slate-400">/100</span>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${getPerformanceBadge(mark.score)}`}>
                                {getPerformanceLabel(mark.score)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FULL DEDICATED AI TUTOR WORKSPACE */}
            {activeTab === "ai-chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[580px]">
                {/* Left side panel: Suggestions & Guidelines */}
                <div className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-slate-800">AI Tutor Tips</h3>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your AI Study Assistant uses Gemini technology to answer complex questions, write schedules, or explain school topics.
                    </p>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Quick Questions
                      </p>
                      {[
                        "How can I organize a study routine?",
                        "Summarize basic scientific steps",
                        "Tell me a clever math shortcut",
                        "How should I take notes efficiently?",
                      ].map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(promptText)}
                          className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition text-xs font-medium text-slate-700 leading-normal"
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                    Powered by Gemini 2.5 • Responses are synthesized instantly.
                  </div>
                </div>

                {/* Right side panel: Conversation box */}
                <div className="col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[580px]">
                  {/* Chat header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Interactive AI Companion</h4>
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online • Readily Available
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setChatMessages([])}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Clear History
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/20">
                    {/* Welcome Box */}
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4.5 w-4.5" />
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 text-xs leading-relaxed text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-800 mb-1">Hi there! 👋</p>
                        <p>
                          I'm your study assistant. Need definitions, homework guidance, or revision plans? Simply type below or select a tip card on the left!
                        </p>
                      </div>
                    </div>

                    {chatMessages.map((msg, i) => {
                      const isBot = msg.sender !== "user";
                      return (
                        <div
                          key={i}
                          className={`flex gap-3 max-w-[85%] ${isBot ? "self-start" : "self-end flex-row-reverse ml-auto"
                            }`}
                        >
                          {isBot ? (
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4.5 w-4.5" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                              <User className="h-4.5 w-4.5" />
                            </div>
                          )}
                          <div
                            className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm border ${isBot
                              ? "bg-white border-slate-200/80 text-slate-700"
                              : "bg-indigo-600 border-indigo-700 text-white"
                              }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Ask your AI tutor a question..."
                        className="flex-1 bg-slate-50 border border-slate-150 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!userInput.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-600/10 transition"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Chat Assistant (Only displayed when activeTab is not ai-chat, for accessibility) */}
      {activeTab !== "ai-chat" && (
        <>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:scale-105 transition-transform focus:outline-none"
            aria-label="Toggle AI Tutor"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white"></span>
          </button>

          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-5 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">AI Study Assistant</p>
                      <p className="text-[10px] opacity-80 font-medium">Ready to help you revise</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition text-white"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto p-5 custom-scrollbar bg-slate-50/10">
                  <div className="self-start rounded-2xl bg-slate-100 px-4 py-2.5 text-xs text-slate-700 max-w-[85%] leading-relaxed">
                    Hello! I'm your AI study bot. Ask me a quick question about school topics or schedules!
                  </div>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${msg.sender === "user"
                        ? "self-end bg-blue-600 text-white ml-auto"
                        : "self-start bg-slate-100 text-slate-700"
                        }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your question..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!userInput.trim()}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Teacher Modal */}
      {isModalOpen && selectedTeacher && (
        <TeacherModal teacher={selectedTeacher} onClose={closeModal} />
      )}

      {/* Global All Marks Modal (shows marks from ALL teachers) */}
      {marksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-150">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-blue-900 px-8 py-6 text-white">
              <div>
                <h3 className="text-xl font-bold">Academic Assessment History</h3>
                <p className="mt-1 text-xs opacity-80 font-medium">
                  {profile.fullName} • Grade {profile.grade || profile.course || "Enrollment"}
                </p>
              </div>
              <button
                onClick={closeMarksModal}
                className="rounded-xl p-2.5 hover:bg-white/10 transition text-white"
              >
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {marks.length > 0 ? (
                <>
                  {/* Desktop Table - Hidden on Mobile */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-4 pr-8">Subject</th>
                          <th className="pb-4 pr-8 text-center">Score</th>
                          <th className="pb-4 pr-8 text-center">Performance</th>
                          <th className="pb-4">Date</th>
                          <th className="pb-4">Teacher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...marks]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((mark, index) => (
                            <tr
                              key={index}
                              className="hover:bg-slate-50/60 transition"
                            >
                              <td className="py-4 pr-8 font-bold text-slate-900 text-sm">
                                {mark.subject}
                              </td>
                              <td className="py-4 pr-8 text-center">
                                <span className="text-lg font-black text-slate-800">
                                  {mark.score}
                                </span>
                                <span className="ml-1 text-xs text-slate-400">
                                  /100
                                </span>
                              </td>
                              <td className="py-4 pr-8 text-center">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getPerformanceBadge(
                                    mark.score
                                  )}`}
                                >
                                  {getPerformanceLabel(mark.score)}
                                </span>
                              </td>
                              <td className="py-4 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  {formatDate(mark.date)}
                                </span>
                              </td>
                              <td className="py-4 text-xs text-slate-600 font-medium">
                                {teachers.find((t) => t.id === mark.teacherId)
                                  ?.fullName ||
                                  "Administrator"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards - Hidden on Desktop */}
                  <div className="grid gap-4 md:hidden">
                    {[...marks]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((mark, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-150 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-950 text-sm">
                              {mark.subject}
                            </h4>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${getPerformanceBadge(
                                mark.score
                              )}`}
                            >
                              {getPerformanceLabel(mark.score)}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-black text-slate-900">
                              {mark.score}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              / 100
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(mark.date)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {teachers.find((t) => t.id === mark.teacherId)
                                ?.fullName || "Instructor"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <Award className="mx-auto h-16 w-16 text-slate-300" />
                  <h4 className="mt-4 text-lg font-bold text-slate-700">
                    No Marks Recorded
                  </h4>
                  <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
                    Your assessment reports will show here once teachers issue ratings and record feedback.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, text, clamp = false }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-sm ${clamp ? "truncate" : ""}`}>
        {text || "—"}
      </span>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center text-slate-600">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border shadow-sm">
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

export default Home;
