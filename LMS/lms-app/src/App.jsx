// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner"; // 👈 ADD THIS

import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import LandingPage from "./components/LandingPage";
import Notices from "./components/Notices";
import Materials from "./components/Materials";
import Homework from "./components/Homework";
import FeedbackPage from "./components/FeedbackPage";
import AskQuestion from "./components/AskQuestion";
import Questions from "./components/TeacherQuestions";
import TeacherFeedback from "./components/TeacherFeedback";
import TeacherProfile from "./components/TeacherProfile";

// Check if user is logged in
const isAuthenticated = () => {
  return !!localStorage.getItem("userEmail");
};

// Get user role
const getUserRole = () => {
  return localStorage.getItem("role");
};

// Protected Route with role restriction
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const role = getUserRole();
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Toast Provider */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
        }}
      />

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
