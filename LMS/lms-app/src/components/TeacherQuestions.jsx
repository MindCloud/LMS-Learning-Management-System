// src/components/TeacherQuestions.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  MessageSquare,
  Reply,
  User,
  CheckCircle2,
  Clock3,
  X,
  Loader2,
  ArrowLeft,
  Search,
  Sparkles,
  HelpCircle,
} from "lucide-react";

const QUICK_REPLIES = [
  "Good question! Please review the lecture materials in the folders.",
  "Let's discuss this query in our next class session.",
  "Please double check the formula and try again.",
  "I have uploaded a resource resolving this issue.",
  "Excellent effort. That is correct!",
];

export default function TeacherQuestions() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false); // sending reply
  const [fetching, setFetching] = useState(true); // fetching questions
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  // Fetch questions for the logged-in teacher
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("You must be logged in to view questions.");
        setFetching(false);
        navigate("/login");
        return;
      }

      try {
        setFetching(true);
        const q = query(
          collection(db, "questions"),
          where("teacherId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const questionList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Sort by date (descending)
        const sortedList = questionList.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setQuestions(sortedList);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions. Please try again.");
      } finally {
        setFetching(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Open modal
  const handleOpenModal = (question) => {
    setSelectedQuestion(question);
    setReply(question.reply || "");
  };

  // Close modal helper
  const closeModal = () => {
    setSelectedQuestion(null);
    setReply("");
  };

  // Send reply
  const handleSendReply = async () => {
    if (!reply.trim()) {
      toast.error("Please type a reply before sending.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending your reply...");

    try {
      await updateDoc(doc(db, "questions", selectedQuestion.id), {
        reply: reply.trim(),
        status: "answered",
        repliedAt: serverTimestamp(),
      });

      // Update local state optimistically
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? {
                ...q,
                reply: reply.trim(),
                status: "answered",
                repliedAt: new Date(),
              }
            : q
        )
      );

      toast.dismiss(toastId);
      toast.success("Reply sent successfully!");
      closeModal();
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.dismiss(toastId);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick reply select action
  const handleQuickReply = (text) => {
    setReply((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text}` : text;
    });
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
  const renderAvatar = (imageUrl, name) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow"
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
      : "S";
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow ring-2 ring-white dark:ring-slate-800">
        {initials}
      </div>
    );
  };

  // Client side query filtering
  const filteredQuestions = questions.filter((q) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      q.studentName.toLowerCase().includes(searchLower) ||
      q.question.toLowerCase().includes(searchLower) ||
      (q.reply && q.reply.toLowerCase().includes(searchLower));

    const isAnswered = q.status === "answered";
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && !isAnswered) ||
      (activeTab === "answered" && isAnswered);

    return matchesSearch && matchesTab;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50/70 via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4 sm:px-6 transition-colors duration-300">
      {/* Floating soft background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[-1]">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sky-100/50 dark:bg-sky-950/10 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-100/50 dark:bg-indigo-950/10 blur-3xl animate-float-medium" />
      </div>

      <div className="mx-auto w-full max-w-6xl glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 shadow-xl shadow-blue-500/[0.02] dark:shadow-black/40 overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <MessageSquare className="h-5.5 w-5.5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Student Questions
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                View, filter, and reply to student inquiries
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-blue-50 dark:bg-blue-950/20 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 ring-1 ring-blue-200/50 dark:ring-blue-900/30 shadow-sm">
              {questions.length} total
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Brand Ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Search and Filter Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40 dark:bg-slate-950/20">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or question text..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950 pl-10 pr-9 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100/50 dark:focus:ring-blue-950/30 dark:text-slate-200 dark:placeholder-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sliding tab selector */}
          <div className="flex p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 relative overflow-hidden self-start sm:self-auto">
            {["all", "pending", "answered"].map((tab) => {
              const isActive = activeTab === tab;
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              let count = 0;
              if (tab === "all") count = questions.length;
              else if (tab === "pending")
                count = questions.filter((q) => q.status !== "answered").length;
              else if (tab === "answered")
                count = questions.filter((q) => q.status === "answered").length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer z-10 select-none ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/40 dark:border-slate-700/30 z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-6">
          {fetching ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800/40 dark:to-slate-800/20"
                />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white/30 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner mb-4 animate-pulse">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">
                No Questions Found
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm leading-relaxed">
                {searchQuery
                  ? "No questions match your current search query. Try searching for something else."
                  : activeTab === "pending"
                  ? "Congratulations! You have resolved all pending questions."
                  : activeTab === "answered"
                  ? "No questions have been replied to yet."
                  : "Students haven't asked any questions yet."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredQuestions.map((q) => (
                  <motion.article
                    key={q.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/20 p-5.5 shadow-sm hover:shadow-md dark:shadow-slate-950/20 hover:border-blue-200 dark:hover:border-blue-900/40 transition-all duration-300 relative group overflow-hidden"
                  >
                    <div>
                      {/* Header Row */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {renderAvatar(q.studentImage, q.studentName)}
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                              {q.studentName}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              {formatRelativeTime(q.createdAt)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={q.status} />
                      </div>

                      {/* Question */}
                      <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-4 font-medium italic relative pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                        "{q.question}"
                      </p>

                      {/* Reply snippet if any */}
                      {q.reply && (
                        <div className="mb-4 rounded-2xl border border-blue-100/60 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/10 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="mr-1 inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                            <Reply className="h-3.5 w-3.5" /> Your reply:
                          </span>
                          <p className="mt-1 font-medium leading-relaxed line-clamp-3">
                            {q.reply}
                          </p>
                          {q.repliedAt && (
                            <span className="block mt-1 text-[9px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider text-right">
                              Replied {formatRelativeTime(q.repliedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenModal(q)}
                      className={`mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98] ${
                        q.reply
                          ? "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-indigo-500/10"
                          : "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-blue-500/15"
                      }`}
                    >
                      <Reply className="h-3.5 w-3.5" />
                      {q.reply ? "Edit Reply" : "Answer Query"}
                    </button>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <Dialog
            open={true}
            onClose={closeModal}
            static
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <Dialog.Title className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Reply className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  Reply to {selectedQuestion.studentName}
                </Dialog.Title>
                <button
                  onClick={closeModal}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Color ribbon */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Question Info card */}
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student Question:
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 italic pl-3 border-l-2 border-slate-300 dark:border-slate-700">
                    "{selectedQuestion.question}"
                  </p>
                </div>

                {/* Response Text area */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Your Helpful Reply
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        reply.length > 450 ? "text-red-500" : "text-slate-405"
                      }`}
                    >
                      {reply.length}/500 chars
                    </span>
                  </div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value.slice(0, 500))}
                    placeholder="Type your helpful reply here..."
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 dark:focus:ring-blue-900/10 resize-none leading-relaxed"
                  />
                </div>

                {/* Quick replies */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 block">
                    Quick replies presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(item)}
                        className="text-[10px] bg-slate-55 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80 transition-all font-semibold active:scale-95 cursor-pointer shadow-sm"
                      >
                        {item.length > 30 ? `${item.slice(0, 28)}...` : item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/15 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Reply className="h-4.5 w-4.5" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/* UI status chip */
function StatusBadge({ status }) {
  const isAnswered = (status || "").toLowerCase() === "answered";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
        isAnswered
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200/50 dark:ring-emerald-500/20"
          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-200/50 dark:ring-amber-500/20"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isAnswered ? (
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </>
        )}
      </span>
      {isAnswered ? "Answered" : "Pending"}
    </span>
  );
}
