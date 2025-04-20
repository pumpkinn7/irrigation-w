import React, { useEffect, useState } from 'react';
import { db, rtdb } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

function App() {
  const [status, setStatus] = useState({ firestore: '', realtime: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        // ทดสอบ Firestore
        const testDoc = await addDoc(collection(db, 'test'), {
          message: 'Hello from Firestore!',
          timestamp: new Date()
        });
        setStatus(prev => ({ ...prev, firestore: 'เชื่อมต่อสำเร็จ! Document ID: ' + testDoc.id }));

        // ทดสอบ Realtime Database
        const testRef = ref(rtdb, 'test');
        await set(testRef, {
          message: 'Hello from Realtime Database!',
          timestamp: new Date().toISOString()
        });
        setStatus(prev => ({ ...prev, realtime: 'เชื่อมต่อสำเร็จ!' }));

      } catch (err) {
        console.error('เกิดข้อผิดพลาด:', err);
        setError(err.message);
      }
    };

    testFirebaseConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ทดสอบการเชื่อมต่อ Firebase</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Firestore:</h2>
        <p style={{ color: status.firestore ? 'green' : 'gray' }}>
          {status.firestore || 'กำลังทดสอบ...'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Realtime Database:</h2>
        <p style={{ color: status.realtime ? 'green' : 'gray' }}>
          {status.realtime || 'กำลังทดสอบ...'}
        </p>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h2>เกิดข้อผิดพลาด:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
