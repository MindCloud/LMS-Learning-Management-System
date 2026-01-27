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
import { FaLock, FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { toast } from "sonner";
import { motion } from "framer-motion"; // Suggest adding: npm install framer-motion

const BG_URL =
  "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80";

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
    <main className="relative min-h-screen flex items-center justify-center font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-white to-blue-500/20" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-multiply filter blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, #4f46e5, transparent)`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] px-6"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              EZ
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              EZone
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="text-slate-500 mt-2">
            Enter your details to access your account
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5 ml-1">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  size="sm"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl py-3 pl-11 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              {isLoading ? "Authenticating..." : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 tracking-widest font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <FaGoogle className="text-red-500" />
            Google Account
          </button>
        </div>

        <p className="mt-8 text-center text-slate-600">
          New to EZone?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-bold hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default Login;
