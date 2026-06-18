import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  FiBookOpen,
  FiClock,
  FiSearch,
  FiDownload,
  FiExternalLink,
  FiMapPin,
  FiCheckCircle,
  FiFilter,
} from "react-icons/fi";
import logo from "../assets/logo1.jpeg";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

const TeacherNotes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const grades = [
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "O/L",
    "A/L",
    "Other",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teacher info
        const teacherDoc = doc(db, "teachers", id);
        const teacherSnap = await getDoc(teacherDoc);

        if (!teacherSnap.exists()) {
          setError("Teacher not found");
          setLoading(false);
          return;
        }
        setTeacher({ id: teacherSnap.id, ...teacherSnap.data() });

        // Fetch teacher's uploaded materials (short notes)
        const q = query(
          collection(db, "materials"),
          where("teacherId", "==", id)
        );
        const querySnap = await getDocs(q);
        const materialsData = querySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by date (newest first)
        materialsData.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return timeB - timeA;
        });

        setNotes(materialsData);
      } catch (e) {
        setError("Failed to load short notes");
        console.error("Error fetching notes data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading notes..." fullScreen={true} />;
  }

  if (error || !teacher) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center bg-gray-50 min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-red-650 mb-4">
          {error || "Teacher not found"}
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (note.description && note.description.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesGrade =
      gradeFilter === "all" ||
      (note.grades && Array.isArray(note.grades) && note.grades.includes(gradeFilter));

    return matchesSearch && matchesGrade;
  });

  const getGradeTagStyles = (grade) => {
    const normalized = grade.toLowerCase();
    if (normalized.includes("o/l")) {
      return "bg-amber-50 text-amber-700 border-amber-200/65";
    }
    if (normalized.includes("a/l")) {
      return "bg-violet-50 text-violet-700 border-violet-200/65";
    }
    if (normalized.includes("10") || normalized.includes("11")) {
      return "bg-sky-50 text-sky-700 border-sky-200/65";
    }
    if (normalized.includes("6") || normalized.includes("7") || normalized.includes("8") || normalized.includes("9")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/65";
    }
    return "bg-slate-50 text-slate-700 border-slate-200/65";
  };

  const formatNoteDate = (createdAt) => {
    if (!createdAt) return "Recently";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-800 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background glow elements */}
      <div className="pointer-events-none absolute top-[20%] left-[-10%] h-[35%] w-[35%] rounded-full bg-blue-200/30 blur-[130px] z-0 animate-pulse" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[35%] w-[35%] rounded-full bg-indigo-200/30 blur-[130px] z-0 animate-pulse" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="EZone Logo" className="h-16 w-auto object-contain" />
          </Link>
          <Link
            to={`/teachers/${id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4 text-slate-550" />
            <span>Back to Profile</span>
          </Link>
        </div>
      </header>

      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 py-12 px-6 sm:px-12 text-white overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6 z-10">
          <img
            src={teacher.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300"}
            alt={teacher.fullName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-xl"
          />
          <div className="text-center sm:text-left space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider border border-white/15">
              <FiCheckCircle className="text-emerald-450 h-3.5 w-3.5" /> short notes
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Short Notes by {teacher.fullName}
            </h1>
            <p className="text-sm text-blue-200 font-semibold uppercase tracking-widest">
              {teacher.subjects || "Educator"}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-6 md:p-8 z-10 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-4 shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative sm:w-48">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-8 text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer font-semibold"
            >
              <option value="all">All Grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <FiFilter className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Notes Grid/List */}
        <div className="min-h-[300px]">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/40 backdrop-blur-sm p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 text-blue-600 shadow-sm">
                <FiBookOpen className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">No short notes found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  There are no notes that match your filters, or this teacher hasn't shared any notes yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-5 shadow-xs hover:shadow-md hover:border-blue-200/70 transition duration-300"
                >
                  {/* Decorative left line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-lg group-hover:from-blue-600 group-hover:to-indigo-600 transition" />

                  <div className="space-y-3 pl-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-slate-850 font-bold text-base leading-snug truncate group-hover:text-blue-700 transition">
                        {note.title}
                      </h3>
                    </div>

                    {note.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {note.description}
                      </p>
                    )}

                    {/* Target Grade Pill Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {note.grades && note.grades.length > 0 ? (
                        note.grades.map((grade) => (
                          <span
                            key={grade}
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getGradeTagStyles(
                              grade
                            )}`}
                          >
                            {grade}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-705 tracking-wide">
                          All Grades
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Meta Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between pl-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <FiClock className="h-3.5 w-3.5 text-slate-300" />
                      Shared {formatNoteDate(note.createdAt)}
                    </span>

                    <a
                      href={note.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      <span>Get Note</span>
                      <FiExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TeacherNotes;
