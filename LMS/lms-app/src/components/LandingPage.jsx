// src/components/LandingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  limit,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
// src/components/LandingPage.jsx
import HERO_BG_360 from "../assets/landing.png"; // <-- adjust path/name as needed
import logo from "../assets/logo.jpg";
import Footer from "./Footer";
import { useLanguage } from "../context/LanguageContext";

// Icons
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaChartLine,
} from "react-icons/fa";
import {
  FiStar,
  FiUsers,
  FiCheckCircle,
  FiChevronRight,
  FiBookOpen as FiBookOpenIcon,
  FiClock,
  FiTarget,
  FiAward,
  FiMapPin,
  FiMenu,
  FiX,
  FiChevronDown, // ⬅️ for avatar dropdown
  FiDownload,
  FiHome,
  FiInfo,
  FiMessageSquare,
  FiLogIn,
  FiUserPlus,
} from "react-icons/fi";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/** Color system: Dark Blue / Light Blue / White **/

// const HERO_BG_360 = "https://royalinstitute.org/wp-content/uploads/2021/03/Gampaha-RGB.jpg";

// const topStudents = [
//   {
//     id: "s1",
//     name: "Kavindu Perera",
//     subject: "Mathematics",
//     marks: 98,
//     instructor: "John Silva",
//     image: "https://randomuser.me/api/portraits/men/32.jpg",
//   },
//   {
//     id: "s2",
//     name: "Nethmi Fernando",
//     subject: "Science",
//     marks: 96,
//     instructor: "Nimali Perera",
//     image: "https://randomuser.me/api/portraits/women/44.jpg",
//   },
//   {
//     id: "s3",
//     name: "Sahan Jayawardena",
//     subject: "ICT",
//     marks: 95,
//     instructor: "Tharindu Peris",
//     image: "https://randomuser.me/api/portraits/men/54.jpg",
//   },
//   {
//     id: "s4",
//     name: "Hiruni Madushika",
//     subject: "Physics",
//     marks: 94,
//     instructor: "Amara De Silva",
//     image: "https://randomuser.me/api/portraits/women/68.jpg",
//   },
//   {
//     id: "s5",
//     name: "Dilshan Weerasinghe",
//     subject: "Chemistry",
//     marks: 93,
//     instructor: "Ruwan Jayasuriya",
//     image: "https://randomuser.me/api/portraits/men/61.jpg",
//   },
//   {
//     id: "s6",
//     name: "Sachini Gunawardena",
//     subject: "English",
//     marks: 92,
//     instructor: "Ishara Fernando",
//     image: "https://randomuser.me/api/portraits/women/71.jpg",
//   },
//   {
//     id: "s7",
//     name: "Ashen Wickramasinghe",
//     subject: "Web Development",
//     marks: 91,
//     instructor: "Chamindu Madushan",
//     image: "https://randomuser.me/api/portraits/men/77.jpg",
//   },
// ];

/* ---------- Shared data ---------- */
const defaultTutors = [
  {
    id: "t1",
    fullName: "Nimali Perera",
    subjects: "Science, Biology",
    imageUrl: "https://randomuser.me/api/portraits/women/64.jpg",
    rating: 5,
  },
  {
    id: "t2",
    fullName: "John Silva",
    subjects: "Mathematics",
    imageUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4,
  },
  {
    id: "t3",
    fullName: "Amara De Silva",
    subjects: "Physics",
    imageUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
  },
  {
    id: "t4",
    fullName: "Ruwan Jayasuriya",
    subjects: "Chemistry",
    imageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 5,
  },
  {
    id: "t5",
    fullName: "Ishara Fernando",
    subjects: "English, IELTS",
    imageUrl: "https://randomuser.me/api/portraits/women/75.jpg",
    rating: 4,
  },
  {
    id: "t6",
    fullName: "Tharindu Peris",
    subjects: "ICT",
    imageUrl: "https://randomuser.me/api/portraits/men/28.jpg",
    rating: 5,
  },
];


