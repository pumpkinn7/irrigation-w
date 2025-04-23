import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import googleApiConfig from '../config/googleApiConfig';

function FileUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const { currentUser } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์');
      return;
    }
    
    if (!file) {
      setError('กรุณาเลือกไฟล์');
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      // ใช้ค่าจาก config file
      const { clientId, clientSecret, refreshToken } = googleApiConfig;
      
      // ขอ access token จาก refresh token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token response error:', errorData);
        throw new Error(`Token Error: ${errorData.error || 'Failed to get access token'}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      
      // อ่านไฟล์และสร้าง metadata
      setProgress(30);
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      const metadata = {
        name: file.name,
        mimeType: file.type,
        description: `Uploaded by ${currentUser.email} on ${new Date().toLocaleString()}`,
      };

      // สร้าง multipart request
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      let requestBody = '';
      requestBody += delimiter;
      requestBody += 'Content-Type: application/json\r\n\r\n';
      requestBody += JSON.stringify(metadata);
      requestBody += delimiter;
      requestBody += `Content-Type: ${file.type}\r\n`;
      requestBody += 'Content-Transfer-Encoding: base64\r\n\r\n';
      
      const base64Data = arrayBufferToBase64(arrayBuffer);
      requestBody += base64Data;
      requestBody += closeDelim;

      setProgress(50);
      
      // อัปโหลดไฟล์
      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: requestBody
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();
      console.log('Upload successful:', result);
      
      setProgress(100);
      setSuccess(`อัปโหลดไฟล์สำเร็จ: ${file.name}`);
      
      // รีเซ็ต state
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Error details:', error);
      setError(`เกิดข้อผิดพลาด: ${error.message}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e.target.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (!currentUser) {
    return (
      <div className="card p-3">
        <h5 className="card-title">อัปโหลดไฟล์</h5>
        <div className="alert alert-warning">
          กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์
          <div className="mt-2">
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.href = '/login'}
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3">
      <h5 className="card-title">อัปโหลดไฟล์</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}
      
      <form onSubmit={handleUpload}>
        <div className="mb-3">
          <input
            id="fileInput"
            type="file"
            className="form-control"
            onChange={handleFileChange}
            disabled={loading}
          />
          <small className="text-muted">เลือกไฟล์ที่ต้องการอัปโหลด</small>
        </div>

        {progress > 0 && (
          <div className="mb-3">
            <div className="progress">
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {progress}%
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!file || loading}
        >
          {loading ? `กำลังอัปโหลด...` : 'อัปโหลดไฟล์'}
        </button>
      </form>
    </div>
  );
}

export default FileUploader;
