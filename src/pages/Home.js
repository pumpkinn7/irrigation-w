import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';
import { departments } from '../utils/constants';
import MapOverview from '../components/MapOverview';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const years = generateYearRange();
  const db = getFirestore(app);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [projectDetail, setProjectDetail] = useState(null);
  const [editorInfo, setEditorInfo] = useState(null);

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
  }, [db, selectedYear]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // เปลี่ยนเป็นการรีเซ็ตหน่วยงานเมื่อเปลี่ยนปี
  useEffect(() => {
    setSelectedDepartment('');
  }, [selectedYear]);

  const handleSearch = (e) => {
    e.preventDefault();
    // ตัวกรองข้อมูลจะทำในการแสดงผลไม่ต้อง query ใหม่
  };

  // ปรับปรุงการกรองข้อมูลให้รองรับทั้งชื่อโครงการและหน่วยงาน
  const filteredProjects = projects.filter(project => {
    // กรองตามการค้นหาชื่องาน
    const nameMatch = project.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามหน่วยงาน
    const departmentMatch = !selectedDepartment || project.department === selectedDepartment;
    
    return nameMatch && departmentMatch;
  });

  const handleMarkerClick = (project) => {
    setSelectedProject(project);
  };

  // เพิ่มฟังก์ชันเปิด modal รายละเอียด
  const handleShowDetail = async (project, e) => {
    e.stopPropagation();
    setProjectDetail(project);
    setShowDetailModal(true);
    
    if (project.updatedBy) {
      try {
        const userDoc = await getDoc(doc(db, 'users', project.updatedBy));
        if (userDoc.exists()) {
          setEditorInfo(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching editor info:", error);
      }
    } else {
      setEditorInfo(null);
    }
  };

  return (
    <div className="container mt-5 pt-5 pb-4">
      <div className="row justify-content-center g-3">
        {/* ส่วนด้านซ้าย - การค้นหาและรายการโครงการ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h4 className="mb-3">งานชลประทานปี {selectedYear}</h4>
              
              <form onSubmit={handleSearch} className="mb-3">
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="ค้นหางาน..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-info" type="submit">ค้นหา</button>
                </div>
              </form>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
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
                
                <div className="col-md-6">
                  <label className="form-label">หน่วยงานดำเนินการ</label>
                  <select
                    className="form-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">หน่วยงานทั้งหมด</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

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
                    พบงานทั้งหมด {filteredProjects.length} รายการ
                  </h5>
                  
                  {/* ตารางแสดงงาน */}
                  <div 
                    className="table-responsive flex-grow-1" 
                    style={{ 
                      height: "280px",
                      maxHeight: "280px",
                      overflowY: 'auto',
                      border: filteredProjects.length === 0 ? '1px solid #dee2e6' : 'none',
                      marginBottom: "10px"
                    }}
                  >
                    {filteredProjects.length > 0 ? (
                      <table className="table table-hover table-striped mb-0">
                        <thead className="table-light sticky-top" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th scope="col" width="70%">ชื่องาน</th>
                            <th scope="col" width="30%" className="text-center"></th>
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
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={(e) => handleShowDetail(project, e)}
                                >
                                  ข้อมูล
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <p className="text-muted">ไม่มีรายการงานที่แสดงในขณะนี้</p>
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

      {/* Modal แสดงรายละเอียดโครงการ */}
      {showDetailModal && projectDetail && (
        <>
          <div 
            className="modal fade show" 
            tabIndex="-1" 
            role="dialog" 
            aria-labelledby="detailModalLabel" 
            aria-hidden="false" 
            style={{ display: 'block' }}
            onClick={() => setShowDetailModal(false)}
          >
            <div 
              className="modal-dialog modal-dialog-centered" 
              role="document"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="detailModalLabel">รายละเอียดงาน</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDetailModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <h5 className="mb-3">{projectDetail.name}</h5>
                  <p><strong>ปีงบประมาณ:</strong> {projectDetail.year || selectedYear}</p>
                  <p><strong>หน่วยงานดำเนินการ:</strong> {projectDetail.department}</p>
                  {projectDetail.location?.address && (
                    <p><strong>ที่อยู่:</strong> {projectDetail.location.address}</p>
                  )}
                  
                  {projectDetail.files && projectDetail.files.length > 0 && (
                    <>
                      <h6 className="mt-3 mb-2">เอกสารแนบ</h6>
                      <ul className="list-group mb-3">
                        {projectDetail.files.map((file, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <i className="bi bi-file-earmark me-2"></i>
                              {file.name}
                            </div>
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                เปิดไฟล์
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <div className="mt-3">
                    <p><strong>วันที่สร้าง:</strong> {new Date(projectDetail.createdAt).toLocaleDateString('th-TH')}</p>
                    {projectDetail.updatedAt && (
                      <p><strong>แก้ไขล่าสุด:</strong> {new Date(projectDetail.updatedAt).toLocaleDateString('th-TH')}</p>
                    )}
                    {projectDetail.updatedBy && (
                      <p><strong>แก้ไขโดย:</strong> {editorInfo ? `${editorInfo.firstName} ${editorInfo.lastName}` : 'ไม่ระบุชื่อผู้แก้ไข'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default Home;
