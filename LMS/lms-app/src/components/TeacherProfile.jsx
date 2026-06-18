import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  FiCheckCircle,
  FiBookOpen,
  FiTarget,
  FiMapPin,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import logo from "../assets/logo1.jpeg"; // ✅ adjust path as needed
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";

const TeacherProfile = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherDoc = doc(db, "teachers", id);
        const docSnap = await getDoc(teacherDoc);

        if (docSnap.exists()) {
          setTeacher({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Teacher not found");
        }
      } catch (e) {
        setError("Failed to load teacher profile");
        console.error("Error fetching teacher:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Retrieving teacher profile..." fullScreen={true} />;
  }

  if (error || !teacher) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-red-600">
          {error || "Teacher not found"}
        </h2>
        <Link
          to="/teachers"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Teachers
        </Link>
      </div>
    );
  }

  const subjectBadges = (teacher.subjects || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const gradeBadges = Array.isArray(teacher.grades)
    ? teacher.grades
    : Array.isArray(teacher.grade)
      ? teacher.grade
      : (teacher.grade || "").split(",").map((g) => g.trim()).filter(Boolean);

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-800 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background soft glowing elements */}
      <div className="pointer-events-none absolute top-[20%] left-[-10%] h-[35%] w-[35%] rounded-full bg-blue-200/30 blur-[130px] z-0 animate-pulse" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[35%] w-[35%] rounded-full bg-indigo-200/30 blur-[130px] z-0 animate-pulse" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="EZone Logo"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4 text-slate-500" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner Cover */}
      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 py-16 px-6 sm:px-12 text-white overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[80%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
          {/* Avatar frame */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <img
              src={teacher.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300"}
              alt={teacher.fullName}
              className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl transition duration-300 hover:scale-[1.02]"
            />
          </div>

          <div className="text-center md:text-left space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
              <FiCheckCircle className="text-emerald-400 h-4 w-4" /> Verified Educator
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-md">
              {teacher.fullName}
            </h1>
            <p className="text-lg text-blue-200 font-extrabold uppercase tracking-widest leading-none">
              {teacher.role || "Instructor"}
            </p>
            <p className="text-xs text-slate-355 font-semibold tracking-wider">
              @{teacher.username || "teacher"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-6 md:p-8 z-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left / Sidebar Column - spans 1 on md */}
          <div className="md:col-span-1 space-y-8">
            {/* Contact Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
                <FiMail className="w-5 h-5 text-blue-600" />
                Contact Info
              </h2>
              <div className="space-y-5">
                <div className="flex items-center gap-3.5 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 group-hover:scale-105 transition-transform">
                    <FiMail className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Address</div>
                    <div className="text-sm font-semibold text-slate-700 truncate" title={teacher.email}>{teacher.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 group-hover:scale-105 transition-transform">
                    <FiPhone className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Phone Contact</div>
                    <div className="text-sm font-semibold text-slate-700">{teacher.contact || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100/50 group-hover:scale-105 transition-transform">
                    <FiMapPin className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location Office</div>
                    <div className="text-sm font-semibold text-slate-700 truncate" title={teacher.address}>{teacher.address || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Main Info Column - spans 2 on md */}
          <div className="md:col-span-2 space-y-8">
            {/* Bio Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <span className="absolute right-6 top-6 text-7xl font-serif text-slate-100/80 pointer-events-none select-none leading-none">“</span>
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
                <FiBookOpen className="w-5 h-5 text-blue-600" />
                About Educator
              </h2>
              <p className="text-slate-650 leading-relaxed text-sm italic whitespace-pre-wrap relative z-10 pr-2">
                {teacher.bio || "No biography provided by the educator."}
              </p>
            </div>

            {/* Academic Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
                <FiTarget className="w-5 h-5 text-blue-600" />
                Teaching Specializations
              </h2>

              <div className="space-y-5">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Expert Subjects</h3>
                  {subjectBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subjectBadges.map((s, idx) => {
                        const tagStyle = idx % 2 === 0
                          ? "from-blue-650 to-indigo-650 shadow-blue-500/10"
                          : "from-indigo-550 to-cyan-555 shadow-indigo-500/10";
                        return (
                          <span
                            key={s}
                            className={`inline-flex items-center rounded-2xl bg-gradient-to-r px-4.5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs ${tagStyle}`}
                          >
                            {s}00
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500 italic">No subjects set</span>
                  )}
                </div>

                <div className="pt-2">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Target Classes & Grades</h3>
                  {gradeBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {gradeBadges.map((g) => (
                        <span key={g} className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-650">
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500 italic">No grades set</span>
                  )}
                </div>

                {teacher.achievements && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Qualifications & Achievements</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                      {teacher.achievements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to={`/teachers/${teacher.id}/notes`}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-750 text-white px-8 py-3.5 text-sm font-extrabold tracking-wide uppercase transition shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <FiBookOpen className="w-4.5 h-4.5" />
            <span>View Notes by Teacher</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-750 px-8 py-3.5 text-sm font-extrabold tracking-wide uppercase transition border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4.5 h-4.5 text-slate-550" />
            <span>Back to Teachers</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};


export default TeacherProfile;
