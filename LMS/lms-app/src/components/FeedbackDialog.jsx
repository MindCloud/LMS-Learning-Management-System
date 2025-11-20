import { useEffect, useState } from "react";
import { X, Send, Mail, MessageSquare, Star } from "lucide-react";

export default function FeedbackDialog({ isOpen, onClose }) {
  const [type, setType] = useState("question"); // question | feedback | bug
  const [rating, setRating] = useState(0); // 0–5 (for feedback)
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(""); // optional email/phone

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit =
    message.trim().length >= 10 && (type !== "feedback" || rating > 0);

  const saveLocally = () => {
    const item = {
      id: crypto.randomUUID(),
      type,
      rating,
      message: message.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString(),
    };
    const prev = JSON.parse(localStorage.getItem("student_feedback") || "[]");
    localStorage.setItem("student_feedback", JSON.stringify([item, ...prev]));
    return item;
  };

  // Builds a mailto (optional for students who want to email the mentor)
  const buildMailto = (item) => {
    const to = ""; // add your email if you want
    const subject = encodeURIComponent(
      `[Student ${item.type.toUpperCase()}] ${item.message.slice(0, 40)}`
    );
    const body = encodeURIComponent(
      `Type: ${item.type}\nRating: ${item.rating || "-"}\nContact: ${
        item.contact || "-"
      }\n\nMessage:\n${item.message}\n\nTimestamp: ${item.createdAt}`
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const submit = () => {
    if (!canSubmit) return;
    const item = saveLocally();
    // Optional: open email client (uncomment next line to enable)
    // window.location.href = buildMailto(item);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b p-4">
          <MessageSquare className="h-5 w-5 text-slate-700" />
          <h3 className="text-base font-semibold">
            Give Feedback / Ask a Question
          </h3>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "question", label: "Question" },
                { key: "feedback", label: "Feedback" },
                { key: "bug", label: "Issue / Bug" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    type === opt.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating for feedback */}
          {type === "feedback" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className={`rounded-md p-2 ${
                      i <= rating
                        ? "text-yellow-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label={`Rate ${i}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        i <= rating ? "fill-yellow-500" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              rows={5}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder={
                type === "question"
                  ? "Ask your question..."
                  : type === "bug"
                  ? "Describe the issue and steps to reproduce..."
                  : "Share your feedback about the class, materials, or teacher..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 10 characters.
            </p>
          </div>

          {/* Contact (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contact (optional)
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Email or phone number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t p-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const item = {
                type,
                rating,
                message: message.trim(),
                contact: contact.trim(),
                createdAt: new Date().toISOString(),
              };
              window.open(
                `mailto:?subject=${encodeURIComponent(
                  `[Student ${item.type.toUpperCase()}]`
                )}&body=${encodeURIComponent(
                  `${item.message}\n\nRating: ${item.rating || "-"}\nContact: ${
                    item.contact || "-"
                  }\nTimestamp: ${item.createdAt}`
                )}`
              );
            }}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Email instead
          </a>
          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
              canSubmit ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-400"
            }`}
          >
            <Send className="h-4 w-4" />
            Save locally
          </button>
        </div>
      </div>
    </div>
  );
}
