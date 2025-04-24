import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ManageProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // ถ้าไม่ได้ล็อกอิน ให้ redirect ไปหน้า login
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // ถ้าไม่ได้ล็อกอิน จะไม่แสดงเนื้อหา
  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mt-5 pt-5">
      <div className="row">
        <div className="col-12">
          <h2>การจัดการโครงการ</h2>
          <div className="card mt-3">
            <div className="card-body">
              <p>ยินดีต้อนรับสู่หน้าจัดการโครงการ</p>
              {/* เพิ่มเนื้อหาส่วนการจัดการโครงการตรงนี้ */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageProjects;
