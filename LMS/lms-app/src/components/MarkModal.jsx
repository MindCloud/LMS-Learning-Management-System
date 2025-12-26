// src/components/MarkModal.jsx
// Updated to include teacherId in marks for proper categorization

import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

// Icons
import {
  NotebookPen,
  X,
  BadgeCheck,
  BookOpen,
  Hash,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

function MarkModal({ isOpen, onClose, student, teacherId, onMarkAdded }) {
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [marks, setMarks] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null); // null = add, number = edit
  const [loadingMarks, setLoadingMarks] = useState(false);

  // Fetch marks when modal opens
  useEffect(() => {
    if (isOpen && student) {
      fetchMarks();
    }
  }, [isOpen, student]);

  const fetchMarks = async () => {
    if (!student?.id) return;

    setLoadingMarks(true);
    try {
      const studentRef = doc(db, "students", student.id);
      const docSnap = await getDoc(studentRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const allMarks = data.marks || [];

        // Optional: Filter marks to show only those given by current teacher
        // Remove this filter if you want to show ALL marks from all teachers
        const teacherMarks = teacherId
          ? allMarks.filter((mark) => mark.teacherId === teacherId)
          : allMarks;

        setMarks(teacherMarks);
      } else {
        toast.error("Student record not found.");
        setMarks([]);
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
      toast.error("Failed to fetch marks. Please try again.");
      setMarks([]);
    } finally {
      setLoadingMarks(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }
    if (!score || isNaN(score) || Number(score) < 0) {
      toast.error("Please enter a valid score.");
      return;
    }

    if (!teacherId) {
      toast.error("Teacher information missing. Cannot assign marks.");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading(
        editingIndex !== null ? "Updating mark..." : "Adding mark..."
      );

      const studentRef = doc(db, "students", student.id);

      // Get current full marks array from Firestore (to avoid overwriting others' marks)
      const docSnap = await getDoc(studentRef);
      if (!docSnap.exists()) {
        toast.error("Student not found.");
        return;
      }

      let allMarks = docSnap.data().marks || [];

      const newMark = {
        subject: subject.trim(),
        score: Number(score),
        date: new Date().toISOString(),
        teacherId: teacherId, // ← Critical: Track who gave the mark
      };

      let updatedMarks;

      if (editingIndex !== null) {
        // Find the actual index in full array using a unique identifier (we'll use date + subject + teacherId)
        // Since we're showing filtered marks, we need to update the correct one in full list

        // Better approach: Replace by matching teacherId + original index logic
        // But since we filtered, we map back safely:
        const currentTeacherMarks = teacherId
          ? allMarks.filter((m) => m.teacherId === teacherId)
          : allMarks;

        if (currentTeacherMarks[editingIndex]) {
          // Remove old version and insert updated one
          updatedMarks = allMarks.filter(
            (m) => m !== currentTeacherMarks[editingIndex]
          );

          updatedMarks.push({
            ...currentTeacherMarks[editingIndex],
            subject: newMark.subject,
            score: newMark.score,
            // date remains original
          });
        }
      } else {
        // Adding new mark
        updatedMarks = [...allMarks, newMark];
      }

      // Save full updated array
      await updateDoc(studentRef, { marks: updatedMarks });

      toast.dismiss();
      toast.success(
        editingIndex !== null
          ? "Mark updated successfully!"
          : `Mark added for ${student.fullName}!`
      );

      // Update local state (refetch to stay in sync)
      fetchMarks();

      // Reset form
      resetForm();

      // Notify Dashboard to refresh student list
      onMarkAdded?.();
    } catch (err) {
      console.error("Error saving mark:", err);
      toast.dismiss();
      toast.error("Failed to save mark. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this mark?")) return;

    if (!teacherId) {
      toast.error("Cannot delete: Teacher info missing.");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading("Deleting mark...");

      const studentRef = doc(db, "students", student.id);
      const docSnap = await getDoc(studentRef);
      if (!docSnap.exists()) return;

      const allMarks = docSnap.data().marks || [];
      const teacherMarks = allMarks.filter((m) => m.teacherId === teacherId);

      if (!teacherMarks[index]) {
        toast.error("Mark not found.");
        return;
      }

      // Remove this specific mark
      const markToDelete = teacherMarks[index];
      const updatedMarks = allMarks.filter((m) => m !== markToDelete);

      await updateDoc(studentRef, { marks: updatedMarks });

      toast.dismiss();
      toast.success("Mark deleted successfully!");

      // Refresh local marks
      fetchMarks();

      onMarkAdded?.();
    } catch (err) {
      console.error("Error deleting mark:", err);
      toast.dismiss();
      toast.error("Failed to delete mark.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (index) => {
    const teacherMarks = teacherId
      ? marks.filter((m) => m.teacherId === teacherId)
      : marks;

    const mark = teacherMarks[index];
    if (mark) {
      setSubject(mark.subject);
      setScore(mark.score.toString());
      setEditingIndex(index);
    }
  };

  const resetForm = () => {
    setSubject("");
    setScore("");
    setEditingIndex(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 text-white bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <NotebookPen className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold tracking-wide">
              Manage Marks
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-md p-1 transition hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Student Info */}
        <div className="px-5 pt-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100">
              <BadgeCheck className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="truncate text-sm font-semibold text-slate-900">
                {student.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {editingIndex !== null
                  ? "Editing existing mark"
                  : "Add new mark below"}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Marks List */}
        <div className="px-5 py-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Your Assigned Marks
          </h3>
          {loadingMarks ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : marks.length === 0 ? (
            <p className="text-xs text-slate-500">
              No marks assigned by you yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {marks.map((mark, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-900">
                      {mark.subject}
                    </span>
                    : <span className="text-slate-700">{mark.score}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({new Date(mark.date).toLocaleDateString()})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(index)}
                      disabled={submitting}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      aria-label="Edit mark"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      disabled={submitting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      aria-label="Delete mark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-5 py-5 border-t bg-slate-50"
        >
          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Subject
            </label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="subject"
                type="text"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-xl border bg-white px-9 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
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
              <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="score"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 85"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                disabled={submitting}
                className="w-full rounded-xl border bg-white px-9 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Enter whole or decimal scores.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingIndex !== null ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <NotebookPen className="h-4 w-4" />
                  {editingIndex !== null ? "Update Mark" : "Add Mark"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MarkModal;
