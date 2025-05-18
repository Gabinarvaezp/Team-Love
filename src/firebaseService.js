// Servicio para manejar operaciones con Firebase
import { db, auth, rtdb, storage, withTimeout, isOffline } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  ref,
  set,
  push,
  onValue,
  update,
  remove,
  get,
  goOffline,
  goOnline,
  connectDatabaseEmulator
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Enhanced error handling utility
const handleFirebaseError = (error, customMessage = "Firebase operation failed") => {
  console.error(`${customMessage}:`, error);
  
  // Check if it's a connection error
  const isConnectionError = 
    error.code === 'unavailable' || 
    error.code === 'deadline-exceeded' ||
    error.code === 'network-request-failed' ||
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('unavailable') ||
    error.name === 'TimeoutError';
  
  // Intentar guardar el error para análisis
  try {
    const errorsLog = JSON.parse(localStorage.getItem('firebase_errors') || '[]');
    errorsLog.push({
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      code: error.code || 'unknown',
      custom: customMessage,
      isConnectionError,
      appVersion: '1.0.0' // Versión de la aplicación para diagnóstico
    });
    // Guardar solo los últimos 20 errores
    localStorage.setItem('firebase_errors', JSON.stringify(errorsLog.slice(-20)));
  } catch (e) {
    console.warn('Could not log error to localStorage', e);
  }
  
  // Return more user-friendly error
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'An unknown error occurred';
  
  return {
    code: errorCode,
    message: errorMessage,
    isConnectionError,
    friendly: errorCode === 'permission-denied' 
      ? 'No tienes permiso para realizar esta acción. Por favor verifica tu cuenta.'
      : isConnectionError
        ? 'Hubo un problema con la conexión a internet. Por favor verifica tu conexión e intenta nuevamente.'
        : 'Hubo un problema conectando al servicio. Por favor intenta más tarde.'
  };
};

