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
      orderBy("postedAt", "desc"),
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
    }

    setLoading(false);
  };

  const handleEdit = (n) => {
    setEditingId(n.id);
    setTitle(n.title);
    setDescription(n.description);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    await deleteDoc(doc(db, "SpecialNotices", id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-3">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlusCircle className="text-blue-600" size={20} />
            Special Notices
          </h2>
          <button onClick={onClose}>
            <X className="text-slate-500 hover:text-black" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 p-6 border-b md:grid-cols-2"
        >
          <div className="relative md:col-span-2">
            <FileText className="absolute left-3 top-3 text-slate-400" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notice title"
              required
              className="w-full rounded-lg border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="relative md:col-span-2">
            <AlignLeft className="absolute left-3 top-3 text-slate-400" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notice description"
              rows={4}
              required
              className="w-full rounded-lg border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 md:col-span-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setDescription("");
                }}
                className="px-4 py-2 rounded-lg border hover:bg-slate-100"
              >
                Cancel
              </button>
            )}

            <button
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {editingId ? "Update Notice" : "Post Notice"}
            </button>
          </div>
        </form>

        {/* Notices List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notices.length === 0 && (
            <p className="text-center text-slate-400 text-sm">
              No notices posted yet
            </p>
          )}

          {notices.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:shadow-sm transition"
            >
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{n.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {n.postedAt?.toDate().toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 self-end sm:self-start">
                <button
                  onClick={() => handleEdit(n)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
