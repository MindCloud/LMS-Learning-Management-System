import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import {
  BookOpen,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      const q = query(
        collection(db, "materials"),
        where("teacherId", "==", auth.currentUser?.uid || "")
      );
      const snapshot = await getDocs(q);
      setMaterials(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchMaterials();
  }, []);

  const addMaterial = async () => {
    if (!title.trim() || !link.trim()) return;
    await addDoc(collection(db, "materials"), {
      teacherId: auth.currentUser?.uid || "",
      title: title.trim(),
      link: link.trim(),
      createdAt: new Date(),
    });
    setTitle("");
    setLink("");
    window.location.reload(); // keep behavior
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-slate-50 to-white py-10 px-4">
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
              <h2 className="text-lg font-semibold text-slate-900">Learning Materials</h2>
              <p className="text-xs text-slate-500">Share resources with your students</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
              {materials.length} total
            </span>
            {/* Back to Dashboard */}
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
              title="Back to Dashboard"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* top brand ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Composer */}
        <div className="px-6 py-5 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g., Algebra: Linear Equations – Notes)"
              className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://resource-link"
              className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addMaterial}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 px-3 py-3 text-slate-600 ring-1 ring-blue-100">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm">Loading materials…</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-4 py-6 text-slate-600 ring-1 ring-blue-100">
              <p className="text-sm">No materials uploaded yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {materials.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-slate-800 transition hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-200"
                  >
                    <LinkIcon className="h-4 w-4 text-blue-600 transition group-hover:translate-x-0.5" />
                    <span className="truncate">{m.title}</span>
                    <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
                  </a>
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