// Helper function to retry operations on network errors
const withRetry = async (operation, attempts = RETRY_ATTEMPTS, delay = RETRY_DELAY) => {
  try {
    return await operation();
  } catch (error) {
    const errorDetails = handleFirebaseError(error);
    
    if (errorDetails.isConnectionError && attempts > 0) {
      console.log(`Retrying operation, ${attempts} attempts left...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, attempts - 1, delay * 2);
    }
    
    throw error;
  }
};

// Network status management
const networkStatus = {
  online: navigator.onLine,
  listeners: [],
  
  setStatus(status) {
    this.online = status;
    this.notifyListeners();
    
    // Apply network status to Firebase services
    try {
      if (status) {
        enableNetwork(db);
        goOnline(rtdb);
      } else {
        disableNetwork(db);
        goOffline(rtdb);
      }
    } catch (e) {
      console.warn('Error updating Firebase network status:', e);
    }
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.online));
  },
  
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  init() {
    window.addEventListener('online', () => this.setStatus(true));
    window.addEventListener('offline', () => this.setStatus(false));
    
    // Initialize with current status
    this.setStatus(navigator.onLine);
  }
};

// Initialize network monitoring
networkStatus.init();

// Auth State Observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, user => {
    // Si el usuario existe, guarda la información básica en localStorage
    if (user) {
      try {
        const userData = JSON.parse(localStorage.getItem('user_session') || '{}');
        userData.uid = user.uid;
        userData.email = user.email;
        userData.lastLogin = new Date().toISOString();
        localStorage.setItem('user_session', JSON.stringify(userData));
      } catch (e) {
        console.warn('Error saving user session data', e);
      }
    }
    
    callback(user);
  });
};

// User Authentication
export const registerUser = async (email, password) => {
  try {
    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, email, password)
    );
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to register user");
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, email, password)
    );
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to login");
  }
};

export const logoutUser = async () => {
  try {
    await withTimeout(signOut(auth));
    // Limpiar datos de sesión pero mantener datos offline
    localStorage.removeItem('user_session');
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to logout");
  }
};

export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user && !navigator.onLine) {
    try {
      // Intentar recuperar del almacenamiento local
      const sessionData = localStorage.getItem('user_session');
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (e) {
      console.warn('Error getting cached user data', e);
    }
  }
  return user;
};

// User Profile Management
export const getUserProfile = async (userId) => {
  try {
    // First try to get from local cache
    let userData = null;
    try {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        userData = parsedData[userId];
      }
    } catch (e) {
      console.warn('Error getting cached user profile', e);
    }

    if (!navigator.onLine) {
      return userData || { userId, offline: true };
    }

    const userDocRef = doc(db, "users", userId);
    const docSnap = await withTimeout(getDoc(userDocRef));
    
    if (docSnap.exists()) {
      const profileData = docSnap.data();
      
      // Cache the result
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData[userId] = profileData;
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (e) {
        console.warn('Error caching user profile', e);
      }
      
      return profileData;
    } else {
      return userData || null;
    }
  } catch (error) {
    // Si estamos offline, devolver los datos en caché
    if (!navigator.onLine) {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        try {
          const userData = JSON.parse(storedData);
          return userData[userId] || null;
        } catch (e) {
          console.warn('Error parsing cached user data', e);
        }
      }
    }
    
    throw handleFirebaseError(error, "Failed to get user profile");
  }
};

export const addUserProfile = async (userId, profileData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      ...profileData,
      createdAt: serverTimestamp()
    });
    return userId;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to add user profile");
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to update user profile");
  }
};

// Financial Movements
export const addMovement = async (movementData) => {
  try {
    // Use withRetry for better error handling
    const docRef = await withRetry(async () => {
      const movementsRef = collection(db, "movements");
      return await addDoc(movementsRef, {
        ...movementData,
        timestamp: serverTimestamp()
      });
    });
    
    // Also save to real-time database for instant sync
    // Wrap in another withRetry to handle Realtime Database errors separately
    await withRetry(async () => {
      await saveRealTimeData(`movements/${docRef.id}`, {
        ...movementData,
        id: docRef.id,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      // Just log the error but don't fail the operation if realtime sync fails
      console.warn("Failed to sync to Realtime Database, but Firestore operation succeeded:", error);
    });
    
    return docRef.id;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to add movement");
  }
};

export const getMovements = async (userId) => {
  try {
    return await withRetry(async () => {
      const movementsRef = collection(db, "movements");
      const q = query(movementsRef, where("user", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const movements = [];
      querySnapshot.forEach((doc) => {
        movements.push({ id: doc.id, ...doc.data() });
      });
      
      return movements;
    });
  } catch (error) {
    // Use fallback if available
    try {
      const cacheKey = userId ? `movements_${userId}` : 'movements_all';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.log("Using cached movements data after fetch error");
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error("Error retrieving cached movements data:", e);
    }
    
    throw handleFirebaseError(error, "Failed to get movements");
  }
};

export const updateMovement = async (movementId, data) => {
  try {
    // Use withRetry for better error handling
    await withRetry(async () => {
      const movementRef = doc(db, "movements", movementId);
      await updateDoc(movementRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    });
    
    // Update real-time database for instant sync
    await withRetry(async () => {
      await updateRealTimeData(`movements/${movementId}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    }).catch(error => {
      // Just log the error but don't fail the operation if realtime sync fails
      console.warn("Failed to sync update to Realtime Database, but Firestore operation succeeded:", error);
    });
    
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to update movement");
  }
};

export const deleteMovement = async (movementId) => {
  try {
    // Use withRetry for better error handling
    await withRetry(async () => {
      const movementRef = doc(db, "movements", movementId);
      await deleteDoc(movementRef);
    });
    
    // Remove from real-time database
    await withRetry(async () => {
      await removeRealTimeData(`movements/${movementId}`);
    }).catch(error => {
      // Just log the error but don't fail the operation if realtime sync fails
      console.warn("Failed to remove from Realtime Database, but Firestore operation succeeded:", error);
    });
    
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to delete movement");
  }
};

// Real-time Database Operations
export const saveRealTimeData = async (path, data) => {
  try {
    return await withRetry(async () => {
      const dbRef = ref(rtdb, path);
      await set(dbRef, data);
      
      // Also cache locally
      try {
        const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Error caching data locally:', e);
      }
      
      return true;
    });
  } catch (error) {
    // Log the error but don't fail the app if it's just a realtime sync
    const errorDetails = handleFirebaseError(error, "Failed to save real-time data");
    
    // Cache the data locally even if Firebase sync failed
    try {
      const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log('Data cached locally despite Firebase sync failure');
    } catch (e) {
      console.warn('Error caching data locally after sync failure:', e);
    }
    
    throw errorDetails;
  }
};

