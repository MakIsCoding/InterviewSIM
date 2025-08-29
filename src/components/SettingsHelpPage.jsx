// src/components/SettingsHelpPage.jsx
import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid"; // Example icon for list items

const SettingsHelpPage = () => {
  return (
    <div className="p-6 sm:p-8 md:p-10 bg-dark text-textGray min-h-full animate-fade-in-up">
      {/* Page Title */}
      <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-brand-light border-b border-borderGray pb-4">
        Settings & Help
      </h2>

      {/* Settings Section */}
      <section className="mb-10 bg-lightDark p-6 rounded-xl shadow-lg border border-borderGray transform hover:scale-[1.01] transition-transform duration-300 ease-in-out">
        <h3 className="text-2xl font-semibold mb-4 text-gray-100 flex items-center">
          <ChevronRightIcon className="w-5 h-5 mr-2 text-brand" />
          Settings
        </h3>

        <p className="mb-4 text-gray-300 leading-relaxed">
          Manage your personal preferences and account configurations here to
          tailor your InterviewSIM experience.
        </p>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Notification preferences
          </li>
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Privacy settings
          </li>
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Account linked services
          </li>
        </ul>

        <button className="mt-4 px-8 py-3 bg-brand text-white font-bold rounded-full transition-all duration-300 ease-in-out hover:bg-brand-dark shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-lightDark transform hover:-translate-y-0.5">
          Save Settings
        </button>
      </section>

      {/* Help Section */}
      <section className="bg-lightDark p-6 rounded-xl shadow-lg border border-borderGray transform hover:scale-[1.01] transition-transform duration-300 ease-in-out">
        <h3 className="text-2xl font-semibold mb-4 text-gray-100 flex items-center">
          <ChevronRightIcon className="w-5 h-5 mr-2 text-brand" />
          Help & Support
        </h3>

        <p className="mb-4 text-gray-300 leading-relaxed">
          Find answers to common questions about using InterviewSIM:
        </p>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            How to start a new interview? {/* Changed text */}
          </li>
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Managing past interview sessions {/* Changed text */}
          </li>
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Troubleshooting tips
          </li>
          <li className="flex items-center text-gray-200">
            <span className="w-2 h-2 bg-brand rounded-full mr-3 animate-pulse"></span>
            Contact support
          </li>
        </ul>

        <p className="mt-6 text-gray-300">
          For urgent assistance, please contact our dedicated support team at{" "}
          <a
            href="mailto:support@interviewsim.com"
            className="text-brand-light hover:underline font-medium transition-colors duration-200"
          >
            support@interviewsim.com
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default SettingsHelpPage;
