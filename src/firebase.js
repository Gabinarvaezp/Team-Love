// Firebase configuration
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
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

// Initialize Auth with custom settings
const auth = getAuth(app);
auth.useDeviceLanguage();

// Initialize Firestore with improved offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Initialize other services
const rtdb = getDatabase(app);
const storage = getStorage(app);

// Set longer timeout for operations
const FIREBASE_TIMEOUT = 30000; // 30 seconds

// Helper function for timeout wrapping
const withTimeout = (promise, timeoutMs = FIREBASE_TIMEOUT) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase operation timed out'));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Export the initialized services and helpers
export { app, auth, db, rtdb, storage, withTimeout }; 