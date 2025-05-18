// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Hardcoded fallback for development and if env vars are missing
const firebaseConfig = {
  apiKey: "AIzaSyCqR8DOBCOsNsiycBvJNWd1JQKu73i7VLU",
  authDomain: "team-love-2dd83.firebaseapp.com",
  projectId: "team-love-2dd83",
  storageBucket: "team-love-2dd83.appspot.com",
  messagingSenderId: "794621460850",
  appId: "1:794621460850:web:bb9ee5132f1aa638ce9deb",
  measurementId: "G-0W56K3B12G",
  databaseURL: "https://team-love-2dd83-default-rtdb.firebaseio.com"
};

// Try to use environment variables if available
try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    firebaseConfig.apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    firebaseConfig.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    firebaseConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    firebaseConfig.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    firebaseConfig.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    firebaseConfig.appId = import.meta.env.VITE_FIREBASE_APP_ID;
    firebaseConfig.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    firebaseConfig.databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    
    console.log("Firebase initialized with environment variables");
  } else {
    console.log("Using fallback Firebase configuration");
  }
} catch (error) {
  console.error("Error loading environment variables:", error);
  console.log("Using fallback Firebase configuration");
}

// Validate databaseURL to ensure it's in the correct format
if (!firebaseConfig.databaseURL || !firebaseConfig.databaseURL.includes("firebaseio.com")) {
  firebaseConfig.databaseURL = "https://team-love-2dd83-default-rtdb.firebaseio.com";
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize all services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

// Flag to determine if we're in development mode
const isDevelopment = window.location.hostname === 'localhost';

// Handle development for Firebase emulators if needed
if (isDevelopment && false) { // Set to true if using emulators
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectDatabaseEmulator(rtdb, 'localhost', 9000);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Export the initialized services
export { app, auth, db, rtdb, storage }; 