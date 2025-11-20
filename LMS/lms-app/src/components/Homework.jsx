import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { NotebookPen, Plus, Loader2, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ← added

function Homework() {
  const [homeworks, setHomeworks] = useState([]);
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ← added

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const q = query(
          collection(db, "homework"),
          where("teacherId", "==", auth.currentUser?.uid || "")
        );
        const snapshot = await getDocs(q);
        setHomeworks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, []);

  const addHomework = async () => {
    if (!task.trim()) return;
    await addDoc(collection(db, "homework"), {
      teacherId: auth.currentUser?.uid || "",
      task: task.trim(),
      createdAt: new Date(),
    });
    setTask("");
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
              <NotebookPen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Homework</h2>
              <p className="text-xs text-slate-500">Assign tasks to your students</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
              {homeworks.length} total
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
        <div className="px-6 py-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter homework task (e.g., Chapter 3: Exercises 1–10)"
                className="w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-blue-500"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                press Enter to add
              </div>
            </div>
            <button
              onClick={addHomework}
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
              <p className="text-sm">Loading homework…</p>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-sky-50/40 px-4 py-6 text-slate-600 ring-1 ring-blue-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-blue-100">
                <ListChecks className="h-5 w-5 text-blue-600" />
              </span>
              <p className="text-sm">No homework assigned yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {homeworks.map((hw) => (
                <li
                  key={hw.id}
                  className="group rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-slate-900 transition hover:bg-sky-50 hover:ring-1 hover:ring-sky-200"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-sky-400" />
                    <div className="flex-1">
                      <p className="text-sm">{hw.task}</p>
                      {hw.createdAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            hw.createdAt.seconds
                              ? hw.createdAt.seconds * 1000
                              : hw.createdAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
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

export default Homework;
