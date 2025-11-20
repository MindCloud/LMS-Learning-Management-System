import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Bell, Plus, Loader2, Megaphone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Notices() {
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotices = async () => {
      const q = query(
        collection(db, "notices"),
        where("teacherId", "==", auth.currentUser?.uid || "")
      );
      const snapshot = await getDocs(q);
      setNotices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchNotices();
  }, []);

  const addNotice = async () => {
    if (!newNotice.trim()) return;
    await addDoc(collection(db, "notices"), {
      teacherId: auth.currentUser?.uid || "",
      content: newNotice.trim(),
      createdAt: new Date(),
    });
    setNewNotice("");
    window.location.reload(); // keep behavior
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-emerald-50/30 to-white py-10 px-4">
      {/* soft background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-100 blur-3xl" />

      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white shadow-sm ring-1 ring-amber-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Manage Notices</h2>
              <p className="text-xs text-slate-500">Post announcements for your students</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              {notices.length} total
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </div>
        </div>

        {/* brand ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" />

        {/* Composer */}
        <div className="px-6 py-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNotice}
              onChange={(e) => setNewNotice(e.target.value)}
              placeholder="Write a short announcement"
              className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={addNotice}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-50/60 to-emerald-50/40 px-3 py-3 text-slate-600 ring-1 ring-amber-100">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <p className="text-sm">Loading notices…</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-amber-50/60 to-emerald-50/50 px-4 py-6 text-slate-600 ring-1 ring-amber-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-amber-100">
                <Megaphone className="h-5 w-5 text-amber-700" />
              </span>
              <p className="text-sm">No notices yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-slate-900"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                    <Megaphone className="h-3.5 w-3.5 text-emerald-700" />
                  </span>
                  <span>{notice.content}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notices;
