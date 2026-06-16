import React from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const LoadingSpinner = ({ text = "Loading...", size = "medium", fullScreen = false }) => {
  const sizeClasses = {
    small: "w-10 h-10 border-2",
    medium: "w-16 h-16 border-[3px]",
    large: "w-24 h-24 border-4",
  };

  const iconSizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-10 h-10",
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative flex items-center justify-center">
        {/* Glowing aura bg */}
        <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-indigo-500/10 blur-xl animate-pulse" />
        
        {/* Spinning Gradient Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`rounded-full border-slate-100 dark:border-slate-800 border-t-blue-600 border-r-indigo-500 border-b-purple-500 border-l-sky-400 ${sizeClasses[size]}`}
        />
        
        {/* Pulsing Central Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute flex items-center justify-center"
        >
          <BookOpen className={`text-blue-600 dark:text-blue-400 ${iconSizeClasses[size]}`} />
        </motion.div>
      </div>

      {/* Subtle pulsing loading status text */}
      {text && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-slate-600 dark:text-slate-350 font-semibold tracking-wider text-sm select-none"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100/40 dark:bg-blue-950/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-violet-100/40 dark:bg-indigo-950/10 blur-3xl" />
        
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center p-12 min-h-[280px]">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner;
