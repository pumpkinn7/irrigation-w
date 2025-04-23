import React from 'react';
import FileUploader from '../components/FileUploader';

function Test() {
  return (
    <div className="container mt-5 pt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-6 col-sm-10">
          <h2 className="mb-4">หน้าทดสอบ</h2>
          
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">ทดสอบอัปโหลดไฟล์</h5>
            </div>
            <div className="card-body">
              <FileUploader />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Test;
