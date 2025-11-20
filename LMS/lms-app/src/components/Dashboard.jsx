import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MarkModal from "./MarkModal";
import {
  LayoutDashboard,
  Bell,
  BookOpen,
  NotebookPen,
  MessageSquare,
  Mail,
  User,
  Users,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  BadgeCheck,
  Loader2,
  ArrowRight,
  FileText,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Dashboard() {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [homework, setHomework] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 6;

  const navigate = useNavigate();

  // Sign out -> /login
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Fetch teacher profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "teachers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTeacher(docSnap.data());
        } else {
          console.warn("No teacher profile found for this UID:", user.uid);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch students for this teacher
  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacher) return;

      const q = query(collection(db, "students"));
      const querySnapshot = await getDocs(q);

      const studentList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((student) =>
          student.preferredTeachers?.some(
            (t) => t.preferredTeacherId === auth.currentUser?.uid
          )
        );

      setStudents(studentList);
      setFilteredStudents(studentList);
    };

    fetchStudents();
  }, [teacher]);

  // Fetch Homework, Materials, Notices
  useEffect(() => {
    const fetchData = async () => {
      if (!teacher) return;

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Homework
      const hwQ = query(
        collection(db, "homework"),
        where("teacherId", "==", uid)
      );
      const hwSnap = await getDocs(hwQ);
      setHomework(hwSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // Materials
      const matQ = query(
        collection(db, "materials"),
        where("teacherId", "==", uid)
      );
      const matSnap = await getDocs(matQ);
      setMaterials(matSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // Notices
      const noticeQ = query(
        collection(db, "notices"),
        where("teacherId", "==", uid)
      );
      const noticeSnap = await getDocs(noticeQ);
      const noticeList = noticeSnap.docs
        .map((d) => {
          const data = d.data();
          const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
          return { id: d.id, ...data, _createdAtMs: createdAtMs };
        })
        .sort((a, b) => b._createdAtMs - a._createdAtMs);

      setNotices(noticeList);
    };

    fetchData();
  }, [teacher]);

  // Handle search
  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, students]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  if (!teacher)
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-blue-100">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <p>Loading teacher profile…</p>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-slate-50 to-white">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Teacher Dashboard
              </h1>
              <p className="text-[11px] text-slate-500">
                EZone Institute • Instructor
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <TopLink
              onClick={() => navigate("/notices")}
              icon={<Bell className="h-4 w-4 text-amber-600" />}
              label="Manage Notices"
            />
            <TopLink
              onClick={() => navigate("/materials")}
              icon={<BookOpen className="h-4 w-4 text-indigo-600" />}
              label="Materials"
            />
            <TopLink
              onClick={() => navigate("/homework")}
              icon={<NotebookPen className="h-4 w-4 text-sky-600" />}
              label="Homework"
            />
            <button
              onClick={() => navigate("/questions")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <MessageSquare className="h-4 w-4" />
              Questions
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 via-40% to-indigo-600" />
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Header cards */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="mb-4 flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Profile
              </h2>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-blue-100">
                <User className="h-7 w-7 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {teacher.fullName}
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    {teacher.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-500" />
                    {teacher.subjects || "Subjects not set"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Role: {teacher.role || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    Grade: {teacher.grade || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <h2 className="mb-4 flex items-center gap-3 text-base font-semibold text-slate-900">
              Overview
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Students" value={students.length} />
              <StatCard label="Homework" value={homework.length} />
              <StatCard label="Notices" value={notices.length} />
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <h2 className="mb-4 flex items-center gap-3 text-base font-semibold text-slate-900">
              Shortcuts
            </h2>
            <div className="space-y-2">
              <Shortcut
                icon={<Bell className="h-4 w-4 text-amber-600" />}
                label="Create a new notice"
                onClick={() => navigate("/notices")}
              />
              <Shortcut
                icon={<BookOpen className="h-4 w-4 text-indigo-600" />}
                label="Upload learning material"
                onClick={() => navigate("/materials")}
              />
              <Shortcut
                icon={<NotebookPen className="h-4 w-4 text-sky-600" />}
                label="Assign homework"
                onClick={() => navigate("/homework")}
              />
            </div>
          </div>
        </section>

        {/* Students section */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm ring-1 ring-blue-100">
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-white to-slate-50 px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Users className="h-5 w-5 text-slate-600" />
                My Students
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                Total {filteredStudents.length}
              </span>
            </div>
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-4 py-6 text-slate-600 ring-1 ring-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="text-sm">
                    {searchQuery
                      ? "No students match your search"
                      : "No students found"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {currentStudents.map((student) => (
                      <div
                        key={student.id}
                        className="rounded-xl border bg-white p-6 shadow-sm ring-1 ring-blue-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-5">
                          <img
                            src={
                              student.studentImage ||
                              "https://via.placeholder.com/96"
                            }
                            alt={student.fullName}
                            className="h-24 w-24 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-slate-900 truncate">
                              {student.fullName}
                            </p>
                            <p className="text-sm text-slate-600 truncate mt-1">
                              <Mail className="h-4 w-4 inline-block mr-1 text-blue-500" />
                              {student.email}
                            </p>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-slate-700">
                                Marks:
                              </p>
                              {student.marks && student.marks.length > 0 ? (
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                  {student.marks.map((mark, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <FileText className="h-4 w-4 text-blue-500" />
                                      {mark.subject}: {mark.score} (
                                      {new Date(mark.date).toLocaleDateString()}
                                      )
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400">
                                  No marks
                                </p>
                              )}
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-slate-700">
                                Status:
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 mt-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                                  student.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                }`}
                              >
                                {student.status === "active" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Clock3 className="h-3.5 w-3.5" />
                                )}
                                {student.status || "pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => openModal(student)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            <NotebookPen className="h-4 w-4" />
                            Give Marks
                          </button>
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, "students", student.id), {
                                status: "active",
                              });
                              setStudents((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, status: "active" }
                                    : s
                                )
                              );
                              setFilteredStudents((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, status: "active" }
                                    : s
                                )
                              );
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Set Active
                          </button>
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, "students", student.id), {
                                status: "pending",
                              });
                              setStudents((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, status: "pending" }
                                    : s
                                )
                              );
                              setFilteredStudents((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, status: "pending" }
                                    : s
                                )
                              );
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
                          >
                            <Clock3 className="h-4 w-4" />
                            Set Pending
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing {indexOfFirstStudent + 1} to{" "}
                        {Math.min(indexOfLastStudent, filteredStudents.length)}{" "}
                        of {filteredStudents.length} students
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, index) => (
                            <button
                              key={index + 1}
                              onClick={() => handlePageChange(index + 1)}
                              className={`rounded-lg px-3 py-1.5 text-sm ${
                                currentPage === index + 1
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right rail: Homework / Materials / Notices */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-sky-100">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-white to-slate-50 px-5 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <NotebookPen className="h-5 w-5 text-sky-600" />
                  Homework
                </h3>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                  {homework.length}
                </span>
              </div>
              <div className="p-5">
                {homework.length === 0 ? (
                  <EmptyState label="No homework assigned yet" />
                ) : (
                  <ul className="space-y-2">
                    {homework.map((hw) => (
                      <li
                        key={hw.id}
                        className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-slate-900"
                      >
                        {hw.task}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-indigo-100">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-white to-slate-50 px-5 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Learning Materials
                </h3>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                  {materials.length}
                </span>
              </div>
              <div className="p-5">
                {materials.length === 0 ? (
                  <EmptyState label="No materials uploaded yet" />
                ) : (
                  <ul className="space-y-2">
                    {materials.map((mat) => (
                      <li key={mat.id}>
                        <a
                          href={mat.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2 text-slate-900 transition hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200"
                        >
                          <ExternalLink className="h-4 w-4 text-indigo-600" />
                          <span className="truncate underline-offset-2 group-hover:underline">
                            {mat.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-amber-100">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-white to-slate-50 px-5 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Notices
                </h3>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  {notices.length}
                </span>
              </div>
              <div className="p-5">
                {notices.length === 0 ? (
                  <EmptyState label="No notices yet" />
                ) : (
                  <ul className="space-y-2">
                    {notices.map((notice) => (
                      <li
                        key={notice.id}
                        className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-slate-800"
                      >
                        {notice.content}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarkModal
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
      />
    </div>
  );
}

function TopLink({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center ring-1 ring-blue-100">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-600">{label}</div>
    </div>
  );
}

function Shortcut({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:bg-slate-50 ring-1 ring-slate-100"
    >
      <span className="inline-flex items-center gap-2 text-sm text-slate-800">
        {icon}
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-4 py-6 text-slate-600 ring-1 ring-blue-100">
      <MessageSquare className="h-5 w-5 text-blue-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export default Dashboard;
