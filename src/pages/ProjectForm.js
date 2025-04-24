import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import app from '../firebase';
import MapPicker from '../components/MapPicker';
import FileManager from '../components/FileManager';
import { generateYearRange, getCurrentYear } from '../utils/yearUtils';

function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore(app);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const years = generateYearRange();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    year: getCurrentYear(),
    location: {  // กำหนดค่าเริ่มต้น
      lat: 16.4419,
      lng: 102.8360,
      address: ''
    },
    files: []
  });

  // ดึงข้อมูลโครงการเมื่อเป็นการแก้ไข
  const fetchProjectData = useCallback(async () => {
    if (!id) {
      // ถ้าเป็นการสร้างใหม่ ให้กำหนดค่าเริ่มต้นของ location
      setFormData(prev => ({
        ...prev,
        location: {
          lat: 16.4419,
          lng: 102.8360,
          address: ''
        }
      }));
      return;
    }
    
    try {
      setLoading(true);
      const projectRef = doc(db, formData.year, id);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        setFormData({
          ...projectData,
          year: formData.year,
          location: projectData.location || {
            lat: 16.4419,
            lng: 102.8360,
            address: ''
          },
          files: Array.isArray(projectData.files) ? projectData.files : []
        });
      } else {
        setError('ไม่พบข้อมูลโครงการ');
        setTimeout(() => navigate('/manage-projects'), 3000);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError('ไม่สามารถโหลดข้อมูลโครงการได้');
    } finally {
      setLoading(false);
    }
  }, [id, db, formData.year, navigate]);

  // ตรวจสอบการเข้าสู่ระบบและดึงข้อมูลโครงการ
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    fetchProjectData();
  }, [currentUser, navigate, fetchProjectData]);

  // จัดการเปลี่ยนค่า input พื้นฐาน
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // จัดการเปลี่ยนค่า location
  const handleLocationChange = (newLocation) => {
    if (newLocation && typeof newLocation.lat === 'number' && typeof newLocation.lng === 'number') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          lat: newLocation.lat,
          lng: newLocation.lng
        }
      }));
    }
  };

  // จัดการเปลี่ยนแปลงเอกสารแนบ
  const handleFileChange = (newFiles) => {
    setFormData(prev => ({
      ...prev,
      files: newFiles
    }));
  };

  // จัดการเปลี่ยนปีงบประมาณ
  const handleYearChange = async (e) => {
    const newYear = e.target.value;
    
    // เมื่อแก้ไขโครงการและเปลี่ยนปี ต้องตรวจสอบว่าโครงการมีอยู่ในปีใหม่หรือไม่
    if (id && newYear !== formData.year) {
      try {
        setLoading(true);
        const newYearProjectRef = doc(db, newYear, id);
        const projectDoc = await getDoc(newYearProjectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setFormData({
            ...projectData,
            year: newYear,
            files: Array.isArray(projectData.files) ? projectData.files : []
          });
        } else {
          // ถ้าไม่พบในปีใหม่ ให้เปลี่ยนเฉพาะปี คงข้อมูลอื่นไว้เหมือนเดิม
          setFormData(prev => ({ ...prev, year: newYear }));
        }
      } catch (error) {
        console.error("Error checking project in new year:", error);
      } finally {
        setLoading(false);
      }
    } else {
      // กรณีเพิ่มใหม่หรือไม่มีการเปลี่ยนปี
      setFormData(prev => ({ ...prev, year: newYear }));
    }
  };

  // ตรวจสอบความถูกต้องของข้อมูล
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อโครงการ');
      return false;
    }
    
    if (!formData.location.lat || !formData.location.lng) {
      setError('กรุณาเลือกพิกัดบนแผนที่');
      return false;
    }
    
    return true;
  };

  // บันทึกแบบฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // อัพโหลดไฟล์แนบก่อน
      const uploadedFiles = [];
      const filesToUpload = formData.files.filter(f => f.file); // เฉพาะไฟล์ใหม่ที่ยังไม่ได้อัพโหลด

      if (filesToUpload.length > 0) {
        const storage = getStorage(app);
        
        for (const fileData of filesToUpload) {
          const timestamp = Date.now();
          const fileName = `${timestamp}_${fileData.name}`;
          const storagePath = `projects/${formData.year}/${id || 'new'}/${fileName}`;
          const storageRef = ref(storage, storagePath);
          
          // อัพโหลดไฟล์
          await uploadBytesResumable(storageRef, fileData.file);
          const url = await getDownloadURL(storageRef);
          
          uploadedFiles.push({
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            path: storagePath,
            url,
            uploadedAt: new Date().toISOString()
          });
        }
      }

      // รวมไฟล์ที่อัพโหลดใหม่กับไฟล์เดิม
      const allFiles = [
        ...formData.files.filter(f => !f.file), // ไฟล์เดิม
        ...uploadedFiles // ไฟล์ที่อัพโหลดใหม่
      ];

      // บันทึกข้อมูลโครงการ
      const saveData = {
        ...formData,
        files: allFiles,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      };

      if (id) {
        await setDoc(doc(db, formData.year, id), saveData);
        setSuccess('อัปเดตโครงการเรียบร้อยแล้ว');
      } else {
        saveData.createdAt = new Date().toISOString();
        saveData.createdBy = currentUser.uid;
        const docRef = await addDoc(collection(db, formData.year), saveData);
        setSuccess(`เพิ่มโครงการเรียบร้อยแล้ว (รหัส: ${docRef.id})`);
      }

      setTimeout(() => navigate('/manage-projects'), 1000);
      
    } catch (error) {
      console.error("Error saving project:", error);
      setError('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-bottom">
              <h3 className="card-title mb-0">
                {isEditMode ? 'แก้ไขโครงการชลประทาน' : 'เพิ่มโครงการชลประทาน'}
              </h3>
            </div>
            
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              {success && (
                <div className="alert alert-success">{success}</div>
              )}
              
              {loading && !error && !success && (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                  </div>
                  <p className="mt-2">กำลังดำเนินการ กรุณารอสักครู่...</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">ปีงบประมาณ <span className="text-danger">*</span></label>
                  <select 
                    className="form-select"
                    name="year"
                    value={formData.year}
                    onChange={handleYearChange}
                    disabled={loading}
                    required
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">ชื่อโครงการ <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">เลือกพิกัดบนแผนที่ <span className="text-danger">*</span></label>
                  <MapPicker
                    location={formData.location}
                    onLocationChange={handleLocationChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">ที่อยู่ตำแหน่ง</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.location?.address || ''} // เพิ่ม optional chaining
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...(formData.location || {}), // ป้องกันกรณี location เป็น null
                        address: e.target.value
                      }
                    })}
                    disabled={loading}
                    placeholder="ระบุรายละเอียดที่อยู่หรือตำแหน่ง (ถ้ามี)"
                  />
                </div>

                {/* เอกสารแนบ */}
                <div className="mb-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">เอกสารแนบโครงการ</h5>
                    </div>
                    <div className="card-body">
                      <FileManager 
                        projectId={id}
                        files={formData.files} 
                        onFileChange={handleFileChange}
                        year={formData.year}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        กำลังบันทึก...
                      </>
                    ) : (
                      isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มโครงการ'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary py-2"
                    onClick={() => navigate('/manage-projects')}
                    disabled={loading}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectForm;
