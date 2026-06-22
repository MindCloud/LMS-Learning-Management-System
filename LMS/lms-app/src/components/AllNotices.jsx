// src/components/AllNotices.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiSearch,
  FiFilter,
  FiSliders,
  FiRefreshCw,
  FiAlertTriangle,
  FiBookmark,
} from "react-icons/fi";

export default function AllNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [quickDateFilter, setQuickDateFilter] = useState("all"); // all, today, week, month
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc (newest), asc (oldest)

  // Fetch all notices on mount
  useEffect(() => {
    const q = query(
      collection(db, "SpecialNotices"),
      orderBy("postedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setNotices(
          snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Keep original timestamp object for filter comparison
              rawPostedAt: data.postedAt,
              postedAtStr: data.postedAt?.toDate
                ? data.postedAt.toDate().toLocaleString()
                : data.postedAt
                ? new Date(data.postedAt).toLocaleString()
                : "N/A",
            };
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching special notices:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Parse postedAt timestamp helper
  const getNoticeDate = (notice) => {
    if (!notice.rawPostedAt) return null;
    if (notice.rawPostedAt.toDate) {
      return notice.rawPostedAt.toDate();
    }
    return new Date(notice.rawPostedAt);
  };

  // Keyword tag parser (same mapping as LandingPage notices card)
  const getNoticeTag = (title = "", description = "") => {
    const text = (title + " " + description).toLowerCase();
    if (
      text.includes("exam") ||
      text.includes("test") ||
      text.includes("paper") ||
      text.includes("විභාග") ||
      text.includes("ප්‍රශ්න පත්‍ර")
    ) {
      return {
        label: "Exam",
        color:
          "bg-blue-50 dark:bg-blue-950/40 text-blue-750 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40",
      };
    }
    if (
      text.includes("urgent") ||
      text.includes("important") ||
      text.includes("alert") ||
      text.includes("වැදගත්") ||
      text.includes("අත්‍යවශ්‍ය") ||
      text.includes("විශේෂ")
    ) {
      return {
        label: "Urgent",
        color:
          "bg-rose-50 dark:bg-rose-950/40 text-rose-750 dark:text-rose-455 border border-rose-200/50 dark:border-rose-900/45 animate-pulse",
      };
    }
    if (
      text.includes("class") ||
      text.includes("schedule") ||
      text.includes("පන්ති") ||
      text.includes("වේලාව") ||
      text.includes("සටහන")
    ) {
      return {
        label: "Class",
        color:
          "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40",
      };
    }
    if (
      text.includes("holiday") ||
      text.includes("cancel") ||
      text.includes("postpone") ||
      text.includes("නිවාඩු") ||
      text.includes("කල් දැමීම")
    ) {
      return {
        label: "Holiday",
        color:
          "bg-amber-50 dark:bg-amber-950/40 text-amber-850 dark:text-amber-400 border border-amber-250/50 dark:border-amber-900/40",
      };
    }
    return {
      label: "Notice",
      color:
        "bg-orange-50 dark:bg-orange-950/30 text-orange-750 dark:text-orange-400 border border-orange-200/40 dark:border-orange-900/30",
    };
  };

  // Filtered and Sorted notices list
  const filteredNotices = useMemo(() => {
    let result = [...notices];

    // 1. Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.description && n.description.toLowerCase().includes(q))
      );
    }

    // 2. Date filters
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (quickDateFilter !== "all") {
      result = result.filter((n) => {
        const d = getNoticeDate(n);
        if (!d) return false;

        if (quickDateFilter === "today") {
          return d >= startOfToday;
        } else if (quickDateFilter === "week") {
          const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= sevenDaysAgo;
        } else if (quickDateFilter === "month") {
          const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
          return d >= thirtyDaysAgo;
        }
        return true;
      });
    }

    // 3. Custom date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((n) => {
        const d = getNoticeDate(n);
        return d && d >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((n) => {
        const d = getNoticeDate(n);
        return d && d <= end;
      });
    }

    // 4. Sort sorting
    result.sort((a, b) => {
      const dateA = getNoticeDate(a) || new Date(0);
      const dateB = getNoticeDate(b) || new Date(0);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [notices, searchQuery, quickDateFilter, startDate, endDate, sortOrder]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setQuickDateFilter("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300 pb-16">
      {/* Background shapes and glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[45%] rounded-full bg-gradient-to-tr from-amber-400/10 to-orange-400/5 blur-[120px] dark:from-amber-600/5 dark:to-transparent" />
        <div className="absolute bottom-[20%] right-[-10%] h-[35%] w-[40%] rounded-full bg-gradient-to-br from-yellow-400/10 to-amber-500/5 blur-[150px] dark:from-orange-600/5 dark:to-transparent" />
      </div>

      {/* Navbar replacement bar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-xl bg-slate-100/80 dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 cursor-pointer"
          >
            <FiArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>ආපසු (Home)</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-605 dark:text-amber-400">
              Notices Hub
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="text-center sm:text-left mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl leading-tight">
            සියලුම ආයතනික විශේෂ දැන්වීම්
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
            All Institute Notices & Announcements. Filter notices by date range or keyword search.
          </p>
        </div>

        {/* Filters Panel Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left panel: Filters (Spans 4) */}
          <section className="lg:col-span-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FiSliders className="text-amber-500" />
                දැන්වීම් පෙරහන (Filters)
              </h2>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FiRefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Keyword Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title/content..."
                    className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white/80 dark:bg-slate-950 px-4 py-2.5 pl-10 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Quick Date Filters */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Date Filter
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "Last 7 Days" },
                    { id: "month", label: "Last 30 Days" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setQuickDateFilter(filter.id)}
                      className={`py-2 px-3 rounded-lg text-center text-xs font-bold border transition-all cursor-pointer ${
                        quickDateFilter === filter.id
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Picker Range */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Custom Date Range
                </label>
                <div className="space-y-2.5">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                      From
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white/80 dark:bg-slate-950 py-2.5 pl-14 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                      To
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white/80 dark:bg-slate-950 py-2.5 pl-14 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer font-semibold"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </section>

          {/* Right panel: Notices list (Spans 8) */}
          <section className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Retrieving all notices...
                </p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-500 mb-4 shadow-2xs">
                  <FiAlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  නොගැලපේ (No notices match your filters)
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-[360px] mx-auto font-medium">
                  Try adjusting the date pickers, quick filters, or keyword search terms to find notices.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-655 text-white font-bold px-6 py-2.5 text-xs shadow-md transition cursor-pointer"
                >
                  <FiRefreshCw /> Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredNotices.map((n) => {
                  const tag = getNoticeTag(n.title, n.description);
                  return (
                    <article
                      key={n.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-2xs hover:shadow-xs hover:border-amber-200 dark:hover:border-amber-550/40 transition-all duration-300"
                    >
                      {/* Left glowing gradient strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-[4.5px] bg-gradient-to-b from-amber-500 to-orange-500 rounded-r-md group-hover:scale-y-110 transition-transform duration-300" />

                      <div className="pl-1.5">
                        <header className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${tag.color}`}
                            >
                              <FiBookmark className="mr-1" />
                              {tag.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold">
                            <FiClock className="text-amber-500/70" />
                            <span>Posted on {n.postedAtStr}</span>
                          </div>
                        </header>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {n.title}
                        </h3>

                        <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                          {n.description}
                        </p>

                        <footer className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-405 dark:text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="text-slate-400" />
                            <span className="font-bold">Morawaka Institute</span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-350 dark:text-slate-600">
                            Verified
                          </span>
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
