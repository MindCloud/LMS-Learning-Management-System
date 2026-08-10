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
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
                {...props}
                className={`block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${error ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-slate-200 dark:border-slate-800"
                    }`}
            />
        </div>
        {error && (
            <p className="text-xs font-bold text-red-500 dark:text-red-400 ml-1">
                {error}
            </p>
        )}
    </div>
);

const TeacherCard = ({ t, selected, onToggle }) => (
    <button
        type="button"
        onClick={() => onToggle(t.id)}
        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 cursor-pointer ${selected
            ? "bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/30"
            : "bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
    >
        <img
            src={
                t.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    t.fullName || "Teacher"
                )}&background=3b82f6&color=fff`
            }
            alt={t.fullName}
            className="h-14 w-14 rounded-xl object-cover ring-2 ring-blue-200 dark:ring-slate-800"
        />

        <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {t.fullName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                {t.subjects || "General"} • {t.grade || "Any"}
            </p>
        </div>

        {selected && (
            <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
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
                    (id) => ({ preferredTeacherId: id, status: "pending" })
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* NAVBAR */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                        <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-blue-500/20">
                            EZ
                        </div>
                        <span>EZone</span>
                    </button>
                    <Link
                        to="/login"
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        Log in
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-8 grid lg:grid-cols-12 gap-8 lg:gap-10">
                {/* FORM */}
                <div className="lg:col-span-7 space-y-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Student Registration
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Complete the fields below to enroll in EZone Portal
                        </p>
                    </div>

                    <form
                        onSubmit={handleSignup}
                        className="space-y-8"
                    >
                        <div className="bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
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
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        Course
                                    </label>
                                    <select
                                        className={`w-full p-3 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.course
                                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                            : "border-slate-200 dark:border-slate-800"
                                            }`}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                course: e.target.value,
                                                grade: "",
                                            })
                                        }
                                    >
                                        <option value="" className="dark:bg-slate-900 text-slate-400">
                                            Select course
                                        </option>
                                        <option value="6-11-classes" className="dark:bg-slate-900">
                                            Grade 6–11 Classes
                                        </option>
                                        <option value="al-ict" className="dark:bg-slate-900">
                                            A/L
                                        </option>
                                        <option value="ol-ict" className="dark:bg-slate-900">
                                            O/L
                                        </option>
                                        <option value="other" className="dark:bg-slate-900">
                                            Other
                                        </option>
                                    </select>
                                    {errors.course && (
                                        <p className="text-xs font-bold text-red-500 dark:text-red-400 ml-1">
                                            {errors.course}
                                        </p>
                                    )}
                                </div>

                                {/* GRADE */}
                                {formData.course ===
                                    "6-11-classes" && (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                                Grade
                                            </label>
                                            <select
                                                className={`w-full p-3 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.grade
                                                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                                    : "border-slate-200 dark:border-slate-800"
                                                    }`}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        grade: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="" className="dark:bg-slate-900 text-slate-400">
                                                    Select grade
                                                </option>
                                                {[6, 7, 8, 9, 10, 11].map(
                                                    (g) => (
                                                        <option
                                                            key={g}
                                                            value={g}
                                                            className="dark:bg-slate-900"
                                                        >
                                                            Grade {g}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {errors.grade && (
                                                <p className="text-xs font-bold text-red-500 dark:text-red-400 ml-1">
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
                        <div className="bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-500" />
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

                            <label className="flex items-center gap-3 mt-6 text-sm text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                                <input
                                    type="checkbox"
                                    checked={formData.agree}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            agree: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span>Accept Terms & Privacy Policy</span>
                            </label>
                            {errors.agree && (
                                <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-1">
                                    {errors.agree}
                                </p>
                            )}
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-extrabold shadow-xl shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mx-auto h-6 w-6 text-white" />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </div>

                {/* TEACHERS */}
                <aside className="lg:col-span-5">
                    <div className="bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 h-full transition-colors duration-300">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Select Teachers
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                            Choose the teachers whose classes you will attend
                        </p>

                        <div className="relative mb-6">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                placeholder="Search teachers by name or subject..."
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder-slate-400 dark:placeholder-slate-500"
                                onChange={(e) =>
                                    setTQuery(e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {tLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                                </div>
                            ) : filteredTeachers.length === 0 ? (
                                <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
                                    No teachers found
                                </p>
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
