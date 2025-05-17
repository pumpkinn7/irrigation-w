import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../firebase';

const ProjectDetailModal = ({ project, isOpen, onClose, year }) => {
  const [editorInfo, setEditorInfo] = useState(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchEditorInfo = async () => {
      if (project?.updatedBy) {
        try {
          const userDoc = await getDoc(doc(db, 'users', project.updatedBy));
          if (userDoc.exists()) {
            setEditorInfo(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching editor info:", error);
          setEditorInfo(null);
        }
      } else {
        setEditorInfo(null);
      }
    };

    if (isOpen && project) {
      fetchEditorInfo();
    }
  }, [isOpen, project, db]);

  if (!isOpen || !project) return null;

  return (
    <>
      <div 
        className="modal fade show" 
        tabIndex="-1" 
        role="dialog" 
        aria-labelledby="detailModalLabel" 
        aria-hidden="false" 
        style={{ display: 'block' }}
        onClick={onClose}
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
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <h5 className="mb-3">{project.name}</h5>
              <p><strong>ปีงบประมาณ:</strong> {project.year || year}</p>
              <p><strong>หน่วยงานดำเนินการ:</strong> {project.department}</p>
              {project.location?.address && (
                <p><strong>ที่อยู่:</strong> {project.location.address}</p>
              )}
              
              {project.files && project.files.length > 0 && (
                <>
                  <h6 className="mt-3 mb-2">เอกสารแนบ</h6>
                  <ul className="list-group mb-3">
                    {project.files.map((file, index) => (
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
                {(() => {
                  try {
                    // ตรวจสอบรูปแบบของ createdAt และแปลงให้ถูกต้อง
                    let createdDate = null;
                    if (project.createdAt) {
                      if (project.createdAt.toDate) {
                        // กรณีเป็น Firestore Timestamp
                        createdDate = project.createdAt.toDate();
                      } else if (typeof project.createdAt === 'string') {
                        // กรณีเป็น string
                        createdDate = new Date(project.createdAt);
                      } else if (project.createdAt instanceof Date) {
                        // กรณีเป็น Date object
                        createdDate = project.createdAt;
                      }
                    }
                    
                    // ตรวจสอบรูปแบบของ updatedAt และแปลงให้ถูกต้อง
                    let updatedDate = null;
                    if (project.updatedAt) {
                      if (project.updatedAt.toDate) {
                        // กรณีเป็น Firestore Timestamp
                        updatedDate = project.updatedAt.toDate();
                      } else if (typeof project.updatedAt === 'string') {
                        // กรณีเป็น string
                        updatedDate = new Date(project.updatedAt);
                      } else if (project.updatedAt instanceof Date) {
                        // กรณีเป็น Date object
                        updatedDate = project.updatedAt;
                      }
                    }
                    
                    return (
                      <>
                        {createdDate && <p><strong>วันที่สร้าง:</strong> {createdDate.toLocaleDateString('th-TH')}</p>}
                        {updatedDate && <p><strong>แก้ไขล่าสุด:</strong> {updatedDate.toLocaleDateString('th-TH')}</p>}
                        {editorInfo && project.updatedBy && (
                          <p><strong>แก้ไขโดย:</strong> {editorInfo ? `${editorInfo.firstName} ${editorInfo.lastName}` : 'ไม่ระบุชื่อผู้แก้ไข'}</p>
                        )}
                      </>
                    );
                  } catch (error) {
                    console.error("Error formatting dates:", error);
                    return <p className="text-danger">ไม่สามารถแสดงข้อมูลวันที่ได้</p>;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default ProjectDetailModal;
