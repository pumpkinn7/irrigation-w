import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import app from '../firebase';

function EmailVerification() {
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    // โหลดอีเมลจาก localStorage ถ้ามี
    const savedEmail = localStorage.getItem('verificationEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (showPasswordInput && !password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    
    try {
      if (!showPasswordInput) {
        setShowPasswordInput(true);
        return;
      }
      
      // ล็อกอินชั่วคราวเพื่อส่งอีเมลยืนยัน
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      
      setSuccess('ส่งลิงก์ยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมลของคุณ');
      setError('');
      setCountdown(60);
      setShowPasswordInput(false);
      
    } catch (error) {
      console.error("Error resending verification email:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่ภายหลัง');
      }
    }
  };

  return (
    <div className="container" style={{ marginTop: "100px" }}>
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4 text-center">
              <h3 className="mb-4">ยืนยันอีเมลของคุณ</h3>
              <p>เราได้ส่งลิงก์ยืนยันไปยัง <strong>{email}</strong></p>
              <p>กรุณาตรวจสอบอีเมลและคลิกลิงก์เพื่อยืนยันตัวตน</p>
              
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
              {success && <div className="alert alert-success py-2 mb-3">{success}</div>}
              
              {showPasswordInput && (
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="กรอกรหัสผ่านของคุณ"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
              
              <div className="mt-4">
                <Link to="/login" className="btn btn-primary me-2">กลับไปหน้าเข้าสู่ระบบ</Link>
                <button 
                  className="btn btn-link text-decoration-none"
                  onClick={handleResendEmail}
                  disabled={countdown > 0 && !showPasswordInput}
                >
                  {showPasswordInput 
                    ? 'ส่งลิงก์ยืนยัน' 
                    : countdown > 0 
                      ? `ส่งอีกครั้ง (${countdown}s)` 
                      : 'ส่งอีกครั้ง'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;
