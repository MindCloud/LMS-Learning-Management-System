import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import {
  ArrowLeft,
  Download,
  User,
  Mail,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock3,
  BookOpen,
} from "lucide-react";
import logo from "../assets/logo.jpg";
import Footer from "./Footer";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch teacher & student info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error("You must be logged in to view student details.");
        navigate("/login");
        return;
      }

      try {
        // Fetch teacher
        const teacherRef = doc(db, "teachers", user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          setTeacher({ uid: user.uid, ...teacherSnap.data() });
        }

        // Fetch student
        const studentRef = doc(db, "students", id);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() });
        } else {
          toast.error("Student profile not found.");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error loading student details:", err);
        toast.error("Failed to load student profiles.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Compute Statistics
  const marksList = student?.marks || [];
  const totalTests = marksList.length;

  const averageScore = totalTests > 0
    ? (marksList.reduce((acc, m) => acc + Number(m.score || 0), 0) / totalTests).toFixed(1)
    : "N/A";

  const highestScore = totalTests > 0
    ? Math.max(...marksList.map((m) => Number(m.score || 0)))
    : "N/A";

  const lowestScore = totalTests > 0
    ? Math.min(...marksList.map((m) => Number(m.score || 0)))
    : "N/A";

  const isActive = student && teacher && (student.preferredTeachers || []).some(
    (pt) => pt.preferredTeacherId === teacher.uid && pt.status === "active"
  );

  const gradeText = student
    ? student.grade
      ? `Grade ${student.grade}`
      : student.course === "al-ict"
        ? "A/L"
        : student.course === "ol-ict"
          ? "O/L"
          : student.course === "other"
            ? "Other"
            : "General"
    : "";

  // Single Student Report Download handler
  const downloadReport = () => {
    if (!student) return;

    try {
      // 1. CSV Structure
      const csvLines = [];
      csvLines.push("==================================================");
      csvLines.push(`EZONE STUDENT PROGRESS REPORT`);
      csvLines.push(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`);
      csvLines.push("==================================================");
      csvLines.push("");
      
      // Student Metadata
      csvLines.push(`Student Name,${student.fullName}`);
      csvLines.push(`Email Address,${student.email}`);
      csvLines.push(`Grade/Course,${gradeText}`);
      csvLines.push(`Status with Teacher,${isActive ? "Active" : "Pending"}`);
      if (teacher?.fullName) {
        csvLines.push(`Assigned Teacher,${teacher.fullName}`);
      }
      csvLines.push("");

      // Academic Overview
      csvLines.push("ACADEMIC PERFORMANCE SUMMARY");
      csvLines.push(`Total Tests taken,${totalTests}`);
      csvLines.push(`Average Test Score,${averageScore}%`);
      csvLines.push(`Highest Score logged,${highestScore}`);
      csvLines.push(`Lowest Score logged,${lowestScore}`);
      csvLines.push("");

      // Detail Marks Table
      csvLines.push("DETAILED TEST SCORES");
      csvLines.push("Subject/Exam,Score,Date Logged");
      
      if (totalTests > 0) {
        marksList.forEach((m) => {
          const cleanSubject = String(m.subject || "").replace(/"/g, '""');
          const dateStr = m.date ? new Date(m.date).toLocaleDateString() : "N/A";
          csvLines.push(`"${cleanSubject}",${m.score},${dateStr}`);
        });
      } else {
        csvLines.push("No exam scores logged yet.,-,—");
      }

      csvLines.push("");
      csvLines.push("==================================================");
      csvLines.push("End of Progress Report. EZone ICT Learning Management.");
      csvLines.push("==================================================");

      const csvContent = csvLines.join("\n");

      // 2. Trigger Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ezone_report_${student.fullName.replace(/\s+/g, "_").toLowerCase()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${student.fullName}'s progress report downloaded!`);
    } catch (err) {
      console.error("Error generating student report:", err);
      toast.error("Failed to generate report.");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving student files..." fullScreen={true} />;
  }

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Background soft glowing elements */}
      <div className="pointer-events-none absolute top-[20%] left-[-10%] h-[35%] w-[35%] rounded-full bg-blue-200/20 dark:bg-blue-900/10 blur-[130px] z-0" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[35%] w-[35%] rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-[130px] z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center">
            <img
              src={logo}
              alt="EZone Logo"
              className="h-14 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-800"
            />
          </Link>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* Hero Banner Cover */}
      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 py-16 px-6 sm:px-12 text-white overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[80%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
          
          {/* Avatar frame */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <img
              src={student.studentImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"}
              alt={student.fullName}
              className="relative w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl transition duration-300 hover:scale-[1.02]"
            />
          </div>

          <div className="text-center md:text-left space-y-3">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                Student Profile
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                }`}
              >
                {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                {isActive ? "Active Enrollment" : "Pending Approval"}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none drop-shadow-md">
              {student.fullName}
            </h1>

            <p className="text-sm text-blue-200 font-extrabold uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 leading-none">
              <GraduationCap className="h-4.5 w-4.5 text-blue-400" />
              {gradeText}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-6 md:p-8 z-10 space-y-8">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Average Score */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Average Score</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">
                {averageScore}{averageScore !== "N/A" ? "%" : ""}
              </h3>
            </div>
          </div>

          {/* Total Tests */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Exams</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{totalTests}</h3>
            </div>
          </div>

          {/* Highest Score */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-450 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Highest Score</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{highestScore}</h3>
            </div>
          </div>

          {/* Lowest Score */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 shrink-0">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Lowest Score</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{lowestScore}</h3>
            </div>
          </div>

        </div>

        {/* Profile Details & Academic Marks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Student Profile Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold uppercase text-slate-800 dark:text-white tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-600" />
                Contact Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700/60 shrink-0">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Email Address</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-250 truncate">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700/60 shrink-0">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Grade / Class</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-250 truncate">{gradeText}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={downloadReport}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3.5 text-sm font-extrabold tracking-wide uppercase transition shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Download className="w-4.5 h-4.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Academic Records Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase text-slate-800 dark:text-white tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-indigo-600" />
              Academic Exam History
            </h3>

            {totalTests > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 text-xs uppercase font-extrabold text-slate-400 tracking-wider">Subject / Exam</th>
                      <th className="py-3 text-xs uppercase font-extrabold text-slate-400 tracking-wider text-center">Score</th>
                      <th className="py-3 text-xs uppercase font-extrabold text-slate-400 tracking-wider text-right">Date Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksList.map((m, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200">{m.subject}</td>
                        <td className="py-3.5 text-sm font-black text-center">
                          <span className="inline-flex rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-blue-700 dark:text-blue-400 border border-blue-100/40 dark:border-blue-900/30">
                            {m.score}%
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-slate-450 text-right font-medium">
                          {m.date ? new Date(m.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          }) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400">
                No academic marks logged for this student yet.
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
