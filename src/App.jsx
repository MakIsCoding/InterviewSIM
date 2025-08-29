import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase"; 

import MainLayout from "./components/MainLayout";
import QueryPage from "./components/QueryPage";
import SignInPage from "./components/SignInPage";
import SignUpPage from "./components/SignUpPage";
import WelcomePage from "./components/WelcomePage";
import SettingsHelpPage from "./components/SettingsHelpPage";
import ProfilePage from "./components/ProfilePage";

function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();

  // 1. Authentication State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);

      // Redirect logic based on authentication state
      if (!currentUser) {
        // If not authenticated and not already on sign-in/sign-up pages, redirect to sign-in
        if (
          location.pathname !== "/signin" &&
          location.pathname !== "/signup"
        ) {
          navigate("/signin");
        }
      } else {
        // If authenticated and on sign-in/sign-up/root, redirect to dashboard
        if (
          location.pathname === "/signin" ||
          location.pathname === "/signup" ||
          location.pathname === "/"
        ) {
          navigate("/dashboard");
        }
      }
    });

    return () => unsubscribeAuth(); // Clean up auth listener
  }, [navigate, location.pathname]); 

  // Handler for "New Query" button click (from Sidebar or WelcomePage)
  const handleNewQueryClick = () => {
    if (user) {
      navigate("/dashboard/new"); 
      setIsSidebarOpen(false); 
    } else {
      console.warn("User not authenticated for new query. Redirecting to signin.");
      navigate("/signin"); 
    }
  };

  // Handler for clicking a recent query in the sidebar (or from QueryPage)
  const handleRecentQueryClick = (queryId) => {
    if (user) {
      navigate(`/dashboard/${queryId}`); 
      setIsSidebarOpen(false); 
    } else {
      console.warn("User not authenticated to view recent query. Redirecting to signin.");
      navigate("/signin"); 
    }
  };

  // Determine activeQueryId for sidebar highlighting (passed down to MainLayout -> Sidebar)
  const pathSegments = location.pathname.split("/");
  const activeQueryIdFromUrl = pathSegments[pathSegments.length - 1];

  // Show loading screen while checking authentication
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950 text-brand-light text-2xl animate-pulse">
        Loading Interview<span className="text-accentOrange">SIM</span>...
      </div>
    );
  }

  return (
    <MainLayout
      user={user}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      onNewQueryClick={handleNewQueryClick}
      onRecentQueryClick={handleRecentQueryClick}
      activeQueryIdFromUrl={activeQueryIdFromUrl}
    >
      <Routes>
        {/* Sign-in and Sign-up routes (outside dashboard layout) */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} /> 

        {/* Routes within the Dashboard layout for authenticated users */}
        {/* The order matters: specific paths first */}
        <Route
          path="/dashboard/new"
          element={user ? <QueryPage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/dashboard/:queryId"
          element={user ? <QueryPage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/dashboard/profile"
          element={user ? <ProfilePage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/dashboard/welcome"
          element={user ? <WelcomePage /> : <Navigate to="/signin" />}
        />
        <Route
          path="/dashboard/settings-help"
          element={user ? <SettingsHelpPage /> : <Navigate to="/signin" />}
        />

        {/* Default /dashboard path for authenticated users: navigate to welcome */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to="/dashboard/welcome" />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        {/* Catch-all for any other unauthenticated routes or root */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/signin"} />}
        />
      </Routes>
    </MainLayout>
  );
}

// Top-level App component: only renders AppContent. BrowserRouter is assumed to be in main.jsx
function App() {
  return <AppContent />;
}

export default App;