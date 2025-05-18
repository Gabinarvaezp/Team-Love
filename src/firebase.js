// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Tu configuración de Firebase
// Debes reemplazar estos valores con los de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqR8DOBCOsNsiycBvJNWd1JQKu73i7VLU",
  authDomain: "team-love-2dd83.firebaseapp.com",
  projectId: "team-love-2dd83",
  storageBucket: "team-love-2dd83.firebasestorage.app",
  messagingSenderId: "794621460850",
  appId: "1:794621460850:web:bb9ee5132f1aa638ce9deb",
  measurementId: "G-0W56K3B12G",
  databaseURL: "https://team-love-2dd83-default-rtdb.firebaseio.com"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa servicios de Firebase
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, auth, rtdb, storage }; 