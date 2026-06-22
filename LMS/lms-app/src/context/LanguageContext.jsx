import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Default to Sinhala ('si') or load from localStorage if already saved
    return localStorage.getItem("appLanguage") || "si";
  });

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  // Translate function with nested dot-notation support
  const t = (key, fallback = "") => {
    const keys = key.split(".");
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return fallback || key; // Return fallback or the key itself if not found
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
