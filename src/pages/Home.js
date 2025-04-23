import React from 'react';

function Home() {
  return (
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
              <li><button className="dropdown-item">ทั้งหมด</button></li>
              <li><button className="dropdown-item">โครงการที่กำลังดำเนินการ</button></li>
              <li><button className="dropdown-item">โครงการที่เสร็จสิ้น</button></li>
              <li><hr className="dropdown-divider"/></li>
              <li><button className="dropdown-item">เรียงตามวันที่: ล่าสุด</button></li>
              <li><button className="dropdown-item">เรียงตามวันที่: เก่าสุด</button></li>
            </ul>
            <button className="btn btn-outline-info" type="button">ค้นหา</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
