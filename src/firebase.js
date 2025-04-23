// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// ลบการ import getAnalytics เนื่องจากไม่ได้ใช้
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCFee4IXyGOptIyQuyQKVooJV5j1hE-LA",
  authDomain: "irrigation-b91d8.firebaseapp.com",
  databaseURL: "https://irrigation-b91d8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "irrigation-b91d8",
  storageBucket: "irrigation-b91d8.firebasestorage.app",
  messagingSenderId: "746219506356",
  appId: "1:746219506356:web:a38a9255bd4185b651e5e1",
  measurementId: "G-3YVDPPWKT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

// debug for storage
console.log("Firebase Storage initialized:", storage ? "Yes" : "No");

export default app;