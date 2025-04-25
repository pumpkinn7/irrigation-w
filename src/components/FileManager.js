import React, { useState, useRef } from 'react';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function FileManager({ files = [], onFileChange, onDeleteFromStorage }) {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const safeFiles = Array.isArray(files) ? files : [];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setError(null);

    // ตรวจสอบจำนวนไฟล์
    if (safeFiles.length + selectedFiles.length > MAX_FILES) {
      setError(`สามารถเพิ่มได้สูงสุด ${MAX_FILES} ไฟล์`);
      return;
    }

    // ตรวจสอบขนาดไฟล์
    const invalidFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    // เพิ่มไฟล์ที่เลือกเข้า state
    const newFiles = selectedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file)
    }));

    onFileChange([...safeFiles, ...newFiles]);
    
    // รีเซ็ต input
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleRemoveFile = async (index) => {
    const newFiles = [...safeFiles];
    const removedFile = newFiles[index];
    
    // ถ้ามี preview URL ให้เคลียร์ทิ้ง
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
    
    // ลบไฟล์จาก Storage ถ้าไฟล์มีข้อมูล path และ onDeleteFromStorage ถูกส่งมา
    if (removedFile.path && onDeleteFromStorage) {
      try {
        await onDeleteFromStorage(removedFile.path);
      } catch (error) {
        console.error("Error deleting file from storage:", error);
        setError('ไม่สามารถลบไฟล์จากระบบได้');
        return;
      }
    }
    
    newFiles.splice(index, 1);
    onFileChange(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <div>
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}

      {/* รายการไฟล์ที่เลือก */}
      {safeFiles.length > 0 && (
        <ul className="list-group mb-3">
          {safeFiles.map((file, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-file-earmark me-2"></i>
                {file.name}
                <small className="text-muted ms-2">({formatFileSize(file.size)})</small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleRemoveFile(index)}
              >
                <i className="bi bi-x"></i>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ปุ่มเลือกไฟล์ */}
      {safeFiles.length < MAX_FILES && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="form-control"
            onChange={handleFileSelect}
            multiple={MAX_FILES - safeFiles.length > 1}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn btn-outline-primary w-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="bi bi-file-earmark-plus me-1"></i>
            เลือกไฟล์แนบ ({safeFiles.length}/{MAX_FILES})
          </button>
          <div className="form-text mt-1">
            รองรับไฟล์ PDF, Office, รูปภาพ (ไม่เกิน 10MB)
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
