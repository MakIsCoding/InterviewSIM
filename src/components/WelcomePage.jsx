// src/components/WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, Cog6ToothIcon, FolderOpenIcon, PlusIcon } from "@heroicons/react/24/solid"; // Importing relevant icons

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleNewQueryClick = () => navigate("/dashboard/new"); // Function name remains consistent
  const handleSettingsHelpClick = () => navigate("/dashboard/settings-help");
  const handleGetStartedClick = () => navigate("/dashboard/new"); // Same as handleNewQueryClick for direct start

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-dark via-gray-900 to-dark px-6 py-12 text-white relative overflow-hidden">
      {/* Background Flair with Brand Colors */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-brand opacity-15 rounded-full blur-[100px] z-0 animate-fade-in-up delay-100"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-brand-dark opacity-10 rounded-full blur-[120px] z-0 animate-fade-in-up delay-200"></div>
      <div className="absolute top-[20%] right-[5%] w-48 h-48 bg-brand-light opacity-8 rounded-full blur-[90px] z-0 animate-fade-in-up delay-300"></div>

      {/* Main content with modern styling */}
      <div className="z-10 max-w-4xl text-center px-4 py-8 bg-lightDark rounded-2xl shadow-2xl border border-borderGray animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">
          Welcome to <span className="text-brand">InterviewSIM</span>
        </h1>
        <p className="text-lg sm:text-xl text-textGray mb-10 leading-relaxed font-light">
          Your intelligent interview assistant is here to guide you through interview scenarios. {/* Changed text */}
          Start a new interview or revisit past sessions anytime. {/* Changed text */}
        </p>

        <button
          onClick={handleGetStartedClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-12 rounded-full text-lg sm:text-xl transition-all duration-300 shadow-xl hover:shadow-blue-glow transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-lightDark flex items-center justify-center mx-auto"
          aria-label="Get Started with InterviewSIM"
        >
          <ArrowRightIcon className="w-6 h-6 mr-3 text-white" />
          Get Started
        </button>

        <div className="mt-16 space-y-8 text-left w-full sm:w-11/12 md:w-5/6 mx-auto">
          <p className="text-textGray text-base sm:text-lg flex items-start">
            <PlusIcon className="w-6 h-6 text-brand mr-4 mt-1 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white block mb-1">New Interview:</span> {/* Changed text */}
              <span>Click <strong className="text-brand-light">“New Interview”</strong> in the sidebar to begin a fresh interview session.</span> {/* Changed text */}
            </div>
          </p>
          <p className="text-textGray text-base sm:text-lg flex items-start">
            <FolderOpenIcon className="w-6 h-6 text-brand mr-4 mt-1 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white block mb-1">Past Interviews:</span> {/* Changed text */}
              <span>Easily access your previous interview sessions, neatly organized under <strong className="text-brand-light">“Past Interviews”</strong> in the sidebar.</span> {/* Changed text */}
            </div>
          </p>
          <p className="text-textGray text-base sm:text-lg flex items-start">
            <Cog6ToothIcon className="w-6 h-6 text-brand mr-4 mt-1 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white block mb-1">Settings & Help:</span>
              <span>Manage your preferences and find quick answers anytime.
              <button
                onClick={handleSettingsHelpClick}
                className="ml-0 sm:ml-2 text-brand-light hover:underline font-medium transition-colors duration-200 inline-flex items-center mt-2 sm:mt-0"
                aria-label="Go to Settings and Help page"
              >
                Go to Settings & Help <ArrowRightIcon className="w-4 h-4 ml-1" />
              </button>
              </span>
            </div>
          </p>
        </div>

        <p className="text-sm text-gray-500 mt-12 italic font-mono">
          InterviewSIM is currently in beta — your feedback shapes the future.
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;