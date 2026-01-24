import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Search,
  CheckCircle2,
  Loader2,
  Camera,
  ShieldCheck,
} from "lucide-react";

/* ---------------- HELPERS ---------------- */

const sriLankaPhone = /^(?:\+94|0)?7\d{8}$/;
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordChecks(pw) {
  return {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /\d/.test(pw),
  };
}

/* ---------------- COMPONENTS ---------------- */

const ModernInput = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700 ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <input
        {...props}
        className={`block w-full pl-11 pr-4 py-3 bg-white border rounded-2xl outline-none ${
          error ? "border-red-500 bg-red-50" : "border-slate-200"
        }`}
      />
    </div>
    {error && (
      <p className="text-xs font-bold text-red-500 ml-1">
        {error}
      </p>
    )}
  </div>
);

const TeacherCard = ({ t, selected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(t.id)}
    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
      selected
        ? "bg-blue-50 border-blue-500"
        : "bg-slate-50 border-transparent hover:border-slate-200"
    }`}
  >
    <img
      src={
        t.imageUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          t.fullName || "Teacher"
        )}&background=3b82f6&color=fff`
      }
      className="h-14 w-14 rounded-xl object-cover"
    />

    <div className="flex-1 min-w-0">
      <p className="font-bold text-slate-900 truncate">
        {t.fullName}
      </p>
      <p className="text-xs text-slate-500 font-semibold uppercase">
        {t.subjects || "General"} • {t.grade || "Any"}
      </p>
    </div>

    {selected && (
      <CheckCircle2 className="h-6 w-6 text-blue-600" />
    )}
  </button>
);

