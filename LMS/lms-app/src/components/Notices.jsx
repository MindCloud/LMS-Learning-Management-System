// src/components/Notices.jsx - Updated with modern aesthetic visual design and framer-motion transitions

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  Bell,
  Plus,
  Loader2,
  Megaphone,
  ArrowLeft,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  X,
  Send,
  GraduationCap,
  Globe,
  Sparkles,
  Info,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function Notices() {
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // For button loading state
  const [searchFilter, setSearchFilter] = useState(""); // Notice content search
  const [gradeFilter, setGradeFilter] = useState("all"); // Notice grade filter
  const navigate = useNavigate();

  const grades = [
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "O/L",
    "A/L",
    "After A/L",
    "All Grades",
  ];

  // Real-time listener for teacher's notices
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast.error("You must be logged in to view notices.");
        setLoading(false);
        setNotices([]);
        navigate("/login");
        return;
      }

      const q = query(
        collection(db, "notices"),
        where("teacherId", "==", user.uid)
      );

      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const noticesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort newest first
          noticesData.sort((a, b) => {
            const timeA = a.createdAt?.toDate() || new Date(0);
            const timeB = b.createdAt?.toDate() || new Date(0);
            return timeB - timeA;
          });

          setNotices(noticesData);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore listener error:", error);
          toast.error("Failed to load notices. Please try again.");
          setLoading(false);
        }
      );

      return unsubscribeFirestore;
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const toggleGrade = (grade) => {
    if (grade === "All Grades") {
      if (selectedGrades.includes("All Grades")) {
        setSelectedGrades([]);
      } else {
        setSelectedGrades(["All Grades"]);
      }
    } else {
      setSelectedGrades((prev) => {
        if (prev.includes(grade)) {
          return prev.filter((g) => g !== grade);
        }
        // Remove "All Grades" when selecting specific ones
        return [...prev.filter((g) => g !== "All Grades"), grade];
      });
    }
  };

  const addNotice = async () => {
    if (!newNotice.trim()) {
      toast.error("Please write a notice before publishing.");
      return;
    }

    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade.");
      return;
    }

    setSubmitting(true);
    toast.loading("Publishing notice...");

    try {
      const finalGrades = selectedGrades.includes("All Grades")
        ? grades.filter((g) => g !== "All Grades")
        : selectedGrades;

      await addDoc(collection(db, "notices"), {
        teacherId: auth.currentUser.uid,
        content: newNotice.trim(),
        grades: finalGrades,
        createdAt: serverTimestamp(), // Better than client time
      });

      toast.dismiss();
      toast.success("Notice published successfully!");

      // Reset form
      setNewNotice("");
      setSelectedGrades([]);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error adding notice:", error);
      toast.dismiss();
      toast.error("Failed to publish notice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNotice = async (id) => {
    toast.loading("Deleting notice...");

    try {
      await deleteDoc(doc(db, "notices", id));
      toast.dismiss();
      toast.success("Notice deleted.");
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.dismiss();
      toast.error("Failed to delete notice.");
    }
  };

  // Format firestore timestamps to clean relative displays
  const formatNoticeDate = (createdAt) => {
    if (!createdAt) return "Just now";

    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return "Just now";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Grade color tags generator
  const getGradeTagStyles = (grade) => {
    const normalized = grade.toLowerCase();
    if (normalized.includes("o/l")) {
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    }
    if (normalized.includes("a/l")) {
      return "bg-violet-50 text-violet-700 border-violet-200/60";
    }
    if (normalized.includes("10") || normalized.includes("11")) {
      return "bg-sky-50 text-sky-700 border-sky-200/60";
    }
    if (normalized.includes("6") || normalized.includes("7") || normalized.includes("8") || normalized.includes("9")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
    return "bg-slate-50 text-slate-700 border-slate-200/60";
  };

  // Filter notices for display feed
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.content.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesGrade =
      gradeFilter === "all" ||
      (notice.grades && Array.isArray(notice.grades) && notice.grades.includes(gradeFilter)) ||
      (notice.grades && notice.grades.length === 0 && gradeFilter === "All Grades");

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="relative min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased pb-12">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[30%] rounded-full bg-gradient-to-tr from-blue-300/10 to-indigo-300/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[30%] h-[35%] rounded-full bg-gradient-to-br from-indigo-300/10 to-purple-300/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[35%] h-[30%] rounded-full bg-gradient-to-tr from-sky-300/10 to-blue-300/10 blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/60 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Notices Hub
              </h1>
              <p className="text-sm text-slate-500">
                Create and manage official announcements for student grades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Composer & Info Sidebar: Span 5 */}
          <div className="lg:col-span-5 space-y-6">
            {/* Notice Form Composer Card */}
            <div className="relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    New Announcement
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Announcement text field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Notice Message
                  </label>
                  <div className="relative">
                    <textarea
                      value={newNotice}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setNewNotice(e.target.value);
                        }
                      }}
                      placeholder="Type your official announcement here..."
                      rows={5}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-70"
                    />
                    <div className={`absolute bottom-3 right-3 text-xs font-medium ${newNotice.length >= 450 ? "text-red-500" : "text-slate-400"
                      }`}>
                      {newNotice.length}/500
                    </div>
                  </div>
                </div>

                {/* Targeted Grade Selection dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Target Audience (Grades)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={submitting}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70"
                  >
                    <span className="text-slate-500 font-medium">
                      {selectedGrades.length === 0
                        ? "Select target grades"
                        : `${selectedGrades.length} grade(s) selected`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-250 ${isDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Active tags representing selected grades */}
                  {selectedGrades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {selectedGrades.map((grade) => (
                        <span
                          key={grade}
                          onClick={() => toggleGrade(grade)}
                          className="inline-flex items-center gap-1 cursor-pointer rounded-lg bg-blue-50 border border-blue-100/80 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-blue-700 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-colors"
                          title="Click to remove"
                        >
                          {grade}
                          <X className="h-3 w-3" />
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Options selection dropdown list */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-100"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Select Target</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedGrades(["All Grades"])}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              All Grades
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGrades([])}
                              className="text-[10px] font-bold text-slate-500 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto pr-1">
                          <div className="grid grid-cols-2 gap-1.5">
                            {grades.map((grade) => {
                              const isSelected = selectedGrades.includes(grade);
                              return (
                                <button
                                  key={grade}
                                  type="button"
                                  onClick={() => toggleGrade(grade)}
                                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all ${isSelected
                                      ? "bg-blue-50 text-blue-700 border border-blue-100/50"
                                      : "bg-slate-50/50 hover:bg-slate-50 text-slate-600 border border-transparent"
                                    }`}
                                >
                                  <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border transition-all ${isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-300 bg-white"
                                    }`}>
                                    {isSelected && <CheckCircle2 className="h-2.5 w-2.5 stroke-[3px]" />}
                                  </div>
                                  <span className="truncate">{grade}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={addNotice}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-98 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </div>

            {/* Quick Metrics Overview Panel */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Info className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Overview
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Notices</span>
                  <span className="text-2xl font-bold text-slate-800">{notices.length}</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtered Feed</span>
                  <span className="text-2xl font-bold text-blue-600">{filteredNotices.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Published Announcements Feed: Span 7 */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Search and Filters box */}
            <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative sm:w-48">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-semibold"
                >
                  <option value="all">All Targets</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* List Feed Area */}
            <div className="flex-1 min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/40 backdrop-blur-sm p-12 h-full">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Retrieving announcements</p>
                    <p className="text-xs text-slate-400 mt-1">Connecting to Firestore server...</p>
                  </div>
                </div>
              ) : filteredNotices.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/40 backdrop-blur-sm p-12 text-center h-full">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 text-indigo-600 shadow-sm">
                    {searchFilter || gradeFilter !== "all" ? (
                      <Search className="h-7 w-7 text-slate-400" />
                    ) : (
                      <Megaphone className="h-7 w-7 text-indigo-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {searchFilter || gradeFilter !== "all" ? "No matches found" : "Announcements feed empty"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchFilter || gradeFilter !== "all"
                        ? "Try adjusting your search terms or grade filter settings."
                        : "Publish your first announcement using the composer on the left to notify targeted students."}
                    </p>
                  </div>
                </div>
              ) : (
                <motion.ul
                  layout
                  className="space-y-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredNotices.map((notice) => (
                      <motion.li
                        key={notice.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-5 shadow-2xs hover:shadow-xs hover:border-blue-200/70 transition-all duration-300 overflow-hidden"
                      >
                        {/* Left visual indicator accent border */}
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-lg group-hover:from-blue-600 group-hover:to-indigo-600 transition-colors" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5 animate-pulse">
                              <Megaphone className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap select-text pr-2 font-medium">
                                {notice.content}
                              </p>

                              {/* Target Grade Pill Badges */}
                              <div className="flex flex-wrap gap-1.5 mt-3.5">
                                {notice.grades && notice.grades.length > 0 ? (
                                  notice.grades.map((grade) => (
                                    <span
                                      key={grade}
                                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getGradeTagStyles(
                                        grade
                                      )}`}
                                    >
                                      <GraduationCap className="h-2.5 w-2.5 mr-1" />
                                      {grade}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center rounded-md border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 tracking-wide">
                                    <Globe className="h-2.5 w-2.5 mr-1" />
                                    All Grades
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/50 transition-all duration-150 active:scale-90"
                            title="Delete announcement"
                            aria-label="Delete announcement"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Footer Information Row */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5" title={notice.createdAt?.toDate ? notice.createdAt.toDate().toLocaleString() : "Just now"}>
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            <span>Published {formatNoticeDate(notice.createdAt)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notices;

