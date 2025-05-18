// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Configuración fija de Firebase
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize all services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore (helps with connection issues)
try {
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }).then(() => {
    console.log("Firebase offline persistence enabled");
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed - multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
} catch (err) {
  console.warn('Error enabling offline persistence:', err);
}

// Export the initialized services
export { app, auth, db, rtdb, storage }; 