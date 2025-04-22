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
  );
}

export default Home;
