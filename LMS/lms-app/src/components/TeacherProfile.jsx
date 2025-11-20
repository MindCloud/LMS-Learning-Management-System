import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  FiStar,
  FiUsers,
  FiCheckCircle,
  FiBookOpen,
  FiClock,
  FiTarget,
  FiAward,
  FiMapPin,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import logo from "../assets/logo1.jpeg"; // ✅ adjust path as needed

const TeacherProfile = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherDoc = doc(db, "teachers", id);
        const docSnap = await getDoc(teacherDoc);

        if (docSnap.exists()) {
          setTeacher({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Teacher not found");
        }
      } catch (e) {
        setError("Failed to load teacher profile");
        console.error("Error fetching teacher:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-red-600">
          {error || "Teacher not found"}
        </h2>
        <Link
          to="/teachers"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Teachers
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar Placeholder */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="flex items-center">
              <img
                src={logo}
                alt="EZone Logo"
                className="h-20 w-auto" // you can tweak the size
              />
            </h1>
            <Link
              to="/"
              className="inline-flex items-center text-lg font-semibold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src={teacher.imageUrl}
              alt={teacher.fullName}
              className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-blue-100"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {teacher.fullName}
              </h1>
              <p className="text-lg text-blue-600 capitalize font-medium">
                {teacher.role}
              </p>
              <p className="text-md text-gray-500">@{teacher.username}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiBookOpen className="w-6 h-6 mr-2 text-blue-600" />
              About
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {teacher.bio || "No bio available."}
            </p>

            <h2 className="mt-6 text-xl font-semibold text-gray-800 flex items-center">
              <FiMail className="w-6 h-6 mr-2 text-blue-600" />
              Contact Information
            </h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li className="flex items-center">
                <FiMail className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Email:</strong> {teacher.email}
                </span>
              </li>
              <li className="flex items-center">
                <FiPhone className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Phone:</strong> {teacher.contact}
                </span>
              </li>
              <li className="flex items-center">
                <FiMapPin className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Address:</strong> {teacher.address}
                </span>
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiTarget className="w-6 h-6 mr-2 text-blue-600" />
              Teaching Details
            </h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li className="flex items-center">
                <FiBookOpen className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Subjects:</strong> {teacher.subjects}
                </span>
              </li>
              <li className="flex items-center">
                <FiUsers className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Grade:</strong> {teacher.grade}
                </span>
              </li>
              <li className="flex items-center">
                <FiAward className="w-5 h-5 mr-3 text-blue-500" />
                <span>
                  <strong>Achievements:</strong> {teacher.achievements}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to={`/courses?instructor=${encodeURIComponent(teacher.fullName)}`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
          >
            <FiBookOpen className="w-5 h-5 mr-2" />
            View {teacher.fullName}'s Courses
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Teachers
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 py-12 text-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center">
              <FiBookOpen className="w-6 h-6 mr-2" />
              EZone
            </h3>
            <p className="mt-2 text-blue-100 leading-relaxed">
              Empowering learners and educators worldwide since 2020.
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Explore</p>
            <ul className="mt-4 space-y-3 text-blue-100">
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
                <Link
                  to="/pricing"
                  className="hover:text-white transition-colors"
                >
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
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Support</p>
            <ul className="mt-4 space-y-3 text-blue-100">
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
            <p className="text-lg font-bold text-white">Newsletter</p>
            <p className="mt-2 text-blue-100 leading-relaxed">
              Stay updated with product news and updates.
            </p>
            <div className="mt-4 flex max-w-sm">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-l-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Email address"
              />
              <button
                type="button"
                className="rounded-r-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-blue-700 pt-6 text-center text-blue-200">
          <p>&copy; {new Date().getFullYear()} EZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default TeacherProfile;
