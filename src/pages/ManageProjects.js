import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../firebase';

function ManageProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  // สร้างฟังก์ชันคำนวณปีงบประมาณ
  const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็นพ.ศ.
    const currentMonth = new Date().getMonth() + 1; // เดือนปัจจุบัน (1-12)
    
    // ถ้าเดือนปัจจุบันมากกว่าหรือเท่ากับตุลาคม ให้เพิ่มปีงบประมาณถัดไป
    const startYear = currentMonth >= 10 ? currentYear : currentYear - 1;
    
    // สร้างอาเรย์ปีงบประมาณย้อนหลัง 2 ปี และปีถัดไป 1 ปี
    return [
      (startYear - 2).toString(),
      (startYear - 1).toString(),
      startYear.toString(),
      (startYear + 1).toString()
    ];
  };

  const [selectedYear, setSelectedYear] = useState(() => {
    const fiscalYears = generateFiscalYears();
    return fiscalYears[2]; // เลือกปีปัจจุบันเป็นค่าเริ่มต้น
  });
  
  const years = generateFiscalYears();
  const db = getFirestore(app);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, selectedYear);
        const snapshot = await getDocs(projectsRef);
        const projectsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [currentUser, navigate, db, selectedYear]);

  if (!currentUser) return null;

  return (
    <div className="container mt-5 pt-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>การจัดการโครงการ</h2>
            <Link to="/manage-projects/create" className="btn btn-primary">
              เพิ่มโครงการใหม่
            </Link>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">ปีงบประมาณ</label>
                <select 
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="row">
              {projects.map(project => (
                <div key={project.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">{project.name}</h5>
                      <p className="card-text">{project.description}</p>
                      <p className="card-text">
                        <small className="text-muted">
                          พิกัด: {project.location.lat}, {project.location.lng}
                        </small>
                      </p>
                    </div>
                    <div className="card-footer bg-transparent">
                      <Link 
                        to={`/manage-projects/edit/${project.id}`} 
                        className="btn btn-outline-primary btn-sm"
                      >
                        แก้ไข
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info">
              ไม่พบโครงการในปีงบประมาณ {selectedYear}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageProjects;
