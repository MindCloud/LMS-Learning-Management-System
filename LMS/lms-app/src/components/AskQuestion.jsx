// src/components/AskQuestion.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  documentId,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  Send,
  User,
  GraduationCap,
  Filter,
  Loader2,
  MessageSquare,
  Reply,
  UserCircle2,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
  Search,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

export default function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredTeacherIds, setRegisteredTeacherIds] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch student data + registered teachers
  useEffect(() => {
    let isMounted = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) {
          toast.error("You must be logged in to ask questions.");
          navigate("/login");
        }
        return;
      }
      try {
        const snap = await getDoc(doc(db, "students", user.uid));
        if (!snap.exists()) {
          toast.error("Student profile not found.");
          if (isMounted) setAuthLoading(false);
          return;
        }

        if (isMounted) {
          const data = snap.data();
          setStudentData({
            name: data.fullName || "Unknown Student",
            image: data.studentImage || null,
          });

          const raw = Array.isArray(data.preferredTeachers)
            ? data.preferredTeachers
            : [];
          const ids = raw
            .map((t) => (typeof t === "string" ? t : t?.preferredTeacherId))
            .filter(Boolean);
          setRegisteredTeacherIds(ids);

          if (ids.length === 0) {
            toast.info("You haven't registered with any teachers yet.");
          }
          setAuthLoading(false);
        }
      } catch (err) {
        console.error("Failed to get student data:", err);
        toast.error("Failed to load your profile.");
        if (isMounted) setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigate]);

  // Fetch teachers by registered IDs
  useEffect(() => {
    const fetchTeachersByIds = async () => {
      if (registeredTeacherIds.length === 0) {
        setTeachers([]);
        return;
      }

      try {
        const chunks = [];
        for (let i = 0; i < registeredTeacherIds.length; i += 10) {
          chunks.push(registeredTeacherIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (batch) => {
            const qRef = query(
              collection(db, "teachers"),
              where(documentId(), "in", batch)
            );
            const snap = await getDocs(qRef);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );

        setTeachers(results.flat());
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
        toast.error("Failed to load teachers.");
      }
    };
    fetchTeachersByIds();
  }, [registeredTeacherIds]);

  // Fetch questions
  useEffect(() => {
    const run = async () => {
      if (!registeredTeacherIds || registeredTeacherIds.length === 0) {
        setQuestions([]);
        return;
      }

      try {
        const targetIds = filterTeacherId
          ? [filterTeacherId]
          : registeredTeacherIds;

        const chunks = [];
        for (let i = 0; i < targetIds.length; i += 10) {
          chunks.push(targetIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (batch) => {
            const qRef = query(
              collection(db, "questions"),
              where("teacherId", "in", batch)
            );
            const snap = await getDocs(qRef);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );

        const merged = new Map();
        for (const item of results.flat()) merged.set(item.id, item);

        const list = Array.from(merged.values()).sort((a, b) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt || 0);
          const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt || 0);
          return tb.getTime() - ta.getTime();
        });

        setQuestions(list);
      } catch (e) {
        console.error("Error fetching questions:", e);
        toast.error("Failed to load your questions.");
      }
    };
    run();
  }, [registeredTeacherIds, filterTeacherId]);

  // Submit new question
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Please enter your question.");
      return;
    }
    if (!teacherId) {
      toast.error("Please select a teacher.");
      return;
    }
    if (!studentData) {
      toast.error("Student details not loaded.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending your question...");

    try {
      const selectedTeacher = teachers.find((t) => t.id === teacherId);

      const docRef = await addDoc(collection(db, "questions"), {
        question: question.trim(),
        studentId: auth.currentUser.uid,
        studentName: studentData.name,
        studentImage: studentData.image,
        teacherId,
        teacherName: selectedTeacher?.fullName || "Teacher",
        teacherImage: selectedTeacher?.imageUrl || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      const matches = !filterTeacherId || filterTeacherId === teacherId;
      if (matches) {
        setQuestions((prev) => [
          {
            id: docRef.id,
            question: question.trim(),
            studentId: auth.currentUser.uid,
            studentName: studentData.name,
            studentImage: studentData.image,
            teacherId,
            teacherName: selectedTeacher?.fullName || "Teacher",
            teacherImage: selectedTeacher?.imageUrl || null,
            status: "pending",
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }

      toast.dismiss(toastId);
      toast.success("Question sent successfully!");

      setQuestion("");
      setTeacherId("");
    } catch (err) {
      console.error("Error sending question:", err);
      toast.dismiss(toastId);
      toast.error("Failed to send question. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (q) => {
    setEditingQuestionId(q.id);
    setEditText(q.question);
  };

  // Save edited question
  const saveEdit = async (qId) => {
    if (!editText.trim()) {
      toast.error("Question cannot be empty.");
      return;
    }

    const toastId = toast.loading("Updating question...");

    try {
      const qRef = doc(db, "questions", qId);
      await updateDoc(qRef, { question: editText.trim() });

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId ? { ...q, question: editText.trim() } : q
        )
      );

      toast.dismiss(toastId);
      toast.success("Question updated!");

      setEditingQuestionId(null);
      setEditText("");
    } catch (err) {
      console.error("Error updating question:", err);
      toast.dismiss(toastId);
      toast.error("Failed to update question.");
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditText("");
  };

  // Delete question
  const handleDelete = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const toastId = toast.loading("Deleting question...");

    try {
      await deleteDoc(doc(db, "questions", qId));
      setQuestions((prev) => prev.filter((q) => q.id !== qId));

      toast.dismiss(toastId);
      toast.success("Question deleted.");
    } catch (err) {
      console.error("Error deleting question:", err);
      toast.dismiss(toastId);
      toast.error("Failed to delete question.");
    }
  };

  // Helper relative time formatter
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper avatar renderer
  const renderAvatar = (imageUrl, name, fallbackChar) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/80 shadow-sm transition-transform hover:scale-105"
        />
      );
    }
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : fallbackChar;
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white/80 transition-transform hover:scale-105">
        {initials}
      </div>
    );
  };

  // Quick question suggestions
  const doubtStarters = [
    "I need help understanding this formula...",
    "Could you review my submission for...",
    "I'm confused about the grading criteria...",
    "When is the next deadline for this course?",
  ];

  // Filtering questions client-side using searchQuery + questions
  const filteredQuestions = questions.filter((q) => {
    const queryStr = searchQuery.toLowerCase();
    const matchesQuery =
      q.question.toLowerCase().includes(queryStr) ||
      (q.reply && q.reply.toLowerCase().includes(queryStr)) ||
      (q.teacherName && q.teacherName.toLowerCase().includes(queryStr));
    return matchesQuery;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-60 animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-violet-100 blur-3xl opacity-60 animate-pulse" />
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <GraduationCap className="w-8 h-8 text-blue-600 absolute top-4 left-4 animate-bounce" />
          </div>
          <p className="text-slate-600 font-semibold tracking-wide text-lg animate-pulse">
            Connecting to your classroom...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans text-slate-800 flex flex-col py-8 px-4 sm:px-6">
      {/* Background Atmosphere Blobs */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-100/40 blur-[120px] animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-rose-100/30 blur-[120px] animate-float-medium" />
      <div className="pointer-events-none absolute top-[40%] right-[10%] h-[40%] w-[40%] rounded-full bg-sky-100/30 blur-[120px] animate-float-fast" />

      <div className="mx-auto w-full max-w-6xl z-10 flex-1 flex flex-col">
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/75 backdrop-blur-md border border-slate-200/50 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200/50 shadow-sm transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-1" />
              Dashboard
            </button>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-5 w-5 text-blue-600 animate-pulse" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Help Desk
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Direct support channel with your registered teachers</p>
            </div>
          </div>
          
          {studentData && (
            <div className="flex items-center gap-3 self-end sm:self-auto bg-white/80 px-4 py-2 rounded-2xl border border-slate-200/40 shadow-sm">
              {renderAvatar(studentData.image, studentData.name, "S")}
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Student</p>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {studentData.name}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          
          {/* Left Column: Compose Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl shadow-xl shadow-blue-500/[0.02] border border-slate-200/60 overflow-hidden bg-white/85">
              {/* Card Accent Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-blue-200 animate-spin-slow" />
                  <div>
                    <h3 className="font-bold text-base">New Consultation</h3>
                    <p className="text-xs text-blue-100/80">Ask details, code, or assignments</p>
                  </div>
                </div>
                <GraduationCap className="h-6 w-6 text-white/20 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Visual Teacher Selector */}
                {teachers.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Select Teacher
                      </label>
                      {teacherId && (
                        <button 
                          type="button" 
                          onClick={() => setTeacherId("")}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                    
                    {/* Horizontal scroll select cards */}
                    <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                      {teachers.map((t) => {
                        const isSelected = teacherId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTeacherId(t.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 min-w-24 text-center select-none cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-102"
                                : "bg-white border-slate-200/80 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={t.imageUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                                alt={t.fullName}
                                className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white/20"
                              />
                              {isSelected && (
                                <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-blue-600 shadow ring-1 ring-blue-500/10">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className={`text-[11px] font-bold truncate max-w-[80px] leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}>
                                {t.fullName.split(" ")[0]}
                              </p>
                              <p className={`text-[9px] truncate max-w-[80px] leading-tight mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                                {t.subjects || "Teacher"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Standard Select as backup or for small screens */}
                    <div className="relative mt-2">
                      <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        required
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Choose via dropdown...</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} {t.subjects ? `(${t.subjects})` : ""}
                          </option>
                        ))}
                      </select>
                      <User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center">
                    <p className="text-xs font-semibold text-amber-700">
                      No Registered Teachers
                    </p>
                    <p className="text-[10px] text-amber-600 mt-1">
                      You must register with a teacher in your student hub to ask questions.
                    </p>
                  </div>
                )}

                {/* Question Text Area */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Your Question
                    </label>
                    <span className={`text-[10px] font-semibold ${question.length > 450 ? "text-red-500" : "text-slate-400"}`}>
                      {question.length}/500 chars
                    </span>
                  </div>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                    placeholder="Describe your question or doubt in detail. Feel free to specify homework details or syllabus section..."
                    required
                    className="min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 resize-none leading-relaxed"
                  />
                </div>

                {/* Doubt Starters */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Need Inspiration? Click to start:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {doubtStarters.map((starter, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuestion(starter)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/30 transition-all cursor-pointer font-medium active:scale-95"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || teachers.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-500/15 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting Question...
                      </>
                    ) : (
                      <>
                        <Send className="h-4.5 w-4.5" />
                        Send Question
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Quick Tip Widget */}
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-4 flex gap-3 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100/50">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Quick Study Tip</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Keep your inquiries highly specific. Mention code file names or homework numbers to help your teacher reply faster!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Conversations History Section */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Filters and Search Dashboard Header */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-slate-200/50 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Dynamic search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or teachers..."
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/40 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Teacher Dropdown Filter */}
              <div className="relative shrink-0 sm:w-48">
                <select
                  value={filterTeacherId}
                  onChange={(e) => setFilterTeacherId(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="">All Teachers</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white/70 border border-slate-200/50 rounded-3xl shadow-sm">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-inner mb-4 animate-pulse">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-base">No Conversations Found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {searchQuery 
                      ? "No questions match your current search terms. Try typing something else."
                      : registeredTeacherIds.length === 0 
                        ? "Register with a teacher to begin messaging."
                        : "Send your first question in the form on the left to start a discussion thread!"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition font-medium cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {filteredQuestions.map((q) => {
                      const isEditing = editingQuestionId === q.id;
                      const isOwnQuestion = q.studentId === auth.currentUser?.uid;
                      const hasReply = !!q.reply;

                      return (
                        <motion.div
                          key={q.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          {/* Top Status & Action Bar */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              {/* Pulsing Status Badges */}
                              {hasReply ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                  Answered
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                  </span>
                                  Pending Reply
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-400">
                                {formatRelativeTime(q.createdAt)}
                              </span>
                            </div>

                            {/* Actions (Pencil & Trash) */}
                            {isOwnQuestion && !isEditing && (
                              <div className="flex gap-1 bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                                <button
                                  onClick={() => startEdit(q)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition shadow-sm hover:shadow-inner cursor-pointer"
                                  title="Edit question"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(q.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition cursor-pointer"
                                  title="Delete question"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Conversation Thread bubbles */}
                          <div className="space-y-1">
                            
                            {/* Student Question Bubble Group */}
                            <div className="flex items-start gap-3">
                              {renderAvatar(q.studentImage, q.studentName, "S")}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800">
                                    {q.studentName}
                                  </span>
                                  <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100/50 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    You
                                  </span>
                                </div>

                                {isEditing ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 leading-relaxed resize-none"
                                      rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => saveEdit(q.id)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition cursor-pointer"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1.5 bg-blue-50/50 border border-blue-100/40 p-3.5 rounded-2xl rounded-tl-none text-sm text-slate-700 leading-relaxed max-w-full inline-block">
                                    {q.question}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Thread connector line */}
                            {hasReply && (
                              <div className="w-[2px] bg-slate-100 h-6 ml-5" />
                            )}

                            {/* Teacher Reply Bubble Group */}
                            {hasReply && (
                              <div className="flex items-start gap-3">
                                {renderAvatar(q.teacherImage, q.teacherName, "T")}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800">
                                      {q.teacherName}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100/50 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                      <Reply className="h-2.5 w-2.5" />
                                      Reply
                                    </span>
                                  </div>
                                  
                                  <div className="mt-1.5 bg-emerald-50/40 border border-emerald-100/30 p-3.5 rounded-2xl rounded-tl-none text-sm text-slate-700 leading-relaxed max-w-full inline-block">
                                    {q.reply}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer Info Row */}
                          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                              <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                              Directed to: <span className="font-bold text-slate-600">{q.teacherName}</span>
                            </span>
                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
