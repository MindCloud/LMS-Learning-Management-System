// src/components/LandingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";
// src/components/LandingPage.jsx
import HERO_BG_360 from "../assets/landing.jpeg"; // <-- adjust path/name as needed
import logo from "../assets/logo1.jpeg";

// Icons
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaChartLine,
  FaPlay,
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
} from "react-icons/fi";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/** Color system: Dark Blue / Light Blue / White **/

// const HERO_BG_360 = "https://royalinstitute.org/wp-content/uploads/2021/03/Gampaha-RGB.jpg";

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

const features = [
  {
    icon: <FaChalkboardTeacher className="mb-4 text-4xl text-blue-600" />,
    title: "Expert Instructors",
    description:
      "Learn from industry professionals with real-world experience.",
  },
  {
    icon: <FaBookOpen className="mb-4 text-4xl text-blue-500" />,
    title: "Comprehensive Courses",
    description: "Access a wide range of courses across multiple disciplines.",
  },
  {
    icon: <FaChartLine className="mb-4 text-4xl text-blue-400" />,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics.",
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
    students: 120,
    rating: 4.9,
    ratingCount: 35,
    price: 15000,
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
    price: 25000,
    category: "Design",
    badge: "Hands-On",
    image:
      "https://nise.org.pk/wp-content/uploads/2017/02/Graphic-Designing1-1024x614.jpg",
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
    price: 20000,
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
    price: 30000,
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
    price: 18000,
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
    [rating]
  );
  return (
    <div
      className="flex items-center gap-1 text-blue-400"
      aria-label={`Rating ${rating} of 5`}
    >
      {stars.map((on, i) => (
        <FiStar key={i} className={on ? "fill-current" : "opacity-30"} />
      ))}
    </div>
  );
}

