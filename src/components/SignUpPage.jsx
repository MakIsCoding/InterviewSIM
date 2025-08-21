// src/components/SignUpPage.jsx
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Assuming firebase.js is in the src directory and exports auth, db
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import ReCAPTCHA from "react-google-recaptcha"; // Make sure you have installed react-google-recaptcha

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // New state for success messages
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  // Function to create user profile in Firestore after successful signup
  const createUserProfileInFirestore = async (user, displayName, userEmail) => {
    // Only proceed if user and user.uid are available
    if (!user || !user.uid) {
      console.error("User or User UID is not available for Firestore profile creation.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    try {
      await setDoc(userDocRef, {
        displayName: displayName || "", // Use provided name, or empty string
        email: userEmail || "", // Use provided email, or empty string
        createdAt: new Date(),
        // Add any other default fields you need for a new user
      }, { merge: true }); // Use merge: true to avoid overwriting existing data if any
      console.log("User profile created in Firestore for UID:", user.uid);
    } catch (firestoreError) {
      console.error("Error creating user profile in Firestore:", firestoreError);
      // It's crucial not to block signup flow if profile creation fails,
      // but log the error for debugging.
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setSuccessMessage(""); // Clear previous success messages

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user's name and email in Firestore
      await createUserProfileInFirestore(user, name, email);

      setSuccessMessage("Registration successful! Redirecting to dashboard...");
      // Clear form fields
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRecaptchaToken(null);
      recaptchaRef.current.reset(); // Reset reCAPTCHA widget

      // Navigate to dashboard after successful signup
      // Changed from /profile to /dashboard for consistency with SignInPage
      navigate("/dashboard");

    } catch (err) {
      console.error("Signup error:", err);
      let errorMessage = "An unknown error occurred.";
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use. Please try logging in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage = `Signup failed: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark px-4 animate-fade-in-up">
      <div className="bg-lightDark p-8 rounded-xl shadow-2xl w-full max-w-md text-white border border-borderGray">
        <h2 className="text-3xl font-bold text-center mb-8 text-brand-light">
          Create Your Account
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

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-textGray">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Your Name"
              className="w-full px-4 py-2 rounded-lg bg-dark border border-borderGray text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Full Name"
            />
          </div>

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

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-2 text-textGray">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-dark border border-borderGray text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-label="Confirm Password"
            />
          </div>

          <div className="flex justify-center pt-2">
            {/* IMPORTANT: Replace "YOUR_RECAPTCHA_SITE_KEY" with your actual reCAPTCHA site key */}
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6Leywa0rAAAAAMADRLk3ezqYVnKCwyQyUKbRUTVr" // <--- Place your reCAPTCHA site key here
              onChange={handleRecaptchaChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-lightDark"
              aria-label="Sign Up"
            >
              Sign Up
            </button>
            <Link to="/signin" className="text-brand-light hover:underline text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-light">
              Already have an account? Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
