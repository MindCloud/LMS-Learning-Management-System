// src/components/Navbar.jsx (updated with Sonner toast on logout)

import React, { useEffect, useState } from "react";
import logo from "../assets/logo1.jpeg"; // ensure this file exists
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  LogIn,
  UserPlus,
  Home,
  LayoutDashboard,
  Shield,
  Menu,
  X,
  User,
  Settings,
} from "lucide-react";
import { toast } from "sonner"; // <-- Added for professional feedback

function Navbar() {
  const { userEmail, role, setUserEmail, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false); // mobile nav open
  const [menuOpen, setMenuOpen] = useState(false); // desktop avatar menu open
  const [logoError, setLogoError] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Close avatar menu with ESC
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    // Clear auth context & localStorage
    setUserEmail(null);
    setRole(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");

    // Show success toast
    toast.success("You have been logged out successfully.");

    // Navigate to login page
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "border-blue-700 text-blue-700"
      : "border-transparent text-slate-700 hover:text-blue-700 hover:border-blue-600";

  const navLinks = [
    { to: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    { to: "/courses", label: "Courses" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  // Build initials from email for avatar fallback
  const getInitials = (email) => {
    if (!email) return "EZ";
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800/80 transition-all duration-300">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold tracking-tight text-blue-900 transition-transform duration-300 hover:scale-[1.02]"
          aria-label="Go to homepage"
        >
          {!logoError ? (
            <img
              src={logo}
              alt="EZone logo"
              className="h-8 w-auto drop-shadow-sm"
              loading="eager"
              decoding="async"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white text-lg font-bold">
              EZ
            </span>
          )}
          <span className="hidden text-xl sm:inline">EZone</span>
        </Link>

        {/* Desktop Nav Links (optional – uncomment if you want them visible on large screens) */}
        {/* <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-1 border-b-2 px-1.5 py-2 text-sm font-medium transition ${isActive(to)}`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </div> */}

        {/* Right side: Avatar / Account (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true; aria-expanded={menuOpen}"
              className="group flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 pl-2 pr-3.5 py-1.5 hover:bg-blue-50 dark:hover:bg-slate-900/80 transition-all duration-300 shadow-sm"
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-750 text-white text-sm font-bold shadow-inner transition-transform group-hover:scale-105"
                aria-hidden="true"
              >
                {getInitials(userEmail)}
              </span>
              <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-355 sm:inline">
                {userEmail ? userEmail.split("@")[0] : "Account"}
              </span>
            </button>

            {/* Desktop Dropdown Menu */}
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 p-2 z-50"
              >
                {!userEmail ? (
                  <div className="p-2">
                    <p className="mb-2.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Welcome to EZone
                    </p>
                    <Link
                      to="/login"
                      className="group flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-slate-755 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogIn className="h-4.5 w-4.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                      <span>Log in</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="mt-2 group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-3.5 py-2.5 font-bold text-white hover:from-blue-750 hover:to-indigo-700 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserPlus className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
                      <span>Sign up</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/65 mb-1.5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-400">
                        Signed in as
                      </p>
                      <p className="truncate text-xs font-bold text-blue-900 dark:text-blue-405">
                        {userEmail}
                      </p>
                    </div>

                    {role === "student" && (
                      <Link
                        to="/home"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-355 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4.5 w-4.5 text-blue-600" />
                        <span>Student Dashboard</span>
                      </Link>
                    )}
                    {role === "teacher" && (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-355 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4.5 w-4.5 text-blue-600" />
                        <span>Teacher Dashboard</span>
                      </Link>
                    )}
                    {role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-355 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Shield className="h-4.5 w-4.5 text-blue-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/65" />

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-355 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4.5 w-4.5 text-blue-600" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-355 hover:bg-blue-50 dark:hover:bg-slate-800/60 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-4.5 w-4.5 text-blue-600" />
                      <span>Settings</span>
                    </Link>

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/65" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2.5 font-bold text-white transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="inline-flex items-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      {open && (
        <div className="md:hidden border-t border-blue-100 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
            <div className="space-y-1 rounded-2xl border border-blue-100 bg-white p-4 shadow-lg">
              {/* Public Links */}
              {navLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive(
                    to
                  )}`}
                >
                  {icon}
                  {label}
                </Link>
              ))}

              <div className="my-3 border-t border-blue-100" />

              {/* Auth Section */}
              {!userEmail ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-blue-900 ring-1 ring-blue-100 hover:bg-blue-50"
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 font-medium text-white hover:bg-blue-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  {role === "student" && (
                    <Link
                      to="/home"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium transition ${isActive(
                        "/home"
                      )}`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Student Dashboard
                    </Link>
                  )}
                  {role === "teacher" && (
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium transition ${isActive(
                        "/dashboard"
                      )}`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Teacher Dashboard
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium transition ${isActive(
                        "/admin"
                      )}`}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="my-3 flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold">
                      {getInitials(userEmail)}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-blue-900">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