export const updateRealTimeData = async (path, data) => {
  try {
    return await withRetry(async () => {
      const dbRef = ref(rtdb, path);
      
      // First get current data for updating cache
      let currentData = {};
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          currentData = snapshot.val();
        }
      } catch (e) {
        console.warn('Failed to get current data for update, will use empty object:', e);
      }
      
      // Perform the update
      await update(dbRef, data);
      
      // Update cache
      try {
        const updatedData = { ...currentData, ...data };
        const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedData));
      } catch (e) {
        console.warn('Error updating local cache:', e);
      }
      
      return true;
    });
  } catch (error) {
    // Log error but try to update cache anyway
    const errorDetails = handleFirebaseError(error, "Failed to update real-time data");
    
    // Try to update cache even if Firebase update failed
    try {
      const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const currentData = JSON.parse(cachedData);
        const updatedData = { ...currentData, ...data };
        localStorage.setItem(cacheKey, JSON.stringify(updatedData));
        console.log('Cache updated despite Firebase update failure');
      }
    } catch (e) {
      console.warn('Error updating cache after Firebase failure:', e);
    }
    
    throw errorDetails;
  }
};

export const removeRealTimeData = async (path) => {
  try {
    return await withRetry(async () => {
      const dbRef = ref(rtdb, path);
      await remove(dbRef);
      
      // Also remove from cache
      try {
        const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
        localStorage.removeItem(cacheKey);
      } catch (e) {
        console.warn('Error removing from local cache:', e);
      }
      
      return true;
    });
  } catch (error) {
    // Log error but try to update cache anyway
    const errorDetails = handleFirebaseError(error, "Failed to remove real-time data");
    
    // Remove from cache anyway
    try {
      const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
      localStorage.removeItem(cacheKey);
      console.log('Removed from cache despite Firebase removal failure');
    } catch (e) {
      console.warn('Error removing from cache after Firebase failure:', e);
    }
    
    throw errorDetails;
  }
};

