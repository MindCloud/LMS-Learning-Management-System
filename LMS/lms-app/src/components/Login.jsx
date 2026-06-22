import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { toast } from "sonner";
import { motion } from "framer-motion";
import logo from "../assets/logo.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      let userData;
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        userData = docSnap.data();
      } else {
        const teachersRef = collection(db, "teachers");
        const q = query(teachersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
        } else {
          toast.error("No profile found!");
          setIsLoading(false);
          return;
        }
      }

      const role = userData.role?.toLowerCase().trim();

      localStorage.setItem("role", role);
      localStorage.setItem("userEmail", user.email); // 🔥 FIX

      toast.success(`Welcome back, ${role}!`);

      navigate(
        role === "student"
          ? "/home"
          : role === "teacher"
            ? "/dashboard"
            : role === "admin"
              ? "/admin"
              : "/",
      );
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center font-sans selection:bg-blue-600/30 selection:text-white bg-slate-950 overflow-hidden">
      {/* Dynamic Glowing Mesh Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[140px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-sky-500/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[450px] px-6 py-12 z-10"
      >
        {/* Branding Logo & Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group transition-transform hover:scale-[1.02]">
            <img
              src={logo}
              alt="EZone Logo"
              className="h-11 w-auto rounded-xl object-contain border border-slate-800/80 shadow-xl shadow-blue-950/20 group-hover:rotate-6 transition-transform duration-300"
            />
            <span className="text-2xl font-black tracking-tight text-white flex items-center">
              EZone<span className="text-blue-500">.</span>
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sign In</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Enter your credentials to access the learning portal
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Address */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-650 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 text-sm shadow-inner"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-slate-655 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200 text-sm shadow-inner"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash size={16} />
                  ) : (
                    <FaEye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:active:scale-100 disabled:pointer-events-none mt-4 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* Footer/Navigation Link */}
        <p className="mt-8 text-center text-slate-400 text-sm">
          New to EZone?{" "}
          <Link
            to="/signup"
            className="text-blue-400 font-bold hover:text-blue-300 transition-colors hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default Login;
