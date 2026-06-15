// src/components/TeacherFeedback.jsx (updated with Dashboard back button + Sonner toasts)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- Added
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  const [hoveredRating, setHoveredRating] = useState(0);
  const navigate = useNavigate(); // <-- For navigation

  // 🔹 Fetch logged-in teacher data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("You must be logged in to submit feedback.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
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
    });

    return () => unsubscribe();
  }, [navigate]);

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
        role: teacher.role || "Teacher",
        subject: teacher.subjects || "General",
        imageUrl: teacher.imageUrl || "",
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
    navigate("/dashboard");
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <p className="font-medium">Loading teacher profile...</p>
        </div>
      </div>
    );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      {/* Decorative Blur Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-900/10 animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-900/10 animate-float-medium" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="group inline-flex items-center gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-800 transition hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Dashboard
          </button>

          <span className="rounded-full bg-purple-50 dark:bg-purple-950/40 px-3.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40 shadow-sm">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Dual-Panel Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left panel: Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-md p-6 sm:p-8"
          >
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Stars className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Submit Teacher Feedback
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share your experiences to help improve student experience.
                  </p>
                </div>
              </div>

              {/* Teacher Info Card Header */}
              {teacher && (
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-900">
                  <div className="relative">
                    {teacher.imageUrl ? (
                      <img
                        src={teacher.imageUrl}
                        alt={teacher.fullName}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 ring-2 ring-purple-100 dark:ring-purple-900 shadow-sm">
                        <UserCircle2 className="h-8 w-8 text-slate-500" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                      <BadgeCheck className="h-2.5 w-2.5 fill-current" />
                      Active
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {teacher.fullName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 border border-purple-100/50 dark:border-purple-900/30">
                        <GraduationCap className="h-3 w-3" />
                        {teacher.role || "Teacher"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 border border-blue-100/50 dark:border-blue-900/30">
                        <MessageSquareText className="h-3 w-3" />
                        {teacher.subjects || "General"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Text Area */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Your Testimonial / Feedback
                </label>
                <div className="relative">
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleChange}
                    required
                    rows="5"
                    maxLength={500}
                    placeholder="Describe your teaching experience, learning outcomes, or classes at EZone..."
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  />
                  <span className="absolute bottom-3 right-3 rounded-md bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/80">
                    {formData.feedback.length}/500
                  </span>
                </div>
              </div>

              {/* Rating Star Selection */}
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Overall Rating
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Click on the stars below to set your overall rating score.
                </p>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isLit =
                      (hoveredRating || Number(formData.rating)) >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() =>
                          setFormData((s) => ({ ...s, rating: starVal }))
                        }
                        onMouseEnter={() => setHoveredRating(starVal)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="group p-0.5 transition-transform hover:scale-115 active:scale-95 focus:outline-none"
                        aria-label={`Select ${starVal} star rating`}
                      >
                        <Star
                          className={`h-9 w-9 transition-all duration-200 ${isLit
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                            : "text-slate-200 dark:text-slate-800 hover:text-slate-300 dark:hover:text-slate-700"
                            }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-0.5 text-sm font-bold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                    {formData.rating} Star{formData.rating > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/85 pt-5">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Feedback will be displayed publicly in EZone community showcases.
              </p>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700 hover:shadow-purple-700/20 focus:outline-none focus:ring-2 focus:ring-purple-500 active:scale-98"
              >
                <Stars className="h-4 w-4" />
                Submit Feedback
              </button>
            </div>
          </form>

          {/* Right panel: Live Preview */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="sticky top-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Live Slider Preview
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20">
                  Homepage render
                </span>
              </div>

              {/* Redesigned Glass Card component */}
              <article className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                {/* Quotation mark decoration */}
                <span className="absolute right-6 top-6 text-7xl font-serif text-slate-200/60 dark:text-slate-800/40 pointer-events-none select-none">
                  “
                </span>

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    {/* User Profile */}
                    <div className="mb-6 flex items-center gap-4">
                      {teacher?.imageUrl ? (
                        <img
                          src={teacher.imageUrl}
                          alt="Teacher avatar"
                          className="h-14 w-14 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-950 shadow-md"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950 ring-4 ring-purple-100 dark:ring-purple-950 shadow-md">
                          <UserCircle2 className="h-8 w-8 text-purple-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {teacher?.fullName || "Educator Name"}
                          </h4>
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 p-0.5 text-emerald-600 dark:text-emerald-400" title="Verified Educator">
                            <BadgeCheck className="h-4 w-4 fill-current" />
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {teacher?.role || "Teacher"}
                          {teacher?.subjects ? ` • ${teacher.subjects}` : " • General"}
                        </p>
                      </div>
                    </div>

                    {/* Feedback content */}
                    <p className="text-slate-750 dark:text-slate-300 italic leading-relaxed break-words min-h-[4rem] text-sm">
                      {formData.feedback.trim()
                        ? `“${formData.feedback}”`
                        : "“Your feedback text will appear here as you type in the form on the left. Tell the students and the EZone community what you think!...”"}
                    </p>
                  </div>

                  {/* Rating display */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i <= formData.rating
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]"
                            : "text-slate-200 dark:text-slate-800"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Educator Review
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeedback;
