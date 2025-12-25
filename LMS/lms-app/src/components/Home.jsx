// src/pages/Home.jsx (or wherever your student dashboard is) - Updated with Sonner toast notifications

import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  documentId,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import TeacherModal from "../components/TeacherModal.jsx";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner"; // <-- Added

// Icons
import {
  User,
  School,
  Cake,
  Phone,
  MapPin,
  Users,
  Megaphone,
  NotebookPen,
  BookOpen,
  Bell,
  Mail,
  MessageCircle,
  X,
  Link as LinkIcon,
  LogOut,
  ExternalLink,
  Bot,
} from "lucide-react";

// ⚠️ Never ship API keys in production - move to env vars!
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY ||
    "AIzaSyDk6Wr9FzQKlnVFG87fpRNawtmOOujAvSM"
);

const subjectHue = (s = "") => {
  const t = s.toLowerCase();
  if (t.includes("math")) return "indigo";
  if (t.includes("science") || t.includes("biology") || t.includes("physics"))
    return "emerald";
  if (t.includes("english")) return "violet";
  if (t.includes("history")) return "amber";
  if (t.includes("ict") || t.includes("it") || t.includes("computer"))
    return "cyan";
  return "sky";
};

const badgeByHue = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
};

const chipByHue = {
  blue: "bg-blue-50 ring-blue-200 text-blue-700",
  indigo: "bg-indigo-50 ring-indigo-200 text-indigo-700",
  sky: "bg-sky-50 ring-sky-200 text-sky-700",
  violet: "bg-violet-50 ring-violet-200 text-violet-700",
  cyan: "bg-cyan-50 ring-cyan-200 text-cyan-700",
  emerald: "bg-emerald-50 ring-emerald-200 text-emerald-700",
  amber: "bg-amber-50 ring-amber-200 text-amber-700",
};

