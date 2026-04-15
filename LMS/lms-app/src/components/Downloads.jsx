// src/pages/Downloads.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiFolder,
  FiFileText,
  FiCalendar,
  FiExternalLink,
  FiBookOpen,
  FiAward,
  FiDownload,
  FiMenu,
  FiX,
} from "react-icons/fi";
import {
  BookOpen, Award, FileText, Download,
  Zap, Target, Loader2
} from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import logo from "../assets/logo.jpg"; // your logo

// ────────────────────────────────────────────────
// Footer Component (as provided + minor polish)
// ────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-950 to-indigo-950 py-12 text-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-xl font-bold text-white">EZone</h3>
            <p className="mt-3 text-blue-100/90 text-sm leading-relaxed">
              Empowering learners and educators in Sri Lanka and beyond since
              2020.
            </p>
          </div>

          <div>
            <p className="text-lg font-semibold text-white">Explore</p>
            <ul className="mt-4 space-y-2.5 text-blue-100/90 text-sm">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("home")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
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
                  className="hover:text-white transition-colors"
                >
                  Courses
                </a>
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
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-lg font-semibold text-white">Support</p>
            <ul className="mt-4 space-y-2.5 text-blue-100/90 text-sm">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-lg font-semibold text-white">Newsletter</p>
            <p className="mt-3 text-blue-100/80 text-sm">
              Get the latest updates, free resources & exam tips.
            </p>
            <form className="mt-4 flex max-w-xs">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-l-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Email address"
              />
              <button
                type="button"
                className="rounded-r-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-blue-800/50 pt-8 text-center text-blue-200/80 text-sm">
          <p>© {new Date().getFullYear()} EZone. All rights reserved.</p>
          <p className="mt-1">
            Made with dedication for A/L students in Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────
// Nav Button (refined)
// ────────────────────────────────────────────────
const NavButton = ({ children, to, active }) => (
  <Link
    to={to}
    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-700 hover:text-blue-700 hover:bg-blue-50"
    }`}
  >
    {children}
  </Link>
);

// ────────────────────────────────────────────────
// Main Downloads Page
// ────────────────────────────────────────────────
const iconMap = {
  BookOpen: BookOpen,
  Award: Award,
  FileText: FileText,
  Download: Download,
  Zap: Zap,
  Target: Target,
};

const Downloads = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all resource folders
  const fetchFolders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "resourceFolders"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const fetchedFolders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setFolders(fetchedFolders);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFolders();
  }, []);

  const categories = [
    "All",
    "Past Papers",
    "Marking Schemes",
    "Model Papers",
    "Notes",
    "Revision",
    "Quick Guides",
  ];

  const filteredFolders = folders.filter((f) => {
    const searchMatch =
      (f.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = activeCategory === "All" || f.category === activeCategory;
    return searchMatch && catMatch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ──────────────── HEADER ──────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="EZone Logo"
              className="h-18 w-auto object-contain"
            />
            {/* <span className="hidden font-bold tracking-tight text-blue-900 sm:inline text-xl">
              EZone
            </span> */}
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavButton to="/">Home</NavButton>
            {/* <NavButton to="/tutors">Teachers</NavButton>
            <NavButton to="/courses">Courses</NavButton> */}
            <NavButton to="/downloads" active>
              Downloads
            </NavButton>
          </nav>

          <button
            className="md:hidden p-2.5 text-slate-700 hover:text-blue-700 rounded-lg hover:bg-blue-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 px-5 py-6 space-y-4">
            <Link
              to="/"
              className="block py-3 text-slate-700 hover:text-blue-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/downloads"
              className="block py-3 text-blue-700 font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Downloads
            </Link>
          </div>
        )}
      </header>

      {/* ──────────────── HERO with Background Image ──────────────── */}
      <section
        className="relative bg-cover bg-center bg-no-repeat text-white overflow-hidden"
        style={{
          backgroundImage: `url('https://thumbs.dreamstime.com/b/description-vibrant-colorful-image-captures-group-indian-asian-school-kids-fully-engaged-their-studies-surrounded-369272221.jpg')`,
        }}
      >
        {/* Overlay gradient + subtle dark tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-indigo-900/80 to-violet-950/75" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-block mb-6 px-6 py-2.5 bg-white/15 backdrop-blur-md rounded-full text-sm font-medium tracking-wide border border-white/20">
            2025 Updated • 500+ Free Resources • A/L Focused
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 drop-shadow-lg">
            Your Ultimate A/L <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
              Resource Hub
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-blue-50/95 mb-10 drop-shadow">
            Past papers, official marking schemes, high-quality notes, model
            papers and revision materials — everything you need to achieve your
            best results.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base">
            <div className="flex items-center gap-2.5 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
              <FiFileText className="text-amber-300" size={20} />
              <span>450+ Files</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
              <FiCalendar className="text-amber-300" size={20} />
              <span>Regular Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <main className="flex-1 bg-slate-50/90 pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-6 md:p-8 mb-12">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="relative flex-1">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search subject, year, topic, teacher name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition text-base"
                />
              </div>

              <button className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow-md min-w-[160px]">
                <FiFilter className="w-5 h-5" />
                Filter
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex items-center gap-3 text-slate-500 text-lg font-medium">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                Loading resources...
              </div>
            </div>
          ) : filteredFolders.length > 0 ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFolders.map((folder) => {
                const Icon = iconMap[folder.iconName] || FiFolder;
                return (
                  <a
                    key={folder.id}
                    href={folder.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-2xl hover:border-blue-200/70 hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className={`h-3 bg-gradient-to-r ${folder.accent}`} />

                    <div className="p-7 flex flex-col items-center text-center flex-1">
                      <div className="w-24 h-24 mb-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-400 shadow-md" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl -rotate-3 group-hover:-rotate-6 transition-transform duration-400 flex items-center justify-center shadow-inner">
                          <Icon className="w-12 h-12 text-blue-700" />
                        </div>
                      </div>

                      <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-700 transition-colors mb-3">
                        {folder.name}
                      </h3>

                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-6">
                        {folder.description}
                      </p>

                      <div className="mt-auto w-full pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FiFileText className="w-4 h-4" />
                          <span>{folder.files} files</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-4 h-4" />
                          <span>{folder.updated}</span>
                        </div>
                      </div>

                      <div className="mt-7">
                        <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium group-hover:bg-blue-100 transition">
                          Open in Google Drive
                          <FiExternalLink className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl shadow border border-slate-100">
              <div className="text-8xl mb-6 opacity-70">📚</div>
              <h3 className="text-2xl font-semibold text-slate-700 mb-4">
                No resources found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Try different keywords or select another category
              </p>
            </div>
          )}
        </div>
      </main>

      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-blue-700 py-16 text-white">
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
                to="/"
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Downloads;
