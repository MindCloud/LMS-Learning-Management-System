// src/pages/Signup.jsx (updated with professional Sonner toast notifications)

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner"; // <-- Added for toast notifications

function classNames(...c) {
  return c.filter(Boolean).join(" ");
}

const BG_URL =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1920&auto=format&fit=crop";

const sriLankaPhone = /^(?:\+94|0)?7\d{8}$/;
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordChecks(pw) {
  return {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

const StrengthBar = ({ password }) => {
  const checks = passwordChecks(password);
  const passed = Object.values(checks).filter(Boolean).length;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const label = password ? labels[Math.max(0, passed - 1)] : "";
  return (
    <div className="mt-1">
      <div className="h-1 w-full rounded bg-gray-200">
        <div
          className={classNames(
            "h-1 rounded transition-all",
            passed <= 1
              ? "bg-red-500"
              : passed === 2
              ? "bg-yellow-500"
              : passed === 3
              ? "bg-blue-500"
              : "bg-blue-600"
          )}
          style={{ width: `${(passed / 4) * 100}%` }}
        />
      </div>
      {password && (
        <p className="mt-1 text-xs text-gray-600">
          Password strength: <span className="font-medium">{label}</span>
        </p>
      )}
    </div>
  );
};

const Field = ({ label, hint, error, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-800">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const ImagePreview = ({ url }) => {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [url]);
  return (
    <div className="mt-2 overflow-hidden rounded-lg border bg-gray-50">
      {url ? (
        <img
          src={url}
          alt="Student preview"
          className="h-40 w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">
          No image URL
        </div>
      )}
      {!ok && (
        <div className="p-2 text-xs text-red-600">
          Couldn’t load image from the provided URL.
        </div>
      )}
    </div>
  );
};

const TeacherCard = ({ t, selected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(t.id)}
    className={classNames(
      "w-full text-left rounded-lg border bg-white/90 p-4 shadow-sm backdrop-blur transition hover:shadow-md focus:outline-none focus:ring-2",
      selected ? "ring-2 ring-blue-500 border-blue-500" : "focus:ring-blue-400"
    )}
  >
    <div className="flex gap-3">
      <img
        src={
          t.imageUrl ||
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600&auto=format&fit=crop"
        }
        alt={t.fullName || "Teacher"}
        className="h-20 w-20 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-base font-semibold">
            {t.fullName || "Unnamed"}
          </h3>
          <span
            className={classNames(
              "rounded-full px-2 py-0.5 text-xs",
              selected
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {selected ? "Selected" : "Tap to select"}
          </span>
        </div>
        {t.username && <p className="text-sm text-gray-600">@{t.username}</p>}
        <p className="line-clamp-2 text-sm text-gray-700">
          <strong>Subject:</strong> {t.subjects || "—"}{" "}
          <span className="text-gray-400">•</span> <strong>Grade:</strong>{" "}
          {t.grade || "—"}
        </p>
        {t.contact && (
          <p className="text-xs text-gray-600">
            <strong>Contact:</strong> {t.contact}
          </p>
        )}
        {t.bio && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{t.bio}</p>
        )}
      </div>
    </div>
  </button>
);

function Signup() {
  const navigate = useNavigate();

  // form state
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [school, setSchool] = useState("");
  const [studentImage, setStudentImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [grade, setGrade] = useState("");

  // teachers state
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [tLoading, setTLoading] = useState(true);
  const [tError, setTError] = useState("");
  const [tQuery, setTQuery] = useState("");
  const [tGrade, setTGrade] = useState("");
  const [tSubject, setTSubject] = useState("");
  const [teacherError, setTeacherError] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setTLoading(true);
        const querySnapshot = await getDocs(collection(db, "teachers"));
        const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeachers(list);
        setTError("");
        toast.success("Teachers loaded successfully!");
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTError("Could not load teachers. Please try again later.");
        toast.error("Failed to load teachers list.");
      } finally {
        setTLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = tQuery.trim().toLowerCase();
      const byQuery =
        !q ||
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
        (t.subjects && String(t.subjects).toLowerCase().includes(q)) ||
        (t.grade && String(t.grade).toLowerCase().includes(q));
      const byGrade =
        !tGrade || String(t.grade).toLowerCase() === tGrade.toLowerCase();
      const bySubject =
        !tSubject ||
        String(t.subjects || "")
          .toLowerCase()
          .includes(tSubject.toLowerCase());
      return byQuery && byGrade && bySubject;
    });
  }, [teachers, tQuery, tGrade, tSubject]);

  const toggleTeacher = (id) => {
    setSelectedTeacherIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id];

      if (updated.length > 0) {
        setTeacherError("");
      }

      return updated;
    });
  };

  const validate = () => {
    const e = {};
    if (!studentId.trim()) e.studentId = "Student ID is required.";
    if (!fullName.trim()) e.fullName = "Full name is required.";
    if (!course) e.course = "Please select a course.";
    if (course === "6-11-classes" && !grade) e.grade = "Please select a grade.";
    if (!guardianName.trim()) e.guardianName = "Guardian name is required.";
    if (!contactNumber.trim() || !sriLankaPhone.test(contactNumber.trim()))
      e.contactNumber =
        "Enter a valid Sri Lankan mobile number (e.g., 07XXXXXXXX or +94XXXXXXXXX).";
    if (!address.trim()) e.address = "Address is required.";
    if (!birthday) e.birthday = "Birthday is required.";
    if (!school.trim()) e.school = "School is required.";
    if (!studentImage.trim())
      e.studentImage = "Please add a student image URL.";
    if (!email.trim() || !emailRx.test(email.trim()))
      e.email = "Enter a valid email address.";
    const checks = passwordChecks(password);
    if (!(checks.len && checks.upper && checks.num)) {
      e.password =
        "Password must be at least 8 chars and include an uppercase letter and a number.";
    }
    if (!agree) e.agree = "You must accept the terms.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validate()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    // Teacher selection validation
    if (selectedTeacherIds.length === 0) {
      setTeacherError("Please select at least one teacher.");
      toast.error("You must select at least one teacher.");
      return;
    }

    setLoading(true);
    toast.loading("Creating your account...");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "students", user.uid), {
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        course,
        grade: course === "6-11-classes" ? grade : null,
        guardianName: guardianName.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        birthday,
        school: school.trim(),
        status: "pending",
        studentImage: studentImage.trim(),
        email: email.trim().toLowerCase(),
        role: "student",
        preferredTeachers: selectedTeacherIds.map((id) => ({
          preferredTeacherId: id,
        })),
        createdAt: serverTimestamp(),
      });

      // Success feedback
      toast.dismiss(); // remove loading toast
      toast.success(
        "Account created successfully! Your teacher requests are pending approval."
      );

      // Navigate to login
      navigate("/login");
    } catch (err) {
      console.error(err);

      let message = "Signup failed. Please try again.";

      // Friendly Firebase error messages
      switch (err.code) {
        case "auth/email-already-in-use":
          message = "This email is already registered. Try logging in.";
          break;
        case "auth/weak-password":
          message = "Password is too weak.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/network-request-failed":
          message = "Network error. Check your connection and try again.";
          break;
        default:
          message = err.message || message;
      }

      toast.dismiss();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BG_URL})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/65" />

      {/* Page Content */}
      <div className="relative z-10">
        {/* Simple brand header */}
        <header className="border-b border-white/10 bg-white/10 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-extrabold tracking-tight text-white"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                EZ
              </span>
              <span className="text-lg">EZone </span>
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white"
            >
              Already have an account? Log in
            </button>
          </div>
        </header>

        {/* Main card */}
        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur">
            {/* Decorative top gradient strip */}
            <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />

            {/* Title */}
            <div className="px-6 pb-0 pt-6 sm:px-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Student Signup
                  </h1>
                  <p className="text-sm text-slate-600">
                    Create your EZone account and request teachers.
                  </p>
                </div>
              </div>
            </div>

            {/* Form grid */}
            <form
              onSubmit={handleSignup}
              className="grid gap-6 px-6 pb-8 pt-4 sm:px-8 lg:grid-cols-3"
            >
              {/* Left 2 cols: form */}
              <div className="space-y-6 lg:col-span-2">
                {/* Student information */}
                <section className="rounded-xl border bg-white/90 p-6 shadow-sm backdrop-blur">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Student Information
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Student ID / Reg. No."
                      required
                      error={errors.studentId}
                    >
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>
                    <Field label="Full Name" required error={errors.fullName}>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>

                    <Field label="Course" required error={errors.course}>
                      <select
                        value={course}
                        onChange={(e) => {
                          setCourse(e.target.value);
                          if (e.target.value !== "6-11-classes") setGrade("");
                        }}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Course</option>
                        <option value="after-al">After A/L</option>
                        <option value="after-ol">After O/L</option>
                        <option value="6-11-classes">Grade 6–11 Classes</option>
                      </select>
                    </Field>

                    {course === "6-11-classes" && (
                      <Field label="Grade" required error={errors.grade}>
                        <select
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Grade</option>
                          {[6, 7, 8, 9, 10, 11].map((g) => (
                            <option key={g} value={g}>
                              Grade {g}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    <Field label="School" required error={errors.school}>
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>

                    <Field
                      label="Contact Number"
                      required
                      error={errors.contactNumber}
                      hint="e.g., 0712345678 or +94712345678"
                    >
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>

                    <Field label="Birthday" required error={errors.birthday}>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>

                    <Field label="Address" required error={errors.address}>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>

                    <Field
                      label="Student Image URL"
                      required
                      error={errors.studentImage}
                    >
                      <input
                        type="url"
                        value={studentImage}
                        onChange={(e) => setStudentImage(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                      <ImagePreview url={studentImage} />
                    </Field>
                  </div>
                </section>

                {/* Guardian */}
                <section className="rounded-xl border bg-white/90 p-6 shadow-sm backdrop-blur">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Guardian
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Guardian Name"
                      required
                      error={errors.guardianName}
                    >
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>
                  </div>
                </section>

                {/* Account */}
                <section className="rounded-xl border bg-white/90 p-6 shadow-sm backdrop-blur">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Account
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email" required error={errors.email}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Field>
                    <Field
                      label="Password"
                      required
                      error={errors.password}
                      hint="Min 8 chars, include uppercase and a number."
                    >
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                          aria-label={
                            showPw ? "Hide password" : "Show password"
                          }
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                      </div>
                      <StrengthBar password={password} />
                    </Field>
                  </div>

                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        required
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the <span className="underline">Terms</span>{" "}
                        and <span className="underline">Privacy Policy</span>.
                      </span>
                    </label>
                    {errors.agree && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.agree}
                      </p>
                    )}
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-lg border px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || selectedTeacherIds.length === 0}
                    className={classNames(
                      "rounded-lg px-5 py-2 font-semibold text-white transition",
                      loading || selectedTeacherIds.length === 0
                        ? "cursor-not-allowed bg-blue-400"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {loading ? "Creating..." : "Sign Up"}
                  </button>
                </div>
              </div>

              {/* Right column: teacher picker */}
              <aside className="space-y-4">
                <div className="rounded-xl border bg-white/90 p-6 shadow-sm backdrop-blur">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Choose Teachers <span className="text-red-500">*</span>
                  </h2>

                  <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Search name/subject/grade"
                      value={tQuery}
                      onChange={(e) => setTQuery(e.target.value)}
                      className="col-span-2 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                      value={tGrade}
                      onChange={(e) => setTGrade(e.target.value)}
                      className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Grades</option>
                      {[6, 7, 8, 9, 10, 11, "O/L", "A/L"].map((g) => (
                        <option key={g} value={String(g)}>
                          {typeof g === "number" ? `Grade ${g}` : g}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Filter by subject (e.g., Maths)"
                      value={tSubject}
                      onChange={(e) => setTSubject(e.target.value)}
                      className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-3"
                    />
                  </div>

                  {/* Required error */}
                  {teacherError && (
                    <p className="mb-2 text-sm font-medium text-red-600">
                      {teacherError}
                    </p>
                  )}

                  <div className="mt-3 grid max-h-[520px] grid-cols-1 gap-3 overflow-auto pr-1">
                    {tLoading ? (
                      <p className="py-8 text-center text-gray-500">
                        Loading teachers...
                      </p>
                    ) : filteredTeachers.length === 0 ? (
                      <p className="py-8 text-center text-gray-500">
                        No teachers found matching your filters.
                      </p>
                    ) : (
                      filteredTeachers.map((t) => (
                        <TeacherCard
                          key={t.id}
                          t={t}
                          selected={selectedTeacherIds.includes(t.id)}
                          onToggle={toggleTeacher}
                        />
                      ))
                    )}
                  </div>

                  {selectedTeacherIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-blue-700">
                        Selected Teacher IDs:
                      </p>
                      <p className="font-mono text-xs text-blue-700">
                        {selectedTeacherIds.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="mb-1 font-semibold">Tip</p>
                  <p>
                    Select multiple teachers to request their classes. Your
                    requests will be pending until approved.
                  </p>
                </div>
              </aside>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;
