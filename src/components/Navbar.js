import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
            <li className="nav-item">
              <Link className="nav-link" to="/contact">ติดต่อ</Link>
            </li>
            {currentUser ? (
              <>
                <li className="nav-item">
                  <div className="d-flex align-items-center nav-link">
                    <div className="me-2">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="22" 
                        height="22" 
                        fill="currentColor" 
                        className="bi bi-person-circle" 
                        viewBox="0 0 16 16"
                        style={{ marginTop: '-2px' }}
                      >
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                      </svg>
                    </div>
                    <span className="me-3">{currentUser.firstName} {currentUser.lastName}</span>
                    <button 
                      onClick={handleLogout}
                      className="nav-link text-danger border-0 bg-transparent p-0"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
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
