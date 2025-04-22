// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Initialize Authentication
export const auth = getAuth(app);

export default app;