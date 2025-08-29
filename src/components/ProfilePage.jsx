// src/components/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase"; // Import auth
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth"; // Import Firebase Auth functions

const ProfilePage = () => {
  const user = auth.currentUser; // Get the current authenticated user

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState(""); // For password update
  const [currentPassword, setCurrentPassword] = useState(""); // For reauthentication
  const [message, setMessage] = useState(""); // For success/error messages
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount and when 'user' changes
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setLoading(false); // Set loading to false once basic user data is available
    } else {
      setLoading(false);
      setMessage("Please sign in to view your profile.");
    }

    // Clean up message after some time
    const timer = setTimeout(() => {
      setMessage("");
    }, 5000); // Message disappears after 5 seconds

    return () => clearTimeout(timer); // Clear timeout if component unmounts or message changes
  }, [user, message]); // Added message to dependency to re-trigger timer on message change

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("No user signed in.");
      return;
    }

    setMessage(""); // Clear previous messages
    let successMessage = "Profile updated successfully!";
    let hasError = false;

    // 1. Update Display Name (if changed)
    if (displayName !== user.displayName) {
      try {
        await updateProfile(user, { displayName });
        successMessage = "Display name updated.";
      } catch (error) {
        console.error("Error updating display name:", error);
        setMessage(`Error updating display name: ${error.message}`);
        hasError = true;
      }
    }

    // 2. Reauthenticate for Email/Password changes
    // Only proceed if email is different OR a new password is provided
    if ((email !== user.email && email) || newPassword) {
      if (!currentPassword) {
        setMessage(
          "Please enter your current password to change email or password."
        );
        return;
      }
      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        // Reauthentication successful, now proceed with email/password update
        successMessage = "Profile updated and reauthenticated.";
      } catch (error) {
        console.error("Error reauthenticating:", error);
        setMessage(
          `Error reauthenticating: ${error.message}. Please check your current password.`
        );
        return; // Stop if reauthentication fails
      }
    }

    // 3. Update Email (if changed and reauthenticated)
    if (email !== user.email && email) {
      try {
        await updateEmail(user, email);
        successMessage =
          "Email updated successfully (verification email sent if required).";
      } catch (error) {
        console.error("Error updating email:", error);
        setMessage(`Error updating email: ${error.message}`);
        hasError = true;
      }
    }

    // 4. Update Password (if newPassword is provided and reauthenticated)
    if (newPassword) {
      try {
        await updatePassword(user, newPassword);
        successMessage = "Password updated successfully.";
        setNewPassword(""); // Clear password field
        setCurrentPassword(""); // Clear current password field
      } catch (error) {
        console.error("Error updating password:", error);
        setMessage(`Error updating password: ${error.message}`);
        hasError = true;
      }
    }

    if (!hasError) {
      setMessage(successMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-300">
        <div className="text-xl animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-red-400">
        <div className="text-xl">{message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
      <form
        onSubmit={handleUpdateProfile}
        className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out hover:shadow-orange-glow border border-borderGray"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-light mb-6 text-center tracking-wide">
          User Profile
        </h1>

        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-sm text-white text-center transition-all duration-300 ease-in-out transform scale-95 opacity-0 animate-fade-in-up ${
              message.includes("Error") || message.includes("Failed")
                ? "bg-red-700"
                : "bg-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-5">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-textGray mb-2"
          >
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-lightDark border border-borderGray rounded-lg text-textGray placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-300"
            placeholder="Your Display Name"
            aria-label="Display Name"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-textGray mb-2"
          >
            Email (Cannot be changed directly here)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-lightDark border border-borderGray rounded-lg text-textGray placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light cursor-not-allowed opacity-70"
            placeholder="Your Email"
            disabled // Email field is disabled for direct editing, requiring reauthentication
            aria-label="Email"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-textGray mb-2"
          >
            New Password (Leave blank if not changing)
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-lightDark border border-borderGray rounded-lg text-textGray focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-300"
            placeholder="Enter new password"
            aria-label="New Password"
          />
        </div>

        {(email !== user.email || newPassword) && (
          <div className="mb-6 animate-fade-in-up">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-textGray mb-2"
            >
              Current Password (Required for Email/Password changes)
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-lightDark border border-borderGray rounded-lg text-textGray focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-300"
              placeholder="Enter your current password"
              aria-label="Current Password"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl"
          aria-label="Update Profile"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
