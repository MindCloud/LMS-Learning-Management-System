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
  LogOut, // <-- added
} from "lucide-react";

// ⚠️ Do not ship API keys in client code in production.
const genAI = new GoogleGenerativeAI("AIzaSyDk6Wr9FzQKlnVFG87fpRNawtmOOujAvSM");

/* ---------- small helpers for color accents ---------- */
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

    try {
      const subjects = teachers.map((t) => t.subject || t.courseName).join(", ");
      const context = `The student studies: ${subjects}. Answer briefly.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${context}\n\nQ: ${userMessage}` }] }],
      });

      const reply =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || "—";
      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong. Try again later." },
      ]);
    }
  };

  // --- NEW: logout handler ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    if (isModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, closeModal]);

  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // 1) student profile
        const studentSnap = await getDoc(doc(db, "students", user.uid));
        if (!studentSnap.exists()) return;

        const studentData = studentSnap.data();
        if (isMounted) {
          setProfile(studentData);
          setMarks(studentData.marks || []);
        }

        // 2) resolve teacherIds
        const raw = Array.isArray(studentData.preferredTeachers)
          ? studentData.preferredTeachers
          : [];
        const teacherIds = raw
          .map((t) => (typeof t === "string" ? t : t?.preferredTeacherId))
          .filter(Boolean);

        if (teacherIds.length === 0) {
          if (isMounted) setTeachers([]);
          return;
        }

        // 3) fetch teachers
        let fetchedTeachers = [];
        if (teacherIds.length <= 10) {
          const tq = query(
            collection(db, "teachers"),
            where(documentId(), "in", teacherIds)
          );
          const ts = await getDocs(tq);
          fetchedTeachers = ts.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else {
          const chunks = [];
          for (let i = 0; i < teacherIds.length; i += 10) {
            chunks.push(teacherIds.slice(i, i + 10));
          }
          const results = await Promise.all(
            chunks.map(async (ids) => {
              const tq = query(
                collection(db, "teachers"),
                where(documentId(), "in", ids)
              );
              const ts = await getDocs(tq);
              return ts.docs.map((d) => ({ id: d.id, ...d.data() }));
            })
          );
          fetchedTeachers = results.flat();
        }

        if (isMounted) setTeachers(fetchedTeachers);

        const fetchCollection = async (colName, setter, teacherId) => {
          try {
            const q1 = query(
              collection(db, colName),
              where("teacherId", "==", teacherId),
              limit(50)
            );
            const snap = await getDocs(q1);
            if (!isMounted) return;

            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort(
              (a, b) =>
                (b.createdAt?.toMillis?.() ?? 0) -
                (a.createdAt?.toMillis?.() ?? 0)
            );
            setter((prev) => ({ ...prev, [teacherId]: list }));
          } catch (e) {
            console.error(`Failed to load ${colName} for ${teacherId}:`, e);
            setter((prev) => ({ ...prev, [teacherId]: [] }));
          }
        };

        await Promise.all(
          fetchedTeachers.map((t) =>
            Promise.all([
              fetchCollection("homework", setHomework, t.id),
              fetchCollection("materials", setMaterials, t.id),
              fetchCollection("notices", setNotices, t.id),
            ])
          )
        );
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigate]);

  // Loading skeleton (multi-hue, blue-forward)
  if (!profile)
    return (
      <div className="min-h-screen relative overflow-hidden p-6">
        {/* background accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-blue-100" />
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* soft color blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-100 blur-3xl" />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Student Portal
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="group flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-expanded={chatOpen}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            {/* NEW: Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* multicolor brand ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 via-40% to-indigo-600" />
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Welcome */}
        <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-blue-100 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-100 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-violet-100 blur-2xl" />
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center relative">
            <div className="relative">
              <img
                src={profile.studentImage}
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
                <InfoRow icon={<School className="h-4 w-4 text-indigo-600" />} text={profile.course} />
                <InfoRow icon={<User className="h-4 w-4 text-blue-600" />} text={`Student ID: ${profile.studentId}`} />
                <InfoRow icon={<Cake className="h-4 w-4 text-violet-600" />} text={`Birthday: ${profile.birthday}`} />
                <InfoRow icon={<Phone className="h-4 w-4 text-cyan-600" />} text={`Contact: ${profile.contactNumber}`} />
                <InfoRow icon={<Users className="h-4 w-4 text-emerald-600" />} text={`Guardian: ${profile.guardianName}`} />
                <InfoRow icon={<MapPin className="h-4 w-4 text-amber-600" />} text={profile.address} clamp />
              </div>
            </div>
          </div>
        </section>

        {/* Teachers and content */}
        <div className="space-y-10">
          {teachers.map((teacher) => {
            const hue = subjectHue(teacher.subjects || teacher.courseName || "");
            const badge = badgeByHue[hue] || badgeByHue.sky;
            const chip = chipByHue[hue] || chipByHue.sky;

            return (
              <section key={teacher.id} className="space-y-6">
                {/* Teacher card */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  {/* gradient top border */}
                  <div className="mb-4 h-1 w-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <User className="h-5 w-5 text-blue-600" />
                      Teacher
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${badge}`}>
                      {teacher.subjects || teacher.courseName || "Subject"}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => openModal(teacher)}
                      className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                      aria-label={`View profile of ${teacher.fullName}`}
                      title="View teacher profile"
                    >
                      <img
                        src={teacher.imageUrl}
                        alt={teacher.fullName}
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div className="flex-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {teacher.fullName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-700">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${chip}`}>
                          <Mail className="h-3.5 w-3.5 opacity-80" />
                          {teacher.email}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs ring-1 ring-slate-200">
                          <School className="h-3.5 w-3.5 text-slate-500" />
                          {profile.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Homework (sky/cyan) */}
                  <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-sky-100">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <NotebookPen className="h-5 w-5 text-sky-600" />
                        Homework
                      </h4>
                    </div>
                    {homework[teacher.id]?.length ? (
                      <ul className="space-y-2 text-slate-800">
                        {homework[teacher.id].map((hw) => (
                          <li
                            key={hw.id}
                            className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                              <span className="flex-1">{hw.task}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={<NotebookPen className="h-5 w-5 text-sky-600" />}
                        label="No homework assigned yet"
                      />
                    )}
                  </div>

                  {/* Materials (indigo/violet) */}
                  <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-indigo-100">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        Learning Materials
                      </h4>
                    </div>
                    {materials[teacher.id]?.length ? (
                      <ul className="space-y-2">
                        {materials[teacher.id].map((m) => (
                          <li key={m.id}>
                            <a
                              href={m.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2 text-slate-900 transition hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200"
                            >
                              <LinkIcon className="h-4 w-4 text-violet-600 transition group-hover:translate-x-0.5" />
                              <span className="truncate underline-offset-2 group-hover:underline">
                                {m.title}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
                        label="No materials uploaded yet"
                      />
                    )}
                  </div>

                  {/* Notices (amber) */}
                  <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-amber-100">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Bell className="h-5 w-5 text-amber-600" />
                        Notices
                      </h4>
                    </div>
                    {notices[teacher.id]?.length ? (
                      <ul className="space-y-2 text-slate-800">
                        {notices[teacher.id].map((n) => (
                          <li
                            key={n.id}
                            className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                              <span className="flex-1">{n.content}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={<Megaphone className="h-5 w-5 text-amber-600" />}
                        label="No notices posted yet"
                      />
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          {/* No teachers state */}
          {teachers.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm ring-1 ring-blue-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-blue-200">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No teachers linked yet
              </h3>
              <p className="mt-1 text-slate-600">
                Once your preferred teachers are added, their homework,
                materials, and notices will appear here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Teacher modal */}
      {isModalOpen && selectedTeacher && (
        <TeacherModal teacher={selectedTeacher} onClose={closeModal} />
      )}

      {/* Chat widget */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-30 w-[22rem] overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-blue-100">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <MessageCircle className="h-5 w-5" />
              AI Chatbot
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded p-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close chat"
              title="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex max-h-80 min-h-[14rem] flex-col gap-2 overflow-y-auto p-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender === "user"
                    ? "self-end bg-blue-600 text-white"
                    : "self-start border bg-violet-50/50 ring-1 ring-violet-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t p-2">
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Ask about your subject"
            />
            <button
              onClick={sendMessage}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <MessageCircle className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small presentational helpers */
function InfoRow({ icon, text, clamp = false }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={clamp ? "line-clamp-1" : ""}>{text}</span>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-violet-50/40 px-3 py-3 text-slate-600 ring-1 ring-blue-100">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-blue-100">
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default Home;
