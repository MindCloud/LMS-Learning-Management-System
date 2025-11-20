// src/pages/Login.jsx (or wherever you keep it)
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FaLock, FaEye, FaEyeSlash, FaGoogle, FaGithub } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { RiShieldUserFill } from "react-icons/ri";

const BG_URL =
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1920&q=60"; // crisp campus/education look

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let userData;

      // 1) Try "students" by UID
      let docRef = doc(db, "students", user.uid);
      let docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        userData = docSnap.data();
      } else {
        // 2) Fallback "teachers" by email
        const teachersRef = collection(db, "teachers");
        const q = query(teachersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
        } else {
          setError("No profile found in our system!");
          setIsLoading(false);
          return;
        }
      }

      localStorage.setItem("role", userData.role);
      localStorage.setItem("userEmail", user.email);

      if (userData.role === "student") {
        navigate("/home");
        window.location.reload();
      } else if (userData.role === "teacher") {
        navigate("/dashboard");
        window.location.reload();
      } else if (userData.role === "admin") {
        navigate("/admin");
        window.location.reload();
      } else {
        setError("Role not assigned!");
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support.";
      case "auth/user-not-found":
        return "No account found. Please check your email or sign up.";
      case "auth/wrong-password":
        return "Incorrect password. Try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Background image + overlay */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_URL})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/60 via-blue-800/50 to-blue-600/50" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-white">
        <Link
          to="/#home"
          className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-90"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
            EZ
          </span>
          <span className="hidden sm:inline">EZone </span>
        </Link>
        <Link
          to="/"
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur hover:bg-white/20"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Centered card */}
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/90 p-1 shadow-2xl ring-1 ring-slate-200 backdrop-blur">
            {/* Header */}
            <div className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-center text-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <RiShieldUserFill className="text-3xl" />
              </div>
              <h1 className="text-xl font-bold">Welcome back to EZone</h1>
              <p className="mt-1 text-blue-100 text-sm">Sign in to access your learning dashboard</p>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              {error && (
                <div
                  className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="font-semibold">Login failed</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="relative">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MdEmail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Row */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isLoading ? "cursor-not-allowed opacity-80" : ""
                  }`}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="col-span-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-12 py-3 text-base font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      // onClick={handleGoogle}
                    >
                      <FaGoogle className="h-5 w-5 mr-2 text-red-500" />
                      Continue with Google
                    </button>
                  </div>

              </div>

              {/* Bottom link */}
              <p className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Small footnote */}
          <p className="mt-6 text-center text-xs text-white/90">
            © {new Date().getFullYear()} EZone Institute — Learn. Build. Excel.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;
