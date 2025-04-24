import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import app from '../firebase';

function Navbar() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore(app);

  // ดึงข้อมูลผู้ใช้เพิ่มเติมเมื่อ currentUser เปลี่ยน
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && currentUser.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
    };

    fetchUserData();
  }, [currentUser, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบ dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          โครงการชลประทาน
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/projects">หน่วยงานที่เกี่ยวข้อง</Link>
            </li>
            {currentUser && (
              <li className="nav-item">
                <Link className="nav-link" to="/manage-projects">การจัดการโครงการ</Link>
              </li>
            )}
            <li className="nav-item">
              <Link className="nav-link" to="/contact">ติดต่อ</Link>
            </li>
            
            {currentUser ? (
              <>
                <li className="nav-item">
                  <span className="nav-link d-flex align-items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      fill="currentColor" 
                      className="bi bi-person-circle me-2 flex-shrink-0" 
                      viewBox="0 0 16 16"
                      style={{ minWidth: '24px' }}
                    >
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                      <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                    </svg>
                    <span className="text-truncate" style={{ maxWidth: '150px' }}>
                      {userData?.firstName} {userData?.lastName}
                    </span>
                  </span>
                </li>
                <li className="nav-item dropdown">
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#!" // เปลี่ยนจาก # เป็น #!
                    id="navbarDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    บัญชีฉัน
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li className="dropdown-item">
                      <small className="text-muted">อีเมล</small>
                      <div>{currentUser.email}</div>
                    </li>
                    <li className="dropdown-item">
                      <small className="text-muted">วันที่เข้าร่วม</small>
                      <div>{userData ? formatDate(userData.createdAt) : ''}</div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link className="dropdown-item" to="/forgot-password">ลืมรหัสผ่าน</Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={handleLogout}
                      >
                        ออกจากระบบ
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">เข้าสู่ระบบ</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
