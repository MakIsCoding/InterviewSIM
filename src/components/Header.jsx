import React from "react";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon, Bars3Icon } from "@heroicons/react/24/solid";

const Header = ({ onToggleSidebar, user }) => {
  const navigate = useNavigate();

  return (
    <header className="flex-shrink-0 bg-dark text-gray-100 p-4 flex items-center justify-between shadow-xl z-20 w-full animate-fade-in-up">
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-300 ease-in-out"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* App Title */}
        <span className="text-2xl font-bold font-mono text-gray-50">
          Interview<span className="text-brand">SIM</span>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {user ? (
          <button
            onClick={() => navigate("/dashboard/profile")}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-300 ease-in-out"
            aria-label="User Profile"
          >
            <UserCircleIcon className="w-7 h-7" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="bg-brand hover:bg-brand-dark text-white font-medium py-2 px-6 rounded-full text-sm shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;