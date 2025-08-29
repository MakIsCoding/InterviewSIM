// src/components/SignInPage.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase"; // Assuming firebase.js correctly exports auth, googleProvider, and db
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // New state for success messages
  const navigate = useNavigate();

  // Function to create or update user profile in Firestore
  const createUserProfileInFirestore = async (user) => {
    // Only proceed if user and user.uid are available
    if (!user || !user.uid) {
      console.error("User or User UID is not available for Firestore profile creation.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        // Create new user profile if it doesn't exist
        await setDoc(userDocRef, {
          displayName: user.displayName || "", // Use display name from auth, or empty string
          email: user.email || "", // Use email from auth, or empty string
          createdAt: new Date(),
          // Add any other default fields you need for a new user
        }, { merge: true }); // Use merge: true to avoid overwriting existing data if any
        console.log("User profile created in Firestore for UID:", user.uid);
      } else {
        // Optionally update existing profile fields if needed, e.g., last login
        await updateDoc(userDocRef, {
          lastLogin: new Date(),
          // Update other fields if necessary
        });
        console.log("User profile already exists and updated (e.g., last login).");
      }
    } catch (firestoreError) {
      console.error("Error creating/updating user profile in Firestore:", firestoreError);
      // It's crucial not to block auth flow if profile creation fails,
      // but log the error for debugging.
    }
  };

  // Handler for email/password authentication (Login/Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setSuccessMessage(""); // Clear previous success messages

    try {
      let userCredential;
      if (isRegistering) {
        // Attempt to create a new user with email and password
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Registration successful! Redirecting to dashboard...");
      } else {
        // Attempt to sign in with email and password
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Login successful! Redirecting to dashboard...");
      }
      
      // Create or update user profile in Firestore
      await createUserProfileInFirestore(userCredential.user);
      
      // Navigate to dashboard after successful authentication and profile handling
      navigate("/dashboard");
    } catch (err) {
      console.error("Authentication error:", err);
      // Display a user-friendly error message
      let errorMessage = "An unknown error occurred.";
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email. Please register or check your email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use. Please login or use a different email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        default:
          errorMessage = `Authentication failed: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  // Handler for Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(""); // Clear previous errors
    setSuccessMessage(""); // Clear previous success messages

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setSuccessMessage("Signed in with Google! Redirecting to dashboard...");
      
      // Create or update user profile in Firestore
      await createUserProfileInFirestore(result.user);
      
      // Navigate to dashboard after successful authentication and profile handling
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      // Display a user-friendly error message for Google Sign-In
      let errorMessage = "Google Sign-In failed.";
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google Sign-In popup was closed.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Google Sign-In popup was cancelled.';
      } else {
        errorMessage = `Google Sign-In failed: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark px-4 animate-fade-in-up">
      <div className="bg-lightDark p-8 rounded-xl shadow-2xl w-full max-w-md text-white border border-borderGray">
        <h2 className="text-3xl font-bold text-center mb-8 text-brand-light">
          {isRegistering ? "Register Account" : "Welcome Back!"}
        </h2>

        {/* Display Error Message */}
        {error && (
          <p className="bg-red-700 text-red-100 p-3 rounded-md text-center mb-6 text-sm animate-fade-in-up">
            {error}
          </p>
        )}

        {/* Display Success Message */}
        {successMessage && (
          <p className="bg-green-700 text-green-100 p-3 rounded-md text-center mb-6 text-sm animate-fade-in-up">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-textGray">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="your@example.com"
              className="w-full px-4 py-2 rounded-lg bg-dark border border-borderGray text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email Address"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-textGray">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-dark border border-borderGray text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-lightDark"
              aria-label={isRegistering ? "Register Account" : "Login to Account"}
            >
              {isRegistering ? "Register" : "Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(""); // Clear errors when toggling mode
                setSuccessMessage(""); // Clear success messages
              }}
              className="text-brand-light hover:underline text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-light"
              aria-label={isRegistering ? "Switch to Login" : "Switch to Register"}
            >
              {isRegistering
                ? "Already have an account? Login"
                : "Need an account? Register"}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-borderGray pt-8">
          <p className="text-center text-textGray mb-5">Or continue with:</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-lightDark"
            aria-label="Sign in with Google"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
            >
              <path d="M12.24 10.20v2.45h6.63c-.27 1.6-1.29 2.94-2.82 3.86l2.19 1.7c1.33-1.03 2.37-2.73 2.37-4.99 0-.67-.06-1.3-.18-1.92h-.01z" fill="#4285F4"/>
              <path d="M12.24 20.48c3.08 0 5.66-1.02 7.55-2.78l-2.19-1.7c-1.25.79-2.87 1.25-4.43 1.25-3.41 0-6.31-2.29-7.35-5.46h-2.2v1.73c1.07 3.32 4.23 5.96 9.22 5.96z" fill="#34A853"/>
              <path d="M5.04 13.91c-.25-.79-.39-1.63-.39-2.48s.14-1.69.39-2.48V7.24H2.84C2.39 8.24 2.14 9.39 2.14 11.43s.25 3.19.7 4.19L5.04 13.91z" fill="#FBBC05"/>
              <path d="M12.24 4.54c1.88 0 3.39.81 4.28 1.63l1.94-1.94c-1.1-1.04-2.61-1.9-6.22-1.9-4.99 0-8.15 2.64-9.22 5.96l2.2 1.73c1.04-3.17 3.94-5.46 7.35-5.46z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
