import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import app from '../firebase';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth(app);

  // ใช้อีเมลของผู้ใช้ที่ล็อกอินอยู่ (ถ้ามี)
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      // ส่ง email reset password
      await sendPasswordResetEmail(auth, email);
      
      // ถ้าส่งลิงก์สำเร็จและผู้ใช้กำลังล็อกอินอยู่
      if (currentUser) {
        try {
          console.log("Attempting to sign out user");
          
          // เปลี่ยนเป็นแสดง alert แทนการ set message
          alert('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมลและเข้าสู่ระบบใหม่อีกครั้ง');
          
          // ออกจากระบบหลังจากแสดง alert แล้ว
          await signOut(auth);
          console.log("User signed out successfully");
          
          // นำทางไปหน้า login
          navigate('/login');
          
        } catch (logoutError) {
          console.error("Error signing out:", logoutError);
          alert('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว แต่ไม่สามารถออกจากระบบได้โดยอัตโนมัติ');
        }
      } else {
        // กรณีไม่ได้ล็อกอินอยู่
        alert('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล');
        setMessage(''); // ล้าง message เพราะใช้ alert แทน
      }
    } catch (error) {
      console.error('Reset password error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('ไม่พบอีเมลนี้ในระบบ');
          break;
        case 'auth/invalid-email':
          setError('รูปแบบอีเมลไม่ถูกต้อง');
          break;
        case 'auth/too-many-requests':
          setError('คุณส่งคำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณาลองใหม่ในภายหลัง');
          break;
        default:
          setError('เกิดข้อผิดพลาดในการส่งอีเมล: ' + error.message);
      }
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
              <h3 className="text-center mb-3">ลืมรหัสผ่าน</h3>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              {message && <div className="alert alert-success py-2">{message}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">อีเมล</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    readOnly={currentUser} // ถ้าล็อกอินแล้ว ไม่ให้แก้ไขอีเมล
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  ส่งลิงก์รีเซ็ตรหัสผ่าน
                </button>
                <div className="text-center">
                  {!currentUser ? (
                    <Link to="/login" className="text-decoration-none">กลับไปหน้าเข้าสู่ระบบ</Link>
                  ) : (
                    <Link to="/" className="text-decoration-none">กลับไปหน้าหลัก</Link>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
