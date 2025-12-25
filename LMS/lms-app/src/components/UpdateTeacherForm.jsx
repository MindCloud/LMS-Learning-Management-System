// src/components/UpdateTeacherForm.jsx (updated with Sonner toast notifications)

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner"; // <-- Added

import {
  X,
  User,
  AtSign,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  GraduationCap,
  BookOpen,
  Award,
  FileText,
  Loader2,
  Shield,
  Info,
  CheckCircle2,
} from "lucide-react";

/* ----------------------------- Helpers ----------------------------- */
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRx = /^(?:\+94|0)?7\d{8}$/;
const urlRx = /^https?:\/\/.+/i;

function UpdateTeacherForm({ teacher, onClose, onTeacherUpdated }) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    role: "",
    subjects: "",
    grades: [],
    bio: "",
    achievements: "",
    contact: "",
    address: "",
    imageUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" }); // Kept for inline feedback inside modal
  const dialogRef = useRef(null);

  // Populate form when teacher prop changes
  useEffect(() => {
    if (teacher) {
      setForm({
        fullName: teacher.fullName || "",
        username: teacher.username || "",
        email: teacher.email || "",
        role: teacher.role || "teacher",
        subjects: teacher.subjects || "",
        grades: Array.isArray(teacher.grades)
          ? teacher.grades
          : teacher.grade
          ? [teacher.grade]
          : [],
        bio: teacher.bio || "",
        achievements: teacher.achievements || "",
        contact: teacher.contact || "",
        address: teacher.address || "",
        imageUrl: teacher.imageUrl || "",
      });
    }
  }, [teacher]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close on overlay click
  const onOverlayClick = (e) => {
    if (e.target === dialogRef.current) onClose?.();
  };

  const validate = async () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.email.trim() || !emailRx.test(form.email.trim()))
      e.email = "Enter a valid email address.";
    if (form.contact && !phoneRx.test(form.contact.trim())) {
      e.contact = "Valid SL mobile (07XXXXXXXX or +94XXXXXXXXX).";
    }
    if (form.imageUrl && !urlRx.test(form.imageUrl))
      e.imageUrl = "Image URL must start with http(s)://";

    // Uniqueness checks (excluding current teacher)
    if (!e.username) {
      const uq = query(
        collection(db, "teachers"),
        where("username", "==", form.username.trim())
      );
      const ur = await getDocs(uq);
      if (!ur.empty && ur.docs.some((d) => d.id !== teacher.id)) {
        e.username = "This username is already in use.";
      }
    }

    if (!e.email) {
      const eq = query(
        collection(db, "teachers"),
        where("email", "==", form.email.trim().toLowerCase())
      );
      const er = await getDocs(eq);
      if (!er.empty && er.docs.some((d) => d.id !== teacher.id)) {
        e.email = "This email is already registered.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleGradeChange = (e) => {
    const { checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      grades: checked
        ? [...prev.grades, value]
        : prev.grades.filter((g) => g !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner({ type: "", message: "" });

    if (!(await validate())) {
      toast.error("Please fix the highlighted errors and try again.");
      return;
    }

    try {
      setSubmitting(true);
      toast.loading("Updating teacher profile...");

      const teacherRef = doc(db, "teachers", teacher.id);
      await updateDoc(teacherRef, {
        ...form,
        email: form.email.trim().toLowerCase(),
        updatedAt: new Date().toISOString(),
      });

      toast.dismiss();
      toast.success(`Teacher "${form.fullName}" updated successfully!`);

      onTeacherUpdated?.();
      setTimeout(() => onClose?.(), 800); // Give user time to see toast
    } catch (err) {
      toast.dismiss();
      console.error("Error updating teacher:", err);

      const message =
        err?.message || "Failed to update teacher. Please try again.";
      toast.error(message);

      setBanner({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      onMouseDown={onOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/20 backdrop-blur-sm p-4"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-900">
              Update Teacher Profile
            </h2>
            <p className="text-xs text-blue-700/70">Modify teacher details</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-blue-700/70 transition hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Optional inline banner (kept for detailed context inside modal) */}
        {banner.message && (
          <div
            className={`mx-6 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              banner.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {banner.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="grid gap-6 p-6 md:grid-cols-2">
          {/* Left — Personal */}
          <div className="space-y-4">
            <SectionTitle icon={<User className="h-4 w-4" />} blue>
              Personal Information
            </SectionTitle>

            <Input
              icon={<User className="h-4 w-4" />}
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              required
              error={errors.fullName}
            />

            <Input
              icon={<AtSign className="h-4 w-4" />}
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              error={errors.username}
            />

            <Input
              icon={<Mail className="h-4 w-4" />}
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              error={errors.email}
            />

            <Input
              icon={<Phone className="h-4 w-4" />}
              name="contact"
              type="text"
              placeholder="Contact Number"
              value={form.contact}
              onChange={handleChange}
              error={errors.contact}
            />

            <Input
              icon={<MapPin className="h-4 w-4" />}
              name="address"
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />

            <div>
              <Input
                icon={<ImageIcon className="h-4 w-4" />}
                name="imageUrl"
                type="url"
                placeholder="Profile Image URL"
                value={form.imageUrl}
                onChange={handleChange}
                error={errors.imageUrl}
              />
              <ImagePreview url={form.imageUrl} />
            </div>
          </div>

          {/* Right — Professional */}
          <div className="space-y-4">
            <SectionTitle icon={<GraduationCap className="h-4 w-4" />} blue>
              Professional Information
            </SectionTitle>

            <LabeledSelect
              label="Role"
              icon={<Shield className="h-4 w-4" />}
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: "teacher", label: "Teacher" },
                { value: "lead-teacher", label: "Lead Teacher" },
                { value: "admin", label: "Admin" },
              ]}
            />

            <LabeledSelect
              label="Primary Subject"
              icon={<BookOpen className="h-4 w-4" />}
              name="subjects"
              value={form.subjects}
              onChange={handleChange}
              options={[
                { value: "", label: "Select Subject" },
                { value: "Math", label: "Math" },
                { value: "Science", label: "Science" },
                { value: "English", label: "English" },
                { value: "History", label: "History" },
                { value: "ICT", label: "ICT" },
              ]}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-blue-900">
                Teaching Grades
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Grade 6",
                  "Grade 7",
                  "Grade 8",
                  "Grade 9",
                  "Grade 10",
                  "Grade 11",
                  "A/L",
                ].map((g) => (
                  <label
                    key={g}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition cursor-pointer ${
                      form.grades.includes(g)
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-blue-100 bg-white hover:bg-blue-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={g}
                      checked={form.grades.includes(g)}
                      onChange={handleGradeChange}
                      className="accent-blue-600"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              icon={<FileText className="h-4 w-4" />}
              name="bio"
              placeholder="Short bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
            />

            <Textarea
              icon={<Award className="h-4 w-4" />}
              name="achievements"
              placeholder="Key achievements (optional)"
              value={form.achievements}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t bg-gradient-to-r from-white to-blue-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-blue-200 px-5 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- UI Components (unchanged) ----------------------------- */
function SectionTitle({ children, icon, blue }) {
  return (
    <h3
      className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
        blue ? "text-blue-800" : "text-slate-600"
      }`}
    >
      {icon}
      {children}
    </h3>
  );
}

function Input({ icon, error, ...props }) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/70">
          {icon}
        </span>
        <input
          {...props}
          className={`w-full rounded-xl border border-blue-100 bg-white px-9 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 ${
            error ? "border-rose-300 focus:ring-rose-300" : ""
          } ${props.className || ""}`}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function Textarea({ icon, rows = 4, error, ...props }) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-3 text-blue-500/70">
          {icon}
        </span>
        <textarea
          {...props}
          rows={rows}
          className={`w-full rounded-xl border border-blue-100 bg-white px-9 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 ${
            error ? "border-rose-300 focus:ring-rose-300" : ""
          } ${props.className || ""}`}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function LabeledSelect({ label, icon, options, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-blue-900">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/70">
          {icon}
        </span>
        <select
          {...props}
          className="w-full appearance-none rounded-xl border border-blue-100 bg-white px-9 py-2.5 text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-300"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ImagePreview({ url }) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [url]);

  if (!url) {
    return (
      <div className="mt-2 flex h-36 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-xs text-blue-700">
        No image URL provided
      </div>
    );
  }

  return ok ? (
    <img
      src={url}
      alt="Profile preview"
      className="mt-2 h-36 w-full rounded-lg border border-blue-100 object-cover"
      onError={() => setOk(false)}
    />
  ) : (
    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
      Could not load image from the provided URL.
    </div>
  );
}

export default UpdateTeacherForm;
