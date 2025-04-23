import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import app from '../firebase';

function Register() {
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const VALID_INVITE_CODE = 'Sm7Tggi303xgsNa';
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!inviteCode || !firstName || !lastName || !email || !password || !confirmPassword) {
      return setError('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    if (password !== confirmPassword) {
      return setError('รหัสผ่านไม่ตรงกัน');
    }

    if (inviteCode !== VALID_INVITE_CODE) {
      return setError('รหัสเชิญไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
    }

    try {
      setError('');
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // ส่งอีเมลยืนยัน
      await sendEmailVerification(userCredential.user);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        role: 'user',
        status: 'pending', // เปลี่ยนสถานะเริ่มต้นเป็น pending
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      await signOut(auth); // ออกจากระบบทันทีหลังสมัคร
      
      // เก็บอีเมลไว้สำหรับหน้า EmailVerification
      localStorage.setItem('verificationEmail', email);
      
      // นำทางไปยังหน้า EmailVerification แทนหน้า Login
      navigate('/email-verification');
    } catch (error) {
      let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'อีเมลนี้มีผู้ใช้งานแล้ว';
          break;
        case 'auth/invalid-email':
          errorMessage = 'อีเมลไม่ถูกต้อง';
          break;
        case 'auth/weak-password':
          errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
          break;
        default:
          errorMessage += ': ' + error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "100px", marginBottom: "40px" }}>
      <div className="row justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-3">สมัครสมาชิก</h3>
              
              <div className="alert alert-warning py-2 mb-3">
                <i className="bi bi-info-circle me-2"></i>
                ใช้งานภายในองค์กรเท่านั้น กรุณาใช้รหัสเชิญจากผู้ดูแลระบบ
              </div>
              
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
              
              <form onSubmit={handleRegister}>
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

                <div className="mb-3">
                  <label htmlFor="email" className="form-label mb-1">อีเมล <span className="text-danger">*</span></label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    placeholder="กรอกอีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label mb-1">รหัสผ่าน <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="form-control" 
                      id="password" 
                      placeholder="กรอกรหัสผ่าน"
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

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label mb-1">ยืนยันรหัสผ่าน <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control" 
                      id="confirmPassword" 
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
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
                  disabled={loading || !inviteCode || !firstName || !lastName || !email || !password || !confirmPassword}
                >
                  {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </button>
                
                <div className="text-center">
                  <p className="mb-0">มีบัญชีแล้ว? <Link to="/login" className="text-info text-decoration-none">เข้าสู่ระบบ</Link></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
