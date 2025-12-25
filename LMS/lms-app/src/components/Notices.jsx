// src/pages/Notices.jsx (or wherever it's located) - Updated with Sonner toast notifications

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner"; // <-- Added

function Notices() {
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // For button loading state
  const navigate = useNavigate();

  const grades = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-white py-10 px-4">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white shadow-sm ring-1 ring-amber-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Manage Notices
              </h2>
              <p className="text-xs text-slate-500">
                Post announcements for your students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              {notices.length} {notices.length === 1 ? "notice" : "notices"}
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </div>
        </div>

        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />

        {/* Composer */}
        <div className="px-6 py-5 space-y-3">
          <input
            type="text"
            value={newNotice}
            onChange={(e) => setNewNotice(e.target.value)}
            placeholder="Write a short announcement..."
            disabled={submitting}
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-amber-400 disabled:opacity-70"
          />

          {/* Grade Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={submitting}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-70"
            >
              <span>
                {selectedGrades.length === 0
                  ? "Select grade(s)"
                  : selectedGrades.join(", ")}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow-lg ring-1 ring-slate-200">
                <div className="max-h-60 overflow-y-auto py-2">
                  {grades.map((grade) => (
                    <label
                      key={grade}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addNotice}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {submitting ? "Publishing..." : "Publish Notice"}
          </button>
        </div>

        {/* Notices List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-50/60 to-emerald-50/40 px-4 py-4 text-slate-600 ring-1 ring-amber-100">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <p className="text-sm">Loading your notices…</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-gradient-to-br from-amber-50/60 to-emerald-50/50 px-6 py-10 text-center text-slate-600 ring-1 ring-amber-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-2 ring-amber-100">
                <Megaphone className="h-7 w-7 text-amber-700" />
              </div>
              <p className="text-sm font-medium">No notices yet</p>
              <p className="text-xs">Create your first announcement above!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-slate-900 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                        <Megaphone className="h-3.5 w-3.5 text-emerald-700" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          {notice.content}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          For:{" "}
                          <strong>
                            {notice.grades?.length > 0
                              ? notice.grades.join(", ")
                              : "All Grades"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteNotice(notice.id)}
                      className="mt-0.5 rounded-lg p-1.5 text-red-600 hover:bg-red-100 transition"
                      title="Delete notice"
                      aria-label="Delete notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notices;
