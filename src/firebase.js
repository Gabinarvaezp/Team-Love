// Firebase configuration
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  connectFirestoreEmulator
} from "firebase/firestore";
import { getAuth, connectAuthEmulator, onAuthStateChanged } from "firebase/auth";
import { getDatabase, goOnline, goOffline, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import config from './firebase.config';

// Obtener la configuración de Firebase
const firebaseConfig = config.firebase;

// Conexión a consola para debugging
console.log("Firebase config:", JSON.stringify({
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
}));

// Connection state tracking
let isInitialized = false;
let hasNetworkError = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = config.connection.maxRetries;
const RECONNECT_DELAY = config.connection.retryDelayMs;
const FIREBASE_TIMEOUT = config.connection.timeoutMs;

// Función para verificar conectividad con Firebase
const checkFirebaseConnectivity = async (db, rtdb) => {
  try {
    // Verificar conexión a Firestore
    const connectivityCheck = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(getAuth(), () => {
        unsubscribe();
        resolve(true);
      });
      
      // Timeout si no hay respuesta
      setTimeout(() => resolve(false), 5000);
    });
    
    const isConnected = await connectivityCheck;
    console.log(`Firebase connectivity check: ${isConnected ? 'Connected' : 'Failed'}`);
    return isConnected;
  } catch (error) {
    console.error("Error checking Firebase connectivity:", error);
    return false;
  }
};

// Initialize Firebase with error handling
const initializeFirebaseWithRetry = () => {
  try {
    console.log("Initializing Firebase...");
    
    // Force cleanup of any existing Firebase instances
    if (typeof window !== 'undefined') {
      window.FIREBASE_INSTANCES = window.FIREBASE_INSTANCES || [];
      
      // Cleanup old instances
      if (window.FIREBASE_INSTANCES.length > 0) {
        console.warn("Cleaning up existing Firebase instances...");
      }
      window.FIREBASE_INSTANCES = [];
    }
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    
    if (typeof window !== 'undefined') {
      window.FIREBASE_INSTANCES.push(app);
    }

    // Initialize Auth with custom settings
    const auth = getAuth(app);
    auth.useDeviceLanguage();

    // Initialize Firestore with reliable configuration for web
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: config.firestore.cacheSizeBytes
      }),
      ignoreUndefinedProperties: true,
      // These experimental options are being deprecated, removing them
      // experimentalForceLongPolling: false,
      // experimentalAutoDetectLongPolling: true,
    });

    // Initialize Realtime Database with explicit URL
    const rtdb = getDatabase(app, firebaseConfig.databaseURL);
    
    // Verify the database URL is set correctly
    console.log("RTDB URL:", firebaseConfig.databaseURL);
    
    // Initialize Storage
    const storage = getStorage(app);

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

    // Verificar conectividad inicial con reintento inmediato
    setTimeout(async () => {
      const isConnected = await checkFirebaseConnectivity(db, rtdb);
      if (!isConnected) {
        console.warn("Initial connectivity check failed. Attempting reconnection...");
        try {
          // Forzar reconexión
          await disableNetwork(db);
          goOffline(rtdb);
          
          // Breve pausa para permitir que se complete la desconexión
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Reconectar
          await enableNetwork(db);
          goOnline(rtdb);
          
          console.log("Reconnection attempt completed");
        } catch (e) {
          console.error("Error during reconnection attempt:", e);
        }
      }
    }, 1000);

    // Setup connection state monitoring
    setupConnectionMonitoring(rtdb, db);
    
    isInitialized = true;
    hasNetworkError = false;
    reconnectAttempts = 0;

    // Export the initialized services and helpers
    return { app, auth, db, rtdb, storage, withTimeout };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    hasNetworkError = true;
    
    // Attempt to reconnect if we haven't reached max attempts
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY/1000} seconds...`);
      
      setTimeout(() => {
        initializeFirebaseWithRetry();
      }, RECONNECT_DELAY);
      
      // Return null services to indicate error state
      return {
        app: null,
        auth: null,
        db: null,
        rtdb: null,
        storage: null,
        withTimeout: (promise) => promise,
        isOffline: true
      };
    } else {
      console.error("Max reconnection attempts reached. Please check your network connection and Firebase configuration.");
      
      // Fall back to localStorage-only mode
      const localStorageFallback = {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key)
      };
      
      // Return mock services that will use localStorage
      return {
        app: null,
        auth: {
          onAuthStateChanged: (callback) => {
            callback(null); // Simulate not authenticated
            return () => {}; // Return unsubscribe function
          },
          signOut: () => Promise.resolve()
        },
        db: null,
        rtdb: null,
        storage: null,
        withTimeout: (promise) => promise,
        isOffline: true
      };
    }
  }
};

// Setup connection state monitoring
const setupConnectionMonitoring = (rtdb, db) => {
  // Monitor online/offline state
  window.addEventListener('online', async () => {
    console.log("Device is online, reconnecting to Firebase...");
    try {
      // Ensure we properly disconnect first to prevent connection issues
      await disableNetwork(db);
      goOffline(rtdb);
      
      // Short delay to allow disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now reconnect
      await enableNetwork(db);
      goOnline(rtdb);
      
      console.log("Successfully reconnected to Firebase");
      hasNetworkError = false;
      
      // Verificar conectividad real después de reconectar
      setTimeout(async () => {
        const isConnected = await checkFirebaseConnectivity(db, rtdb);
        if (!isConnected) {
          console.warn("Reconnection verification failed. Firebase services may still be unavailable.");
        }
      }, 2000);
    } catch (error) {
      console.error("Error reconnecting to Firebase:", error);
      hasNetworkError = true;
    }
  });

  window.addEventListener('offline', async () => {
    console.log("Device is offline, disabling Firebase network operations...");
    try {
      // Wait for pending writes before going offline
      await waitForPendingWrites(db);
      // Disable Firestore network
      await disableNetwork(db);
      // Disable Realtime Database
      goOffline(rtdb);
      console.log("Firebase offline mode activated");
    } catch (error) {
      console.error("Error setting Firebase to offline mode:", error);
    }
  });

  // Monitor auth state to handle reauth if needed
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User authenticated, ensuring connection is active...");
      if (hasNetworkError) {
        console.log("Reconnecting after previous network error...");
        try {
          // Un pequeño retraso para prevenir solicitudes simultáneas
          setTimeout(async () => {
            try {
              await disableNetwork(db);
              goOffline(rtdb);
              
              // Breve pausa
              await new Promise(resolve => setTimeout(resolve, 500));
              
              await enableNetwork(db);
              goOnline(rtdb);
              hasNetworkError = false;
              console.log("Network reconnection successful after auth");
            } catch (err) {
              console.error("Error in delayed reconnection:", err);
            }
          }, 1000);
        } catch (error) {
          console.error("Error reconnecting after auth:", error);
        }
      }
    } else {
      console.log("User signed out");
    }
  });
};

// Initialize services
const { app, auth, db, rtdb, storage, withTimeout, isOffline } = initializeFirebaseWithRetry();

// Export the initialized services and helpers
export { app, auth, db, rtdb, storage, withTimeout, isOffline }; 