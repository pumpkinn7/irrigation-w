import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject, listAll } from 'firebase/storage';
import app from '../firebase';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';
import MapOverview from '../components/MapOverview';

function ManageProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const years = generateYearRange();
  const db = getFirestore(app);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
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

  return (
    <div className="container mt-5 pt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>การจัดการโครงการ</h2>
        <Link to="/manage-projects/create" className="btn btn-primary">
          เพิ่มโครงการ
        </Link>
      </div>

      <div className="row justify-content-center g-3">
        {/* ส่วนซ้าย - รายการโครงการ */}
        <div className="col-lg-6 col-md-12">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
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

              {loading ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                  </div>
                </div>
              ) : projects.length > 0 ? (
                <div className="table-responsive flex-grow-1" style={{ minHeight: "300px", height: "100%", overflowY: 'auto' }}>
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light sticky-top" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th scope="col" width="70%">ชื่อโครงการ</th>
                        <th scope="col" width="15%" className="text-center"></th>
                        <th scope="col" width="15%" className="text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr 
                          key={project.id}
                          className={selectedProject?.id === project.id ? 'table-info' : ''}
                          onClick={() => handleProjectClick(project)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{project.name}</td>
                          <td className="text-center">
                            <Link 
                              to={`/manage-projects/edit/${project.id}?year=${selectedYear}`} 
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              แก้ไข
                            </Link>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                prepareDeleteProject(project);
                              }}
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  ไม่พบโครงการในปีงบประมาณ {selectedYear}
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
                projects={projects} 
                selectedProject={selectedProject}
                onMarkerClick={handleProjectClick}
              />
            </div>
          </div>
        </div>
      </div>

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
