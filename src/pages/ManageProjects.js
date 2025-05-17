import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject, listAll } from 'firebase/storage';
import app from '../firebase';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';
import { departments } from '../utils/constants';
import MapOverview from '../components/MapOverview';

function ManageProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const years = generateYearRange();
  
  const db = getFirestore(app);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // เพิ่ม state สำหรับ modal รายละเอียด
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [projectDetail, setProjectDetail] = useState(null);
  const [editorInfo, setEditorInfo] = useState(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setSelectedDepartment(''); // รีเซ็ตหน่วยงานที่เลือกเมื่อเปลี่ยนปี
    const fetchProjects = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser, navigate, db, selectedYear]);

  if (!currentUser) return null;

  // ฟังก์ชันเตรียมลบโครงการ (แสดง Modal ยืนยัน)
  const prepareDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  // ฟังก์ชันลบไฟล์ทั้งหมดที่เกี่ยวข้องกับโครงการจาก Storage
  const deleteProjectFiles = async (projectId, year) => {
    try {
      const storage = getStorage(app);
      const folderRef = ref(storage, `projects/${year}/${projectId}`);
      
      // ดึงรายการไฟล์ทั้งหมดในโฟลเดอร์
      const fileList = await listAll(folderRef);
      
      // ลบไฟล์ทีละไฟล์
      const deletePromises = fileList.items.map(fileRef => deleteObject(fileRef));
      await Promise.all(deletePromises);
      
      console.log(`All files in projects/${year}/${projectId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting files from storage:", error);
      // ไม่ throw error เพื่อให้สามารถลบข้อมูลโครงการได้แม้ลบไฟล์ไม่สำเร็จ
    }
  };

  // ฟังก์ชันลบโครงการและไฟล์ที่เกี่ยวข้อง
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      // ลบไฟล์ที่เกี่ยวข้องจาก Storage
      if (projectToDelete.files && projectToDelete.files.length > 0) {
        // ลบทีละไฟล์ตามพาธที่เก็บใน files array
        const storage = getStorage(app);
        const deletePromises = projectToDelete.files.map(file => {
          if (file.path) {
            const fileRef = ref(storage, file.path);
            return deleteObject(fileRef).catch(err => {
              console.error(`Error deleting file ${file.path}:`, err);
              return Promise.resolve(); // ไม่ให้ Promise.all ล้มเหลว
            });
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      
      // ลบทั้งโฟลเดอร์เพื่อให้แน่ใจว่าไม่มีไฟล์ตกค้าง
      try {
        await deleteProjectFiles(projectToDelete.id, projectToDelete.year || selectedYear);
      } catch (error) {
        console.error("Error deleting folder:", error);
        // ยังคงดำเนินการลบข้อมูลโครงการต่อไป
      }
      
      // ลบข้อมูลโครงการจาก Firestore
      await deleteDoc(doc(db, projectToDelete.year || selectedYear, projectToDelete.id));
      
      // อัพเดตรายการโครงการ
      setProjects(projects.filter(project => project.id !== projectToDelete.id));
      
      // ปิด Modal
      setShowDeleteModal(false);
      setProjectToDelete(null);
      
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("เกิดข้อผิดพลาดในการลบโครงการ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  // ฟังก์ชันเปิด modal รายละเอียดและดึงข้อมูลผู้แก้ไข
  const handleShowDetail = async (project, e) => {
    e.stopPropagation(); // ป้องกันการ trigger event ของแถว
    setProjectDetail(project);
    setShowDetailModal(true);
    
    // ดึงข้อมูลผู้แก้ไข
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

  // กรองโครงการตามหน่วยงานที่เลือก
  const filteredProjects = selectedDepartment
    ? projects.filter(project => project.department === selectedDepartment)
    : [];

  return (
    <div className="container mt-5 pt-5 pb-4">
      <div className="row justify-content-center g-3">
        {/* ส่วนซ้าย - รายการโครงการ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>จัดการโครงการ</h2>
                <Link 
                  to={`/manage-projects/create?year=${selectedYear}${selectedDepartment ? `&department=${encodeURIComponent(selectedDepartment)}` : ''}`} 
                  className="btn btn-primary"
                >
                  เพิ่มโครงการ
                </Link>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">ปีงบประมาณ</label>
                  <select 
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedDepartment(''); // รีเซ็ตหน่วยงานเมื่อเปลี่ยนปี
                    }}
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
                    <option value="">เลือกหน่วยงาน</option>
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
              ) : selectedDepartment ? (
                filteredProjects.length > 0 ? (
                  <div className="table-responsive flex-grow-1" style={{ 
                    height: "280px", 
                    maxHeight: "280px", 
                    overflowY: 'auto',
                    marginBottom: "10px"
                  }}>
                    <table className="table table-hover table-striped mb-0">
                      <thead className="table-light sticky-top" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th scope="col" width="70%">ชื่อโครงการ</th>
                          <th scope="col" width="30%" className="text-center">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map(project => (
                          <tr 
                            key={project.id}
                            className={selectedProject?.id === project.id ? 'table-info' : ''}
                            onClick={() => handleProjectClick(project)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{project.name}</td>
                            <td>
                              <div className="d-flex justify-content-center gap-1">
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={(e) => handleShowDetail(project, e)}
                                >
                                  ข้อมูล
                                </button>
                                <Link 
                                  to={`/manage-projects/edit/${project.id}?year=${selectedYear}`} 
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  แก้ไข
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    prepareDeleteProject(project);
                                  }}
                                >
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    ไม่พบโครงการของ{selectedDepartment}ในปีงบประมาณ {selectedYear}
                  </div>
                )
              ) : (
                <div className="alert alert-info">
                  กรุณาเลือกหน่วยงานดำเนินการ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ส่วนขวา - แผนที่ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body p-0" style={{ height: "400px", minHeight: "400px" }}>
              <MapOverview 
                projects={filteredProjects} 
                selectedProject={selectedProject}
                onMarkerClick={handleProjectClick}
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
                  <h5 className="modal-title" id="detailModalLabel">รายละเอียดโครงการ</h5>
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

      {/* Modal ยืนยันการลบ */}
      {showDeleteModal && (
        <>
          <div 
            className="modal fade show" 
            tabIndex="-1" 
            role="dialog" 
            aria-labelledby="deleteModalLabel" 
            aria-hidden="false" 
            style={{ display: 'block' }}
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <div 
              className="modal-dialog modal-dialog-centered" 
              role="document"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="deleteModalLabel">ยืนยันการลบโครงการ</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => !deleteLoading && setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <p>คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "{projectToDelete?.name}"</p>
                  <p className="text-danger fw-bold">การลบนี้ไม่สามารถเรียกคืนได้ และจะลบไฟล์ทั้งหมดที่เกี่ยวข้อง</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => !deleteLoading && setShowDeleteModal(false)}
                    disabled={deleteLoading}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteProject}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        กำลังลบ...
                      </>
                    ) : 'ยืนยันการลบ'}
                  </button>
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

export default ManageProjects;
