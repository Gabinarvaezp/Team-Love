// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "REPLACE_WITH_YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "REPLACE_WITH_YOUR_MEASUREMENT_ID",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "REPLACE_WITH_YOUR_DATABASE_URL"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa servicios de Firebase
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, auth, rtdb, storage }; 