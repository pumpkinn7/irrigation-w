import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../firebase';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';
import MapOverview from '../components/MapOverview';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const years = generateYearRange();
  const db = getFirestore(app);
  const [selectedProject, setSelectedProject] = useState(null);

  // ใช้ useCallback เพื่อ memoize ฟังก์ชันและทำให้ dependency array สมบูรณ์
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projectsRef = collection(db, selectedYear);
      const querySnapshot = await getDocs(projectsRef);
      
      const projectsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjects(projectsList);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError('ไม่สามารถโหลดข้อมูลโครงการได้');
    } finally {
      setLoading(false);
    }
  }, [db, selectedYear]); // เพิ่ม dependencies ที่จำเป็น

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // เพิ่ม fetchProjects เป็น dependency

  const handleSearch = (e) => {
    e.preventDefault();
    // ตัวกรองข้อมูลจะทำในการแสดงผลไม่ต้อง query ใหม่
  };

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkerClick = (project) => {
    setSelectedProject(project);
    // อาจมีการเลื่อนไปยังรายการที่เลือกด้วย
  };

  return (
    <div className="container mt-5 pt-4">
      <div className="row justify-content-center g-3">
        {/* ส่วนด้านซ้าย - การค้นหาและรายการโครงการ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h4 className="mb-3">โครงการชลประทานปี {selectedYear}</h4>
              
              <form onSubmit={handleSearch} className="mb-3">
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="ค้นหาโครงการ..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-info" type="submit">ค้นหา</button>
                  
                  <button 
                    className="btn btn-outline-info dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    ปี {selectedYear}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {years.map(year => (
                      <li key={year}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => setSelectedYear(year)}
                        >
                          {year}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </form>

              {loading ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <div className="project-list flex-grow-1 d-flex flex-column">
                  <h5 className="mb-3">
                    {filteredProjects.length > 0 
                      ? `พบโครงการทั้งหมด ${filteredProjects.length} รายการ`
                      : `ไม่พบโครงการในปี ${selectedYear}`
                    }
                  </h5>
                  
                  {/* ตารางแสดงโครงการ - ปรับความสูงให้เหมาะสม */}
                  <div 
                    className="table-responsive flex-grow-1" 
                    style={{ 
                      minHeight: "300px",
                      height: "100%",
                      overflowY: 'auto',
                      border: filteredProjects.length === 0 ? '1px solid #dee2e6' : 'none'
                    }}
                  >
                    {filteredProjects.length > 0 ? (
                      <table className="table table-hover table-striped mb-0">
                        <thead className="table-light sticky-top" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th scope="col" width="70%">ชื่อโครงการ</th>
                            <th scope="col" width="30%">ที่ตั้ง</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProjects.map(project => (
                            <tr
                              key={project.id}
                              className={selectedProject?.id === project.id ? 'table-info' : ''}
                              onClick={() => setSelectedProject(project)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>{project.name}</td>
                              <td>{project.location?.address || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <p className="text-muted">ไม่มีข้อมูลโครงการที่แสดงในขณะนี้</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ส่วนด้านขวา - แผนที่ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            {/* กำหนดความสูงแบบแน่นอนแต่ต่างกันตามขนาดหน้าจอ */}
            <div className="card-body p-0" 
                style={{ 
                  height: "400px", 
                  minHeight: "400px"
                }}>
              <MapOverview 
                projects={filteredProjects} 
                selectedProject={selectedProject}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
