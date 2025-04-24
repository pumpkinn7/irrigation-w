export const generateYearRange = () => {
  const startYear = 2566; // ปีเริ่มต้น
  const currentYear = new Date().getFullYear() + 543; // แปลงเป็น พ.ศ.
  
  // สร้างอาเรย์ปีตั้งแต่ปีเริ่มต้นถึงปีปัจจุบัน
  const years = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year.toString());
  }
  
  return years;
};

export const getCurrentYear = () => {
  return (new Date().getFullYear() + 543).toString();
};