const defaultFeedbacks = [
  {
    id: "1",
    fullName: "Nimali Perera",
    role: "Teacher",
    subject: "Science",
    imageUrl:
      "https://gsep.pepperdine.edu/blog/images/how-much-could-a-masters-degree-increase-your-teaching-salary.png",
    feedback: "EZone is amazing! My students love the interactive lessons.",
    rating: 5,
  },
  {
    id: "2",
    fullName: "John Silva",
    role: "Math Teacher",
    subject: "Mathematics",
    imageUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    feedback:
      "A great platform for both teachers and students to collaborate and grow.",
    rating: 4,
  },
  {
    id: "3",
    fullName: "Amara De Silva",
    role: "Student",
    subject: "Physics",
    imageUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    feedback: "I love how easy it is to track progress and improve my grades!",
    rating: 5,
  },
  {
    id: "4",
    fullName: "Ruwan Jayasuriya",
    role: "Parent",
    subject: "—",
    imageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
    feedback:
      "The parent dashboard helps me stay informed about my child’s learning.",
    rating: 5,
  },
];

const formatPrice = (n) => n.toLocaleString("en-LK");

const courses = [
  {
    id: 1,
    slug: "ms-office-package",
    title: "MS Office Package (Word, Excel, PowerPoint)",
    instructor: "Chamindu Madushan",
    duration: "6 weeks",
    level: "Beginner",
    students: 60,
    rating: 4.9,
    ratingCount: 35,
    price: 0,
    category: "Productivity",
    badge: "Popular",
    image:
      "https://teknertia.com/wp-content/uploads/2023/05/What-is-Microsoft-365-scaled.jpg",
  },
  {
    id: 2,
    slug: "graphic-design-course",
    title: "Graphic Design Course (Photoshop, Illustrator, Figma, XD)",
    instructor: "Chamindu Madushan",
    duration: "8 weeks",
    level: "Beginner → Intermediate",
    students: 95,
    rating: 4.8,
    ratingCount: 28,
    price: 0,
    category: "Design",
    badge: "Hands-On",
    image:
      "https://blog-frontend.envato.com/cdn-cgi/image/width=4800,quality=75,format=auto/uploads/sites/2/2022/05/graphic-design-tools.png",
  },
  {
    id: 3,
    slug: "video-editing-course",
    title: "Video Editing (Premiere Pro, Filmora / CapCut)",
    instructor: "Chamika Dilshan",
    duration: "6 weeks",
    level: "Beginner",
    students: 80,
    rating: 4.7,
    ratingCount: 21,
    price: 0,
    category: "Media",
    badge: "Practical",
    image:
      "https://static.vecteezy.com/system/resources/thumbnails/003/503/501/small_2x/video-editing-timeline-photo.jpg",
  },
  {
    id: 4,
    slug: "web-design-development",
    title: "Web Design & Development (Coding / No-Coding)",
    instructor: "Chamindu Madushan",
    duration: "10 weeks",
    level: "Beginner → Intermediate",
    students: 105,
    rating: 4.8,
    ratingCount: 30,
    price: 0,
    category: "Web",
    badge: "Career-Ready",
    image:
      "https://img.freepik.com/free-photo/computer-program-coding-screen_53876-138060.jpg",
  },
  {
    id: 5,
    slug: "digital-content-creation",
    title: "Digital Content Creation (YouTube & Social Media)",
    instructor: "Chamika Dilshan",
    duration: "5 weeks",
    level: "Beginner",
    students: 70,
    rating: 4.6,
    ratingCount: 18,
    price: 0,
    category: "Content",
    badge: "Trending",
    image:
      "https://png.pngtree.com/thumb_back/fh260/background/20230716/pngtree-illustration-of-social-media-and-digital-marketing-hands-holding-tablet-with-image_3879893.jpg",
  },
];

/* ---------- Small component ---------- */
function StarRating({ rating = 5 }) {
  const stars = useMemo(
    () => Array.from({ length: 5 }, (_, i) => i < rating),
    [rating],
  );
  return (
    <div
      className="flex items-center gap-1 text-amber-400"
      aria-label={`Rating ${rating} of 5`}
    >
      {stars.map((on, i) => (
        <FiStar
          key={i}
          className={
            on
              ? "fill-current drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]"
              : "opacity-25 text-slate-350 dark:text-slate-700"
          }
        />
      ))}
    </div>
  );
}

