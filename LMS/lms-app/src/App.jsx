// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner"; // 👈 ADD THIS
import { auth } from "./firebase";

import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import LandingPage from "./components/LandingPage";
import Notices from "./components/Notices";
import AllNotices from "./components/AllNotices";
import Materials from "./components/Materials";
import Homework from "./components/Homework";
import FeedbackPage from "./components/FeedbackPage";
import AskQuestion from "./components/AskQuestion";
import Questions from "./components/TeacherQuestions";
import TeacherFeedback from "./components/TeacherFeedback";
import TeacherProfile from "./components/TeacherProfile";
import TeacherNotes from "./components/TeacherNotes";
import Downloads from "./components/Downloads";
import StudentDetail from "./components/StudentDetail";
import ManageResourceFolders from "./components/ManageResourceFolders"
import ThemeToggle from "./components/ThemeToggle"; // 👈 ADD THIS
import LanguageToggle from "./components/LanguageToggle";
import ScrollToTop from "./components/ScrollToTop";

import { useAuth } from "./context/AuthContext";

// Protected Route with role restriction & initial session verification
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userEmail, role, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  const isAuthed = currentUser !== null || Boolean(userEmail);

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {/* Global Toast Provider */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
        }}
      />
      {/* Global Dark Mode Switcher */}
      <ThemeToggle />
      {/* Global Language Switcher */}
      <LanguageToggle />

      <div className="flex-1">
        <Routes>
          {/* Default page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/teacher-feedback" element={<TeacherFeedback />} />
          <Route path="/ask" element={<AskQuestion />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/teachers/:id/notes" element={<TeacherNotes />} />
          <Route path="/downloads" element={<Downloads />} />
          {/* NEW: Manage Resources - Protected Route */}
          <Route
            path="/manage-resources"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <ManageResourceFolders />
              </ProtectedRoute>
            }
          />
          {/* Student details page - Protected Route */}
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <StudentDetail />
              </ProtectedRoute>
            }
          />
          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/notices" element={<Notices />} />
          <Route path="/all-notices" element={<AllNotices />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/homework" element={<Homework />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <h2 className="text-center mt-10">404 - Page Not Found</h2>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
