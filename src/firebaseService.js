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
  serverTimestamp 
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
  remove
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Autenticación de usuarios
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Real-time database operations for syncing between users
export const uploadFileToStorage = async (file, path) => {
  try {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

export const saveRealTimeData = async (path, data) => {
  try {
    const dataRef = ref(rtdb, path);
    await set(dataRef, {
      ...data,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

export const updateRealTimeData = async (path, data) => {
  try {
    const dataRef = ref(rtdb, path);
    await update(dataRef, {
      ...data,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    throw error;
  }
};

export const subscribeToRealTimeData = (path, callback) => {
  const dataRef = ref(rtdb, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return unsubscribe;
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

export const removeFromRealTimeData = async (path) => {
  try {
    const dataRef = ref(rtdb, path);
    await remove(dataRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// Operaciones con la base de datos
export const addMovement = async (movementData) => {
  try {
    const docRef = await addDoc(collection(db, "movements"), {
      ...movementData,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateMovement = async (movementId, movementData) => {
  try {
    const docRef = doc(db, "movements", movementId);
    await updateDoc(docRef, movementData);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteMovement = async (movementId) => {
  try {
    const docRef = doc(db, "movements", movementId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    throw error;
  }
};

export const getMovements = async (userId = null) => {
  try {
    let q;
    if (userId) {
      q = query(collection(db, "movements"), where("user", "==", userId));
    } else {
      q = collection(db, "movements");
    }
    
    const querySnapshot = await getDocs(q);
    const movements = [];
    
    querySnapshot.forEach((doc) => {
      movements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return movements;
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

// Usuarios
export const addUserProfile = async (userId, profileData) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      userId,
      ...profileData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const q = query(collection(db, "users"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};