function Typewriter({ text, delay = 100, startDelay = 0, className = "" }) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (startDelay > 0) {
      const timer = setTimeout(() => {
        setStarted(true);
      }, startDelay);
      return () => clearTimeout(timer);
    } else {
      setStarted(true);
    }
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text, started]);

  return (
    <span className={className}>
      {currentText}
      {started && currentIndex < text.length && (
        <span className="inline-block w-[3px] h-[0.9em] bg-current ml-1 animate-pulse align-middle" />
      )}
    </span>
  );
}

/* ---------- Page component ---------- */
function LandingPage() {
  const { t } = useLanguage();
  const [heroTilt, setHeroTilt] = useState({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });

  const handleHeroMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const normalizedX = x / (rect.width / 2);
    const normalizedY = y / (rect.height / 2);
    const maxRotate = 8; // degrees

    setHeroTilt({
      rotateX: -normalizedY * maxRotate,
      rotateY: normalizedX * maxRotate,
      shadowX: -normalizedX * 12,
      shadowY: -normalizedY * 12,
    });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });
  };

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [students, setStudents] = useState([]);

  const getNoticeTag = (title = "", description = "") => {
    const text = (title + " " + description).toLowerCase();
    if (text.includes("exam") || text.includes("test") || text.includes("paper") || text.includes("විභාග") || text.includes("ප්‍රශ්න පත්‍ර")) {
      return { label: "Exam", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-750 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40" };
    }
    if (text.includes("urgent") || text.includes("important") || text.includes("alert") || text.includes("වැදගත්") || text.includes("අත්‍යවශ්‍ය") || text.includes("විශේෂ")) {
      return { label: "Urgent", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-750 dark:text-rose-455 border border-rose-200/50 dark:border-rose-900/45 animate-pulse" };
    }
    if (text.includes("class") || text.includes("schedule") || text.includes("පන්ති") || text.includes("වේලාව") || text.includes("සටහන")) {
      return { label: "Class", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40" };
    }
    if (text.includes("holiday") || text.includes("cancel") || text.includes("postpone") || text.includes("නිවාඩු") || text.includes("කල් දැමීම")) {
      return { label: "Holiday", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-850 dark:text-amber-400 border border-amber-250/50 dark:border-amber-900/40" };
    }
    return { label: "Notice", color: "bg-orange-50 dark:bg-orange-950/30 text-orange-750 dark:text-orange-400 border border-orange-200/40 dark:border-orange-900/30" };
  };

  // Tutors state
  const [tutors, setTutors] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(true);

  // Scroll to hash on first load (#courses, #about, etc.)
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          0,
        );
      }
    }
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const q = query(
          collection(db, "feedback"),
          orderBy("createdAt", "desc"),
          limit(10),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFeedbacks(data.length ? data : defaultFeedbacks);
      } catch {
        setFeedbacks(defaultFeedbacks);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setTutorLoading(true);
        // No limit(6) → shows ALL teachers
        const q = query(collection(db, "teachers"));
        // You can add ordering if you want:
        // const q = query(collection(db, "teachers"), orderBy("fullName"));

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTutors(data);
      } catch (e) {
        console.error("Error fetching tutors:", e);
        setTutors(defaultTutors); // fallback only if needed
      } finally {
        setTutorLoading(false);
      }
    };

    fetchTutors();
  }, []);

  useEffect(() => {
    // Firestore query: collection "SpecialNotices" ordered by postedAt descending
    const q = query(
      collection(db, "SpecialNotices"),
      orderBy("postedAt", "desc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotices(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          postedAt: doc.data().postedAt?.toDate().toLocaleString(), // format Firestore timestamp
        })),
      );
    });

    return () => unsub(); // cleanup listener on unmount
  }, []);

  useEffect(() => {
    // Query Firestore: TopStudents collection, order by marks descending
    const q = query(collection(db, "TopStudents"), orderBy("marks", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setStudents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    });

    return () => unsub();
  }, []);

  return (
    <div className="bg-white text-slate-900">
      <Navbar />

      {/* Hero with background image */}
      <section
        id="home"
        className="relative isolate overflow-hidden bg-cover bg-center bg-no-repeat scroll-mt-24"
        style={{ backgroundImage: `url(${HERO_BG_360})` }}
      >
        <div className="absolute inset-0 -z-10 bg-blue-900/75" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-50 shadow-sm ring-1 ring-white/20 backdrop-blur">
                <FiCheckCircle /> {t("landing.trustedBy")}
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white lg:text-5xl xl:text-6xl min-h-[140px] md:min-h-[160px] lg:min-h-[190px]">
                <Typewriter text={t("landing.instituteTitle")} delay={60} />
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm font-black mt-2 inline-block">
                  <Typewriter text={t("landing.poweredBy")} delay={80} startDelay={2200} />
                </span>
              </h1>
              <p className="mt-4 text-lg text-blue-100 lg:text-xl">
                {t("landing.heroDesc")}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-[0.98] cursor-pointer"
                >
                  <span>{t("landing.registerBtn")}</span>
                  <FiChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-[0.98] cursor-pointer"
                >
                  <span>{t("landing.loginBtn")}</span>
                  <FiChevronRight className="w-5 h-5 text-blue-650 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>
              </div>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Anuradha+Higher+Educational+Institute,+Morawaka"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-blue-50 shadow ring-1 ring-white/20 backdrop-blur hover:bg-white/20 transition-all cursor-pointer"
              >
                <span
                  role="img"
                  aria-label="location pin"
                  className="text-base"
                >
                  📍
                </span>
                <span className="text-sm font-semibold">
                  Morawaka, Deniyaya
                </span>
              </a>
            </div>

            <div className="relative">
              <div
                className="mx-auto w-full max-w-xl rounded-3xl border border-amber-200/50 bg-white/95 dark:bg-slate-900/90 dark:border-amber-500/20 p-6 shadow-2xl shadow-amber-500/10 dark:shadow-amber-500/5 backdrop-blur transition-all duration-350"
              >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    {/* Glowing pulsing megaphone beacon */}
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/20 shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-2xl bg-amber-400 opacity-75 animate-ping -z-10" />
                      <span className="text-xl animate-pulse">📢</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                        {t("landing.instituteNotices")}
                      </h3>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-yellow-450 uppercase tracking-widest mt-0.5">
                        Institute Notices
                      </p>
                    </div>
                  </div>
                  {/* Premium indicator badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {t("landing.liveUpdates")}
                  </span>
                </div>

                {/* Scrollable Notices List */}
                <div className="max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-500 mb-4">
                        <span className="text-2xl opacity-60">📢</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                        {t("landing.noActiveNotices")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                        {t("landing.noActiveNoticesDesc")}
                      </p>
                    </div>
                  ) : (
                    /* Timeline Minimalist Mode Only */
                    <div className="relative border-l-2 border-dashed border-amber-200/50 dark:border-slate-800/80 ml-3 pl-6 space-y-6 py-2">
                      {notices.map((n) => {
                        const tag = getNoticeTag(n.title, n.description);
                        return (
                          <div key={n.id} className="relative group">
                            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${tag.color}`}>
                                  {tag.label}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                  {n.postedAt ? n.postedAt.split(",")[0] : "N/A"}
                                </span>
                              </div>
                              <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-amber-100">
                                {n.title}
                              </h4>
                              <p className="mt-1 text-sm text-slate-650 dark:text-slate-350 font-medium leading-relaxed">
                                {n.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Read More Notices Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                  <Link
                    to="/all-notices"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-orange-500/10 hover:from-orange-600 hover:to-yellow-600 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{t("landing.readMoreNotices")}</span>
                    <FiChevronRight className="w-4 w-4 transition-transform duration-300 hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Students */}
      <section
        id="top-students"
        className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 py-20 scroll-mt-24"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-blue-900 sm:text-4xl">
              {t("landing.topStudents")}
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              {t("landing.topStudentsDesc")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {students.length === 0 && (
              <p className="text-center text-slate-400 col-span-full">
                No top students found.
              </p>
            )}

            {students.map((s) => (
              <article
                key={s.id}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Student info */}
                <div className="flex items-center gap-4">
                  <img
                    src={s.image}
                    alt={s.name}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-200 shadow-lg group-hover:scale-105 transition"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {s.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Subject: {s.subject}
                    </p>
                  </div>
                </div>

                {/* Marks and instructor */}
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Marks
                    </p>
                    <p className="text-2xl font-bold text-blue-800">
                      {s.marks}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Instructor
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {s.instructor}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}

              </article>
            ))}
          </div>
        </div>
      </section>
      {/* Tutors Section */}
      {/* Tutors Section */}
      <section
        id="tutors"
        className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 scroll-mt-24"
      >
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-28 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-blue-900 sm:text-4xl">
              {t("landing.meetTutors")}
            </h2>
            <h3 className="mt-1 text-2xl font-bold text-slate-700">
              {t("landing.meetTutorsDesc")}
            </h3>
          </div>

          {tutorLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-xl">No tutors available at the moment</p>
              <p className="mt-2">Check back later or contact the institute</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((t) => {
                const subjects = (
                  t.subjects ||
                  t.subject ||
                  t.expertise ||
                  "Tutor"
                )
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 3);

                const studentCount = t.students || 120;
                const lessonCount = t.lessons || 45;

                return (
                  <article
                    key={t.id || t.fullName}
                    className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white shadow-sm ring-1 ring-blue-100 transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div>
                      {/* Tutor info layout - matches Top Student avatar + info styling */}
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              t.imageUrl ||
                              "https://via.placeholder.com/300?text=Tutor"
                            }
                            alt={t.fullName}
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-200 shadow-lg group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-0.5 shadow-md border border-white flex items-center justify-center">
                            <FiCheckCircle className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-blue-900 truncate">
                            {t.fullName}
                          </h3>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-lg bg-blue-50 text-blue-700 text-[25px] font-black uppercase tracking-wider px-2.5 py-1 border border-blue-100 shadow-xs">
                              {subjects.join(" • ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats row - styled exactly like student marks box */}
                      <div className="mt-5 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Students
                          </p>
                          <p className="text-2xl font-bold text-blue-800">
                            {studentCount}+
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Lessons
                          </p>
                          <p className="text-sm font-semibold text-slate-700">
                            {lessonCount}+
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA & Social Links */}
                    <div className="mt-5 flex items-center justify-between">
                      <Link
                        to={`/teachers/${t.id || ""}`}
                        className="text-blue-600 hover:text-blue-800 font-black text-xs uppercase tracking-widest hover:underline transition cursor-pointer"
                      >
                        View Profile
                      </Link>

                      <div className="flex gap-4 items-center">
                        {/* WhatsApp Link */}
                        <a
                          href={`https://wa.me/${(t.contact || "94740172552").replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-755 hover:underline cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <span>Ask WhatsApp</span>
                          <svg className="w-4 h-4 text-green-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.52 3.48A11.91 11.91 0 0012.01 0C5.38 0 .01 5.37.01 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62a11.94 11.94 0 005.83 1.49h.01c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.5-8.39zM12.01 21.54a9.55 9.55 0 01-4.88-1.34l-.35-.21-3.67.96.98-3.58-.23-.37a9.53 9.53 0 118.15 4.54zm5.52-7.26c-.3-.15-1.77-.87-2.03-.967-.273-.099-.471-.148-.67.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.34.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.55.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                          </svg>
                        </a>

                        {/* YouTube Link */}
                        <a
                          href={t.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(t.fullName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-755 hover:underline cursor-pointer"
                          title="Watch Lessons on YouTube"
                        >
                          <span>YouTube</span>
                          <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About EZone Institute */}
      <section
        id="about"
        className="relative overflow-hidden bg-white py-20 scroll-mt-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                <FiBookOpenIcon className="h-4 w-4" />
                About EZone ICT
              </span>

              <h2 className="mt-4 text-3xl font-bold text-blue-900 sm:text-4xl">
                EZone ICT — අභිලාෂයන් ජයග්‍රහණ බවට පත්කරන තැන.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-700">
                EZone යනු ප්‍රතිඵල කේන්ද්‍ර කරගත් නවීන අධ්‍යාපන ආයතනයකි. අපි
                විෂය ප්‍රවීණයන්ගේ මඟපෙන්වීම, ප්‍රායෝගික ව්‍යාපෘති සහ දත්ත මත
                පදනම් වූ නිවැරදි ඇගයීම් තුළින් ශිෂ්‍යයන් සතු විභවතාවයන් සැබෑ
                දක්ෂතාවයන් බවට පරිවර්තනය කරමු.
              </p>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Anuradha+Higher+Educational+Institute,+Morawaka"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-blue-800 ring-1 ring-blue-100 hover:bg-blue-100 transition-all cursor-pointer"
              >
                <FiMapPin className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Morawaka, Deniyaya
                </span>
              </a>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FiTarget className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Our Vision
                  </h3>
                  <p className="mt-1 text-slate-600">
                    තාක්ෂණික ලෝකයේ සාර්ථක වීමට අවශ්‍ය දැනුමෙන් සෑම සිසුවෙකුම
                    සන්නද්ධ කරමින්, ශ්‍රී ලංකාවේ ඉගෙනීමේ සිට ජීවනෝපාය දක්වා වූ
                    වඩාත්ම විශ්වාසදායක මාවත බවට පත්වීම.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FiAward className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Our Mission
                  </h3>
                  <p className="mt-1 text-slate-600">
                    පළපුරුදු ගුරුවරුන් සහ ප්‍රායෝගික ව්‍යාපෘති හරහා අදාළ සහ උසස්
                    තත්ත්වයේ අධ්‍යාපනයක් ලබා දීම—එමඟින් සිසුන්ට රැකියා වෙළඳපොළට
                    අවශ්‍ය සැබෑ කුසලතා ලබා දීම.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Core Values
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Student-first",
                    "Evidence-based",
                    "Inclusive",
                    "Practical",
                    "Collaborative",
                  ].map((v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: gallery */}
            <div className="lg:pl-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=60"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-3xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=60"
                    alt="Students collaborating in a bright campus atrium"
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-blue-900">
                    Campus Atrium
                  </span>
                </a>

                <a
                  href="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=60"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-3xl sm:row-span-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=60"
                    alt="Modern lecture hall with students"
                    className="h-full min-h-[16rem] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-blue-900">
                    Lecture Hall
                  </span>
                </a>

                <a
                  href="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=60"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-3xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=60"
                    alt="Quiet campus library with study desks"
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-blue-900">
                    Learning Library
                  </span>
                </a>

                <a
                  href="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=60"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-3xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=60"
                    alt="Campus exterior walkway with greenery"
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-blue-900">
                    Campus Walkway
                  </span>
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Images are representative of EZone’s campus experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="bg-white py-16 sm:py-20 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-blue-900 sm:text-4xl">
              {t("landing.ourCourses")}
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              {t("landing.ourCoursesDesc")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article
                key={c.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blue-100 transition hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={c.image}
                    alt={c.title}
                    className="h-44 w-full object-cover transition will-change-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded-full bg-blue-700/90 px-3 py-1 text-xs font-semibold text-white">
                      {c.category}
                    </span>
                    {c.badge && (
                      <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white">
                        {c.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-blue-900">
                    <Link
                      to={`/courses/${c.slug}`}
                      className="line-clamp-2 transition hover:text-blue-700"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    By {c.instructor}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <FiClock className="text-blue-700" /> {c.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiBookOpenIcon className="text-blue-700" /> {c.level}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiUsers className="text-blue-700" />{" "}
                      {c.students.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <FiStar className="text-amber-500" aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-700">
                        {c.rating.toFixed(1)}{" "}
                        <span className="text-slate-500">
                          ({c.ratingCount})
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      {/* <div className="text-lg font-bold text-blue-900">
                        LKR {formatPrice(c.price)}
                      // </div> */}
                      {/* removed lkr in first relese */}
                      {c.oldPrice && (
                        <div className="text-xs text-slate-500 line-through">
                          LKR {formatPrice(c.oldPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <a
                      href={`https://wa.me/94740172552?text=${encodeURIComponent(`Hello, I would like to enroll in the course: ${c.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 cursor-pointer"
                    >
                      {t("landing.enrollNow")} <FiChevronRight />
                    </a>
                    {/* <Link
                      to={`/courses/${c.slug}#syllabus`}
                      className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Ask Whatsapp
                    </Link> */}
                    <a
                      href="https://wa.me/94740172552"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {t("landing.askWhatsapp")}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-green-500"
                      >
                        <path d="M20.52 3.48A11.91 11.91 0 0012.01 0C5.38 0 .01 5.37.01 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62a11.94 11.94 0 005.83 1.49h.01c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.5-8.39zM12.01 21.54a9.55 9.55 0 01-4.88-1.34l-.35-.21-3.67.96.98-3.58-.23-.37a9.53 9.53 0 118.15 4.54zm5.52-7.26c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.34.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.55.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>


        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-950 dark:to-slate-900 py-20 scroll-mt-24"
      >
        {/* Background Decorative Blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-150/20 blur-3xl dark:bg-blue-950/10 animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-150/20 blur-3xl dark:bg-purple-950/10 animate-float-medium" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
              {t("landing.testimonials")}
            </span>
            <h2 className="mt-4 text-3xl font-bold text-blue-900 dark:text-white sm:text-4xl">
              {t("landing.communitySays")}
            </h2>
            <p className="mt-3 text-base text-slate-650 dark:text-slate-400">
              {t("landing.communitySaysDesc")}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-center text-slate-600 dark:text-slate-400 animate-pulse font-medium">
                {t("landing.loadingFeedback")}
              </p>
            </div>
          ) : feedbacks.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-12 font-medium">
              {t("landing.noFeedback")}
            </p>
          ) : (
            <Swiper
              modules={[Navigation, Pagination, Autoplay, A11y]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              breakpoints={{ 768: { slidesPerView: 2 } }}
              className="pb-14"
            >
              {feedbacks.map((fb) => (
                <SwiperSlide key={fb.id || fb.createdAt}>
                  <article className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 p-8 shadow-md border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex h-full flex-col justify-between min-h-[260px]">
                    {/* Decorative quotes */}
                    <span className="absolute right-6 top-6 text-7xl font-serif text-slate-200/60 dark:text-slate-800/40 pointer-events-none select-none">
                      “
                    </span>

                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div>
                        {/* User Header */}
                        <div className="mb-6 flex items-center gap-4">
                          <img
                            loading="lazy"
                            src={fb.imageUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(fb.fullName || "User")}
                            alt={fb.fullName}
                            className="h-14 w-14 rounded-full object-cover ring-4 ring-blue-50 dark:ring-slate-950 shadow-sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="font-bold text-blue-900 dark:text-white truncate">
                                {fb.fullName}
                              </h4>
                              <span className="inline-flex text-emerald-500" title="Verified Member">
                                <FiCheckCircle className="h-4 w-4 fill-emerald-100 dark:fill-emerald-950/20" />
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                              {fb.role || "Community Member"}
                              {fb.subject ? ` • ${fb.subject}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Testimonial text */}
                        <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed break-words text-sm pr-4">
                          “{fb.feedback}”
                        </p>
                      </div>

                      {/* Footer Rating */}
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/70">
                        <StarRating rating={Number(fb.rating) || 5} />
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-955 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              හරියට ඉගන ගන්න හරිම තැනට එන්න
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-blue-100">
              Join thousands of learners who are advancing their skills with
              EZone.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 font-semibold text-blue-800 shadow-lg transition hover:scale-[1.02] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Start Learning Today — It’s Free!
              </Link>
              {/* <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                View Pricing
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ---------- Navbar & Footer ---------- */
function Navbar({
  // Pass these from auth context if available. Defaults show logged out state.
  isAuthenticated = false,
  user = { displayName: "EZone Learner", photoURL: "" },
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (history.pushState) history.pushState(null, "", `#${id}`);
      setOpen(false);
      setAvatarOpen(false);
    }
  };

  const NavButton = ({ id, icon: Icon, children }) => (
    <button
      onClick={() => scrollTo(id)}
      className="group relative flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs xl:text-sm font-bold text-slate-700 dark:text-slate-350 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50/40 dark:hover:bg-slate-900/50 transition-all duration-300 active:scale-95 cursor-pointer"
    >
      {Icon && (
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 scale-100 group-hover:scale-110" />
      )}
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 group-hover:w-full rounded-full" />
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800/80 transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("home");
          }}
          className="flex items-center gap-2 font-extrabold tracking-tight text-blue-900 transition-transform duration-300 hover:scale-[1.02]"
        >
          <img
            src={logo}
            alt="EZone Logo"
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 xl:gap-1.5 lg:flex bg-slate-100/50 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
          <NavButton id="home" icon={FiHome}>Home</NavButton>
          <NavButton id="top-students" icon={FiAward}>Top Students</NavButton>
          <NavButton id="tutors" icon={FiUsers}>අපේ ඇදුරු මඩුල්ල</NavButton>
          <NavButton id="about" icon={FiInfo}>අපි ගැන විස්තර</NavButton>
          <NavButton id="courses" icon={FiBookOpenIcon}>පාඨමාලා</NavButton>
          <NavButton id="testimonials" icon={FiMessageSquare}>ප්‍රතිචාර</NavButton>
          <Link
            to="/downloads"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-1.5 text-xs xl:text-sm font-black tracking-wider uppercase shadow-md shadow-orange-500/10 hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <FiDownload className="h-4 w-4" />
            <span>Downloads</span>
          </Link>
        </nav>

        {/* Right side: Auth */}
        <div className="hidden items-center gap-2 lg:flex lg:gap-2 xl:gap-3">
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-xl px-4 py-2 text-xs xl:text-sm font-bold text-blue-900 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/50 hover:ring-blue-300 dark:hover:ring-blue-800 bg-white/40 dark:bg-slate-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-300 active:scale-95 shadow-sm"
            >
              <FiLogIn className="w-4 h-4 text-blue-600 dark:text-blue-405 transition-transform group-hover:translate-x-0.5" />
              <span>Log in</span>
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-blue-50 dark:hover:bg-slate-900/50"
              >
                <img
                  src={
                    user?.photoURL ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=EZ&backgroundType=gradientLinear"
                  }
                  alt={user?.displayName || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 hidden xl:inline">
                  {user?.displayName || "Account"}
                </span>
                <FiChevronDown className="text-slate-500" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-2">
                  <Link
                    to="/dashboard"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-350 hover:bg-blue-50 dark:hover:bg-slate-800/60"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-350 hover:bg-blue-50 dark:hover:bg-slate-800/60"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-350 hover:bg-blue-50 dark:hover:bg-slate-800/60"
                    onClick={() => {
                      setAvatarOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile action area */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            to="/downloads"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4.5 py-2 text-xs font-black tracking-wider uppercase shadow-md shadow-orange-500/10 hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Downloads</span>
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900/50"
            onClick={() => {
              setOpen((v) => !v);
              setAvatarOpen(false);
            }}
            aria-label="Toggle menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-2">
            <button
              onClick={() => scrollTo("home")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("top-students")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              ඉහලම ලකුණු ලබාගත් සිසුන්
            </button>
            <button
              onClick={() => scrollTo("tutors")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              අපගේ ඇදුරු මඩුල්ල
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              අපි ගැන
            </button>
            <button
              onClick={() => scrollTo("courses")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              පාඨමාලාවන්
            </button>
            <button
              onClick={() => scrollTo("testimonials")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              ප්‍රතිචාර
            </button>

            {/* Auth area for mobile */}
            <div className="pt-2">
              {!isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-900 ring-1 ring-blue-100 hover:bg-blue-50"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                    onClick={() => setOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
                    onClick={() => {
                      setOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* External quick link (example) */}
            {/* <Link
              to="/pricing"
              className="mt-1 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Pricing
            </Link> */}
          </div>
        </div>
      )}
    </header>
  );
}



export default LandingPage;
