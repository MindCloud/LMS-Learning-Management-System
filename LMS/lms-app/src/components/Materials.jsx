// src/pages/Materials.jsx (or wherever it's located) - Updated with Sonner toasts

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  BookOpen,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Loader2,
  ChevronDown,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner"; // <-- Added

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false); // for button loading state
  const navigate = useNavigate();

  // Customize grades as needed
  const grades = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "All Grades",
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast.error("You must be logged in to view materials.");
        setLoading(false);
        setMaterials([]);
        navigate("/login");
        return;
      }

      const q = query(
        collection(db, "materials"),
        where("teacherId", "==", user.uid)
      );

      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const materialsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Sort newest first
          materialsData.sort(
            (a, b) => b.createdAt.toDate() - a.createdAt.toDate()
          );
          setMaterials(materialsData);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore listener error:", error);
          toast.error("Failed to load materials. Please try again.");
          setLoading(false);
        }
      );

      return unsubscribeFirestore;
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const toggleGrade = (grade) => {
    if (grade === "All Grades") {
      if (selectedGrades.includes("All Grades")) {
        setSelectedGrades([]);
      } else {
        setSelectedGrades(["All Grades"]);
      }
    } else {
      if (selectedGrades.includes(grade)) {
        setSelectedGrades(selectedGrades.filter((g) => g !== grade));
      } else {
        setSelectedGrades([
          ...selectedGrades.filter((g) => g !== "All Grades"),
          grade,
        ]);
      }
    }
  };

  const addMaterial = async () => {
    // Client-side validation
    if (!title.trim()) {
      toast.error("Please enter a title for the material.");
      return;
    }
    if (!link.trim()) {
      toast.error("Please enter a valid link.");
      return;
    }
    // Basic URL validation
    try {
      new URL(link.trim());
    } catch {
      toast.error("Please enter a valid URL (include https://).");
      return;
    }
    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade.");
      return;
    }

    setAdding(true);
    toast.loading("Adding material...");

    try {
      await addDoc(collection(db, "materials"), {
        teacherId: auth.currentUser.uid,
        title: title.trim(),
        link: link.trim(),
        grades: selectedGrades.includes("All Grades")
          ? grades.filter((g) => g !== "All Grades")
          : selectedGrades,
        createdAt: new Date(),
      });

      toast.dismiss();
      toast.success("Material added successfully!");

      // Reset form
      setTitle("");
      setLink("");
      setSelectedGrades([]);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error adding material:", error);
      toast.dismiss();
      toast.error("Failed to add material. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const deleteMaterial = async (id, materialTitle) => {
    // Optional: confirm deletion
    if (!window.confirm(`Delete "${materialTitle}"? This cannot be undone.`)) {
      return;
    }

    toast.loading("Deleting material...");

    try {
      await deleteDoc(doc(db, "materials", id));
      toast.dismiss();
      toast.success("Material deleted successfully.");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.dismiss();
      toast.error("Failed to delete material. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-purple-100 via-violet-100 to-purple-50 py-10 px-4">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />

      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white shadow-sm ring-1 ring-blue-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Learning Materials
              </h2>
              <p className="text-xs text-slate-500">
                Share resources with your students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
              {materials.length} total
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* brand ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Composer */}
        <div className="px-6 py-5 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g., Algebra: Linear Equations – Notes)"
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
            disabled={adding}
          />

          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/... or https://youtube.com/..."
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
            disabled={adding}
          />

          {/* Grade Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={adding}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <span>
                {selectedGrades.length === 0
                  ? "Select grade(s)"
                  : selectedGrades.join(", ")}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow-lg ring-1 ring-slate-200">
                <div className="max-h-60 overflow-y-auto py-2">
                  {grades.map((grade) => (
                    <label
                      key={grade}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        disabled={adding}
                      />
                      <span className="text-sm text-slate-700">{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addMaterial}
            disabled={adding}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {adding ? "Adding..." : "Add Material"}
          </button>
        </div>

        {/* List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 px-3 py-3 text-slate-600 ring-1 ring-blue-100">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm">Loading materials…</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-6 py-8 text-center text-slate-600 ring-1 ring-blue-100">
              <BookOpen className="mx-auto h-10 w-10 text-blue-400 mb-3" />
              <p className="text-sm">
                No materials shared yet. Add your first one above!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex-1 flex items-start gap-3 text-left"
                    >
                      <LinkIcon className="mt-0.5 h-5 w-5 text-blue-600 flex-shrink-0 transition group-hover:translate-x-1" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 group-hover:text-blue-700 transition">
                          {m.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          For:{" "}
                          <strong>
                            {m.grades && m.grades.length > 0
                              ? m.grades.join(", ")
                              : "All Grades"}
                          </strong>
                        </p>
                        <p className="mt-1 text-xs text-slate-400 truncate max-w-md">
                          {m.link}
                        </p>
                      </div>
                      <ExternalLink className="mt-0.5 h-4 w-4 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                    </a>

                    <button
                      onClick={() => deleteMaterial(m.id, m.title)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition"
                      title="Delete material"
                      aria-label={`Delete ${m.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Materials;
