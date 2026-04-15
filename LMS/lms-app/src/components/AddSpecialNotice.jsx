import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  X,
  Trash2,
  Edit2,
  FileText,
  AlignLeft,
  PlusCircle,
} from "lucide-react";
import { db } from "../firebase";

export default function AddSpecialNoticeModal({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "SpecialNotices"),
      orderBy("postedAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "SpecialNotices", editingId), {
          title,
          description,
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "SpecialNotices"), {
          title,
          description,
          postedAt: serverTimestamp(),
        });
      }

      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (n) => {
    setEditingId(n.id);
    setTitle(n.title);
    setDescription(n.description);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    try {
      await deleteDoc(doc(db, "SpecialNotices", id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete notice");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 sm:px-3 sm:py-6">
      <div className="w-full h-full sm:h-auto sm:max-w-4xl bg-white sm:rounded-2xl shadow-xl overflow-hidden flex flex-col sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <PlusCircle className="text-blue-600" size={20} />
            Special Notices
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="text-slate-500 hover:text-black" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-6 border-b bg-slate-50/30"
          >
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notice title"
                required
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notice description"
                rows={4}
                required
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setDescription("");
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-95 shadow-md focus:ring-2 ring-blue-500"
              >
                {editingId ? "Update Notice" : "Post Notice"}
              </button>
            </div>
          </form>

          {/* Notices List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {notices.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">
                No notices posted yet
              </p>
            )}

            {notices.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:shadow-sm transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{n.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {n.description}
                  </p>
                  {n.postedAt && (
                    <p className="text-xs text-slate-400 mt-2">
                      {n.postedAt.toDate().toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 self-end sm:self-start mt-2 sm:mt-0">
                  <button
                    onClick={() => handleEdit(n)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}