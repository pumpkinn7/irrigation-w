import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import app from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ตรวจสอบว่าอีเมลถูกยืนยันหรือไม่
        if (!user.emailVerified) {
          // ถ้าอีเมลยังไม่ถูกยืนยัน ให้ลงชื่อออก
          console.log('Email not verified, signing out');
          await signOut(auth);
          setCurrentUser(null);
        } else {
          // ดึงข้อมูลเพิ่มเติมจาก Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setCurrentUser({
                ...user,
                ...userDoc.data()
              });
            } else {
              setCurrentUser(user);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('user'); // ลบข้อมูลล็อกอินใน localStorage
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]); // เพิ่ม dependencies

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const updateUserStatus = async (uid) => {
    const userDoc = await getDoc(doc(getFirestore(app), 'users', uid));
    if (userDoc.exists() && userDoc.data().status === 'pending') {
      await updateDoc(doc(getFirestore(app), 'users', uid), {
        status: 'active'
      });
    }
  };

  useEffect(() => {
    const userEmailVerified = context.currentUser?.emailVerified;
    const userId = context.currentUser?.uid;
    
    if (userEmailVerified) {
      updateUserStatus(userId);
    }
  }, [context.currentUser]); // ใช้ context.currentUser เป็น dependency เดียว

  return context;
}
