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
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "sonner";
import AddResourceFolderModal from "./AddResourceFolderModal";
import UpdateTeacherForm from "./UpdateTeacherForm";
import LoadingSpinner from "./LoadingSpinner";

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
  Trash2,
  MessageCircle,
  Menu,
  X,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


function Dashboard() {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [homework, setHomework] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Sidebar grade filters
  const [selectedGradeNotices, setSelectedGradeNotices] = useState("all");
  const [selectedGradeMaterials, setSelectedGradeMaterials] = useState("all");
  const [selectedGradeHomework, setSelectedGradeHomework] = useState("all");

  const studentsPerPage = 6;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      toast.error("Failed to log out. Please try again.");
    }
  };

  // Fetch teacher profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "teachers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setTeacher({ uid: user.uid, ...docSnap.data() });
          } else {
            toast.error("Teacher profile not found");
            navigate("/login");
          }
        } catch (err) {
          toast.error("Failed to load profile");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch all dashboard data
  const fetchAllData = async () => {
    if (!teacher?.uid) return;

    setLoadingData(true);

    try {
      // Fetch students
      const studentsSnap = await getDocs(collection(db, "students"));
      const allStudents = studentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const myStudents = allStudents.filter((student) => {
        if (
          !student.preferredTeachers ||
          !Array.isArray(student.preferredTeachers)
        ) {
          return false;
        }
        return student.preferredTeachers.some(
          (pt) => pt.preferredTeacherId === teacher.uid
        );
      });

      setStudents(myStudents);

      // Fetch teacher content
      const [hwSnap, matSnap, noticeSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "homework"),
            where("teacherId", "==", teacher.uid)
          )
        ),
        getDocs(
          query(
            collection(db, "materials"),
            where("teacherId", "==", teacher.uid)
          )
        ),
        getDocs(
          query(
            collection(db, "notices"),
            where("teacherId", "==", teacher.uid)
          )
        ),
      ]);

      setHomework(hwSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMaterials(matSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const noticeList = noticeSnap.docs
        .map((d) => {
          const data = d.data();
          const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
          return { id: d.id, ...data, _createdAtMs: createdAtMs };
        })
        .sort((a, b) => b._createdAtMs - a._createdAtMs);

      setNotices(noticeList);
      setLoadingData(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoadingData(false);
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [teacher]);

  // Refetch students only after marks are added
  const refreshStudents = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, "students"));
      const allStudents = studentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const myStudents = allStudents.filter((student) => {
        if (
          !student.preferredTeachers ||
          !Array.isArray(student.preferredTeachers)
        ) {
          return false;
        }
        return student.preferredTeachers.some(
          (pt) => pt.preferredTeacherId === teacher.uid
        );
      });

      setStudents(myStudents);
      toast.success("Marks updated successfully");
    } catch (error) {
      console.error("Error refreshing students:", error);
      toast.error("Failed to refresh student data");
    }
  };

  // Delete student
  const handleDeleteStudent = async (student) => {
    setStudentToDelete(null);

    toast.loading(`Deleting ${student.fullName}...`);

    try {
      await deleteDoc(doc(db, "students", student.id));

      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      toast.dismiss();
      toast.success(`${student.fullName} deleted successfully`);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.dismiss();
      toast.error("Failed to delete student");
    }
  };

  // Update student status
  const updateStudentStatus = async (studentId, newStatus) => {
    toast.loading("Updating status...");

    try {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        toast.dismiss();
        toast.error("Student not found");
        return;
      }

      const studentData = studentSnap.data();
      const preferredTeachers = studentData.preferredTeachers || [];

      // Update the status for this specific teacher
      const updatedPreferredTeachers = preferredTeachers.map((pt) => {
        if (pt.preferredTeacherId === teacher.uid) {
          return { ...pt, status: newStatus };
        }
        return pt;
      });

      await updateDoc(studentRef, {
        preferredTeachers: updatedPreferredTeachers,
      });

      // Update the local state
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            const updatedPrefs = (s.preferredTeachers || []).map((pt) => {
              if (pt.preferredTeacherId === teacher.uid) {
                return { ...pt, status: newStatus };
              }
              return pt;
            });
            return { ...s, preferredTeachers: updatedPrefs };
          }
          return s;
        })
      );

      toast.dismiss();
      toast.success(
        `Student status updated to ${newStatus === "active" ? "Active" : "Pending"}`
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.dismiss();
      toast.error("Failed to update status");
    }
  };

  // Filter students
  useEffect(() => {
    let filtered = students;

    if (selectedGrade !== "all") {
      filtered = filtered.filter((student) => {
        const gradeVal = (student.grade || "").toString().trim().toLowerCase();
        const courseVal = (student.course || "").toString().trim().toLowerCase();

        if (selectedGrade === "o/l") {
          return courseVal === "ol-ict" || gradeVal === "o/l" || gradeVal === "ol";
        }
        if (selectedGrade === "a/l") {
          return courseVal === "al-ict" || gradeVal === "a/l" || gradeVal === "al";
        }
        if (selectedGrade === "other") {
          return courseVal === "other" || gradeVal === "other";
        }
        return gradeVal === selectedGrade;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [students, searchQuery, selectedGrade]);

  // Sidebar filtering
  const filterByGrade = (items, selectedFilter) => {
    if (selectedFilter === "all") return items;
    return items.filter(
      (item) =>
        item.grades &&
        Array.isArray(item.grades) &&
        item.grades.some((g) => g.includes(selectedFilter))
    );
  };

  const filteredNotices = filterByGrade(notices, selectedGradeNotices);
  const filteredMaterials = filterByGrade(materials, selectedGradeMaterials);
  const filteredHomework = filterByGrade(homework, selectedGradeHomework);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  // Called from MarkModal after successful mark submission
  const handleMarkAdded = () => {
    closeModal();
    refreshStudents(); // Refresh only students to show new marks
  };

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 text-slate-600 rounded-2xl bg-white/70 backdrop-blur-md px-8 py-8 shadow-xl border border-slate-100/50 max-w-sm w-full text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Initializing Session</h3>
            <p className="text-sm text-slate-500 mt-1">Loading teacher dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased pb-12">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[30%] rounded-full bg-gradient-to-tr from-blue-300/10 to-indigo-300/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[30%] h-[35%] rounded-full bg-gradient-to-br from-indigo-300/10 to-purple-300/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[35%] h-[30%] rounded-full bg-gradient-to-tr from-sky-300/10 to-blue-300/10 blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/50 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-slate-900">
                Teacher Space
              </h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                EZone Institute • Instructor
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-2.5">
            <TopLink
              onClick={() => navigate("/notices")}
              icon={<Bell className="h-4 w-4 text-amber-500" />}
              label="Notices"
            />
            <TopLink
              onClick={() => navigate("/materials")}
              icon={<BookOpen className="h-4 w-4 text-indigo-500" />}
              label="Materials"
            />
            <TopLink
              onClick={() => navigate("/homework")}
              icon={<NotebookPen className="h-4 w-4 text-sky-500" />}
              label="Homework"
            />
            <button
              onClick={() => navigate("/questions")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              Questions
            </button>
            <button
              onClick={() => navigate("/teacher-feedback")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Feedback
            </button>
            <button
              onClick={() => setIsAddFolderModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md hover:from-emerald-700 hover:to-teal-700 transition active:scale-95 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Add Resource Folder
            </button>
            <button
              onClick={handleLogout}
              className="ml-2 inline-flex items-center gap-2 rounded-xl bg-red-50/50 px-4 py-2 text-sm font-medium text-red-600 border border-red-100 shadow-sm transition hover:bg-red-100 hover:text-red-700 active:scale-95 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex xl:hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition hover:bg-slate-100 active:scale-90 cursor-pointer"
          >
            {isMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg shadow-xl"
            >
              <div className="flex flex-col gap-1.5 p-4">
                <MobileLink
                  onClick={() => { navigate("/notices"); setIsMenuOpen(false); }}
                  icon={<Bell className="h-5 w-5 text-amber-500" />}
                  label="Manage Notices"
                />
                <MobileLink
                  onClick={() => { navigate("/materials"); setIsMenuOpen(false); }}
                  icon={<BookOpen className="h-5 w-5 text-indigo-500" />}
                  label="Materials"
                />
                <MobileLink
                  onClick={() => { navigate("/homework"); setIsMenuOpen(false); }}
                  icon={<NotebookPen className="h-5 w-5 text-sky-500" />}
                  label="Homework"
                />
                <MobileLink
                  onClick={() => { navigate("/questions"); setIsMenuOpen(false); }}
                  icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
                  label="Questions"
                />
                <MobileLink
                  onClick={() => { navigate("/teacher-feedback"); setIsMenuOpen(false); }}
                  icon={<MessageCircle className="h-5 w-5 text-indigo-500" />}
                  label="Feedback"
                />
                <button
                  onClick={() => { setIsAddFolderModalOpen(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 border border-emerald-100 transition hover:bg-emerald-100/75"
                >
                  <FileText className="h-5 w-5" />
                  Add Resource Folder
                </button>
                <div className="my-2 h-px bg-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 border border-red-100 transition hover:bg-red-100/75"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {loadingData ? (
          <LoadingSpinner text="Fetching dashboard data..." />
        ) : (
          <>
        {/* Header Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-300">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 -mr-4 -mt-4 blur-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-indigo-500/5 -ml-4 -mb-4 blur-lg" />

            <div className="relative mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <User className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Instructor Profile
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-200 shadow-2xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer active:scale-90"
                  title="Edit Profile"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>


            <div className="relative flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px] shadow-md shadow-blue-500/10">
                  <div className="h-full w-full rounded-2xl bg-white overflow-hidden flex items-center justify-center">
                    {teacher?.imageUrl ? (
                      <img
                        src={teacher.imageUrl}
                        alt="Teacher profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <GraduationCap className="h-7 w-7 text-indigo-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-slate-900">
                  {teacher.fullName}
                </p>
                <span className="inline-block px-2 py-0.5 mt-1 rounded-md bg-blue-50 text-[11px] font-semibold text-blue-600 border border-blue-100">
                  {teacher.role || "Instructor"}
                </span>

                <div className="mt-4 space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{teacher.subjects || "Subjects not set"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="truncate">Grades: {teacher.grades?.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-300">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <LayoutDashboard className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Overview
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 h-[calc(100%-2.5rem)]">
              <StatCard label="Students" value={students.length} icon={<Users className="h-4 w-4 text-blue-500" />} />
              <StatCard label="Homework" value={homework.length} icon={<NotebookPen className="h-4 w-4 text-sky-500" />} />
              <StatCard label="Notices" value={notices.length} icon={<Bell className="h-4 w-4 text-amber-500" />} />
            </div>
          </div>

          {/* Shortcuts Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-300">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ExternalLink className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Shortcut
                icon={<Bell className="h-4 w-4 text-amber-500" />}
                label="New Notice"
                onClick={() => navigate("/notices")}
              />
              <Shortcut
                icon={<BookOpen className="h-4 w-4 text-indigo-500" />}
                label="Upload Material"
                onClick={() => navigate("/materials")}
              />
              <Shortcut
                icon={<NotebookPen className="h-4 w-4 text-sky-500" />}
                label="Assign HW"
                onClick={() => navigate("/homework")}
              />
              <Shortcut
                icon={<FileText className="h-4 w-4 text-emerald-500" />}
                label="Resource Folders"
                onClick={() => navigate("/manage-resources")}
              />
            </div>
          </div>
        </section>


        {/* Students + Sidebar */}
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Students List */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm shadow-slate-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/50 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="text-md font-bold text-slate-800">
                  My Students
                </h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                Total {filteredStudents.length}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              {/* Search & Filter Bar */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Grades</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="o/l">O/L</option>
                    <option value="a/l">A/L</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-slate-500 text-center flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || selectedGrade !== "all"
                        ? "Try modifying your filters or search query"
                        : "No students are currently assigned to you"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <motion.div
                    layout
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <AnimatePresence mode="popLayout">
                      {currentStudents.map((student) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={student.id}
                          className="group relative flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300/60"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  student.studentImage ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                                }
                                alt={student.fullName}
                                className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white shadow-sm ${(student.preferredTeachers || []).some(pt => pt.preferredTeacherId === teacher?.uid && pt.status === "active")
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                                  }`}
                              >
                                {(student.preferredTeachers || []).some(pt => pt.preferredTeacherId === teacher?.uid && pt.status === "active") ? "A" : "P"}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-md font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {student.fullName}
                              </p>

                              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-1 font-medium">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                {student.email}
                              </p>

                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  <GraduationCap className="h-3 w-3 text-indigo-500" />
                                  {student.grade
                                    ? `Grade ${student.grade}`
                                    : student.course === "al-ict"
                                      ? "A/L"
                                      : student.course === "ol-ict"
                                        ? "O/L"
                                        : student.course === "other"
                                          ? "Other"
                                          : "General"}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${(student.preferredTeachers || []).some(pt => pt.preferredTeacherId === teacher?.uid && pt.status === "active")
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}
                                >
                                  {(student.preferredTeachers || []).some(pt => pt.preferredTeacherId === teacher?.uid && pt.status === "active") ? "Active" : "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Student Marks Showcase */}
                          <div className="mt-4 pt-3 border-t border-slate-100/80 flex-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Academic Marks
                            </p>
                            {student.marks && student.marks.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {student.marks.map((mark, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50/50 border border-blue-100/50 px-2 py-1 text-xs text-slate-700"
                                  >
                                    <span className="font-semibold text-blue-600">{mark.subject}:</span>
                                    <span className="font-bold text-slate-800">{mark.score}</span>
                                    <span className="text-[9px] text-slate-400">({new Date(mark.date).toLocaleDateString()})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                No records submitted yet.
                              </p>
                            )}
                          </div>

                          {/* Quick Student Actions */}
                          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                            <button
                              onClick={() => openModal(student)}
                              className="inline-flex flex-1 min-w-[70px] items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-100 transition hover:bg-blue-600 hover:text-white cursor-pointer active:scale-95 duration-150"
                            >
                              <NotebookPen className="h-3.5 w-3.5" />
                              Marks
                            </button>

                            {!((student.preferredTeachers || []).some(pt => pt.preferredTeacherId === teacher?.uid && pt.status === "active")) ? (
                              <button
                                onClick={() => updateStudentStatus(student.id, "active")}
                                className="inline-flex flex-1 min-w-[70px] items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-100 transition hover:bg-emerald-600 hover:text-white cursor-pointer active:scale-95 duration-150"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStudentStatus(student.id, "pending")}
                                className="inline-flex flex-1 min-w-[70px] items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-600 border border-amber-100 transition hover:bg-amber-600 hover:text-white cursor-pointer active:scale-95 duration-150"
                              >
                                <Clock3 className="h-3.5 w-3.5" />
                                Suspend
                              </button>
                            )}

                            <button
                              onClick={() => setStudentToDelete(student)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100 transition hover:bg-red-600 hover:text-white cursor-pointer active:scale-95 duration-150"
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* Delete Confirmation Modal */}
                  {studentToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900">
                          Delete Student Account
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                          Are you sure you want to delete <span className="font-semibold text-slate-800">{studentToDelete.fullName}</span>? All academic marks and history for this student will be permanently erased.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => setStudentToDelete(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(studentToDelete)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer shadow-md shadow-red-500/10 transition"
                          >
                            Delete Student
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs font-semibold text-slate-500">
                        Showing {indexOfFirstStudent + 1} to{" "}
                        {Math.min(indexOfLastStudent, filteredStudents.length)} of{" "}
                        {filteredStudents.length} students
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => handlePageChange(i + 1)}
                              className={`h-8 w-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${currentPage === i + 1
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Homework */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm shadow-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200/50 bg-sky-50/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-5 w-5 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Homework
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                    {filteredHomework.length}
                  </span>
                  <div className="relative">
                    <select
                      value={selectedGradeHomework}
                      onChange={(e) => setSelectedGradeHomework(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 pr-6 text-[10px] font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                    >
                      <option value="all">All Grades</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {filteredHomework.length === 0 ? (
                  <EmptyState label="No homework for this grade" />
                ) : (
                  <ul className="space-y-3">
                    {filteredHomework.map((hw) => (
                      <li
                        key={hw.id}
                        className="rounded-xl border-l-4 border-l-sky-500 border-y border-r border-slate-100 bg-sky-50/20 p-3 text-xs text-slate-700 shadow-2xs"
                      >
                        <p className="font-semibold text-slate-800 leading-relaxed">{hw.task}</p>
                        {hw.grades && hw.grades.length > 0 && (
                          <span className="inline-block mt-2 rounded bg-sky-100/50 border border-sky-200/50 px-1.5 py-0.5 text-[9px] font-bold text-sky-600">
                            Grades: {hw.grades.join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Materials */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm shadow-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200/50 bg-indigo-50/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Materials
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    {filteredMaterials.length}
                  </span>
                  <div className="relative">
                    <select
                      value={selectedGradeMaterials}
                      onChange={(e) => setSelectedGradeMaterials(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 pr-6 text-[10px] font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Grades</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {filteredMaterials.length === 0 ? (
                  <EmptyState label="No materials for this grade" />
                ) : (
                  <ul className="space-y-3">
                    {filteredMaterials.map((mat) => (
                      <li key={mat.id}>
                        <a
                          href={mat.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-xl border-l-4 border-l-indigo-500 border-y border-r border-slate-100 bg-indigo-50/20 p-3 text-xs text-slate-700 shadow-2xs hover:bg-indigo-50/40 hover:border-indigo-200 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                              {mat.title}
                            </span>
                          </div>
                          {mat.grades && mat.grades.length > 0 && (
                            <span className="inline-block mt-2 rounded bg-indigo-100/50 border border-indigo-200/50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">
                              Grades: {mat.grades.join(", ")}
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Notices */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm shadow-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200/50 bg-amber-50/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Notices
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {filteredNotices.length}
                  </span>
                  <div className="relative">
                    <select
                      value={selectedGradeNotices}
                      onChange={(e) => setSelectedGradeNotices(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 pr-6 text-[10px] font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="all">All Grades</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {filteredNotices.length === 0 ? (
                  <EmptyState label="No notices for this grade" />
                ) : (
                  <ul className="space-y-3">
                    {filteredNotices.map((notice) => (
                      <li
                        key={notice.id}
                        className="rounded-xl border-l-4 border-l-amber-500 border-y border-r border-slate-100 bg-amber-50/20 p-3 text-xs text-slate-700 shadow-2xs"
                      >
                        <p className="font-semibold text-slate-800 leading-relaxed">{notice.content}</p>
                        {notice.grades && notice.grades.length > 0 && (
                          <span className="inline-block mt-2 rounded bg-amber-100/50 border border-amber-200/50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                            Grades: {notice.grades.join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      <MarkModal
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
        teacherId={teacher?.uid}
        onMarkAdded={handleMarkAdded}
      />
      {/* Add Resource Folder Modal */}
      <AddResourceFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={() => setIsAddFolderModalOpen(false)}
        teacher={teacher}
      />
      {isEditProfileOpen && (
        <UpdateTeacherForm
          teacher={{ id: teacher.uid, ...teacher }}
          onClose={() => setIsEditProfileOpen(false)}
          onTeacherUpdated={async () => {
            try {
              const docRef = doc(db, "teachers", teacher.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setTeacher({ uid: teacher.uid, ...docSnap.data() });
              }
            } catch (err) {
              console.error("Failed to reload profile after edit:", err);
            }
          }}
        />
      )}
    </div>

  );
}

/* Helper Components */
function TopLink({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 border border-slate-200/80 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

function MobileLink({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center shadow-xs transition hover:bg-slate-50 hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm mb-2 text-slate-600">
        {icon}
      </div>
      <div className="text-xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Shortcut({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3.5 py-2.5 text-left transition-all hover:bg-blue-50/30 hover:border-blue-200/50 active:scale-[0.98] cursor-pointer"
    >
      <span className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
          {icon}
        </span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-4 py-8 text-center text-slate-500">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <MessageSquare className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

export default Dashboard;

