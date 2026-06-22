// src/components/LanguageToggle.jsx
import React, { useState } from "react";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [hovered, setHovered] = useState(false);

  // Audio synthesize click sound (ultra-premium feel)
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      
      if (language === "si") {
        // High pitch clean chime for switching to English
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.15);
      } else {
        // Soft drop chime for switching to Sinhala
        osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.15);
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

  const toggleLanguage = () => {
    playClickSound();
    setLanguage((prev) => (prev === "si" ? "en" : "si"));
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-6 md:right-24 z-50">
      {/* Floating Toggle Button Wrapper */}
      <motion.button
        onClick={toggleLanguage}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-800 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-colors hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:bg-slate-800 dark:shadow-slate-950/40"
        aria-label="Toggle language"
      >
        <div className="relative h-6 w-6 flex items-center justify-center">
          <motion.div
            initial={false}
            animate={{
              rotate: language === "si" ? 0 : 360,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          >
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
          
          {/* Small badge inside the circle button showing the active language */}
          <span className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white font-extrabold text-[8px] px-1 py-0.5 rounded-md shadow-xs select-none">
            {language === "si" ? "සිං" : "EN"}
          </span>
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
        {language === "si" ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"}
      </motion.div>
    </div>
  );
}
