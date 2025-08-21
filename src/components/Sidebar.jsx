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
import { auth, db } from "../firebase"; // Adjust import paths as necessary
import ROUTES from "../routes.js"; // Your app routes config

const Sidebar = ({ isSidebarOpen, onToggleSidebar, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPathSegments = location.pathname.split("/");
  const activeQueryIdFromUrl = currentPathSegments[currentPathSegments.length - 1];

  const currentUserId = user?.uid;

  // States
  const [recentQueries, setRecentQueries] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedQueryIds, setSelectedQueryIds] = useState([]);

  // Fetch user queries with real-time updates, ordered by pinned then lastUpdated
  useEffect(() => {
    if (!currentUserId) {
      setRecentQueries([]);
      setFetchError(null);
      return;
    }

    const userQuerySessionsRef = collection(db, "users", currentUserId, "querySessions");

    const q = query(
      userQuerySessionsRef,
      orderBy("pinned", "desc"),
      orderBy("lastUpdated", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const queriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentQueries(queriesData);
        setFetchError(null);
      },
      (error) => {
        console.error("Error fetching recent queries:", error);
        setFetchError("Failed to load recent queries.");
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Toggle selection mode for multi-select actions
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedQueryIds([]);
  };

  // Select or deselect a query in multi-selection mode
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
      alert("Failed to sign out. Please try again.");
    }
  };

  // Navigate to path and close sidebar on mobile
  const handleLinkClick = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  // Create new query session and navigate there
  const handleNewQueryClick = async () => {
    if (!currentUserId) {
      console.error("No user authenticated to create a new query.");
      navigate(ROUTES.SIGN_IN);
      return;
    }

    setSelectionMode(false);
    setSelectedQueryIds([]);

    try {
      const newSessionRef = await addDoc(
        collection(db, "users", currentUserId, "querySessions"),
        {
          title: "New Chat",
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          pinned: false,
        }
      );
      navigate(`/dashboard/${newSessionRef.id}`);
    } catch (error) {
      console.error("Error creating new query session:", error);
      alert("Failed to start a new chat. Please try again.");
    }

    if (window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  // Navigate to selected query session (unless in selection mode)
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
    alert(`Share functionality for query ${queryId} is not yet implemented.`);
  };

  // Pin or unpin a query session
  const handlePinQuery = async (queryId, setPinnedTo) => {
    if (!currentUserId) {
      alert("Please sign in to pin queries.");
      return;
    }

    try {
      const queryRef = doc(db, "users", currentUserId, "querySessions", queryId);
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

      alert(
        `${currentQuery?.title || "Untitled Query"} ${
          newPinnedStatus ? "pinned" : "unpinned"
        } successfully!`
      );
    } catch (error) {
      console.error("Error pinning/unpinning query:", error);
      alert("Failed to pin/unpin query. Please try again.");
    }
  };

  // Rename query with prompt input
  const handleRenameQuery = async (queryId) => {
    if (!currentUserId) {
      alert("Please sign in to rename queries.");
      return;
    }
    const currentQuery = recentQueries.find((q) => q.id === queryId);
    const oldTitle = currentQuery?.title || "Untitled Query";
    const newTitle = prompt("Enter new title for the query:", oldTitle);

    if (newTitle !== null) {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === "") {
        alert("Query title cannot be empty.");
      } else if (trimmedTitle === oldTitle) {
        alert("No change, title is the same.");
      } else {
        try {
          const queryRef = doc(db, "users", currentUserId, "querySessions", queryId);
          await updateDoc(queryRef, {
            title: trimmedTitle,
            lastUpdated: serverTimestamp(),
          });
          alert("Query renamed successfully!");
        } catch (error) {
          console.error("Error renaming query:", error);
          alert("Failed to rename query. Please try again.");
        }
      }
    }
    // If newTitle is null, user cancelled prompt - do nothing
  };

  // Delete single query session with confirmation
  const handleDeleteQuery = async (queryId) => {
    if (!currentUserId) {
      alert("Please sign in to delete queries.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this query session? This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", currentUserId, "querySessions", queryId));
        alert("Query deleted successfully!");
        if (`/dashboard/${queryId}` === location.pathname) {
          navigate(ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error("Error deleting query:", error);
        alert("Failed to delete query. Please try again.");
      }
    }
  };

  // Delete multiple selected queries in batch with confirmation
  const handleDeleteSelectedQueries = async () => {
    if (!currentUserId) {
      alert("Please sign in to delete queries.");
      return;
    }

    if (selectedQueryIds.length === 0) {
      alert("No queries selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedQueryIds.length} selected query session(s)? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        const batch = writeBatch(db);
        selectedQueryIds.forEach((queryId) => {
          const queryRef = doc(db, "users", currentUserId, "querySessions", queryId);
          batch.delete(queryRef);
        });

        await batch.commit();

        alert(`${selectedQueryIds.length} query session(s) deleted successfully!`);
        setSelectedQueryIds([]);
        setSelectionMode(false);

        if (selectedQueryIds.includes(activeQueryIdFromUrl)) {
          navigate(ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error("Error deleting selected queries:", error);
        setFetchError("Failed to delete selected queries.");
        alert("Failed to delete selected queries. Please try again.");
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
          fixed inset-y-0 left-0 w-64 bg-dark text-textGray p-4 flex-col z-40 h-screen
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:hidden
          ${!isSidebarOpen ? "pointer-events-none" : ""}
        `}
        aria-hidden={!isSidebarOpen}
        role="dialog"
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold select-none">InterviewSIM</h1>
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accentOrange"
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
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}
        `}
        aria-hidden={!isSidebarOpen}
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        {isSidebarOpen && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold select-none">InterviewSIM</h1>
            </div>
            <SidebarContent {...sidebarContentProps} />
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;
