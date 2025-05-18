// Servicio para manejar operaciones con Firebase
import { db, auth, rtdb, storage, withTimeout } from './firebase';
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
  disableNetwork
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
  goOnline
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Error handling utility
const handleFirebaseError = (error, customMessage = "Firebase operation failed") => {
  console.error(`${customMessage}:`, error);
  
  // Intentar guardar el error para análisis
  try {
    const errorsLog = JSON.parse(localStorage.getItem('firebase_errors') || '[]');
    errorsLog.push({
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      code: error.code || 'unknown',
      custom: customMessage
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
    friendly: errorCode === 'permission-denied' 
      ? 'No tienes permiso para realizar esta acción. Por favor verifica tu cuenta.'
      : 'Hubo un problema conectando al servicio. Por favor intenta más tarde.'
  };
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
    const movementsRef = collection(db, "movements");
    const docRef = await addDoc(movementsRef, {
      ...movementData,
      timestamp: serverTimestamp()
    });
    
    // Also save to real-time database for instant sync
    await saveRealTimeData(`movements/${docRef.id}`, {
      ...movementData,
      id: docRef.id,
      timestamp: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to add movement");
  }
};

export const getMovements = async (userId) => {
  try {
    const movementsRef = collection(db, "movements");
    const q = query(movementsRef, where("user", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const movements = [];
    querySnapshot.forEach((doc) => {
      movements.push({ id: doc.id, ...doc.data() });
    });
    
    return movements;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to get movements");
  }
};

export const updateMovement = async (movementId, data) => {
  try {
    const movementRef = doc(db, "movements", movementId);
    await updateDoc(movementRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    // Update real-time database for instant sync
    await updateRealTimeData(`movements/${movementId}`, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to update movement");
  }
};

export const deleteMovement = async (movementId) => {
  try {
    const movementRef = doc(db, "movements", movementId);
    await deleteDoc(movementRef);
    
    // Remove from real-time database
    await removeRealTimeData(`movements/${movementId}`);
    
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to delete movement");
  }
};

// Real-time Database Operations
export const saveRealTimeData = async (path, data) => {
  try {
    const dbRef = ref(rtdb, path);
    await set(dbRef, data);
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to save real-time data");
  }
};

export const updateRealTimeData = async (path, data) => {
  try {
    const dbRef = ref(rtdb, path);
    await update(dbRef, data);
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to update real-time data");
  }
};

export const removeRealTimeData = async (path) => {
  try {
    const dbRef = ref(rtdb, path);
    await remove(dbRef);
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to remove real-time data");
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
  
  // Recuperar datos en caché inmediatamente si están disponibles
  try {
    const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const data = JSON.parse(cachedData);
      console.log(`Usando datos en caché para ${path}`, data);
      // Llamar al callback con los datos en caché mientras se configura la suscripción real
      setTimeout(() => callback(data), 0);
    }
  } catch (e) {
    console.warn(`Error recuperando datos en caché para ${path}:`, e);
  }
  
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
        if (cachedData) {
          console.log(`Fallback a datos en caché para ${path} debido a error:`, error.code);
          callback(JSON.parse(cachedData));
          return;
        }
      } catch (e) {
        console.warn(`Error procesando caché para ${path}:`, e);
      }
      
      // Si no hay caché, devolver un objeto vacío
      callback({});
    };
    
    // Configuración de la suscripción con manejo de errores
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        let data = null;
        
        if (snapshot.exists()) {
          data = snapshot.val();
          console.log(`Datos recibidos para ${path}`, data);
          
          // Guardar en caché
          try {
            const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {
            console.warn(`Error guardando en caché para ${path}:`, e);
          }
        } else {
          console.log(`No hay datos para ${path}`);
          data = null;
        }
        
        // Solo notificar cambios para evitar múltiples renders
        if (initialLoadComplete) {
          console.log(`Notificando cambios para ${path}`);
        } else {
          console.log(`Carga inicial completada para ${path}`);
          initialLoadComplete = true;
        }
        
        callback(data);
      },
      errorHandler
    );
    
    // Devolver función para cancelar suscripción
    return () => {
      console.log(`Cancelando suscripción a ${path}`);
      unsubscribe();
    };
  } catch (error) {
    console.error(`Error configurando suscripción a ${path}:`, error);
    
    // Intentar usar datos en caché como último recurso
    try {
      const cacheKey = `rtdb_${path.replace(/\//g, '_')}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.log(`Usando caché como último recurso para ${path}`);
        callback(JSON.parse(cachedData));
      } else {
        callback(null);
      }
    } catch (e) {
      console.error(`Error usando caché como último recurso para ${path}:`, e);
      callback(null);
    }
    
    // Devolver función vacía para evitar errores
    return () => {};
  }
};

export const subscribeToMovements = (callback, userId = null) => {
  console.log('Configurando suscripción a movements con userId:', userId);
  
  // Intentar recuperar datos en caché primero
  try {
    const cacheKey = userId ? `movements_${userId}` : 'movements_all';
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const movements = JSON.parse(cachedData);
      console.log('Usando datos en caché para movements:', movements.length);
      // Llamar al callback con datos en caché mientras se configura la suscripción real
      setTimeout(() => callback(movements), 0);
    }
  } catch (e) {
    console.warn('Error recuperando datos en caché para movements:', e);
  }
  
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
        if (initialLoadComplete) {
          console.log('Notificando cambios en movements');
        } else {
          console.log('Carga inicial de movements completada');
          initialLoadComplete = true;
        }
        
        callback(movements);
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
          if (cachedData) {
            console.log('Fallback a datos en caché para movements debido a error:', error.code);
            callback(JSON.parse(cachedData));
          } else {
            console.log('No hay datos en caché para movements, devolviendo array vacío');
            callback([]);
          }
        } catch (e) {
          console.error('Error procesando caché para movements:', e);
          callback([]);
        }
      }
    );
    
    // Devolver función para cancelar suscripción
    return () => {
      console.log('Cancelando suscripción a movements');
      unsubscribe();
    };
  } catch (error) {
    console.error('Error configurando suscripción a movements:', error);
    
    // Intentar usar datos en caché como último recurso
    try {
      const cacheKey = userId ? `movements_${userId}` : 'movements_all';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('Usando caché como último recurso para movements');
        callback(JSON.parse(cachedData));
      } else {
        callback([]);
      }
    } catch (e) {
      console.error('Error usando caché como último recurso para movements:', e);
      callback([]);
    }
    
    // Devolver función vacía para evitar errores
    return () => {};
  }
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