import { useState, useEffect } from "react";
import { auth } from "./PersonalFinanceTracker/firebase";
import { onAuthStateChanged } from "firebase/auth";
import PersonalFinanceTracker from "./PersonalFinanceTracker/PersonalFinanceTracker";
import Authpage from "./PersonalFinanceTracker/Authpage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for login/logout changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Syne, sans-serif",
          color: "#6b6880",
          fontSize: "0.9rem",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid #ffffff10",
            borderTopColor: "#c4b5fd",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show login/signup if not logged in, dashboard if logged in
  return user ? <PersonalFinanceTracker /> : <Authpage />;
}

export default App;
