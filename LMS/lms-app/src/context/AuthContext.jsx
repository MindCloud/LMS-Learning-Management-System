import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const email = user.email;
        setUserEmail(email);
        localStorage.setItem("userEmail", email);

        // Fetch role if missing from localStorage
        let currentRole = localStorage.getItem("role");
        if (!currentRole) {
          try {
            const studentSnap = await getDoc(doc(db, "students", user.uid));
            if (studentSnap.exists()) {
              currentRole = studentSnap.data().role?.toLowerCase().trim() || "student";
            } else {
              const q = query(collection(db, "teachers"), where("email", "==", email));
              const teacherSnap = await getDocs(q);
              if (!teacherSnap.empty) {
                currentRole = teacherSnap.docs[0].data().role?.toLowerCase().trim() || "teacher";
              }
            }
          } catch (e) {
            console.error("Error fetching user role:", e);
          }
        }
        if (currentRole) {
          setRole(currentRole);
          localStorage.setItem("role", currentRole);
        }
      } else {
        // Only clear session state if explicitly signed out
        setUserEmail(null);
        setRole(null);
        localStorage.removeItem("userEmail");
        localStorage.removeItem("role");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUserEmail(null);
    setRole(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        role,
        currentUser,
        authLoading,
        setUserEmail,
        setRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

