// src/components/AdminDashboard.jsx (updated with professional Sonner toast notifications)

import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AddTeacherForm from "./AddTeacherForm";
import UpdateTeacherForm from "./UpdateTeacherForm";
import { toast } from "sonner"; // <-- Added for professional toasts
import AddSpecialNoticeModal from "../components/AddSpecialNotice";
import AddTopStudentModal from "../components/AddTopStudentModal";

// Icons
import {
  LayoutDashboard,
  Plus,
  Users,
  Mail,
  User as UserIcon,
  GraduationCap,
  Phone,
  MapPin,
  Sparkles,
  Shield,
  BookOpen,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  Grid as GridIcon,
  RefreshCw,
  LogOut,
  ArrowUpDown,
  Edit,
  Trash2,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showTopStudentModal, setShowTopStudentModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // UI / filters
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [view, setView] = useState("grid");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const navigate = useNavigate();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setFetchError("");
      toast.loading("Loading teachers list...");

      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teachersData);

      toast.dismiss();
      if (teachersData.length > 0) {
        toast.success(`Loaded ${teachersData.length} teachers`);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setFetchError("Couldn't load teachers. Please try again.");
      toast.dismiss();
      toast.error("Failed to load teachers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      250,
    );
    return () => clearTimeout(t);
  }, [query]);

  const subjects = useMemo(() => {
    const set = new Set();
    teachers
      .flatMap((t) =>
        (t.subjects || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
      .forEach((s) => set.add(s));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  const grades = useMemo(() => {
    const set = new Set();
    teachers
      .flatMap((t) => (t.grades || []).map((g) => g.trim()).filter(Boolean))
      .forEach((g) => set.add(g));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  const roles = useMemo(() => {
    const set = new Set();
    teachers
      .map((t) => t.role)
      .filter(Boolean)
      .forEach((r) => set.add(r));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  const filtered = useMemo(() => {
    let list = teachers;

    if (debouncedQuery) {
      list = list.filter((t) => {
        const full = `${t.fullName || ""} ${t.email || ""} ${t.subjects || ""
          } ${t.username || ""}`.toLowerCase();
        return full.includes(debouncedQuery);
      });
    }
    if (subjectFilter) {
      list = list.filter((t) =>
        String(t.subjects || "")
          .toLowerCase()
          .includes(subjectFilter.toLowerCase()),
      );
    }
    if (gradeFilter) {
      list = list.filter((t) =>
        (t.grades || []).some(
          (g) => g.toLowerCase() === gradeFilter.toLowerCase(),
        ),
      );
    }
    if (roleFilter) {
      list = list.filter(
        (t) => String(t.role || "").toLowerCase() === roleFilter.toLowerCase(),
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      const getVal = (obj) => {
        if (sortKey === "email") return (obj.email || "").toLowerCase();
        if (sortKey === "role") return (obj.role || "").toLowerCase();
        return (obj.fullName || "").toLowerCase();
      };
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    teachers,
    debouncedQuery,
    subjectFilter,
    gradeFilter,
    roleFilter,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  const handleSignOut = async () => {
    try {
      toast.loading("Signing out...");
      await signOut(auth);
      toast.dismiss();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to sign out");
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}" permanently?`)) return;

    try {
      toast.loading(`Deleting ${name}...`);
      await deleteDoc(doc(db, "teachers", id));
      await fetchTeachers();
      toast.dismiss();
      toast.success(`${name} deleted successfully`);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.dismiss();
      toast.error("Failed to delete teacher");
    }
  };

  const handleUpdateClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowUpdateModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50/40 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400/30">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Admin Dashboard
              </h1>
              <p className="hidden text-[10px] text-slate-500 sm:block">
                EZone Institute • Admin
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 xl:flex">
            <button
              onClick={fetchTeachers}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-blue-50/40 hover:ring-blue-200"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-blue-600" />
              Refresh
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Teacher
            </button>

            <button
              onClick={() => setShowNoticeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Notice
            </button>

            <button
              onClick={() => setShowTopStudentModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:from-purple-700 hover:to-pink-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Top Student
            </button>

            <button
              onClick={handleSignOut}
              className="ml-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:ring-red-100 active:scale-95"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200 transition active:scale-90 xl:hidden"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t bg-white shadow-lg xl:hidden"
            >
              <div className="flex flex-col gap-2 p-4">
                <button
                  onClick={() => {
                    fetchTeachers();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50"
                >
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Refresh List
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Plus className="h-5 w-5" />
                  Add New Teacher
                </button>
                <button
                  onClick={() => {
                    setShowNoticeModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Plus className="h-5 w-5" />
                  Add Special Notice
                </button>
                <button
                  onClick={() => {
                    setShowTopStudentModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-100"
                >
                  <Plus className="h-5 w-5" />
                  Add Top Student
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Overview Stats */}
        {/* Overview Stats */}
        <section className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            accent="from-blue-50 to-indigo-50"
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label="Total Teachers"
            value={teachers.length}
          />
          <StatCard
            accent="from-sky-50 to-blue-50"
            icon={<BookOpen className="h-5 w-5 text-sky-600" />}
            label="Subjects (unique)"
            value={subjects.length}
          />
          <StatCard
            accent="from-indigo-50 to-violet-50"
            icon={<Shield className="h-5 w-5 text-indigo-600" />}
            label="Roles (unique)"
            value={roles.length}
          />
        </section>

        {/* Toolbar */}
        <section className="mb-6 rounded-2xl border bg-white/95 p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, subject, username…"
                  className="w-full rounded-xl border px-9 py-2.5 text-sm text-slate-800 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 self-end rounded-lg bg-blue-50 p-1 ring-1 ring-blue-200">
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-md px-3 py-1.5 transition ${view === "grid"
                    ? "bg-white shadow-sm ring-1 ring-blue-200"
                    : "text-slate-700 hover:bg-white/60"
                    }`}
                  title="Grid view"
                >
                  <GridIcon className="h-4 w-4 text-blue-600" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`rounded-md px-3 py-1.5 transition ${view === "list"
                    ? "bg-white shadow-sm ring-1 ring-blue-200"
                    : "text-slate-700 hover:bg-white/60"
                    }`}
                  title="List view"
                >
                  <ListIcon className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                <Filter className="h-3.5 w-3.5" /> Filters:
              </span>
              <Select
                value={subjectFilter}
                onChange={(v) => {
                  setSubjectFilter(v);
                  setPage(1);
                }}
                placeholder="All subjects"
                options={subjects}
              />
              <Select
                value={gradeFilter}
                onChange={(v) => {
                  setGradeFilter(v);
                  setPage(1);
                }}
                placeholder="All grades"
                options={grades}
              />
              <Select
                value={roleFilter}
                onChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
                placeholder="All roles"
                options={roles}
              />
            </div>
          </div>
        </section>

        {/* Teachers List */}
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-white to-blue-50/40 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Users className="h-5 w-5 text-blue-600" />
              Teachers
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <SortPill
                current={sortKey === "name"}
                onClick={() => toggleSort("name")}
                label="Name"
              />
              <SortPill
                current={sortKey === "email"}
                onClick={() => toggleSort("email")}
                label="Email"
              />
              <SortPill
                current={sortKey === "role"}
                onClick={() => toggleSort("role")}
                label="Role"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : fetchError ? (
            <div className="p-6">
              <EmptyState
                icon={<XCircle className="h-5 w-5 text-red-500" />}
                text={fetchError}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<XCircle className="h-5 w-5 text-blue-500" />}
                text="No matching teachers found"
              />
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onUpdate={() => handleUpdateClick(teacher)}
                  onDelete={() => handleDelete(teacher.id, teacher.fullName)}
                />
              ))}
            </div>
          ) : (
            <TeacherTable
              rows={pageData}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              onUpdate={handleUpdateClick}
              onDelete={handleDelete}
            />
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t bg-blue-50/40 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:py-3">
              <span className="order-2 sm:order-1 font-medium">
                Showing{" "}
                <span className="text-blue-700">
                  {(pageSafe - 1) * PAGE_SIZE + 1}-
                  {Math.min(pageSafe * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="text-blue-700">{filtered.length}</span>
              </span>
              <div className="flex order-1 sm:order-2 items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 ring-1 ring-blue-200 shadow-sm transition hover:bg-blue-50 disabled:opacity-50 active:scale-95"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={pageSafe <= 1}
                >
                  <ChevronLeft className="h-4 w-4 text-blue-600" />
                  <span className="hidden xs:inline">Prev</span>
                </button>
                <span className="rounded-xl bg-white px-3 py-2 font-bold text-blue-700 ring-1 ring-blue-200 shadow-sm">
                  {pageSafe} / {totalPages}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 ring-1 ring-blue-200 shadow-sm transition hover:bg-blue-50 disabled:opacity-50 active:scale-95"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={pageSafe >= totalPages}
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddTeacherForm
          onClose={() => setShowAddModal(false)}
          onTeacherAdded={() => {
            fetchTeachers();
            toast.success("New teacher added!");
          }}
        />
      )}

      <AddSpecialNoticeModal
        open={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
      />

      {showTopStudentModal && (
        <AddTopStudentModal
          open={showTopStudentModal}
          onClose={() => setShowTopStudentModal(false)}
        />
      )}

      {showUpdateModal && selectedTeacher && (
        <UpdateTeacherForm
          teacher={selectedTeacher}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTeacher(null);
          }}
          onTeacherUpdated={() => {
            fetchTeachers();
            toast.success("Teacher profile updated successfully");
          }}
        />
      )}
    </div>
  );
}

// Reusable Components (unchanged except minor toast integration where needed)
function StatCard({ icon, label, value, accent = "from-slate-50 to-white" }) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${accent} p-5 shadow-sm ring-1 ring-blue-100`}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm text-slate-700">
          {icon}
          {label}
        </span>
        <span className="text-xl font-bold text-slate-900">
          {Number.isFinite(value) ? value : "—"}
        </span>
      </div>
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100"
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50 to-white px-4 py-6 text-slate-700">
      <span className="text-blue-500">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function SortPill({ label, current, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ring-1 text-xs shadow-sm transition ${current
          ? "bg-blue-50 ring-blue-200 text-blue-700"
          : "bg-white/80 ring-slate-200 text-slate-700 hover:bg-blue-50"
        }`}
      title={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${current ? "text-blue-600" : "text-slate-400"
          }`}
      />
    </button>
  );
}

const roleHue = (role = "") => {
  const r = role.toLowerCase();
  if (r.includes("admin")) return "blue";
  if (r.includes("lead") || r.includes("head")) return "indigo";
  if (r.includes("mentor")) return "violet";
  return "sky";
};

function Badge({ children }) {
  const hue = roleHue(children);
  const map = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[hue]}`}
    >
      {children}
    </span>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white/60 backdrop-blur-sm px-3 py-2.5 ring-1 ring-blue-100/50 shadow-sm transition hover:bg-white hover:shadow-md hover:ring-blue-200">
      <span className="mt-1 text-blue-600 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          {label}
        </dt>
        <dd className="truncate text-sm font-medium text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function TeacherCard({ teacher, onUpdate, onDelete }) {
  return (
    <article className="group relative flex flex-col rounded-3xl border bg-gradient-to-br from-white via-white to-blue-50/20 p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-blue-100 hover:ring-blue-300">
      {/* Glossy Top Accent */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-60" />

      {/* Header Profile Section */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 blur opacity-20 group-hover:opacity-40 transition duration-500" />
          {teacher.imageUrl ? (
            <img
              src={teacher.imageUrl}
              alt={teacher.fullName}
              className="relative h-16 w-16 rounded-full object-cover border-2 border-white shadow-lg ring-1 ring-blue-100"
            />
          ) : (
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border-2 border-white shadow-lg ring-1 ring-blue-100">
              <UserIcon className="h-8 w-8 text-blue-400" />
            </div>
          )}
          {teacher.role && (
            <span className="absolute -bottom-1 -right-1 shadow-lg">
              <Badge>{teacher.role}</Badge>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">
            {teacher.fullName || "—"}
          </h3>
          <p className="flex items-center gap-1.5 truncate text-xs font-medium text-slate-500 mt-0.5">
            <Mail className="h-3.5 w-3.5 text-blue-500" />
            {teacher.email || "—"}
          </p>
        </div>
      </div>

      {/* Info Grid - Responsive Columns inside the card */}
      <dl className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 mb-5">
        {teacher.username && (
          <Row
            icon={<UserIcon className="h-3.5 w-3.5" />}
            label="ID / User"
            value={teacher.username}
          />
        )}
        {teacher.subjects && (
          <Row
            icon={<GraduationCap className="h-3.5 w-3.5" />}
            label="Subject"
            value={teacher.subjects}
          />
        )}
        {teacher.contact && (
          <Row
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Contact"
            value={teacher.contact}
          />
        )}
        {teacher.address && (
          <Row
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Location"
            value={teacher.address}
          />
        )}
        {teacher.achievements && (
          <Row
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Awards"
            value={teacher.achievements}
          />
        )}
        {teacher.grades?.length > 0 && (
          <div className="min-[480px]:col-span-2">
            <Row
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Teaching Grades"
              value={teacher.grades.join(", ")}
            />
          </div>
        )}
      </dl>

      {/* Bio section */}
      {teacher.bio && (
        <div className="mb-6 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-200 rounded-full" />
          <p className="pl-4 italic text-sm text-slate-600 line-clamp-2 hover:line-clamp-none transition-all cursor-default">
            “{teacher.bio}”
          </p>
        </div>
      )}

      {/* Action Buttons - Sticky to bottom */}
      <div className="mt-auto flex gap-3">
        <button
          onClick={onUpdate}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-blue-200 shadow-lg transition-all hover:bg-blue-700 active:scale-95"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-xl bg-white p-3 text-red-500 ring-1 ring-red-100 transition-all hover:bg-red-50 hover:ring-red-200 active:scale-95 shadow-sm"
          title="Delete Teacher"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function TeacherTable({ rows, sortKey, sortDir, onSort, onUpdate, onDelete }) {
  const headerBtn = (label, key) => (
    <button
      onClick={() => onSort(key)}
      className="inline-flex items-center gap-1 text-left text-sm font-semibold text-slate-700"
      title={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${sortKey === key ? "text-blue-600" : "text-slate-400"
          }`}
      />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-blue-100">
        <thead className="bg-gradient-to-r from-blue-50 to-white">
          <tr>
            <th className="px-4 py-3">{headerBtn("Name", "name")}</th>
            <th className="px-4 py-3">{headerBtn("Email", "email")}</th>
            <th className="px-4 py-3">Subjects</th>
            <th className="px-4 py-3">Grades</th>
            <th className="px-4 py-3">{headerBtn("Role", "role")}</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50 bg-white">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-blue-50/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {t.imageUrl ? (
                    <img
                      src={t.imageUrl}
                      alt={t.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <UserIcon className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {t.fullName || "—"}
                    </div>
                    {t.username && (
                      <div className="truncate text-xs text-slate-500">
                        @{t.username}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {t.email || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {t.subjects || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {t.grades?.join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-sm">
                {t.role ? <Badge>{t.role}</Badge> : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {t.contact || "—"}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdate(t)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(t.id, t.fullName)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
