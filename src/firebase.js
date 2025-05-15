import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBA4QTs5nHNMW1xR3TYREwqp0GEg8mOE8w",
  authDomain: "hubby-wifey-finances.firebaseapp.com",
  projectId: "hubby-wifey-finances",
  storageBucket: "hubby-wifey-finances.firebasestorage.app",
  messagingSenderId: "769290841190",
  appId: "1:769290841190:web:0d8bd2508c324bf60e11a7",
  measurementId: "G-H5N360C8TY"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);