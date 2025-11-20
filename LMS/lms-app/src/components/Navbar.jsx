// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import logo from "../assets/logo1.jpeg"; // ensure this file exists: src/assets/logo.png
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

function Navbar() {
  const { userEmail, role, setUserEmail, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);         // mobile nav open
  const [menuOpen, setMenuOpen] = useState(false); // avatar menu open
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
    setUserEmail(null);
    setRole(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
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
    return (a + b).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold tracking-tight text-blue-900"
          aria-label="Go to homepage"
        >
          {!logoError ? (
            <img
              src={logo}                 // ← use imported asset
              alt="EZone logo"
              className="h-8 w-auto"
              loading="eager"
              decoding="async"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              
            </span>
          )}
          
        </Link>

        {/* Desktop Nav (uncomment if you want it visible) */}
        {/* <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center gap-1 border-b-2 px-1.5 py-2 ${isActive(to)}`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </div> */}

        {/* Right side: Avatar / Account */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-2 py-1.5 pr-2.5 shadow-sm transition hover:bg-blue-50"
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold"
                aria-hidden="true"
              >
                {getInitials(userEmail)}
              </span>
              <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                {userEmail ? userEmail : "Account"}
              </span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg"
              >
                {!userEmail ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Welcome to EZone
                    </div>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-blue-900 ring-1 ring-blue-100 hover:bg-blue-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogIn className="h-4 w-4" />
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="mt-2 flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign up
                    </Link>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Signed in as
                      </p>
                      <p className="truncate text-sm font-semibold text-blue-900">
                        {userEmail}
                      </p>
                    </div>

                    {role === "student" && (
                      <Link
                        to="/home"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Student Dashboard
                      </Link>
                    )}
                    {role === "teacher" && (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Teacher Dashboard
                      </Link>
                    )}
                    {role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <div className="mt-1 border-t border-blue-100" />

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
            <div className="space-y-2 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
              {navLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 border-b-2 ${isActive(to)}`}
                >
                  {icon}
                  {label}
                </Link>
              ))}

              <div className="border-t border-blue-100 pt-2" />

              {!userEmail ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-blue-900 ring-1 ring-blue-100 hover:bg-blue-50"
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800"
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
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 border-b-2 ${isActive("/home")}`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Student Dashboard
                    </Link>
                  )}
                  {role === "teacher" && (
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 border-b-2 ${isActive("/dashboard")}`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Teacher Dashboard
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 border-b-2 ${isActive("/admin")}`}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold">
                      {getInitials(userEmail)}
                    </span>
                    <span className="truncate text-sm font-semibold text-blue-900">
                      {userEmail}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800"
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
