import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // your Firebase config
import { collection, addDoc, getDoc, doc } from "firebase/firestore";

// Icons
import {
  Stars,
  UserCircle2,
  GraduationCap,
  BadgeCheck,
  Loader2,
  Star,
  MessageSquareText,
} from "lucide-react";

const TeacherFeedback = () => {
  const [teacher, setTeacher] = useState(null);
  const [formData, setFormData] = useState({ feedback: "", rating: 5 });
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch logged-in teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const teacherRef = doc(db, "teachers", user.uid);
        const teacherSnap = await getDoc(teacherRef);

        if (teacherSnap.exists()) setTeacher(teacherSnap.data());
      } catch (err) {
        console.error("Error fetching teacher:", err);
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
    if (!teacher) return alert("No teacher data found!");

    try {
      await addDoc(collection(db, "feedback"), {
        teacherId: auth.currentUser.uid,
        fullName: teacher.fullName,
        role: teacher.role,
        subject: teacher.subjects,
        imageUrl: teacher.imageUrl,
        feedback: formData.feedback,
        rating: formData.rating,
        createdAt: new Date(),
      });

      alert("Feedback submitted successfully!");
      setFormData({ feedback: "", rating: 5 });
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback.");
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading</p>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border bg-white/90 shadow-sm backdrop-blur"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Stars className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Teacher Feedback
            </h2>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            {new Date().toLocaleDateString()}
          </span>
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
                    alt="Profile"
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
                    {teacher.subjects || "Subject"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Feedback
            </label>
            <div className="relative">
              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                required
                rows="5"
                maxLength={500}
                placeholder="Write constructive, specific feedback"
                className="w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-purple-300"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400">
                {formData.feedback.length}/500
              </span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Rating
            </label>

            {/* Native select (kept for form logic) */}
            <div className="relative">
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:ring-2 focus:ring-purple-300"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} Star{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <Stars className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Visual star preview (read-only, mirrors select value) */}
            <div className="mt-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    Number(formData.rating) >= i
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-slate-600">
                {formData.rating}/5
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <p className="text-xs text-slate-500">
            Be respectful and keep it under 500 characters.
          </p>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
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
