// ─── STEP 1: Replace these values with your Firebase project config ───────────
// Go to: https://console.firebase.google.com
// Create a project → Add Web App → Copy the config object below

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCgyRbOhtJzAvNVv9M5HMGH4lvlOQOZpU",
  authDomain: "finova-tracker.firebaseapp.com",
  projectId: "finova-tracker",
  storageBucket: "finova-tracker.firebasestorage.app",
  messagingSenderId: "675258869385",
  appId: "1:675258869385:web:14cd249d0c46f562444858",
  measurementId: "G-FLPGXZZL2H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
