import {
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  UserRound,
  BookOpenText,
} from "lucide-react";

function TeacherModal({ teacher, onClose }) {
  if (!teacher) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* content */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-4 border-b p-4">
          <img
            src={teacher.imageUrl}
            alt={teacher.fullName}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h4 className="text-lg font-semibold">{teacher.fullName}</h4>
            <p className="text-sm text-gray-600">{teacher.role || "Teacher"}</p>
          </div>
          <button
            className="ml-auto rounded-lg bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <InfoRow
            icon={<GraduationCap className="h-4 w-4 text-slate-600" />}
            label="Achievements"
            value={teacher.achievements}
          />
          <InfoRow
            icon={<BookOpenText className="h-4 w-4 text-slate-600" />}
            label="Subjects"
            value={teacher.subjects}
          />
          <InfoRow
            icon={<UserRound className="h-4 w-4 text-slate-600" />}
            label="Grade"
            value={teacher.grade}
          />
          <InfoRow
            icon={<Mail className="h-4 w-4 text-slate-600" />}
            label="Email"
            value={teacher.email}
            asLink={`mailto:${teacher.email}`}
          />
          <InfoRow
            icon={<Phone className="h-4 w-4 text-slate-600" />}
            label="Contact"
            value={teacher.contact}
            asLink={`tel:${teacher.contact}`}
          />
          <InfoRow
            icon={<MapPin className="h-4 w-4 text-slate-600" />}
            label="Address"
            value={teacher.address}
          />

          <div className="md:col-span-2">
            <div className="mb-1 flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-semibold">Bio</span>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
              {teacher.bio || "No bio provided."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t p-4">
          <a
            href={`mailto:${teacher.email}`}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Email
          </a>
          <a
            href={`tel:${teacher.contact}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Call
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, asLink }) {
  const content = asLink ? (
    <a
      href={asLink}
      className="break-words text-sm text-blue-600 hover:underline"
    >
      {value || "Not provided"}
    </a>
  ) : (
    <span className="break-words text-sm text-gray-700">
      {value || "Not provided"}
    </span>
  );

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {content}
    </div>
  );
}

export default TeacherModal;
