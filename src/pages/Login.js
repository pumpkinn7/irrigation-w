import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import app from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [needVerification, setNeedVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('verificationEmail');
    if (savedEmail) {
      setVerificationEmail(savedEmail);
    }
  }, []);

  const handleResendVerification = async () => {
    try {
      const emailToUse = verificationEmail || email;
      
      if (!emailToUse) {
        alert('กรุณากรอกอีเมลก่อนกดส่งอีกครั้ง');
        return;
      }
      
      try {
        if (!password) {
          alert('กรุณากรอกรหัสผ่านด้วย');
          return;
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        
        setCountdown(60);
        setNeedVerification(true);
        alert(`ส่งลิงก์ยืนยันไปยัง ${emailToUse} แล้ว`);
      } catch (loginError) {
        console.error('Login error:', loginError);
        alert('ไม่สามารถล็อกอินเพื่อส่งอีเมลได้: ' + loginError.message);
        return;
      }
      
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('ไม่สามารถส่งอีเมลได้: ' + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.clear();
    console.log('Login attempt started with:', email);
    
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // ขั้นตอน 1: ลอง login
      console.log('Step 1: Attempting sign in');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful', userCredential.user.uid);

      // ขั้นตอน 2: ตรวจสอบการยืนยันอีเมล
      console.log('Step 2: Checking email verification');
      if (!userCredential.user.emailVerified) {
        console.log('Email not verified');
        localStorage.setItem('verificationEmail', email);
        setVerificationEmail(email);
        await signOut(auth);
        setNeedVerification(true);
        setLoading(false);
        return;
      }
      
      // ขั้นตอน 3: อัปเดตข้อมูลผู้ใช้ใน Firestore
      console.log('Step 3: Updating user data in Firestore');
      try {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // อัปเดต status เป็น active และ lastLogin
          await updateDoc(userDocRef, {
            status: 'active',
            lastLogin: new Date().toISOString()
          });
          console.log('User data updated successfully');
        } else {
          // กรณีไม่พบข้อมูลผู้ใช้ใน Firestore
          console.log('User document not found in Firestore');
        }
      } catch (firestoreError) {
        console.error('Error updating user data:', firestoreError);
        // ไม่ต้อง return เพื่อให้ล็อกอินได้แม้อัปเดตข้อมูลไม่สำเร็จ
      }
      
      // ขั้นตอน 4: เก็บข้อมูลผู้ใช้ใน localStorage เพื่อรักษาสถานะล็อกอิน
      console.log('Step 4: Storing user session');
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        isLoggedIn: true
      }));
      
      // ขั้นตอน 5: นำทางไปยังหน้าแรก
      console.log('Login successful, navigating to home page');
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      setNeedVerification(false);
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 pt-4 pb-4">
      <div className="row justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-3">เข้าสู่ระบบ</h3>
              
              {needVerification && (
                <div className="alert alert-warning py-2 mb-3">
                  <div className="mb-1">กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ</div>
                  <div className="d-flex align-items-center">
                    <small className="text-muted me-2">
                      {countdown > 0 
                        ? `(รอ ${countdown} วินาที)` 
                        : 'ไม่ได้รับอีเมล?'}
                    </small>
                    {countdown === 0 && (
                      <button 
                        type="button"
                        onClick={handleResendVerification}
                        className="btn btn-link p-0 text-decoration-underline"
                        style={{ fontSize: '0.875rem' }}
                      >
                        ส่งอีกครั้ง
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
              
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">อีเมล</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">รหัสผ่าน</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <i className="bi bi-eye-slash"></i>
                      ) : (
                        <i className="bi bi-eye"></i>
                      )}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
                <div className="text-center">
                  <div className="d-flex justify-content-end mb-2">
                    <Link to="/forgot-password" className="text-decoration-none">ลืมรหัสผ่าน?</Link>
                  </div>
                  <span>ยังไม่มีบัญชี? <Link to="/register" className="text-info text-decoration-none">สมัครสมาชิก</Link></span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
