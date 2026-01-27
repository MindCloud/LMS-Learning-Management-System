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
import { X, Trash2, Edit2, User, Book, Star } from "lucide-react";
import { db } from "../firebase";

export default function AddTopStudentModal({ open, onClose }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [instructor, setInstructor] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "TopStudents"), orderBy("marks", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const studentData = {
      name,
      subject,
      marks: Number(marks),
      instructor,
      image,
      createdAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "TopStudents", editingId), studentData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "TopStudents"), studentData);
      }
      setName("");
      setSubject("");
      setMarks("");
      setInstructor("");
      setImage("");
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }

    setLoading(false);
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setName(s.name);
    setSubject(s.subject);
    setMarks(s.marks);
    setInstructor(s.instructor);
    setImage(s.image);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student?")) return;
    await deleteDoc(doc(db, "TopStudents", id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-3">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            Top Students
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
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student Name"
              required
              className="w-full rounded-lg border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Subject */}
          <div className="relative">
            <Book className="absolute left-3 top-3 text-slate-400" />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full rounded-lg border pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Marks */}
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="Marks"
            required
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {/* Instructor */}
          <input
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            placeholder="Instructor"
            required
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {/* Image URL */}
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL"
            required
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
          />

          {/* Buttons */}
          <div className="flex justify-end gap-2 md:col-span-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setSubject("");
                  setMarks("");
                  setInstructor("");
                  setImage("");
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
              {editingId ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {students.length === 0 && (
            <p className="text-center text-slate-400 text-sm">
              No students added yet
            </p>
          )}

          {students.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-16 h-16 rounded-full object-cover border shadow-sm"
                />
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-600">{s.subject}</p>
                  <p className="text-sm text-slate-600">
                    Instructor: {s.instructor}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Marks: {s.marks}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 self-end sm:self-start">
                <button
                  onClick={() => handleEdit(s)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                  title="Delete"
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
