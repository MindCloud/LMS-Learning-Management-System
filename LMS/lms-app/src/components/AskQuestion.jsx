// src/pages/AskQuestion.jsx (or wherever this component lives) - Updated with Sonner toasts

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  documentId,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // <-- Added

// Icons
import {
  Send,
  User,
  GraduationCap,
  Filter,
  Loader2,
  MessageSquare,
  Reply,
  UserCircle2,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

export default function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredTeacherIds, setRegisteredTeacherIds] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editText, setEditText] = useState("");
  const navigate = useNavigate();

  // Fetch student data + registered teachers
  useEffect(() => {
    const fetchStudentData = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to ask questions.");
        navigate("/login");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "students", user.uid));
        if (!snap.exists()) {
          toast.error("Student profile not found.");
          return;
        }

        const data = snap.data();
        setStudentData({
          name: data.fullName || "Unknown Student",
          image: data.studentImage || null,
        });

        const raw = Array.isArray(data.preferredTeachers)
          ? data.preferredTeachers
          : [];
        const ids = raw
          .map((t) => (typeof t === "string" ? t : t?.preferredTeacherId))
          .filter(Boolean);
        setRegisteredTeacherIds(ids);

        if (ids.length === 0) {
          toast.info("You haven't registered with any teachers yet.");
        }
      } catch (err) {
        console.error("Failed to get student data:", err);
        toast.error("Failed to load your profile.");
      }
    };
    fetchStudentData();
  }, [navigate]);

  // Fetch teachers by registered IDs
  useEffect(() => {
    const fetchTeachersByIds = async () => {
      if (registeredTeacherIds.length === 0) {
        setTeachers([]);
        return;
      }

      try {
        const chunks = [];
        for (let i = 0; i < registeredTeacherIds.length; i += 10) {
          chunks.push(registeredTeacherIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (batch) => {
            const qRef = query(
              collection(db, "teachers"),
              where(documentId(), "in", batch)
            );
            const snap = await getDocs(qRef);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );

        setTeachers(results.flat());
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
        toast.error("Failed to load teachers.");
      }
    };
    fetchTeachersByIds();
  }, [registeredTeacherIds]);

  // Fetch questions
  useEffect(() => {
    const run = async () => {
      if (!registeredTeacherIds || registeredTeacherIds.length === 0) {
        setQuestions([]);
        return;
      }

      try {
        const targetIds = filterTeacherId
          ? [filterTeacherId]
          : registeredTeacherIds;

        const chunks = [];
        for (let i = 0; i < targetIds.length; i += 10) {
          chunks.push(targetIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (batch) => {
            const qRef = query(
              collection(db, "questions"),
              where("teacherId", "in", batch)
            );
            const snap = await getDocs(qRef);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );

        const merged = new Map();
        for (const item of results.flat()) merged.set(item.id, item);

        const list = Array.from(merged.values()).sort((a, b) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt || 0);
          const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt || 0);
          return tb.getTime() - ta.getTime();
        });

        setQuestions(list);
      } catch (e) {
        console.error("Error fetching questions:", e);
        toast.error("Failed to load your questions.");
      }
    };
    run();
  }, [registeredTeacherIds, filterTeacherId]);

  // Submit new question
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Please enter your question.");
      return;
    }
    if (!teacherId) {
      toast.error("Please select a teacher.");
      return;
    }
    if (!studentData) {
      toast.error("Student details not loaded.");
      return;
    }

    setLoading(true);
    toast.loading("Sending your question...");

    try {
      const selectedTeacher = teachers.find((t) => t.id === teacherId);

      const docRef = await addDoc(collection(db, "questions"), {
        question: question.trim(),
        studentId: auth.currentUser.uid,
        studentName: studentData.name,
        studentImage: studentData.image,
        teacherId,
        teacherName: selectedTeacher?.fullName || "Teacher",
        teacherImage: selectedTeacher?.imageUrl || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      const matches = !filterTeacherId || filterTeacherId === teacherId;
      if (matches) {
        setQuestions((prev) => [
          {
            id: docRef.id,
            question: question.trim(),
            studentId: auth.currentUser.uid,
            studentName: studentData.name,
            studentImage: studentData.image,
            teacherId,
            teacherName: selectedTeacher?.fullName || "Teacher",
            teacherImage: selectedTeacher?.imageUrl || null,
            status: "pending",
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }

      toast.dismiss();
      toast.success("Question sent successfully!");

      setQuestion("");
      setTeacherId("");
    } catch (err) {
      console.error("Error sending question:", err);
      toast.dismiss();
      toast.error("Failed to send question. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (q) => {
    setEditingQuestionId(q.id);
    setEditText(q.question);
  };

  // Save edited question
  const saveEdit = async (qId) => {
    if (!editText.trim()) {
      toast.error("Question cannot be empty.");
      return;
    }

    toast.loading("Updating question...");

    try {
      const qRef = doc(db, "questions", qId);
      await updateDoc(qRef, { question: editText.trim() });

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId ? { ...q, question: editText.trim() } : q
        )
      );

      toast.dismiss();
      toast.success("Question updated!");

      setEditingQuestionId(null);
      setEditText("");
    } catch (err) {
      console.error("Error updating question:", err);
      toast.dismiss();
      toast.error("Failed to update question.");
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditText("");
  };

  // Delete question
  const handleDelete = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    toast.loading("Deleting question...");

    try {
      await deleteDoc(doc(db, "questions", qId));
      setQuestions((prev) => prev.filter((q) => q.id !== qId));

      toast.dismiss();
      toast.success("Question deleted.");
    } catch (err) {
      console.error("Error deleting question:", err);
      toast.dismiss();
      toast.error("Failed to delete question.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            <MessageSquare className="h-6 w-6 text-slate-600" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Ask Your Teacher
            </h2>
          </div>
          {studentData && (
            <div className="flex items-center gap-3">
              <img
                src={
                  studentData.image ||
                  "https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png"
                }
                alt={studentData.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow"
              />
              <span className="hidden text-sm text-slate-700 sm:block">
                {studentData.name}
              </span>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mb-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2 text-slate-800">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold">Compose</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            <label className="text-sm font-medium text-slate-700">
              Select a teacher
            </label>
            <div className="relative">
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select a teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} {t.subjects ? `- ${t.subjects}` : ""}
                  </option>
                ))}
              </select>
              <User className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>

            <label className="text-sm font-medium text-slate-700">
              Your question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here"
              required
              className="min-h-32 w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4 text-slate-500" />
            Filter by teacher
          </span>
          <div className="relative">
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-56 appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-300"
            >
              <option value="">All</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
            <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Conversations */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2 text-slate-800">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-semibold">Your Conversations</h3>
            </div>
          </div>

          <div className="p-5">
            {questions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-slate-50 px-4 py-6 text-slate-500">
                <MessageSquare className="h-5 w-5" />
                <p className="text-sm">
                  {registeredTeacherIds.length === 0
                    ? "Register with a teacher to start asking questions."
                    : "No questions yet. Send one above!"}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {questions.map((q) => {
                  const isEditing = editingQuestionId === q.id;
                  const isOwnQuestion = q.studentId === auth.currentUser?.uid;

                  return (
                    <li
                      key={q.id}
                      className="rounded-2xl border bg-slate-50 p-4"
                    >
                      {/* Student question */}
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            q.studentImage ||
                            "https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png"
                          }
                          alt={q.studentName}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {q.studentName}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              You
                            </span>
                            {isOwnQuestion && !isEditing && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(q)}
                                  className="rounded p-1 text-blue-600 hover:bg-blue-100 transition"
                                  title="Edit question"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(q.id)}
                                  className="rounded p-1 text-red-600 hover:bg-red-100 transition"
                                  title="Delete question"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full rounded-xl border bg-white px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-300"
                                rows={3}
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => saveEdit(q.id)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                                >
                                  <Check className="h-4 w-4" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 max-w-full rounded-2xl bg-white px-3 py-2 text-slate-800 shadow-sm">
                              {q.question}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Teacher reply */}
                      {q.reply && (
                        <div className="mt-4 ml-12 flex items-start gap-3">
                          <img
                            src={
                              q.teacherImage ||
                              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                            }
                            alt={q.teacherName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {q.teacherName}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <Reply className="h-3.5 w-3.5" />
                                Reply
                              </span>
                            </div>
                            <div className="mt-2 max-w-full rounded-2xl bg-white px-3 py-2 text-slate-800 shadow-sm">
                              {q.reply}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <p>
                          Status:{" "}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                            {q.status || "pending"}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4" />
                          {q.teacherName}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: keep questions short and specific for faster replies.
        </p>
      </div>
    </div>
  );
}