/* ---------------- MAIN ---------------- */

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    studentId: "",
    fullName: "",
    course: "",
    grade: "",
    guardianName: "",
    contactNumber: "",
    address: "",
    birthday: "",
    school: "",
    studentImage: "",
    email: "",
    password: "",
    agree: false,
  });

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] =
    useState([]);
  const [tQuery, setTQuery] = useState("");
  const [tLoading, setTLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /* -------- Fetch Teachers -------- */

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        setTeachers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch {
        toast.error("Failed to load teachers");
      } finally {
        setTLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          t.fullName?.toLowerCase().includes(
            tQuery.toLowerCase()
          ) ||
          t.subjects?.toLowerCase().includes(
            tQuery.toLowerCase()
          )
      ),
    [teachers, tQuery]
  );

  /* -------- Validation -------- */

  const validate = () => {
    const e = {};
    if (!formData.studentId) e.studentId = "Required";
    if (!formData.fullName) e.fullName = "Required";
    if (!formData.course) e.course = "Select course";
    if (
      formData.course === "6-11-classes" &&
      !formData.grade
    )
      e.grade = "Select grade";
    if (!formData.guardianName) e.guardianName = "Required";
    if (!sriLankaPhone.test(formData.contactNumber))
      e.contactNumber = "Invalid Sri Lankan number";
    if (!formData.address) e.address = "Required";
    if (!formData.birthday) e.birthday = "Required";
    if (!formData.school) e.school = "Required";
    if (!formData.studentImage)
      e.studentImage = "Image URL required";
    if (!emailRx.test(formData.email))
      e.email = "Invalid email";

    const pw = passwordChecks(formData.password);
    if (!(pw.len && pw.upper && pw.num))
      e.password =
        "Min 8 chars, uppercase & number";

    if (!formData.agree)
      e.agree = "Accept terms";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* -------- Submit -------- */

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Fix form errors");
      return;
    }

    if (selectedTeacherIds.length === 0) {
      toast.error("Select at least one teacher");
      return;
    }

    setLoading(true);

    try {
      const { user } =
        await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

      await setDoc(doc(db, "students", user.uid), {
        ...formData,
        role: "student",
        status: "pending",
        preferredTeachers: selectedTeacherIds.map(
          (id) => ({ preferredTeacherId: id })
        ),
        createdAt: serverTimestamp(),
      });

      toast.success("Account created!");
      navigate("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-xl"
          >
            <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
              EZ
            </div>
            EZone
          </button>
          <Link
            to="/login"
            className="text-blue-600 font-semibold"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid lg:grid-cols-12 gap-10">
        {/* FORM */}
        <div className="lg:col-span-7 space-y-8">
          <h1 className="text-3xl font-bold">
            Student Registration
          </h1>

          <form
            onSubmit={handleSignup}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow">
              <h2 className="font-bold mb-4">
                Student Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <ModernInput
                  label="Student ID"
                  icon={ShieldCheck}
                  error={errors.studentId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      studentId: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="Full Name"
                  icon={User}
                  error={errors.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullName: e.target.value,
                    })
                  }
                />

                {/* COURSE */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Course
                  </label>
                  <select
                    className={`w-full p-3 rounded-2xl border ${
                      errors.course
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200"
                    }`}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        course: e.target.value,
                        grade: "",
                      })
                    }
                  >
                    <option value="">
                      Select course
                    </option>
                    <option value="6-11-classes">
                      Grade 6–11 Classes
                    </option>
                    <option value="al-ict">
                      A/L ICT
                    </option>
                    <option value="ol-ict">
                      O/L ICT
                    </option>
                    <option value="foundation">
                      Foundation IT
                    </option>
                  </select>
                  {errors.course && (
                    <p className="text-xs font-bold text-red-500 ml-1">
                      {errors.course}
                    </p>
                  )}
                </div>

                {/* GRADE */}
                {formData.course ===
                  "6-11-classes" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Grade
                    </label>
                    <select
                      className={`w-full p-3 rounded-2xl border ${
                        errors.grade
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grade: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Select grade
                      </option>
                      {[6, 7, 8, 9, 10, 11].map(
                        (g) => (
                          <option
                            key={g}
                            value={g}
                          >
                            Grade {g}
                          </option>
                        )
                      )}
                    </select>
                    {errors.grade && (
                      <p className="text-xs font-bold text-red-500 ml-1">
                        {errors.grade}
                      </p>
                    )}
                  </div>
                )}

                <ModernInput
                  label="Guardian Name"
                  icon={User}
                  error={errors.guardianName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardianName: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="Contact Number"
                  icon={Phone}
                  error={errors.contactNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactNumber: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="Address"
                  icon={MapPin}
                  error={errors.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="Birthday"
                  type="date"
                  icon={Calendar}
                  error={errors.birthday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthday: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="School"
                  icon={GraduationCap}
                  error={errors.school}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      school: e.target.value,
                    })
                  }
                />

                <ModernInput
                  label="Student Image URL"
                  icon={Camera}
                  error={errors.studentImage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      studentImage: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* ACCOUNT */}
            <div className="bg-white p-8 rounded-3xl shadow">
              <h2 className="font-bold mb-4">
                Account Security
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <ModernInput
                  label="Email"
                  icon={Mail}
                  error={errors.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />
                <ModernInput
                  label="Password"
                  icon={Lock}
                  type="password"
                  error={errors.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              <label className="flex gap-2 mt-4 text-sm">
                <input
                  type="checkbox"
                  checked={formData.agree}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agree: e.target.checked,
                    })
                  }
                />
                Accept Terms & Privacy Policy
              </label>
              {errors.agree && (
                <p className="text-xs font-bold text-red-500">
                  {errors.agree}
                </p>
              )}
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* TEACHERS */}
        <aside className="lg:col-span-5">
          <div className="bg-white p-8 rounded-3xl shadow h-full">
            <h2 className="text-xl font-bold mb-4">
              Select Teachers
            </h2>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-slate-400" />
              <input
                placeholder="Search teachers..."
                className="w-full pl-10 p-3 rounded-xl bg-slate-100"
                onChange={(e) =>
                  setTQuery(e.target.value)
                }
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {tLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                filteredTeachers.map((t) => (
                  <TeacherCard
                    key={t.id}
                    t={t}
                    selected={selectedTeacherIds.includes(
                      t.id
                    )}
                    onToggle={(id) =>
                      setSelectedTeacherIds((p) =>
                        p.includes(id)
                          ? p.filter(
                              (x) => x !== id
                            )
                          : [...p, id]
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Signup;
