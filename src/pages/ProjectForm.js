import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import app from '../firebase';
import MapPicker from '../components/MapPicker';

function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore(app); // ย้ายมาประกาศที่นี่
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const years = ['2566', '2567', '2568'];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: '2567',
    location: {
      lat: 16.4419, // เปลี่ยนเป็นพิกัดขอนแก่น
      lng: 102.8360,
      address: ''
    }
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (id) {
      const fetchProject = async () => {
        try {
          const projectRef = doc(db, formData.year, id);
          const projectDoc = await getDoc(projectRef);
          if (projectDoc.exists()) {
            setFormData({ ...projectDoc.data(), year: formData.year });
          }
        } catch (error) {
          console.error("Error fetching project:", error);
          setError('ไม่สามารถโหลดข้อมูลโครงการได้');
        }
      };
      fetchProject();
    }
  }, [id, currentUser, navigate, db, formData.year]); // เพิ่ม db และ formData.year เข้าไปใน dependencies

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        // อัปเดตโครงการ
        await setDoc(doc(db, formData.year, id), {
          ...formData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      } else {
        // สร้างโครงการใหม่
        await addDoc(collection(db, formData.year), {
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      }
      navigate('/manage-projects');
    } catch (error) {
      console.error("Error saving project:", error);
      setError('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 pt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title mb-4">
                {id ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}
              </h3>
              
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">ปีงบประมาณ</label>
                  <select 
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">ชื่อโครงการ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">รายละเอียด</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">เลือกพิกัดบนแผนที่</label>
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
                    value={formData.location.address || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {...formData.location, address: e.target.value}
                    })}
                    placeholder="ระบุรายละเอียดที่อยู่หรือตำแหน่ง (ถ้ามี)"
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'กำลังบันทึก...' : (id ? 'อัปเดตโครงการ' : 'เพิ่มโครงการ')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/manage-projects')}
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
