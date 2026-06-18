import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
} from "react-icons/fi";
import logo from "../assets/logo.jpg";

export default function Footer() {
  // Dynamic Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to generate calendar days
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const startDayIndex = getFirstDayOfMonth(year, month);

  const daysArray = [];
  // Pad the start of the month with empty slots
  for (let i = 0; i < startDayIndex; i++) {
    daysArray.push(null);
  }
  // Fill in active month days
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-300 py-16 border-t border-slate-900 overflow-hidden font-sans">
      {/* Decorative subtle background glows */}
      <div className="absolute top-1/2 left-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 xl:gap-12 pb-12 border-b border-slate-800/60">
          
          {/* Brand Column - Spans 4 */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="EZone Logo"
                className="h-12 w-auto rounded-lg object-contain border border-slate-700/50 shadow-md"
              />
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                EZone<span className="text-blue-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Empowering learners and educators in Sri Lanka since 2020. Our modern LMS provides interactive courses, digital materials, and progress analytics to A/L students and beyond.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-650/10 transition-all duration-350 active:scale-90"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-400/50 hover:bg-blue-400/10 transition-all duration-350 active:scale-90"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-350 active:scale-90"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-350 active:scale-90"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column - Spans 2 */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Explore</h4>
            <ul className="space-y-3 text-slate-400 text-sm font-semibold">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#courses"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Courses
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column - Spans 2 */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Support</h4>
            <ul className="space-y-3 text-slate-400 text-sm font-semibold">
              <li>
                <Link to="/help" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/downloads" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">
                  Downloads
                </Link>
              </li>
            </ul>
          </div>

          {/* Calendar Widget Column - Spans 4 */}
          <div className="md:col-span-4 space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Academic Calendar</h4>
            
            {/* Interactive Calendar Box */}
            <div className="rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 shadow-2xl space-y-4">
              
              {/* Header: Month/Year navigation */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white tracking-wide">
                  {monthNames[month]} {year}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                    aria-label="Previous month"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                    aria-label="Next month"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                  <span key={dayName} className="text-[10px] uppercase font-bold text-slate-500">
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-6" />;
                  }

                  const activeDay = isToday(day);

                  return (
                    <div
                      key={`day-${day}`}
                      className={`h-6 w-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all select-none relative group ${
                        activeDay
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20 scale-105"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                      }`}
                    >
                      {day}
                      {/* Pulsing glow ring for today's date */}
                      {activeDay && (
                        <span className="absolute inset-0 rounded-lg border border-blue-400/40 animate-ping opacity-75" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

        {/* Footer Bottom copyright and notes */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-xs font-medium">
          <p>© {new Date().getFullYear()} EZone. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Designed with excellence for students in Sri Lanka</span>
            <span className="text-blue-500/70">❤</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
