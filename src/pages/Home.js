import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import MapOverview from '../components/MapOverview';
import ProjectDetailModal from '../components/ProjectDetailModal';
import app from '../firebase';
import { departments } from '../utils/constants';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';
import '../styles/Layout.css';

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
  // เพิ่ม state สำหรับกรองสถานะการถ่ายโอน
  const [transferStatus, setTransferStatus] = useState('all');

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

  // ปรับปรุงการกรองข้อมูลให้รองรับทั้งชื่อโครงการ, หน่วยงาน และสถานะการถ่ายโอน
  const filteredProjects = projects.filter(project => {
    // กรองตามการค้นหาชื่องาน
    const nameMatch = project.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามหน่วยงาน
    const departmentMatch = !selectedDepartment || project.department === selectedDepartment;
    
    // กรองตามสถานะการถ่ายโอน
    let transferMatch = true;
    if (transferStatus === 'transferred') {
      transferMatch = Boolean(project.transferDate);
    } else if (transferStatus === 'not-transferred') {
      transferMatch = !project.transferDate;
    }
    
    return nameMatch && departmentMatch && transferMatch;
  });

  const handleMarkerClick = (project) => {
    setSelectedProject(project);
  };

  // เพิ่มฟังก์ชันเปิด modal รายละเอียด
  const handleShowDetail = (project, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setProjectDetail(project);
    setShowDetailModal(true);
  };

  return (
    <div className="main-container">
      <div className="content-wrapper">
        <div className="content-inner">
          <div className="row g-4">
            {/* ส่วนด้านซ้าย - การค้นหาและรายการโครงการ */}
            <div className="col-lg-6 col-md-12 pb-2">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h4 className="mb-3">งานชลประทานปี {selectedYear}</h4>
                  
                  <div className="d-flex mb-3 gap-2">
                    <form onSubmit={handleSearch} className="flex-grow-1">
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
                    
                    {/* เพิ่มปุ่มไอคอน filter พร้อม dropdown menu */}
                    <div className="dropdown">
                      <button 
                        className="btn btn-outline-info dropdown-toggle"
                        type="button"
                        id="filterDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        title="กรองสถานะการถ่ายโอน"
                      >
                        <i className="bi bi-funnel-fill"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="filterDropdown">
                        <li>
                          <button 
                            className={`dropdown-item ${transferStatus === 'all' ? 'active' : ''}`} 
                            onClick={() => setTransferStatus('all')}
                          >
                            ทั้งหมด
                          </button>
                        </li>
                        <li>
                          <button 
                            className={`dropdown-item ${transferStatus === 'transferred' ? 'active' : ''}`}
                            onClick={() => setTransferStatus('transferred')}
                          >
                            ถ่ายโอนแล้ว
                          </button>
                        </li>
                        <li>
                          <button 
                            className={`dropdown-item ${transferStatus === 'not-transferred' ? 'active' : ''}`}
                            onClick={() => setTransferStatus('not-transferred')}
                          >
                            ยังไม่ถ่ายโอน
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

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
                                <th scope="col" style={{ width: '15%' }} className="text-center align-middle">ถ่ายโอน</th>
                                <th scope="col" style={{ width: '75%' }} className="align-middle">ชื่องาน</th>
                                <th scope="col" style={{ width: '10%' }} className="text-center align-middle"></th>
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
                                  <td className="text-center">
                                    <span 
                                      className="d-inline-block rounded-circle" 
                                      style={{ 
                                        width: '12px', 
                                        height: '12px', 
                                        backgroundColor: project.transferDate ? '#16C47F' : '#FF9D23' 
                                      }}
                                      title={project.transferDate ? 'ถ่ายโอนแล้ว' : 'ยังไม่ถ่ายโอน'}
                                    ></span>
                                  </td>
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
            <div className="col-lg-6 col-md-12 pb-2">
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
        </div>
      </div>

      {/* ใช้ ProjectDetailModal component แทน */}
      <ProjectDetailModal 
        project={projectDetail}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        year={selectedYear}
      />
    </div>
  );
}

export default Home;