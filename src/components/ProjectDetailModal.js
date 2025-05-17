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

  const formatCurrency = (amount) => {
    if (!amount) return 'ไม่ระบุ';
    return Number(amount).toLocaleString('th-TH') + ' บาท';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH');
  };

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
          className="modal-dialog modal-dialog-centered modal-lg" 
          role="document"
          onClick={e => e.stopPropagation()}
          style={{
            maxHeight: '90vh',
            margin: '1.75rem auto',
            padding: '0 10px' // เพิ่ม padding ด้านข้าง
          }}
        >
          <div className="modal-content" style={{ maxHeight: '90vh' }}>
            <div className="modal-header" style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'white',
              zIndex: 1
            }}>
              <h5 className="modal-title" id="detailModalLabel">รายละเอียดงาน</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
              {/* ส่วนที่ 1: ข้อมูลพื้นฐาน */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">ข้อมูลพื้นฐาน</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <p className="mb-1"><strong>ปีงบประมาณ:</strong></p>
                      <p>{project.year || year}</p>
                    </div>
                    <div className="col-md-8">
                      <p className="mb-1"><strong>ชื่องาน:</strong></p>
                      <p>{project.name}</p>
                    </div>
                    <div className="col-12">
                      <p className="mb-1"><strong>หน่วยงานดำเนินการ:</strong></p>
                      <p>{project.department || 'ไม่ระบุ'}</p>
                    </div>
                    <div className="col-12">
                      <p className="mb-1"><strong>ที่อยู่:</strong></p>
                      <p>{project.location?.address || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 2: ข้อมูลงบประมาณและการถ่ายโอน */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">ข้อมูลงบประมาณและการถ่ายโอน</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <p className="mb-1"><strong>งบประมาณตาม พ.ร.บ.:</strong></p>
                      <p>{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="mb-1"><strong>วันที่ถ่ายโอน:</strong></p>
                      <p>{project.transferDate ? formatDate(project.transferDate) : 'ไม่ระบุ'}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="mb-1"><strong>หน่วยงานรับโอน:</strong></p>
                      <p>{project.transferTo || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 3: เอกสารแนบโครงการ */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">เอกสารแนบโครงการ</h6>
                </div>
                <div className="card-body">
                  {project.files && project.files.length > 0 ? (
                    <div className="list-group">
                      {project.files.map((file, index) => (
                        <div key={index} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                          <div>
                            <i className="bi bi-file-earmark me-2"></i>
                            {file.name}
                          </div>
                          {file.url && (
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                              เปิดไฟล์
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">ไม่มีเอกสารแนบ</p>
                  )}
                </div>
              </div>

              {/* ส่วนที่ 4: ข้อมูลการแก้ไข */}
              <div className="card">
                <div className="card-header bg-light">
                  <h6 className="mb-0">ข้อมูลการแก้ไข</h6>
                </div>
                <div className="card-body">
                  {(() => {
                    try {
                      let createdDate = project.createdAt?.toDate?.() || new Date(project.createdAt);
                      let updatedDate = project.updatedAt?.toDate?.() || new Date(project.updatedAt);
                      
                      return (
                        <div className="row">
                          {createdDate && (
                            <div className="col-md-6">
                              <p className="mb-1"><strong>วันที่สร้าง:</strong></p>
                              <p>{createdDate.toLocaleDateString('th-TH')}</p>
                            </div>
                          )}
                          {updatedDate && (
                            <div className="col-md-6">
                              <p className="mb-1"><strong>แก้ไขล่าสุด:</strong></p>
                              <p>{updatedDate.toLocaleDateString('th-TH')}</p>
                            </div>
                          )}
                          {editorInfo && project.updatedBy && (
                            <div className="col-12">
                              <p className="mb-1"><strong>แก้ไขโดย:</strong></p>
                              <p>{editorInfo.firstName} {editorInfo.lastName}</p>
                            </div>
                          )}
                        </div>
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
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default ProjectDetailModal;