/* ---------- Page component ---------- */
function LandingPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

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
          0
        );
      }
    }
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const snap = await getDocs(collection(db, "feedback"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFeedbacks(data.length ? data : defaultFeedbacks);
      } catch (e) {
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
        const q = query(collection(db, "teachers"), limit(6));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTutors(data.length ? data : defaultTutors);
      } catch (e) {
        setTutors(defaultTutors);
      } finally {
        setTutorLoading(false);
      }
    };
    fetchTutors();
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
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-50 shadow-sm ring-1 ring-white/20 backdrop-blur">
                <FiCheckCircle /> Trusted by 50k+ learners
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                අනුරාධ උසස් අධ්‍යාපන ආයතනය මොරවක​
                <br />
                <span className="text-blue-300">EZone ICT</span>
              </h1>
              <p className="mt-4 text-lg text-blue-100 md:text-xl">
                The modern LMS for students, educators, and institutions. Learn
                smarter with interactive courses, analytics, and AI assistance.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Get Started Free <FaPlay className="text-sm" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  I have an account
                </Link>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-blue-50 shadow ring-1 ring-white/20 backdrop-blur">
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
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white">
                    <FiUsers />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Live cohorts
                    </p>
                    <p className="text-xs text-slate-600">
                      Learn together, faster
                    </p>
                  </div>
                </div>
                <ul className="mt-4 list-inside list-disc text-sm text-slate-700">
                  <li>Weekly mentor sessions</li>
                  <li>Recorded lectures & quizzes</li>
                  <li>Certificates on completion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              Meet Our Top Tutors
            </h2>
            <p className="mt-2 text-slate-600">
              Handpicked experts across key subjects
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
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
              const students = t.students || 120;
              const lessons = t.lessons || 45;

              return (
                <article
                  key={t.id || t.fullName}
                  className="group flex h-64 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-blue-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Left: Tutor Image */}
                  <div className="relative h-full w-48 flex-shrink-0">
                    <img
                      src={t.imageUrl || "/default-avatar.png"}
                      alt={t.fullName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute left-3 top-3 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                      ★ {Number(t.rating) || 5}
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 line-clamp-1">
                        {t.fullName}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-1">
                        {subjects.join(" • ")}
                      </p>

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {subjects.map((s, i) => (
                          <span
                            key={`${t.fullName}-${s}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                              i % 2 === 0
                                ? "bg-blue-50 text-blue-700 ring-blue-100"
                                : "bg-cyan-50 text-cyan-700 ring-cyan-100"
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Stats + Buttons */}
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Stats */}
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-base font-bold text-blue-700">
                            {students}+
                          </div>
                          <div className="text-[12px] text-slate-500">
                            Students
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-bold text-blue-700">
                            {lessons}+
                          </div>
                          <div className="text-[12px] text-slate-500">
                            Lessons
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          to={`/teachers/${t.id || ""}`}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                        >
                          View Profile
                        </Link>
                        <Link
                          to={`/courses?instructor=${encodeURIComponent(
                            t.fullName
                          )}`}
                          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 ring-1 ring-blue-200 transition hover:bg-blue-50"
                        >
                          Courses
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
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
                EZone ICT — Where ambition becomes achievement
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-700">
                EZone is a modern learning institute focused on outcomes. We
                blend expert instruction, practical projects, and data-driven
                feedback to help learners move from <em>potential</em> to{" "}
                <em>proof</em>.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-blue-800 ring-1 ring-blue-100">
                <FiMapPin className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Morawaka, Deniyaya
                </span>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FiTarget className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Our Vision
                  </h3>
                  <p className="mt-1 text-slate-600">
                    To be Sri Lanka’s most trusted path from learning to
                    livelihood—equipping every student to thrive in a digital
                    world.
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
                    Deliver relevant, high-quality education with expert mentors
                    and practical projects—so learners gain skills that stick.
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
              Available Courses
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Explore instructor-led, project-based courses designed for
              real-world skills.
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
                      <div className="text-lg font-bold text-blue-900">
                        LKR {formatPrice(c.price)}
                      </div>
                      {c.oldPrice && (
                        <div className="text-xs text-slate-500 line-through">
                          LKR {formatPrice(c.oldPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <Link
                      to={`/courses/${c.slug}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      Enroll now <FiChevronRight />
                    </Link>
                    <Link
                      to={`/courses/${c.slug}#syllabus`}
                      className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline"
                    >
                      View syllabus
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* This goes to the full Courses page */}
          <div className="mt-10 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
            >
              Browse all courses <FiChevronRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="bg-gradient-to-r from-blue-50 to-white py-16 scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-blue-900 sm:text-4xl">
              What Our Community Says
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Real feedback from teachers and learners.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-slate-600">Loading feedback…</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-center text-slate-600">
              No feedback yet. Be the first to share!
            </p>
          ) : (
            <Swiper
              modules={[Navigation, Pagination, Autoplay, A11y]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              breakpoints={{ 768: { slidesPerView: 2 } }}
              className="pb-12"
            >
              {feedbacks.map((fb) => (
                <SwiperSlide key={fb.id}>
                  <article className="flex h-full flex-col justify-between rounded-2xl bg-white p-8 shadow-sm ring-1 ring-blue-100">
                    <div className="mb-6 flex items-center gap-4">
                      <img
                        loading="lazy"
                        src={fb.imageUrl || "/default-avatar.png"}
                        alt={fb.fullName}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                      />
                      <div>
                        <h4 className="font-semibold text-blue-900">
                          {fb.fullName}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {fb.role}
                          {fb.subject ? ` • ${fb.subject}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="flex-1 text-slate-700">“{fb.feedback}”</p>
                    <div className="mt-4">
                      <StarRating rating={Number(fb.rating) || 5} />
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-blue-700 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Transform Your Learning Experience?
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
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                View Pricing
              </Link>
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

  const NavButton = ({ id, children }) => (
    <button
      onClick={() => scrollTo(id)}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"
    >
      {children}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("home");
          }}
          className="flex items-center gap-2 font-extrabold tracking-tight text-blue-900"
        >
          <img
            src={logo}
            alt="EZone Logo"
            className="h-18 w-30 object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavButton id="home">Home</NavButton>
          <NavButton id="tutors">Tutors</NavButton>
          <NavButton id="courses">Courses</NavButton>
          <NavButton id="about">About</NavButton>
          <NavButton id="testimonials">Feedbacks</NavButton>
        </nav>

        {/* Right side: Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-900 ring-1 ring-blue-100 hover:bg-blue-50"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-blue-50"
              >
                <img
                  src={
                    user?.photoURL ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=EZ&backgroundType=gradientLinear"
                  }
                  alt={user?.displayName || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-slate-700 hidden lg:inline">
                  {user?.displayName || "Account"}
                </span>
                <FiChevronDown className="text-slate-500" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-2">
                  <Link
                    to="/dashboard"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50"
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

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-blue-900 hover:bg-blue-50 md:hidden"
          onClick={() => {
            setOpen((v) => !v);
            setAvatarOpen(false);
          }}
          aria-label="Toggle menu"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-2">
            <button
              onClick={() => scrollTo("home")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("tutors")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              Tutors
            </button>
            <button
              onClick={() => scrollTo("courses")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              Courses
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              About
            </button>
            <button
              onClick={() => scrollTo("testimonials")}
              className="block w-full rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-blue-50"
            >
              Testimonials
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
            <Link
              to="/pricing"
              className="mt-1 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Pricing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-blue-900 py-12 text-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-white">EZone</h3>
            <p className="mt-2 text-blue-100">
              Empowering learners and educators worldwide since 2020.
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Explore</p>
            <ul className="mt-2 space-y-2 text-blue-100">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("home")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#courses"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("courses")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white"
                >
                  Courses
                </a>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("about")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Support</p>
            <ul className="mt-2 space-y-2 text-blue-100">
              <li>
                <Link to="/help" className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Newsletter</p>
            <p className="mt-2 text-blue-100">
              Stay updated with product news.
            </p>
            <form className="mt-3 flex max-w-sm">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-l-lg px-4 py-2 text-slate-900"
                aria-label="Email address"
              />
              <button
                type="button"
                className="rounded-r-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 border-t border-blue-800 pt-6 text-center text-blue-200">
          <p>&copy; {new Date().getFullYear()} EZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default LandingPage;
