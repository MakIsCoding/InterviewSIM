// src/components/MainLayout.jsx
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = ({
  user,
  isSidebarOpen,
  setIsSidebarOpen,
  onNewQueryClick,
  recentQueries,
  onRecentQueryClick,
  loadingRecentQueries,
  activeQueryIdFromUrl,
  children,
}) => {
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onNewQueryClick={onNewQueryClick}
        recentQueries={recentQueries}
        onRecentQueryClick={onRecentQueryClick}
        user={user}
        activeQueryIdFromUrl={activeQueryIdFromUrl}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-col flex-1 min-w-0 h-full transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "ml-64 lg:ml-0" : "ml-0"
        }`}
      >
        <Header onToggleSidebar={toggleSidebar} user={user} />

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden animate-fade-in-up"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;