function Home() {
  const [profile, setProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [notices, setNotices] = useState({});
  const [homework, setHomework] = useState({});
  const [materials, setMaterials] = useState({});
  const [marks, setMarks] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hi! Ask me anything about your subjects." },
  ]);
  const [userInput, setUserInput] = useState("");

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const openModal = useCallback((t) => {
    setSelectedTeacher(t);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
    document.body.style.overflow = "";
  }, []);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setUserInput("");

    toast.loading("Thinking...", { id: "ai-thinking" });

    try {
      const subjects = teachers
        .map((t) => t.subjects || t.courseName)
        .filter(Boolean)
        .join(", ");
      const context = `The student studies: ${
        subjects || "general subjects"
      }. Answer briefly and helpfully.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        `${context}\n\nQ: ${userMessage}`
      );

      const reply =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response.";

      toast.dismiss("ai-thinking");
      toast.success("Response received!");

      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      console.error("AI Chat error:", err);
      toast.dismiss("ai-thinking");
      toast.error("Failed to get response. Try again later.");

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong. Try again later.",
        },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      toast.error("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    if (isModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, closeModal]);

  // Determine if content is visible to this student
  const isVisibleToStudent = (item, studentGrade) => {
    if (
      !item.grades ||
      !Array.isArray(item.grades) ||
      item.grades.length === 0
    ) {
      return true;
    }
    return item.grades.includes(studentGrade);
  };

  const formatGrades = (grades) => {
    if (!grades || grades.length === 0) return "";
    return grades.join(", ");
  };

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const studentSnap = await getDoc(doc(db, "students", user.uid));
        if (!studentSnap.exists()) {
          toast.error("No student profile found.");
          console.warn("No student profile found");
          return;
        }

        const studentData = studentSnap.data();
        if (isMounted) {
          setProfile(studentData);
          setMarks(studentData.marks || []);
        }

        const rawGrade = studentData.grade || studentData.course || "";
        const studentGrade = rawGrade.startsWith("Grade ")
          ? rawGrade
          : `Grade ${rawGrade}`;

        const isPending =
          (studentData.status || "").toLowerCase() === "pending";

        // Get teacher IDs
        const rawTeachers = Array.isArray(studentData.preferredTeachers)
          ? studentData.preferredTeachers
          : [];
        const teacherIds = rawTeachers
          .map((t) => (typeof t === "string" ? t : t?.preferredTeacherId))
          .filter(Boolean);

        if (teacherIds.length === 0) {
          if (isMounted) setTeachers([]);
          return;
        }

        // Fetch teachers in chunks
        let fetchedTeachers = [];
        const chunks = [];
        for (let i = 0; i < teacherIds.length; i += 10) {
          chunks.push(teacherIds.slice(i, i + 10));
        }

        const results = await Promise.all(
          chunks.map(async (ids) => {
            const q = query(
              collection(db, "teachers"),
              where(documentId(), "in", ids)
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );
        fetchedTeachers = results.flat();

        if (isMounted) {
          setTeachers(fetchedTeachers);
          toast.success(`Loaded ${fetchedTeachers.length} teacher(s)`);
        }

        if (!isPending) {
          const fetchAndFilter = async (colName, setter, teacherId) => {
            try {
              const q = query(
                collection(db, colName),
                where("teacherId", "==", teacherId),
                limit(50)
              );
              const snap = await getDocs(q);
              if (!isMounted) return;

              let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              list = list.filter((item) =>
                isVisibleToStudent(item, studentGrade)
              );
              list.sort(
                (a, b) =>
                  (b.createdAt?.toMillis?.() ?? 0) -
                  (a.createdAt?.toMillis?.() ?? 0)
              );

              setter((prev) => ({ ...prev, [teacherId]: list }));
            } catch (e) {
              console.error(`Failed to load ${colName}:`, e);
              setter((prev) => ({ ...prev, [teacherId]: [] }));
            }
          };

          await Promise.all(
            fetchedTeachers.map((t) =>
              Promise.all([
                fetchAndFilter("homework", setHomework, t.id),
                fetchAndFilter("materials", setMaterials, t.id),
                fetchAndFilter("notices", setNotices, t.id),
              ])
            )
          );
        } else {
          setHomework({});
          setMaterials({});
          setNotices({});
          toast.info(
            "Your account is pending approval. Content will appear soon."
          );
        }
      } catch (err) {
        console.error("Error loading student dashboard:", err);
        toast.error("Failed to load dashboard data.");
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigate]);

  if (!profile)
    return (
      <div className="min-h-screen relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-blue-100" />
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100"
              >
                <div className="mb-4 h-6 w-40 animate-pulse rounded bg-sky-100" />
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-blue-50" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-indigo-50" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-cyan-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  const isPending = (profile.status || "").toLowerCase() === "pending";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Student Portal
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/ask")}
              className="group flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 via-40% to-indigo-600" />
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Profile Welcome */}
        <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-blue-100 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-100 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-violet-100 blur-2xl" />
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <img
                src={profile.studentImage || "https://via.placeholder.com/112"}
                alt="profile"
                className="h-28 w-28 rounded-full border-4 border-blue-500 object-cover shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white shadow">
                {profile.status || "Active"}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome, {profile.fullName}
              </h2>
              <div className="mt-3 grid gap-2 text-slate-700 sm:grid-cols-2">
                <InfoRow
                  icon={<School className="h-4 w-4 text-indigo-600" />}
                  text={profile.course || profile.grade}
                />
                <InfoRow
                  icon={<User className="h-4 w-4 text-blue-600" />}
                  text={`ID: ${profile.studentId}`}
                />
                <InfoRow
                  icon={<Cake className="h-4 w-4 text-violet-600" />}
                  text={`DOB: ${profile.birthday}`}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4 text-cyan-600" />}
                  text={profile.contactNumber}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4 text-emerald-600" />}
                  text={`Guardian: ${profile.guardianName}`}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4 text-amber-600" />}
                  text={profile.address}
                  clamp
                />
              </div>
            </div>
          </div>
        </section>

        {/* Teachers & Content */}
        <div className="space-y-10">
          {teachers.map((teacher) => {
            const hue = subjectHue(
              teacher.subjects || teacher.courseName || ""
            );
            const badge = badgeByHue[hue] || badgeByHue.sky;
            const chip = chipByHue[hue] || chipByHue.sky;

            return (
              <section key={teacher.id} className="space-y-6">
                <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-4 h-1 w-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <User className="h-5 w-5 text-blue-600" />
                      Teacher
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${badge}`}
                    >
                      {teacher.subjects || teacher.courseName || "Subject"}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <button
                      onClick={() => openModal(teacher)}
                      className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 ring-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      title="View teacher profile"
                    >
                      <img
                        src={
                          teacher.imageUrl || "https://via.placeholder.com/80"
                        }
                        alt={teacher.fullName}
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div className="flex-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {teacher.fullName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-700">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${chip}`}
                        >
                          <Mail className="h-3.5 w-3.5 opacity-80" />
                          {teacher.email}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs ring-1 ring-slate-200">
                          <School className="h-3.5 w-3.5 text-slate-500" />
                          {profile.grade || profile.course}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isPending ? (
                  <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center shadow-sm ring-1 ring-amber-200">
                    <Bell className="mx-auto h-12 w-12 text-amber-600" />
                    <h4 className="mt-4 text-lg font-semibold text-slate-900">
                      Account Pending Approval
                    </h4>
                    <p className="mt-2 text-slate-700">
                      Content will appear once your account is approved.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Homework */}
                    <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-sky-100">
                      <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <NotebookPen className="h-5 w-5 text-sky-600" />
                        Homework
                      </h4>
                      {homework[teacher.id]?.length > 0 ? (
                        <ul className="space-y-3">
                          {homework[teacher.id].map((hw) => (
                            <li
                              key={hw.id}
                              className="rounded-lg border border-sky-100 bg-sky-50/70 px-4 py-3"
                            >
                              <p className="text-sm text-slate-900">
                                {hw.task}
                              </p>
                              {hw.grades && hw.grades.length > 0 && (
                                <p className="mt-2 text-xs text-sky-600">
                                  For:{" "}
                                  <strong>{formatGrades(hw.grades)}</strong>
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState
                          icon={
                            <NotebookPen className="h-5 w-5 text-sky-600" />
                          }
                          label="No homework for your grade"
                        />
                      )}
                    </div>

                    {/* Materials */}
                    <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-indigo-100">
                      <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        Learning Materials
                      </h4>
                      {materials[teacher.id]?.length > 0 ? (
                        <ul className="space-y-3">
                          {materials[teacher.id].map((m) => (
                            <li key={m.id}>
                              <a
                                href={m.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 transition hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-slate-900 truncate">
                                      {m.title}
                                    </span>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-slate-400" />
                                </div>
                                {m.grades && m.grades.length > 0 && (
                                  <p className="mt-2 text-xs text-indigo-600">
                                    For:{" "}
                                    <strong>{formatGrades(m.grades)}</strong>
                                  </p>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState
                          icon={
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          }
                          label="No materials for your grade"
                        />
                      )}
                    </div>

                    {/* Notices */}
                    <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-amber-100">
                      <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Bell className="h-5 w-5 text-amber-600" />
                        Notices
                      </h4>
                      {notices[teacher.id]?.length > 0 ? (
                        <ul className="space-y-3">
                          {notices[teacher.id].map((n) => (
                            <li
                              key={n.id}
                              className="rounded-lg border border-amber-100 bg-amber-50/70 px-4 py-3"
                            >
                              <p className="text-sm text-slate-900">
                                {n.content}
                              </p>
                              {n.grades && n.grades.length > 0 && (
                                <p className="mt-2 text-xs text-amber-700">
                                  For: <strong>{formatGrades(n.grades)}</strong>
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState
                          icon={
                            <Megaphone className="h-5 w-5 text-amber-600" />
                          }
                          label="No notices for your grade"
                        />
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {teachers.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-blue-200">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No teachers linked yet
              </h3>
              <p className="mt-1 text-slate-600">
                Once teachers are assigned, their content will appear here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open AI Chat"
        title="Ask AI Assistant"
      >
        <Bot className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-blue-400 opacity-75"></span>
      </button>

      {/* Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[22rem] overflow-hidden rounded-2xl border bg-white shadow-2xl ring-1 ring-blue-100">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5" />
              AI Assistant
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === "user"
                    ? "self-end bg-blue-600 text-white"
                    : "self-start bg-gray-100 text-slate-800"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your lessons..."
                className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={sendMessage}
                className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {isModalOpen && selectedTeacher && (
        <TeacherModal teacher={selectedTeacher} onClose={closeModal} />
      )}
    </div>
  );
}

function InfoRow({ icon, text, clamp = false }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-sm ${clamp ? "truncate" : ""}`}>
        {text || "—"}
      </span>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 to-indigo-50/30 px-6 py-8 text-center text-slate-600 ring-1 ring-blue-100">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-blue-100">
        {icon}
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default Home;
