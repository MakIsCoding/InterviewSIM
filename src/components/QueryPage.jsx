// src/components/QueryPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Assuming firebase.js correctly exports auth and db
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import axios from "axios"; // Import axios for making HTTP requests to your Flask backend

const QueryPage = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false); // Controls AI thinking state
  const [sessionTitle, setSessionTitle] = useState("New Interview"); // Default title, should match Sidebar's initial title
  const [isSessionLoading, setIsSessionLoading] = useState(true); // For initial session data load
  const [sessionLoadError, setSessionLoadError] = useState(null); // For session loading errors
  const [sendMessageError, setSendMessageError] = useState(null); // New state for send message errors
  const messagesEndRef = useRef(null);

  // New state to temporarily hold a message that needs to be sent AFTER a new session is created
  const [pendingMessage, setPendingMessage] = useState(null);

  // Get current user ID safely. This will be null if no user is logged in.
  const currentUserId = auth.currentUser?.uid;

  // Effect to manage session data based on URL's queryId
  useEffect(() => {
    // Reset state for a clean slate whenever queryId changes
    setMessages([]);
    setInput("");
    setIsLoadingResponse(false); // Reset AI loading state
    setIsSessionLoading(true);
    setSessionLoadError(null);
    setSendMessageError(null); // Also reset send message error on queryId change

    // If no user is logged in, or if queryId is missing/invalid, display error and return
    if (!currentUserId) {
      setSessionLoadError("User not authenticated. Please sign in.");
      setIsSessionLoading(false);
      return;
    }

    // Case 1: Starting a new interview session (URL is /dashboard/new) - temporary state
    if (queryId === "new") {
      setSessionTitle("New Interview"); // Initial title for this temporary state
      setMessages([]); // Ensure messages are empty for a fresh start
      setIsSessionLoading(false); // No data to load for a new session
      return; // Exit as no Firestore listener is needed yet for a /new route
    }

    // Case 2: Loading an existing interview session (URL is /dashboard/:queryId)
    if (queryId) {
      const sessionDocRef = doc(
        db,
        "users",
        currentUserId,
        "interviewSessions", // Changed from querySessions
        queryId
      );

      // Listener for the session document itself (for title, existence)
      const unsubscribeSession = onSnapshot(
        sessionDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setSessionTitle(
              docSnap.data().title || `Session ${queryId.substring(0, 8)}`
            );
            setSessionLoadError(null); // Clear any previous session load error
          } else {
            // If the document doesn't exist, handle it (e.g., redirect to new interview)
            console.warn(
              `Firestore document for session ID "${queryId}" not found for user "${currentUserId}".`
            );
            setSessionLoadError("Interview session not found. Starting a new one.");
            setSessionTitle("Session Not Found");
            setMessages([]); // Clear any old messages
            // Optionally, navigate to a new interview if an invalid ID is in the URL
            navigate("/dashboard/new", { replace: true }); // Redirect to a new temporary session
          }
          setIsSessionLoading(false); // Session info loaded (or determined not to exist)
        },
        (error) => {
          console.error("Error fetching session document:", error);
          setSessionLoadError("Failed to load interview session details. " + error.message);
          setIsSessionLoading(false);
        }
      );

      // Listener for messages within this session
      const messagesCollectionRef = collection(sessionDocRef, "messages");
      const q = query(messagesCollectionRef, orderBy("createdAt"));

      const unsubscribeMessages = onSnapshot(
        q,
        (snapshot) => {
          const loadedMessages = snapshot.docs.map((doc) => ({
            id: doc.id, // Firestore message ID
            ...doc.data(), // message text, sender, createdAt
          }));
          setMessages(loadedMessages);
          console.log(
            "Firestore onSnapshot updated messages state:",
            loadedMessages
          );
        },
        (error) => {
          console.error("Error fetching messages for session:", error);
          if (error.code !== "permission-denied") {
            setSendMessageError("Failed to load messages: " + error.message);
          }
        }
      );

      // Cleanup listeners when component unmounts or queryId/user changes
      return () => {
        unsubscribeSession();
        unsubscribeMessages();
      };
    }

    // Default case if no queryId is provided (e.g., direct /dashboard access without /new or an ID)
    // We treat this as a new interview session
    setSessionTitle("New Interview"); // Ensure initial title matches Sidebar's.
    setMessages([]);
    setIsSessionLoading(false);
  }, [queryId, currentUserId, db, navigate]);

  // Effect for auto-scrolling to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    console.log("Current messages state (after render/scroll):", messages);
  }, [messages, isLoadingResponse]);

  // NEW useEffect to handle sending the pending message once queryId is stable
  useEffect(() => {
    // Only proceed if there's a pending message, queryId is valid (not 'new' or undefined), and session isn't loading
    if (
      pendingMessage &&
      queryId !== "new" &&
      queryId !== undefined &&
      !isSessionLoading &&
      currentUserId
    ) {
      console.log(
        "DEBUG useEffect: Processing pending message for new session:",
        queryId
      );
      const sendMessageToFirestoreAndAI = async () => {
        try {
          const sessionDocRef = doc(
            db,
            "users",
            currentUserId,
            "interviewSessions", // Changed from querySessions
            queryId
          );

          const docSnap = await getDoc(sessionDocRef);
          console.log("DEBUG useEffect: docSnap.exists():", docSnap.exists());
          if (docSnap.exists()) {
            console.log(
              "DEBUG useEffect: docSnap.data().title:",
              docSnap.data().title
            );
            if (docSnap.data().title === "New Interview") { // Changed from New Chat
              const updatedTitle =
                pendingMessage.substring(0, 50) +
                (pendingMessage.length > 50 ? "..." : "");
              await updateDoc(sessionDocRef, {
                title: updatedTitle,
                lastUpdated: serverTimestamp(),
              });
              setSessionTitle(updatedTitle);
              console.log(
                "DEBUG useEffect: Session title updated in useEffect to:",
                updatedTitle
              );
            } else {
              await updateDoc(sessionDocRef, {
                lastUpdated: serverTimestamp(),
              });
              console.log(
                "DEBUG useEffect: Session lastUpdated field updated in useEffect."
              );
            }
          }

          // Add the user's message to the messages subcollection in Firestore
          await addDoc(
            collection(
              db,
              "users",
              currentUserId,
              "interviewSessions", // Changed from querySessions
              queryId,
              "messages"
            ),
            {
              text: pendingMessage,
              sender: "user",
              createdAt: serverTimestamp(),
            }
          );
          console.log(
            "DEBUG useEffect: User message added to Firestore via useEffect."
          );

          // --- START RAG INTEGRATION (Moved here) ---
          setIsLoadingResponse(true);
          console.log(
            "DEBUG useEffect: AI typing indicator set to true in useEffect."
          );

          let aiResponseText =
            "An error occurred while getting a response from InterviewSIM.";
          try {
            console.log(
              "DEBUG useEffect: Sending prompt to Flask backend from useEffect:",
              pendingMessage
            );
            // Implement exponential backoff for API calls
            let retryCount = 0;
            const maxRetries = 3;
            const baseDelay = 1000; // 1 second

            const callApiWithRetry = async () => {
              try {
                const ragResponse = await axios.post(
                  "http://localhost:8000/gemini-rag",
                  {
                    prompt: pendingMessage,
                  }
                );
                return ragResponse.data.response;
              } catch (error) {
                if (retryCount < maxRetries) {
                  const delay = baseDelay * Math.pow(2, retryCount);
                  console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
                  retryCount++;
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return callApiWithRetry(); // Recursive call
                } else {
                  throw error; // Max retries reached, re-throw the error
                }
              }
            };

            aiResponseText = await callApiWithRetry();
            console.log(
              "DEBUG useEffect: AI response received from Flask in useEffect:",
              aiResponseText
            );
          } catch (ragError) {
            console.error(
              "ERROR useEffect: Error calling Python RAG API in useEffect:",
              ragError
            );
            if (ragError.response) {
              aiResponseText = `InterviewSIM: Failed to get a response (Code: ${ragError.response.status}). Please check the Python backend.`;
            } else if (ragError.request) {
              aiResponseText =
                "InterviewSIM: No response from the AI server. Is the Python backend running?";
            } else {
              aiResponseText = `InterviewSIM: Error sending request: ${ragError.message}`;
            }
            setSendMessageError(aiResponseText);
          } finally {
            setIsLoadingResponse(false);
            console.log(
              "DEBUG useEffect: AI typing indicator set to false in useEffect."
            );
          }

          await addDoc(
            collection(
              db,
              "users",
              currentUserId,
              "interviewSessions", // Changed from querySessions
              queryId,
              "messages"
            ),
            {
              text: aiResponseText,
              sender: "bot",
              createdAt: serverTimestamp(),
            }
          );
          console.log(
            "DEBUG useEffect: AI message added to Firestore via useEffect."
          );
          // --- END RAG INTEGRATION ---
        } catch (error) {
          console.error(
            "ERROR useEffect: Error processing pending message in useEffect:",
            error
          );
          setSendMessageError(
            "Failed to send message or save session after creation. Please try again."
          );
          setIsLoadingResponse(false);
        } finally {
          setPendingMessage(null); // Clear the pending message after processing
        }
      };

      sendMessageToFirestoreAndAI();
    }
  }, [pendingMessage, queryId, isSessionLoading, currentUserId, db, navigate]);

  // Handler for sending a message (user or AI)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) {
      if (!currentUserId) {
        setSendMessageError("You must be logged in to send messages.");
      } else if (!input.trim()) {
        setSendMessageError("Message cannot be empty.");
      }
      return;
    }

    const userMessageText = input;
    console.log(
      "User input captured:",
      userMessageText,
      typeof userMessageText
    );
    setInput("");
    setSendMessageError(null); // Clear previous errors

    // Optimistic UI update for the user's message
    const tempUserMessage = {
      id: "temp-" + Date.now(),
      text: userMessageText,
      sender: "user",
      createdAt: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, tempUserMessage]);
    console.log("Optimistic UI: User message added to local state.");

    // If it's a new session, create it and navigate. The rest will be handled by useEffect.
    if (!queryId || queryId === "new") {
      console.log(
        "DEBUG handleSendMessage: Entered 'create new session' block."
      );
      try {
        console.log(
          "DEBUG handleSendMessage: Attempting to add new session document to Firestore..."
        );
        const newSessionRef = await addDoc(
          collection(db, "users", currentUserId, "interviewSessions"), // Changed from querySessions
          {
            title: "New Interview", // Temporary title, will be updated by first message
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }
        );
        const newSessionId = newSessionRef.id;
        console.log(
          "DEBUG handleSendMessage: New session document added. ID:",
          newSessionId
        );

        setPendingMessage(userMessageText); // Store the message to be processed after navigation
        console.log(
          "DEBUG handleSendMessage: Pending message set. About to navigate."
        );
        navigate(`/dashboard/${newSessionId}`, { replace: true }); // Navigate to the new session
        console.log(
          "DEBUG handleSendMessage: Navigation initiated to new session ID:",
          newSessionId
        );
      } catch (error) {
        console.error(
          "ERROR handleSendMessage: Failed to create new session:",
          error
        );
        setSendMessageError("Failed to create new interview session. Please try again.");
        setIsLoadingResponse(false);
        // Remove the optimistically added message if session creation failed
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== tempUserMessage.id)
        );
      }
      return; // Exit here, useEffect will handle message sending after navigation
    }

    // If it's an existing session, proceed directly to send the message
    // This part is for subsequent messages in an already existing session
    console.log(
      "DEBUG handleSendMessage: Handling message for existing session."
    );
    let currentSessionFirestoreId = queryId; // This should already be valid

    try {
      const sessionDocRef = doc(
        db,
        "users",
        currentUserId,
        "interviewSessions", // Changed from querySessions
        currentSessionFirestoreId
      );

      const docSnap = await getDoc(sessionDocRef);
      console.log("docSnap.exists():", docSnap.exists());
      if (docSnap.exists()) {
        console.log("docSnap.data():", docSnap.data());
        console.log(
          "docSnap.data().title:",
          docSnap.data().title,
          typeof docSnap.data().title
        );

        // Update the last updated timestamp for the session
        await updateDoc(sessionDocRef, { lastUpdated: serverTimestamp() });
        console.log("Session lastUpdated field updated.");
      }

      // Add the user's message to Firestore for existing session
      await addDoc(
        collection(
          db,
          "users",
          currentUserId,
          "interviewSessions", // Changed from querySessions
          currentSessionFirestoreId,
          "messages"
        ),
        {
          text: userMessageText,
          sender: "user",
          createdAt: serverTimestamp(),
        }
      );
      console.log("User message added to Firestore for existing session.");

      // --- START RAG INTEGRATION (for existing sessions) ---
      setIsLoadingResponse(true);
      console.log("AI typing indicator set to true.");

      let aiResponseText =
        "An error occurred while getting a response from InterviewSIM.";
      try {
        console.log("Sending prompt to Flask backend:", userMessageText);
        // Implement exponential backoff for API calls
        let retryCount = 0;
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        const callApiWithRetry = async () => {
          try {
            const ragResponse = await axios.post(
              "http://localhost:8000/gemini-rag",
              {
                prompt: userMessageText,
              }
            );
            return ragResponse.data.response;
          } catch (error) {
            if (retryCount < maxRetries) {
              const delay = baseDelay * Math.pow(2, retryCount);
              console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, delay));
              return callApiWithRetry(); // Recursive call
            } else {
              throw error; // Max retries reached, re-throw the error
            }
          }
        };

        aiResponseText = await callApiWithRetry();
        console.log("AI response received from Flask:", aiResponseText);
      } catch (ragError) {
        console.error("Error calling Python RAG API:", ragError);
        if (ragError.response) {
          aiResponseText = `InterviewSIM: Failed to get a response (Code: ${ragError.response.status}). Please check the Python backend.`;
        } else if (ragError.request) {
          aiResponseText =
            "InterviewSIM: No response from the AI server. Is the Python backend running?";
        } else {
          aiResponseText = `InterviewSIM: Error sending request: ${ragError.message}`;
        }
        setSendMessageError(aiResponseText);
        console.error(
          "Error with RAG API call, AI response set to:",
          aiResponseText
        );
      } finally {
        setIsLoadingResponse(false);
        console.log("AI typing indicator set to false.");
      }

      await addDoc(
        collection(
          db,
          "users",
          currentUserId,
          "interviewSessions", // Changed from querySessions
          currentSessionFirestoreId,
          "messages"
        ),
        {
          text: aiResponseText,
          sender: "bot",
          createdAt: serverTimestamp(),
        }
      );
      console.log("AI message added to Firestore.");
      // --- END RAG INTEGRATION ---
    } catch (error) {
      console.error(
        "Error in handleSendMessage (Firebase or initial setup) for existing session:",
        error
      );
      setIsLoadingResponse(false);
      setSendMessageError(
        "Failed to send message or save session. Please try again."
      );
      // Remove the optimistically added message if sending failed
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== tempUserMessage.id)
      );
    }
  };

  // Render loading state, error state, or the chat UI
  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-dark text-textGray">
        <div className="text-xl animate-pulse">Loading interview session...</div> {/* Changed text */}
      </div>
    );
  }

  // Session load error takes precedence
  if (sessionLoadError) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full bg-dark text-red-400">
        <p className="text-lg mb-4 text-center">{sessionLoadError}</p>
        <button
          onClick={() => navigate("/dashboard/new")}
          className="px-6 py-3 bg-brand-dark text-white rounded-lg hover:bg-brand transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
        >
          Start New Interview
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark text-textGray animate-fade-in-up">
      {/* Session Title Bar */}
      <div className="flex-shrink-0 p-4 bg-lightDark shadow-lg flex items-center justify-between border-b border-borderGray">
        <h2 className="text-2xl font-bold text-brand-light">
          {sessionTitle}
        </h2>
      </div>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col custom-scrollbar space-y-4">
        {/* On-screen error message for sending */}
        {sendMessageError && (
          <div className="p-3 mb-4 bg-red-800 text-red-200 rounded-lg text-center shadow-md animate-fade-in-up">
            {sendMessageError}
          </div>
        )}

        {/* Conditional messages for empty state */}
        {messages.length === 0 && !isLoadingResponse ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 text-lg sm:text-xl animate-fade-in-up">
              {queryId === "new" || !queryId
                ? "Begin your interview..." // Changed text
                : "No messages in this interview session yet. Type a message below!"} {/* Changed text */}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id} // Use Firestore document ID or temporary ID as key for messages
              className={`mb-2 p-3 rounded-xl max-w-[90%] sm:max-w-[80%] shadow-md animate-fade-in-up transform transition-transform duration-300 ease-out
                ${
                  msg.sender === "user"
                    ? "bg-brand self-end ml-auto text-white rounded-br-none" // User messages on right
                    : "bg-gray-700 self-start mr-auto text-textGray rounded-bl-none" // AI messages on left
                }`}
            >
              <p className="text-sm sm:text-base whitespace-pre-wrap">
                {msg.text}
              </p>
              {msg.createdAt && msg.createdAt.toDate && (
                <span className="block text-xs text-right opacity-75 mt-1">
                  {new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          ))
        )}
        {isLoadingResponse && (
          <div className="mb-2 p-3 rounded-xl bg-gray-700 self-start mr-auto max-w-[90%] sm:max-w-[80%] shadow-md animate-pulse">
            <p className="text-sm sm:text-base text-textGray">
              InterviewSIM is typing
              <span className="dot-animation">.</span>
              <span className="dot-animation delay-100">.</span>
              <span className="dot-animation delay-200">.</span>
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="flex-shrink-0 p-4 bg-lightDark border-t border-borderGray flex items-center space-x-3 shadow-lg"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            currentUserId ? "Type your message..." : "Please sign in to chat..."
          }
          className="flex-1 p-3 rounded-full bg-dark border border-borderGray text-textGray placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-light transition-all duration-200 text-sm sm:text-base"
          // Input should only be disabled if AI is loading (isLoadingResponse is true) or no user
          disabled={isLoadingResponse || !currentUserId}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-brand text-white rounded-full hover:bg-brand-dark transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-lightDark"
          // Button should be disabled if AI is loading OR input is empty OR no user
          disabled={isLoadingResponse || !input.trim() || !currentUserId}
          aria-label="Send message"
        >
          Send
        </button>
      </form>

      {/* Custom CSS for dot animation */}
      <style jsx>{`
        @keyframes dot-blink {
          0%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
        .dot-animation {
          animation: dot-blink 1.4s infinite;
          display: inline-block; /* To allow animation on individual dots */
        }
        .dot-animation.delay-100 {
          animation-delay: 0.1s;
        }
        .dot-animation.delay-200 {
          animation-delay: 0.2s;
        }
        /* Custom scrollbar for better aesthetics */
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

export default QueryPage;