export const getRealTimeData = async (path) => {
  try {
    const dbRef = ref(rtdb, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to get real-time data");
  }
};

export const subscribeToRealTimeData = (path, callback) => {
  // Registro para depuración
  console.log(`Configurando suscripción a: ${path}`);
  
  // Track subscription state
  let isSubscribed = true;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  const RETRY_DELAY_BASE = 2000; // 2 seconds initial delay
  
  // Recuperar datos en caché inmediatamente si están disponibles
  try {
    const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const data = JSON.parse(cachedData);
      console.log(`Usando datos en caché para ${path}`, data);
      // Llamar al callback con los datos en caché mientras se configura la suscripción real
      setTimeout(() => isSubscribed && callback(data), 0);
    }
  } catch (e) {
    console.warn(`Error recuperando datos en caché para ${path}:`, e);
  }
  
  // Handle offline mode - serve from cache only
  if (isOffline) {
    console.log(`Firebase está en modo offline, usando solo caché para ${path}`);
    try {
      const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setTimeout(() => isSubscribed && callback(JSON.parse(cachedData)), 0);
      } else {
        setTimeout(() => isSubscribed && callback({}), 0);
      }
    } catch (e) {
      console.error(`Error en modo offline para ${path}:`, e);
      setTimeout(() => isSubscribed && callback({}), 0);
    }
    
    // Return unsubscribe function
    return () => {
      isSubscribed = false;
      console.log(`Cancelando suscripción a ${path} en modo offline`);
    };
  }
  
  const setupSubscription = () => {
    try {
      // Indicador de primera carga completada
      let initialLoadComplete = false;
      
      // Referencia a la base de datos
      const dbRef = ref(rtdb, path);
      
      // Manejador de errores mejorado
      const errorHandler = (error) => {
        console.error(`Error en suscripción a ${path}:`, error);
        
        // Registrar el error para análisis
        try {
          const errorsLog = JSON.parse(localStorage.getItem('rtdb_errors') || '[]');
          errorsLog.push({
            path,
            timestamp: new Date().toISOString(),
            code: error.code || 'unknown',
            message: error.message || 'Unknown error'
          });
          localStorage.setItem('rtdb_errors', JSON.stringify(errorsLog.slice(-20)));
        } catch (e) {
          console.warn('Error logging RTDB error:', e);
        }
        
        // Usar datos en caché si hay error de conexión o permisos
        const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData && isSubscribed) {
            console.log(`Fallback a datos en caché para ${path} debido a error:`, error.code);
            callback(JSON.parse(cachedData));
            return;
          }
        } catch (e) {
          console.warn(`Error procesando caché para ${path}:`, e);
        }
        
        // Si no hay caché, devolver un objeto vacío
        if (isSubscribed) {
          callback({});
        }
        
        // Retry connection if it's a connection error and we haven't exceeded max retries
        const isConnectionError = 
          error.code === 'NETWORK_ERROR' || 
          error.code === 'unavailable' || 
          error.code === 'deadline-exceeded' ||
          error.code === 'network-request-failed' ||
          error.message.includes('network') ||
          error.message.includes('connection');
        
        if (isConnectionError && retryCount < MAX_RETRIES && isSubscribed) {
          const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
          retryCount++;
          console.log(`Reintentando suscripción a ${path} en ${delayMs}ms (intento ${retryCount}/${MAX_RETRIES})`);
          
          setTimeout(() => {
            if (isSubscribed) {
              console.log(`Ejecutando reintento ${retryCount} para ${path}`);
              unsubscribe(); // Limpiar suscripción actual
              setupSubscription(); // Configurar nueva suscripción
            }
          }, delayMs);
        }
      };
      
      // Configurar manejador de datos
      const unsubscribe = onValue(
        dbRef, 
        (snapshot) => {
          retryCount = 0; // Reset retry count on successful connection
          
          // Procesar los datos
          let data = {};
          if (snapshot.exists()) {
            data = snapshot.val();
          }
          
          // Registrar para depuración
          console.log(`Datos recibidos para ${path}`, data);
          
          // Guardar en caché
          try {
            const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {
            console.warn(`Error guardando datos en caché para ${path}:`, e);
          }
          
          // Invocar callback si todavía estamos suscritos
          if (isSubscribed) {
            if (initialLoadComplete) {
              console.log(`Notificando cambios para ${path}`);
            } else {
              console.log(`Carga inicial completada para ${path}`);
              initialLoadComplete = true;
            }
            callback(data);
          }
        }, 
        errorHandler
      );
      
      // Devolver función para cancelar suscripción
      return () => {
        isSubscribed = false;
        console.log(`Cancelando suscripción a ${path}`);
        unsubscribe();
      };
    } catch (error) {
      console.error(`Error configurando suscripción a ${path}:`, error);
      
      // Usar datos en caché como fallback
      try {
        const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData && isSubscribed) {
          console.log(`Usando datos en caché como fallback para ${path}`);
          callback(JSON.parse(cachedData));
        } else if (isSubscribed) {
          callback({});
        }
      } catch (e) {
        console.error(`Error procesando caché como fallback para ${path}:`, e);
        if (isSubscribed) {
          callback({});
        }
      }
      
      // Retry setup if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES && isSubscribed) {
        const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        retryCount++;
        console.log(`Reintentando configuración para ${path} en ${delayMs}ms (intento ${retryCount}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          if (isSubscribed) {
            setupSubscription();
          }
        }, delayMs);
      }
      
      // Return a dummy unsubscribe function
      return () => {
        isSubscribed = false;
        console.log(`Cancelando suscripción a ${path} (tras error)`);
      };
    }
  };
  
  // Start the subscription process
  return setupSubscription();
};

export const subscribeToMovements = (callback, userId = null) => {
  console.log('Configurando suscripción a movements con userId:', userId);

  // Track subscription state
  let isSubscribed = true;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  const RETRY_DELAY_BASE = 2000; // 2 seconds initial delay
  
  // Intentar recuperar datos en caché primero
  try {
    const cacheKey = userId ? `movements_${userId}` : 'movements_all';
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const movements = JSON.parse(cachedData);
      console.log('Usando datos en caché para movements:', movements.length);
      // Llamar al callback con datos en caché mientras se configura la suscripción real
      setTimeout(() => isSubscribed && callback(movements), 0);
    }
  } catch (e) {
    console.warn('Error recuperando datos en caché para movements:', e);
  }
  
  // Handle offline mode - serve from cache only
  if (isOffline) {
    console.log('Firebase está en modo offline, usando solo caché para movements');
    try {
      const cacheKey = userId ? `movements_${userId}` : 'movements_all';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setTimeout(() => isSubscribed && callback(JSON.parse(cachedData)), 0);
      } else {
        setTimeout(() => isSubscribed && callback([]), 0);
      }
    } catch (e) {
      console.error('Error en modo offline para movements:', e);
      setTimeout(() => isSubscribed && callback([]), 0);
    }
    
    // Return unsubscribe function
    return () => {
      isSubscribed = false;
      console.log('Cancelando suscripción a movements en modo offline');
    };
  }
  
  const setupSubscription = () => {
    try {
      let q;
      if (userId) {
        q = query(collection(db, "movements"), where("user", "==", userId));
      } else {
        q = collection(db, "movements");
      }
      
      // Indicador de primera carga completada
      let initialLoadComplete = false;
      
      // Configurar suscripción con mejor manejo de errores
      const unsubscribe = onSnapshot(
        q, 
        // Manejador de éxito
        (querySnapshot) => {
          retryCount = 0; // Reset retry count on successful connection
          
          const movements = [];
          querySnapshot.forEach((doc) => {
            movements.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          console.log(`Datos de movements recibidos (${movements.length} documentos)`);
          
          // Guardar en caché
          try {
            const cacheKey = userId ? `movements_${userId}` : 'movements_all';
            localStorage.setItem(cacheKey, JSON.stringify(movements));
          } catch (e) {
            console.warn('Error guardando movements en caché:', e);
          }
          
          // Solo notificar cambios para evitar múltiples renders
          if (isSubscribed) {
            if (initialLoadComplete) {
              console.log('Notificando cambios en movements');
            } else {
              console.log('Carga inicial de movements completada');
              initialLoadComplete = true;
            }
            
            callback(movements);
          }
        },
        // Manejador de error mejorado
        (error) => {
          console.error('Error en suscripción a movements:', error);
          
          // Registrar el error para análisis
          try {
            const errorsLog = JSON.parse(localStorage.getItem('firestore_errors') || '[]');
            errorsLog.push({
              collection: 'movements',
              userId,
              timestamp: new Date().toISOString(),
              code: error.code || 'unknown',
              message: error.message || 'Unknown error'
            });
            localStorage.setItem('firestore_errors', JSON.stringify(errorsLog.slice(-20)));
          } catch (e) {
            console.warn('Error logging Firestore error:', e);
          }
          
          // Usar datos en caché si hay error
          try {
            const cacheKey = userId ? `movements_${userId}` : 'movements_all';
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData && isSubscribed) {
              console.log('Fallback a datos en caché para movements debido a error:', error.code);
              callback(JSON.parse(cachedData));
            } else if (isSubscribed) {
              console.log('No hay datos en caché para movements, devolviendo array vacío');
              callback([]);
            }
          } catch (e) {
            console.error('Error procesando caché para movements:', e);
            if (isSubscribed) {
              callback([]);
            }
          }
          
          // Retry connection if it's a connection error and we haven't exceeded max retries
          const isConnectionError = 
            error.code === 'unavailable' || 
            error.code === 'deadline-exceeded' ||
            error.code === 'network-request-failed' ||
            error.message.includes('network') ||
            error.message.includes('connection');
          
          if (isConnectionError && retryCount < MAX_RETRIES && isSubscribed) {
            const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
            retryCount++;
            console.log(`Reintentando suscripción a movements en ${delayMs}ms (intento ${retryCount}/${MAX_RETRIES})`);
            
            setTimeout(() => {
              if (isSubscribed) {
                console.log(`Ejecutando reintento ${retryCount} para movements`);
                unsubscribe(); // Limpiar suscripción actual
                setupSubscription(); // Configurar nueva suscripción
              }
            }, delayMs);
          }
        }
      );
      
      // Devolver función para cancelar suscripción
      return () => {
        isSubscribed = false;
        console.log('Cancelando suscripción a movements');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error configurando suscripción a movements:', error);
      
      // Intentar usar datos en caché como último recurso
      try {
        const cacheKey = userId ? `movements_${userId}` : 'movements_all';
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData && isSubscribed) {
          console.log('Usando caché como último recurso para movements');
          callback(JSON.parse(cachedData));
        } else if (isSubscribed) {
          callback([]);
        }
      } catch (e) {
        console.error('Error usando caché como último recurso para movements:', e);
        if (isSubscribed) {
          callback([]);
        }
      }
      
      // Retry setup if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES && isSubscribed) {
        const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        retryCount++;
        console.log(`Reintentando configuración para movements en ${delayMs}ms (intento ${retryCount}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          if (isSubscribed) {
            setupSubscription();
          }
        }, delayMs);
      }
      
      // Return a dummy unsubscribe function
      return () => {
        isSubscribed = false;
        console.log('Cancelando suscripción a movements (tras error)');
      };
    }
  };
  
  // Start the subscription process
  return setupSubscription();
};

// File Storage
export const uploadFileToStorage = async (file, path) => {
  try {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to upload file");
  }
};

export const getFileURL = async (path) => {
  try {
    const fileRef = storageRef(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    throw handleFirebaseError(error, "Failed to get file URL");
  }
};

export const pushToRealTimeList = async (path, data) => {
  try {
    const listRef = ref(rtdb, path);
    const newItemRef = push(listRef);
    await set(newItemRef, {
      ...data,
      timestamp: Date.now()
    });
    return newItemRef.key;
  } catch (error) {
    throw error;
  }
};