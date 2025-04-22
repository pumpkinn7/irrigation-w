import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

function Register() {
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const VALID_INVITE_CODE = 'Sm7Tggi303xgsNa';
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleGoogleSignUp = async () => {
    if (!inviteCode || !firstName || !lastName) {
      return setError('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    if (inviteCode !== VALID_INVITE_CODE) {
      return setError('รหัสเชิญไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
    }

    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // ตรวจสอบว่าผู้ใช้มีข้อมูลอยู่แล้วหรือไม่
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        setError('บัญชีนี้เคยลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ');
        return;
      }

      // บันทึกข้อมูลผู้ใช้เพิ่มเติมใน Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      navigate('/');
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="container mt-4 pt-4 pb-4">
        <div className="row justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <h3 className="text-center mb-3">สมัครสมาชิก</h3>
                
                <div className="alert alert-warning py-2 mb-3">
                  <i className="bi bi-info-circle"></i>
                  ใช้งานภายในองค์กรเท่านั้น กรุณาใช้รหัสเชิญจากผู้ดูแลระบบ
                </div>
                
                {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
                
                <div className="mb-3">
                  <label htmlFor="inviteCode" className="form-label mb-1">รหัสเชิญ <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="inviteCode" 
                    placeholder="กรอกรหัสเชิญ"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6 mb-2 mb-md-0">
                    <label htmlFor="firstName" className="form-label mb-1">ชื่อ <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="firstName" 
                      placeholder="กรอกชื่อ"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="lastName" className="form-label mb-1">นามสกุล <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="lastName" 
                      placeholder="กรอกนามสกุล"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleGoogleSignUp}
                  disabled={loading || !inviteCode || !firstName || !lastName}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                    <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                  </svg>
                  {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกด้วย Google'}
                </button>
                
                <div className="text-center mt-2">
                  <p className="mb-0">มีบัญชีแล้ว? <Link to="/login" className="text-info text-decoration-none">เข้าสู่ระบบ</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
