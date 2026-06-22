// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // Initial fetch from localStorage or system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemDark ? "dark" : "light";
  });

  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Audio synthesize click sound (ultra-premium feel)
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      
      if (theme === "light") {
        // High pitch clean chime for turning on dark mode (moon rise)
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
      } else {
        // Soft drop chime for turning on light mode (sun rise)
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.15);
      }
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
      
      setTimeout(() => {
        audioCtx.close();
      }, 200);
    } catch (e) {
      console.warn("Audio Context sound blocked or unsupported", e);
    }
  };

  const toggleTheme = () => {
    playClickSound();
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button Wrapper */}
      <motion.button
        onClick={toggleTheme}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-800 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-colors hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:bg-slate-800 dark:shadow-slate-950/40"
        aria-label="Toggle dark mode"
      >
        <div className="relative h-6 w-6">
          <motion.div
            initial={false}
            animate={{
              rotate: theme === "dark" ? 0 : 90,
              opacity: theme === "dark" ? 1 : 0,
              scale: theme === "dark" ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-6 w-6 text-blue-400 fill-blue-400/20" />
          </motion.div>
          
          <motion.div
            initial={false}
            animate={{
              rotate: theme === "light" ? 0 : -90,
              opacity: theme === "light" ? 1 : 0,
              scale: theme === "light" ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-6 w-6 text-amber-500 fill-amber-500/25" />
          </motion.div>
        </div>
      </motion.button>

      {/* Floating Mode Description Badge (expands on hover) */}
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.8 }}
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : -20,
          scale: hovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none absolute right-16 top-3.5 hidden md:block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-md backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap"
      >
        {theme === "dark" ? "Dark Mode Active" : "Light Mode Active"}
      </motion.div>
    </div>
  );
}
