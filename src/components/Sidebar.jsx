// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";

import SidebarContent from "./SidebarContent";
import { auth, db } from "../firebase";
import ROUTES from "../routes.js";

const Sidebar = ({ isSidebarOpen, onToggleSidebar, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPathSegments = location.pathname.split("/");
  const activeQueryIdFromUrl =
    currentPathSegments[currentPathSegments.length - 1];

  const currentUserId = user?.uid;

  // States
  const [recentQueries, setRecentQueries] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedQueryIds, setSelectedQueryIds] = useState([]);

  // Fetch user interview sessions with real-time updates, ordered by pinned then lastUpdated
  useEffect(() => {
    if (!currentUserId) {
      setRecentQueries([]);
      setFetchError(null);
      return;
    }

    const userInterviewSessionsRef = collection(db, "users", currentUserId, "interviewSessions");

    const q = query(
      userInterviewSessionsRef,
      orderBy("pinned", "desc"),
      orderBy("lastUpdated", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentQueries(sessionsData);
        setFetchError(null);
      },
      (error) => {
        console.error("Error fetching recent interview sessions:", error);
        setFetchError("Failed to load recent interview sessions.");
      }
    );

    return () => unsubscribe();
  }, [currentUserId, db]);

  // Toggle selection mode for multi-select actions
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedQueryIds([]); // Clear selection when toggling mode
  };

  // Select or deselect a query (interview session) in multi-selection mode
  const handleSelectQuery = (queryId) => {
    setSelectedQueryIds((prevSelected) =>
      prevSelected.includes(queryId)
        ? prevSelected.filter((id) => id !== queryId)
        : [...prevSelected, queryId]
    );
  };

  // Handle sign-out process
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES.SIGN_IN);
    } catch (error) {
      console.error("Error signing out:", error);
      console.error("Failed to sign out. Please try again.");
    }
  };

  // Navigate to path and close sidebar on mobile
  const handleLinkClick = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  // Create new interview session and navigate there
  const handleNewQueryClick = async () => {
    if (!currentUserId) {
      console.error("No user authenticated to create a new interview session.");
      navigate(ROUTES.SIGN_IN);
      return;
    }

    setSelectionMode(false);
    setSelectedQueryIds([]);

    try {
      const newSessionRef = await addDoc(
        collection(db, "users", currentUserId, "interviewSessions"),
        {
          title: "New Interview",
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          pinned: false,
        }
      );
      navigate(`/dashboard/${newSessionRef.id}`);
    } catch (error) {
      console.error("Error creating new interview session:", error);
      console.error("Failed to start a new interview. Please try again.");
    }

    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  // Navigate to selected interview session (unless in selection mode)
  const handleRecentQueryClick = (queryId) => {
    if (!selectionMode) {
      navigate(`/dashboard/${queryId}`);
      if (window.innerWidth < 768) {
        onToggleSidebar();
      }
    }
  };

  // Placeholder share handler (to be implemented)
  const handleShareQuery = (queryId) => {
    console.log(`Share functionality for interview session ${queryId} is not yet implemented.`);
  };

  // Pin or unpin an interview session
  const handlePinQuery = async (queryId, setPinnedTo) => {
    if (!currentUserId) {
      console.error("Please sign in to pin interview sessions.");
      return;
    }

    try {
      const queryRef = doc(db, "users", currentUserId, "interviewSessions", queryId);
      const currentQuery = recentQueries.find((q) => q.id === queryId);
      const newPinnedStatus =
        setPinnedTo !== undefined
          ? setPinnedTo
          : currentQuery
          ? !currentQuery.pinned
          : false;

      await updateDoc(queryRef, {
        pinned: newPinnedStatus,
        lastUpdated: serverTimestamp(),
      });

      console.log(
        `${currentQuery?.title || "Untitled Interview"} ${
          newPinnedStatus ? "pinned" : "unpinned"
        } successfully!`
      );
    } catch (error) {
      console.error("Error pinning/unpinning interview session:", error);
      console.error("Failed to pin/unpin interview session. Please try again.");
    }
  };

  // Rename interview session with prompt input
  const handleRenameQuery = async (queryId) => {
    if (!currentUserId) {
      console.error("Please sign in to rename interview sessions.");
      return;
    }
    const currentQuery = recentQueries.find((q) => q.id === queryId);
    const oldTitle = currentQuery?.title || "Untitled Interview";
    const newTitle = window.prompt("Enter new title for the interview session:", oldTitle);

    if (newTitle !== null) {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === "") {
        console.error("Interview session title cannot be empty.");
      } else if (trimmedTitle === oldTitle) {
        console.log("No change, title is the same.");
      } else {
        try {
          const queryRef = doc(db, "users", currentUserId, "interviewSessions", queryId);
          await updateDoc(queryRef, {
            title: trimmedTitle,
            lastUpdated: serverTimestamp(),
          });
          console.log("Interview session renamed successfully!");
        } catch (error) {
          console.error("Error renaming interview session:", error);
          console.error("Failed to rename interview session. Please try again.");
        }
      }
    }
  };

  // Delete single interview session with confirmation
  const handleDeleteQuery = async (queryId) => {
    if (!currentUserId) {
      console.error("Please sign in to delete interview sessions.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this interview session? This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", currentUserId, "interviewSessions", queryId));
        console.log("Interview session deleted successfully!");
        if (`/dashboard/${queryId}` === location.pathname) {
          navigate(ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error("Error deleting interview session:", error);
        console.error("Failed to delete interview session. Please try again.");
      }
    }
  };

  // Delete multiple selected interview sessions in batch with confirmation
  const handleDeleteSelectedQueries = async () => {
    if (!currentUserId) {
      console.error("Please sign in to delete interview sessions.");
      return;
    }

    if (selectedQueryIds.length === 0) {
      console.warn("No interview sessions selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedQueryIds.length} selected interview session(s)? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        const batch = writeBatch(db);
        selectedQueryIds.forEach((queryId) => {
          const queryRef = doc(db, "users", currentUserId, "interviewSessions", queryId);
          batch.delete(queryRef);
        });

        await batch.commit();

        console.log(`${selectedQueryIds.length} interview session(s) deleted successfully!`);
        setSelectedQueryIds([]);
        setSelectionMode(false);

        if (selectedQueryIds.includes(activeQueryIdFromUrl)) {
          navigate(ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error("Error deleting selected interview sessions:", error);
        setFetchError("Failed to delete selected interview sessions.");
        console.error("Failed to delete selected interview sessions. Please try again.");
      }
    }
  };

  // Props bundle to reduce repetition
  const sidebarContentProps = {
    onNewQueryClick: handleNewQueryClick,
    recentQueries,
    activeQueryIdFromUrl,
    onRecentQueryClick: handleRecentQueryClick,
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
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 w-64 bg-dark text-textGray p-4 flex flex-col z-40 h-screen top-16
          transition-transform duration-300 ease-in-out shadow-xl md:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-hidden={!isSidebarOpen}
        role="dialog"
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold select-none text-brand-light">
            Interview<span className="text-accentOrange">SIM</span>
          </h1>
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full text-textGray hover:bg-lightDark focus:outline-none focus:ring-2 focus:ring-brand-light transition duration-200"
            aria-label="Close Sidebar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent {...sidebarContentProps} />
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`
          hidden md:flex flex-shrink-0 bg-dark text-textGray p-4 flex-col z-10 h-screen
          transition-all duration-300 ease-in-out shadow-xl
          ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}
        `}
        aria-hidden={!isSidebarOpen}
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        {isSidebarOpen && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold select-none text-brand-light">
                Interview<span className="text-accentOrange">SIM</span>
              </h1>
            </div>
            <SidebarContent {...sidebarContentProps} />
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;