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
  serverTimestamp, // <-- Added for better timestamp handling
} from "firebase/firestore";
import {
  NotebookPen,
  Plus,
  Loader2,
  ListChecks,
  ChevronDown,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner"; // <-- Added

function Homework() {
  const [homeworks, setHomeworks] = useState([]);
  const [task, setTask] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false); // For button loading state
  const navigate = useNavigate();

  // Customize grades as needed
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

  const addHomework = async () => {
    if (!task.trim()) {
      toast.error("Please enter a homework task.");
      return;
    }
    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade.");
      return;
    }

    try {
      setAdding(true);
      toast.loading("Assigning homework...");

      const finalGrades = selectedGrades.includes("All Grades")
        ? grades.filter((g) => g !== "All Grades")
        : selectedGrades;

      await addDoc(collection(db, "homework"), {
        teacherId: auth.currentUser.uid,
        task: task.trim(),
        grades: finalGrades,
        createdAt: serverTimestamp(), // Better than client-side timestamp
      });

      toast.dismiss();
      toast.success("Homework assigned successfully!");

      setTask("");
      setSelectedGrades([]);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error adding homework:", error);
      toast.dismiss();
      toast.error("Failed to assign homework. Please try again.");
    } finally {
      setAdding(false);
    }
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-100 via-sky-100 to-indigo-50 py-10 px-4">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />

      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white shadow-sm ring-1 ring-blue-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <NotebookPen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Homework</h2>
              <p className="text-xs text-slate-500">
                Assign tasks to your students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
              {homeworks.length} total
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* brand ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Composer */}
        <div className="px-6 py-5 space-y-3">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addHomework()}
            placeholder="Enter homework task (e.g., Chapter 3: Exercises 1–10)"
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
            disabled={adding}
          />

          {/* Grade Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={adding}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-70"
            >
              <span>
                {selectedGrades.length === 0
                  ? "Select grade(s)"
                  : selectedGrades.length > 3
                  ? `${selectedGrades.slice(0, 3).join(", ")} +${
                      selectedGrades.length - 3
                    }`
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
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addHomework}
            disabled={adding}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {adding ? "Assigning..." : "Assign Homework"}
          </button>
        </div>

        {/* List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 px-3 py-3 text-slate-600 ring-1 ring-blue-100">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm">Loading homework…</p>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-6 py-10 text-center text-slate-600 ring-1 ring-blue-100">
              <ListChecks className="h-10 w-10 text-blue-500" />
              <p className="text-sm">
                No homework assigned yet. Create one above!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {homeworks.map((hw) => (
                <li
                  key={hw.id}
                  className="group rounded-xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-3 w-3 rounded-full bg-sky-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-slate-900">
                          {hw.task}
                        </p>
                      </div>

                      <div className="mt-3 ml-6 space-y-1 text-xs text-slate-500">
                        <p>
                          Assigned: <strong>{formatDate(hw.createdAt)}</strong>
                        </p>
                        <p>
                          For:{" "}
                          <strong>
                            {hw.grades?.length > 0
                              ? hw.grades.length > 4
                                ? `${hw.grades.slice(0, 4).join(", ")} +${
                                    hw.grades.length - 4
                                  }`
                                : hw.grades.join(", ")
                              : "All Grades"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteHomework(hw.id)}
                      className="rounded-lg p-2 text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
                      title="Delete homework"
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

export default Homework;
