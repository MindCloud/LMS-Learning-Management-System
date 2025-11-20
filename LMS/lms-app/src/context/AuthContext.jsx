import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    // Keep localStorage in sync
    if (userEmail && role) {
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("role");
    }
  }, [userEmail, role]);

  return (
    <AuthContext.Provider value={{ userEmail, role, setUserEmail, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
