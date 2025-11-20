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
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

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
} from "lucide-react";

export default function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [teacherId, setTeacherId] = useState(""); // for sending
  const [filterTeacherId, setFilterTeacherId] = useState(""); // for viewing
  const [studentData, setStudentData] = useState(null);
  const [teachers, setTeachers] = useState([]); // only registered teachers
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredTeacherIds, setRegisteredTeacherIds] = useState([]); // new
  const navigate = useNavigate();

  // Fetch logged-in student details + their registered teachers
  useEffect(() => {
    const fetchStudentData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "students", user.uid));
        if (!snap.exists()) return;

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
      } catch (err) {
        console.error("Failed to get student data:", err);
      }
    };
    fetchStudentData();
  }, [navigate]);

  // Fetch only the teachers registered by the student
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

        const merged = results.flat();
        setTeachers(merged);
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
      }
    };

    fetchTeachersByIds();
  }, [registeredTeacherIds]);

  // Fetch ALL questions addressed to the student's registered teachers
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
          const ta = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt || 0).getTime();
          const tb = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });

        setQuestions(list);
      } catch (e) {
        console.error("Error fetching questions by teachers:", e);
      }
    };

    run();
  }, [registeredTeacherIds, filterTeacherId, db]);

  // Submit question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return alert("Please enter your question.");
    if (!teacherId) return alert("Please select a teacher.");
    if (!studentData) return alert("Failed to load student details.");

    setLoading(true);
    try {
      const selectedTeacher = teachers.find((t) => t.id === teacherId);

      const docRef = await addDoc(collection(db, "questions"), {
        question,
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
            question,
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

      setQuestion("");
      setTeacherId("");
    } catch (err) {
      console.error("Error sending question:", err);
      alert("Failed to send question.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
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

        {/* Composer card */}
        <div className="mb-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2 text-slate-800">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold">Compose</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            {/* Teacher selection */}
            <label className="text-sm font-medium text-slate-700">
              Select a teacher
            </label>
            <div className="relative">
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
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

            {/* Question textarea */}
            <label className="text-sm font-medium text-slate-700">
              Your question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here"
              className="min-h-32 w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
            />

            {/* Submit */}
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

        {/* Filters */}
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
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {questions.map((q) => (
                  <li key={q.id} className="rounded-2xl border bg-slate-50 p-4">
                    {/* Student question bubble */}
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
                        </div>
                        <div className="mt-2 max-w-full rounded-2xl bg-white px-3 py-2 text-slate-800 shadow-sm">
                          {q.question}
                        </div>
                      </div>
                    </div>

                    {/* Teacher reply bubble */}
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

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Status:{" "}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                          {q.status || "pending"}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <UserCircle2 className="h-4 w-4" />
                        {q.teacherName}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: keep questions short and specific for faster replies.
        </p>
      </div>
    </div>
  );
}
