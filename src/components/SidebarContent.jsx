// src/components/SidebarContent.jsx
import React from "react";
import {
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  TrashIcon,
  FolderOpenIcon, // Used for the query list item icon (now session)
  PencilSquareIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid"; // Solid icons for general use
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline"; // Outline version for a subtle difference

const SidebarContent = ({
  onNewQueryClick, // Prop name remains for consistency from App.jsx
  recentQueries, // Prop name remains, but now holds interview sessions
  activeQueryIdFromUrl,
  onRecentQueryClick, // Prop name remains for consistency from App.jsx
  user,
  handleLinkClick,
  handleSignOut,
  fetchError,
  handleShareQuery,
  handlePinQuery,
  handleRenameQuery,
  handleDeleteQuery,
  selectionMode,
  toggleSelectionMode,
  selectedQueryIds,
  handleSelectQuery,
  handleDeleteSelectedQueries,
}) => {
  return (
    <div className="flex flex-col h-full bg-dark text-textGray">
      {/* New Interview Button & Selection Mode Controls */}
      <div className="mb-4 flex items-center justify-between space-x-2 px-2">
        <button
          onClick={onNewQueryClick}
          className="flex-1 bg-brand text-white py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300 ease-in-out group focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-dark transform hover:scale-[1.02]"
          aria-label="Start New Interview Session"
        >
          <PlusIcon className="w-5 h-5 mr-3 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">New Interview</span>
        </button>
        <button
          onClick={toggleSelectionMode}
          className={`ml-2 p-2 rounded-full border border-borderGray hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-light ${
            selectionMode ? "bg-gray-700" : "bg-transparent"
          } transition-colors duration-200`}
          aria-pressed={selectionMode}
          aria-label={selectionMode ? "Exit selection mode" : "Enter selection mode"}
          title={selectionMode ? "Exit selection mode" : "Enter selection mode"}
        >
          {selectionMode ? (
            <XMarkIcon className="w-6 h-6 text-textGray" />
          ) : (
            <CheckCircleIcon className="w-6 h-6 text-textGray" />
          )}
        </button>
      </div>

      {/* Bulk Delete Button (Visible only in selection mode & if any selected) */}
      {selectionMode && selectedQueryIds.length > 0 && (
        <div className="mb-4 px-2 animate-fade-in-up">
          <button
            onClick={handleDeleteSelectedQueries}
            disabled={selectedQueryIds.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            aria-label={`Delete ${selectedQueryIds.length} selected interview sessions`}
          >
            Delete Selected ({selectedQueryIds.length})
          </button>
        </div>
      )}

      {/* Error message */}
      {fetchError && (
        <div
          role="alert"
          className="mb-4 p-2 bg-red-700 text-red-100 rounded-md text-sm px-2 animate-fade-in-up"
        >
          {fetchError}
        </div>
      )}

      {/* Recent Interview Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {recentQueries.length === 0 && !fetchError ? (
          <p className="text-center text-gray-500 mt-8 select-none animate-fade-in-up">
            No recent interview sessions. Start a new one!
          </p>
        ) : (
          <ul className="space-y-1">
            {recentQueries.map((query) => { // 'query' here refers to an interview session object
              const isActive = query.id === activeQueryIdFromUrl;
              const isSelected = selectedQueryIds.includes(query.id);
              return (
                <li
                  key={query.id}
                  role="button"
                  className={`flex items-center justify-between rounded-md p-2 cursor-pointer select-none
                    hover:bg-lightDark transition duration-200 ease-in-out group
                    ${
                      isActive
                        ? "bg-lightDark text-textGray shadow-inner border border-brand-light/50"
                        : "bg-dark text-textGray"
                    }
                    ${
                      selectionMode ? "pr-0" : "pr-2"
                    }`}
                  onClick={() => {
                    if (selectionMode) {
                      handleSelectQuery(query.id);
                    } else {
                      onRecentQueryClick(query.id);
                    }
                  }}
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (selectionMode) {
                        handleSelectQuery(query.id);
                      } else {
                        onRecentQueryClick(query.id);
                      }
                    }
                  }}
                >
                  {/* Left: Selection checkbox or pin icon */}
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {selectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectQuery(query.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="form-checkbox h-4 w-4 text-brand-light bg-gray-700 border-borderGray rounded focus:ring-2 focus:ring-brand-light cursor-pointer transition-all duration-200"
                        aria-label={`Select interview session titled ${query.title || "Untitled"}`}
                      />
                    )}

                    <FolderOpenIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                    {/* Title and timestamp */}
                    <div className="flex flex-col truncate min-w-0">
                      <span
                        className={`font-medium whitespace-normal break-words line-clamp-2 ${
                          isActive ? "text-brand-light" : "text-textGray"
                        }`}
                        title={query.title || "Untitled Interview Session"}
                      >
                        {query.title || "Untitled Interview Session"}
                      </span>
                      <span className="text-xs text-gray-500 select-none">
                        {query.lastUpdated
                          ? new Date(query.lastUpdated.seconds * 1000).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action buttons (shown only if not in selection mode and on hover/active) */}
                  {!selectionMode && (
                    <div className="ml-auto flex items-center space-x-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinQuery(query.id, !query.pinned);
                        }}
                        title={query.pinned ? "Unpin Session" : "Pin Session"}
                        aria-label={`${query.pinned ? "Unpin" : "Pin"} interview session titled ${query.title || "Untitled"}`}
                        className={`p-1 rounded-md transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-light ${
                          query.pinned
                            ? "text-brand"
                            : "text-gray-400 hover:text-brand-light"
                        }`}
                      >
                        <BookmarkIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameQuery(query.id);
                        }}
                        title="Rename Session"
                        aria-label={`Rename interview session titled ${query.title || "Untitled"}`}
                        className="p-1 hover:bg-gray-800 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-light"
                      >
                        <PencilSquareIcon className="w-5 h-5 text-gray-400 hover:text-brand-light" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuery(query.id);
                        }}
                        title="Delete Session"
                        aria-label={`Delete interview session titled ${query.title || "Untitled"}`}
                        className="p-1 hover:bg-red-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Action Buttons for Multi-Select */}
      {selectionMode && (
        <div className="mt-4 pt-4 border-t border-borderGray flex justify-around space-x-2 animate-fade-in-up">
          <button
            onClick={handleDeleteSelectedQueries}
            disabled={selectedQueryIds.length === 0}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md"
          >
            Delete ({selectedQueryIds.length})
          </button>
          <button
            onClick={toggleSelectionMode}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300 text-sm font-medium shadow-md"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bottom Navigation / User Info */}
      <div className="mt-auto pt-4 border-t border-borderGray">
        <nav className="space-y-2 mb-4">
          <a
            href="#"
            onClick={() => handleLinkClick("/dashboard/settings-help")}
            className="flex items-center px-3 py-2 text-textGray hover:bg-lightDark rounded-md transition duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-dark"
          >
            <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-brand-light" />
            <span className="font-medium">Settings & Help</span>
          </a>
          <button
            onClick={toggleSelectionMode}
            className="flex items-center w-full px-3 py-2 text-textGray hover:bg-lightDark rounded-md transition duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-dark"
          >
            <DocumentDuplicateIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-brand-light" />
            <span className="font-medium">Manage Interviews</span>
          </button>
        </nav>

        {user ? (
          <div className="flex items-center justify-between text-sm py-2 px-3 bg-lightDark rounded-lg text-textGray">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center flex-shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={`${user.displayName || "User"} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-extrabold text-gray-200 select-none">
                  {user?.displayName?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden ml-3">
              <span
                className="text-sm font-semibold text-textGray truncate"
                title={user?.displayName || "User"}
              >
                {user?.displayName || "User"}
              </span>
              <span
                className="text-xs text-gray-500 truncate select-none"
                title={user?.email || ""}
              >
                {user?.email || ""}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-4 flex items-center text-red-400 hover:text-red-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-lightDark flex-shrink-0"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-1" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleLinkClick("/signin")}
            className="flex items-center w-full px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-lightDark"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign In</span>
          </button>
        )}
      </div>
       {/* Custom CSS for scrollbar */}
       <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f1f1f; /* lightDark equivalent or slightly darker */
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563; /* gray-600 */
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280; /* gray-500 */
        }
      `}</style>
    </div>
  );
};

export default SidebarContent;
