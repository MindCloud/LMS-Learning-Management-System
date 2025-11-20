import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

// Icons
import {
  MessageSquare,
  Reply,
  User,
  CheckCircle2,
  Clock3,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function TeacherQuestions() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false); // sending reply
  const [fetching, setFetching] = useState(true); // fetching questions
  const navigate = useNavigate();

  // Fetch questions for the logged-in teacher
  useEffect(() => {
    const fetchQuestions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setFetching(true);
        const q = query(
          collection(db, "questions"),
          where("teacherId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const questionList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setQuestions(questionList);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchQuestions();
  }, []);

  // Open modal
  const handleOpenModal = (question) => {
    setSelectedQuestion(question);
    setReply(question.reply || "");
  };

  // Send reply
  const handleSendReply = async () => {
    if (!reply.trim()) return alert("Please type a reply.");
    setLoading(true);

    try {
      await updateDoc(doc(db, "questions", selectedQuestion.id), {
        reply: reply.trim(),
        status: "answered",
        repliedAt: serverTimestamp(),
      });

      alert("Reply sent!");
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? { ...q, reply: reply.trim(), status: "answered" }
            : q
        )
      );
      setSelectedQuestion(null);
      setReply("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Error sending reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-slate-50 to-white py-8 px-4">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-white shadow-sm ring-1 ring-blue-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Questions
              </h2>
              <p className="text-xs text-slate-500">
                View and reply to student queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
              {questions.length} total
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
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Content */}
        <div className="p-6">
          {fetching ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200"
                />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
              <p className="text-sm">No questions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {questions.map((q) => (
                <article
                  key={q.id}
                  className="flex h-full flex-col justify-between rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                >
                  {/* Header row */}
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={
                        q.studentImage ||
                        "https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png"
                      }
                      alt={q.studentName}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {q.studentName}
                      </h3>
                      <StatusChip status={q.status} />
                    </div>
                  </div>

                  {/* Question */}
                  <p className="mb-4 line-clamp-4 text-slate-800">{q.question}</p>

                  {/* Existing reply */}
                  {q.reply && (
                    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-800">
                      <span className="mr-1 inline-flex items-center gap-1 font-medium text-slate-900">
                        <Reply className="h-4 w-4" /> Your reply:
                      </span>
                      {q.reply}
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenModal(q)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                      q.reply
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    <Reply className="h-4 w-4" />
                    {q.reply ? "Edit Reply" : "Reply"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog
        open={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-blue-100">
          {/* Modal header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-base font-semibold text-slate-900">
              Reply to {selectedQuestion?.studentName}
            </Dialog.Title>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* ribbon */}
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

          {/* Modal body */}
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-start gap-3 rounded-xl border bg-slate-50 px-3 py-2">
              <span className="mt-0.5 text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <p className="text-sm text-slate-800">
                {selectedQuestion?.question}
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Your reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply here"
              className="h-32 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Modal footer */}
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              onClick={() => setSelectedQuestion(null)}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSendReply}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Reply className="h-4 w-4" />
              )}
              {loading ? "Sending" : "Send Reply"}
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}

/* UI-only helper */
function StatusChip({ status }) {
  const isAnswered = (status || "").toLowerCase() === "answered";
  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isAnswered
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isAnswered ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock3 className="h-3.5 w-3.5" />
      )}
      {status || "pending"}
    </span>
  );
}
