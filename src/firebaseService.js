// Servicio para manejar operaciones con Firebase
import { db, auth, rtdb, storage } from './firebase';
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
  setDoc 
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
  get
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Error handling utility
const handleFirebaseError = (error, customMessage = "Firebase operation failed") => {
  console.error(`${customMessage}:`, error);
  
  // Return more user-friendly error
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'An unknown error occurred';
  
  return {
    code: errorCode,
    message: errorMessage,
    friendly: errorCode === 'permission-denied' 
      ? 'You do not have permission to perform this action. Please check your account.'
      : 'There was a problem connecting to the service. Please try again later.'
  };
};

// Auth State Observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// User Authentication
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to register user");
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to login");
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw handleFirebaseError(error, "Failed to logout");
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// User Profile Management
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
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
  try {
    const dbRef = ref(rtdb, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Real-time subscription error:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Failed to subscribe to real-time data:", error);
    return () => {}; // Return empty function to prevent errors
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

export const subscribeToMovements = (callback, userId = null) => {
  let q;
  if (userId) {
    q = query(collection(db, "movements"), where("user", "==", userId));
  } else {
    q = collection(db, "movements");
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const movements = [];
    querySnapshot.forEach((doc) => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(movements);
  });
};