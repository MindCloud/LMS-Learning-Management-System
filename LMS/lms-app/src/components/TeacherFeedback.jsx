// src/components/TeacherFeedback.jsx (updated with Dashboard back button + Sonner toasts)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- Added
import { auth, db } from "../firebase";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { toast } from "sonner"; // <-- Added for professional toasts

// Icons
import {
  Stars,
  UserCircle2,
  GraduationCap,
  BadgeCheck,
  Loader2,
  Star,
  MessageSquareText,
  ArrowLeft, // <-- Added for back button
} from "lucide-react";

const TeacherFeedback = () => {
  const [teacher, setTeacher] = useState(null);
  const [formData, setFormData] = useState({ feedback: "", rating: 5 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- For navigation

  // 🔹 Fetch logged-in teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("You must be logged in to submit feedback.");
          setLoading(false);
          return;
        }

        const teacherRef = doc(db, "teachers", user.uid);
        const teacherSnap = await getDoc(teacherRef);

        if (teacherSnap.exists()) {
          setTeacher(teacherSnap.data());
        } else {
          toast.error("Teacher profile not found.");
        }
      } catch (err) {
        console.error("Error fetching teacher:", err);
        toast.error("Failed to load teacher profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // 🔹 Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teacher) {
      toast.error("No teacher data available.");
      return;
    }

    if (!formData.feedback.trim()) {
      toast.error("Please write some feedback before submitting.");
      return;
    }

    try {
      await addDoc(collection(db, "feedback"), {
        teacherId: auth.currentUser.uid,
        fullName: teacher.fullName,
        role: teacher.role,
        subject: teacher.subjects,
        imageUrl: teacher.imageUrl,
        feedback: formData.feedback.trim(),
        rating: Number(formData.rating),
        createdAt: new Date(),
      });

      toast.success(
        "Thank you! Your feedback has been submitted successfully."
      );
      setFormData({ feedback: "", rating: 5 });
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard"); // Adjust path if your teacher dashboard is different
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading teacher profile...</p>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border bg-white/90 shadow-lg backdrop-blur"
      >
        {/* Header with Back Button */}
        <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Stars className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Teacher Feedback
              </h2>
            </div>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-6">
          {/* Teacher Details */}
          {teacher && (
            <div className="flex items-center gap-4">
              <div className="relative">
                {teacher.imageUrl ? (
                  <img
                    src={teacher.imageUrl}
                    alt={teacher.fullName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white shadow">
                    <UserCircle2 className="h-9 w-9 text-slate-500" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">
                  {teacher.fullName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                    {teacher.role || "Teacher"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                    <MessageSquareText className="h-3.5 w-3.5 text-slate-500" />
                    {teacher.subjects || "General"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Textarea */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Your Feedback
            </label>
            <div className="relative">
              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                required
                rows="5"
                maxLength={500}
                placeholder="Share constructive and specific feedback to help improve teaching..."
                className="w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-300"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400">
                {formData.feedback.length}/500
              </span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Overall Rating
            </label>

            <div className="relative">
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-300"
              >
                {[5, 4, 3, 2, 1].map((num) => (
                  <option key={num} value={num}>
                    {num} Star{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <Stars className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-500" />
            </div>

            {/* Visual Stars */}
            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 transition-colors ${
                    Number(formData.rating) >= i
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
              <span className="ml-3 text-base font-medium text-slate-700">
                {formData.rating}/5
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t bg-slate-50/50 px-6 py-4">
          <p className="text-xs text-slate-500">
            Your feedback is anonymous and helps us improve.
          </p>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <Stars className="h-4 w-4" />
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherFeedback;
