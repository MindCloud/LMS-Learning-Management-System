// src/pages/Homework.jsx (or wherever this component lives) - Updated with Sonner toasts

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
  updateDoc,
} from "firebase/firestore";
import {
  NotebookPen,
  Plus,
  Loader2,
  ListChecks,
  ChevronDown,
  Trash2,
  CheckCircle2,
  X,
  Send,
  GraduationCap,
  Clock,
  Search,
  ArrowLeft,
  Sparkles,
  Info,
  Edit2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

function Homework() {
  const [homeworks, setHomeworks] = useState([]);
  const [task, setTask] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // For button loading state
  const [searchFilter, setSearchFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
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
    "Other",
    "All Grades",
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast.error("You must be logged in to view homework.");
        setLoading(false);
        setHomeworks([]);
        navigate("/login");
        return;
      }

      const q = query(
        collection(db, "homework"),
        where("teacherId", "==", user.uid)
      );

      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const homeworkData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort by newest first
          homeworkData.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return timeB - timeA;
          });

          setHomeworks(homeworkData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching homework:", error);
          toast.error("Failed to load homework. Please try again.");
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
      if (selectedGrades.includes(grade)) {
        setSelectedGrades(selectedGrades.filter((g) => g !== grade));
      } else {
        setSelectedGrades([
          ...selectedGrades.filter((g) => g !== "All Grades"),
          grade,
        ]);
      }
    }
  };

  const saveHomework = async () => {
    if (!task.trim()) {
      toast.error("Please enter a homework task.");
      return;
    }
    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        toast.loading("Updating homework...");
      } else {
        toast.loading("Assigning homework...");
      }

      const finalGrades = selectedGrades.includes("All Grades")
        ? grades.filter((g) => g !== "All Grades")
        : selectedGrades;

      if (editingId) {
        await updateDoc(doc(db, "homework", editingId), {
          task: task.trim(),
          grades: finalGrades,
        });
        toast.dismiss();
        toast.success("Homework updated successfully!");
      } else {
        await addDoc(collection(db, "homework"), {
          teacherId: auth.currentUser.uid,
          task: task.trim(),
          grades: finalGrades,
          createdAt: serverTimestamp(),
        });
        toast.dismiss();
        toast.success("Homework assigned successfully!");
      }

      setTask("");
      setSelectedGrades([]);
      setIsDropdownOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving homework:", error);
      toast.dismiss();
      toast.error(
        editingId
          ? "Failed to update homework. Please try again."
          : "Failed to assign homework. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHomework = (hw) => {
    setEditingId(hw.id);
    setTask(hw.task);
    setSelectedGrades(hw.grades || []);
    setIsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTask("");
    setSelectedGrades([]);
    setIsDropdownOpen(false);
  };

  const deleteHomework = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) {
      return;
    }

    try {
      toast.loading("Deleting homework...");
      await deleteDoc(doc(db, "homework", id));
      toast.dismiss();
      toast.success("Homework deleted.");
      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("Error deleting homework:", error);
      toast.dismiss();
      toast.error("Failed to delete homework.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Grade color tags generator (blue-indigo theme harmonized)
  const getGradeTagStyles = (grade) => {
    const normalized = grade.toLowerCase();
    if (normalized.includes("o/l")) {
      return "bg-sky-50 dark:bg-sky-950/25 text-sky-700 dark:text-sky-400 border-sky-200/65 dark:border-sky-900/30";
    }
    if (normalized.includes("a/l")) {
      return "bg-indigo-50 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-400 border-indigo-200/65 dark:border-indigo-900/30";
    }
    if (normalized.includes("10") || normalized.includes("11")) {
      return "bg-blue-50 dark:bg-blue-950/25 text-blue-750 dark:text-blue-400 border-blue-250/65 dark:border-blue-900/30";
    }
    return "bg-violet-50 dark:bg-violet-950/15 text-violet-700 dark:text-violet-455 border-violet-100/50 dark:border-violet-950/30";
  };

  // Filter homework for display feed
  const filteredHomeworks = homeworks.filter((hw) => {
    const matchesSearch = hw.task.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesGrade =
      gradeFilter === "all" ||
      (hw.grades && Array.isArray(hw.grades) && hw.grades.includes(gradeFilter)) ||
      (hw.grades && hw.grades.length === 0 && gradeFilter === "All Grades");

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50/50 via-sky-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased pb-12 transition-colors duration-300">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[30%] rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[30%] h-[35%] rounded-full bg-gradient-to-br from-indigo-500/10 to-sky-500/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[35%] h-[30%] rounded-full bg-gradient-to-tr from-sky-500/10 to-blue-500/10 blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/60 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 via-sky-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <NotebookPen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Homework Hub
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Assign and manage homework tasks for student grades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 cursor-pointer"
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
            {/* Homework Form Composer Card */}
            <div className="relative z-20 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wider">
                    {editingId ? "Edit Assignment" : "New Assignment"}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Homework Task text field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Homework Task
                  </label>
                  <div className="relative">
                    <textarea
                      value={task}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setTask(e.target.value);
                        }
                      }}
                      placeholder="Enter homework task details here..."
                      rows={5}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-70"
                    />
                    <div className={`absolute bottom-3 right-3 text-xs font-medium ${task.length >= 450 ? "text-red-500" : "text-slate-400"}`}>
                      {task.length}/500
                    </div>
                  </div>
                </div>

                {/* Targeted Grade Selection dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Target Audience (Grades)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={submitting}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-50/20 disabled:opacity-70"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {selectedGrades.length === 0
                        ? "Select target grades"
                        : `${selectedGrades.length} grade(s) selected`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-250 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Active tags representing selected grades */}
                  {selectedGrades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {selectedGrades.map((grade) => (
                        <span
                          key={grade}
                          onClick={() => toggleGrade(grade)}
                          className="inline-flex items-center gap-1 cursor-pointer rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 hover:border-red-100 transition-colors"
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
                        className="absolute z-10 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xl ring-1 ring-slate-100 dark:ring-slate-900"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Select Target</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedGrades(["All Grades"])}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
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
                                    ? "bg-blue-50 dark:bg-blue-950/35 text-blue-750 dark:text-blue-350 border border-blue-100/50 dark:border-blue-900/30"
                                    : "bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border border-transparent"
                                    }`}
                                >
                                  <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border transition-all ${isSelected
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
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

                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={saveHomework}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/15 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : editingId ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting
                      ? editingId
                        ? "Updating..."
                        : "Assigning..."
                      : editingId
                      ? "Save Changes"
                      : "Assign Homework"}
                  </button>

                  {editingId && (
                    <button
                      onClick={cancelEdit}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Overview Panel */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400">
                  <Info className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Overview
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
                  <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tasks</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{homeworks.length}</span>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
                  <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Filtered Feed</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-450">{filteredHomeworks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Homework Feed List: Span 7 */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Search and Filters box */}
            <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 shadow-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search homework tasks..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 pl-10 text-sm text-slate-700 dark:text-slate-250 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative sm:w-48">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-semibold"
                >
                  <option value="all">All Grades</option>
                  {grades.filter(g => g !== "All Grades").map((grade) => (
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
                <LoadingSpinner text="Retrieving homework feed..." />
              ) : filteredHomeworks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm p-12 text-center h-full">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-blue-600 shadow-sm">
                    {searchFilter || gradeFilter !== "all" ? (
                      <Search className="h-7 w-7 text-slate-400" />
                    ) : (
                      <ListChecks className="h-7 w-7 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-300 text-lg">
                      {searchFilter || gradeFilter !== "all" ? "No matches found" : "Homework feed empty"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchFilter || gradeFilter !== "all"
                        ? "Try adjusting your search terms or grade filter settings."
                        : "Assign your first homework task using the composer on the left to notify targeted students."}
                    </p>
                  </div>
                </div>
              ) : (
                <motion.ul
                  layout
                  className="space-y-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredHomeworks.map((hw) => (
                      <motion.li
                        key={hw.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="group relative flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md p-5 shadow-2xs hover:shadow-xs hover:border-blue-200/60 transition-all duration-300 overflow-hidden"
                      >
                        {/* Left visual indicator accent border */}
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-lg group-hover:from-blue-600 group-hover:to-indigo-650 transition-colors" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse">
                              <NotebookPen className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-text pr-2 font-medium">
                                {hw.task}
                              </p>

                              {/* Target Grade Pill Badges */}
                              <div className="flex flex-wrap gap-1.5 mt-3.5">
                                {hw.grades && hw.grades.length > 0 && hw.grades.length === grades.filter(g => g !== "All Grades").length ? (
                                  <span
                                    className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 text-blue-750 dark:text-blue-400"
                                  >
                                    <GraduationCap className="h-2.5 w-2.5 mr-1" />
                                    All Grades
                                  </span>
                                ) : hw.grades && hw.grades.length > 0 ? (
                                  hw.grades.map((grade) => (
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
                                  <span
                                    className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 text-blue-755 dark:text-blue-400"
                                  >
                                    <GraduationCap className="h-2.5 w-2.5 mr-1" />
                                    All Grades
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEditHomework(hw)}
                              className={`rounded-lg p-2 transition-all duration-150 active:scale-90 ${
                                editingId === hw.id
                                  ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30"
                                  : "text-slate-400 hover:text-blue-600 hover:bg-blue-50/30"
                              }`}
                              title="Edit homework assignment"
                              aria-label="Edit homework assignment"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => deleteHomework(hw.id)}
                              className="rounded-lg p-2 text-slate-400 hover:text-red-650 hover:bg-red-50/50 transition-all duration-150 active:scale-90"
                              title="Delete homework assignment"
                              aria-label="Delete homework assignment"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        {/* Footer Information Row */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5" title={hw.createdAt?.toDate ? hw.createdAt.toDate().toLocaleString() : "Just now"}>
                            <Clock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                            <span>Assigned {formatDate(hw.createdAt)}</span>
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

export default Homework;
