import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container">
          <a className="navbar-brand" href="/">
            โครงการชลประทาน
          </a>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="/projects">หน่วยงานที่เกี่ยวข้อง</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/contact">ติดต่อ</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/login">เข้าสู่ระบบ</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <div className="container mt-5 pt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-6 col-sm-10">
            <div className="input-group mb-3">
              <input 
                type="text" 
                className="form-control" 
                placeholder="ค้นหาโครงการ..." 
                aria-label="ค้นหา"
              />
              <button 
                className="btn btn-outline-info dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                ตัวกรอง
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">ทั้งหมด</a></li>
                <li><a className="dropdown-item" href="#">โครงการที่กำลังดำเนินการ</a></li>
                <li><a className="dropdown-item" href="#">โครงการที่เสร็จสิ้น</a></li>
                <li><hr className="dropdown-divider"/></li>
                <li><a className="dropdown-item" href="#">เรียงตามวันที่: ล่าสุด</a></li>
                <li><a className="dropdown-item" href="#">เรียงตามวันที่: เก่าสุด</a></li>
              </ul>
              <button className="btn btn-outline-info" type="button">ค้นหา</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
