import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
// Icons
import { NotebookPen, X, BadgeCheck, BookOpen, Hash } from "lucide-react";

function MarkModal({ isOpen, onClose, student }) {
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const studentRef = doc(db, "students", student.id);
      await updateDoc(studentRef, {
        marks: arrayUnion({
          subject,
          score,
          date: new Date().toISOString(),
        }),
      });

      alert("Marks added successfully!");
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Error adding marks:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-modal-title"
    >
      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-blue-100">
        {/* Gradient Header */}
        <div className="relative">
          <div className="flex items-center justify-between px-5 py-4 text-white bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <NotebookPen className="h-5 w-5" />
              </span>
              <h2
                id="mark-modal-title"
                className="text-base font-semibold tracking-wide"
              >
                Add Marks
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* subtle ribbon under header */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 via-40% to-indigo-600" />
        </div>

        {/* Student summary */}
        <div className="relative px-5 pt-4">
          {/* soft blobs */}
          <div className="pointer-events-none absolute -top-6 -left-6 h-16 w-16 rounded-full bg-sky-100 blur-xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-indigo-100 blur-xl" />

          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100">
              <BadgeCheck className="h-5 w-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {student.fullName}
              </p>
              <p className="text-xs text-slate-500">
                Enter the subject and score, then save.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Subject
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <BookOpen className="h-4 w-4" />
              </span>
              <input
                id="subject"
                type="text"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-xl border bg-white px-9 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="score"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Score
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Hash className="h-4 w-4" />
              </span>
              <input
                id="score"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 85"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                className="w-full rounded-xl border bg-white px-9 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Use whole numbers or decimals as needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <NotebookPen className="h-4 w-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MarkModal;
