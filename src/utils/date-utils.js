/**
 * Lấy ngày giờ ISO 8601 hiện tại (UTC)
 * @returns {string} Chuỗi ISO 8601 (ví dụ: '2026-08-03T13:01:11.000Z')
 */
export function getCurrentIsoDate() {
  return new Date().toISOString();
}

/**
 * Chuyển chuỗi ngày ISO sang định dạng dd/mm/yyyy
 * @param {string|Date} isoString - Chuỗi ISO hoặc đối tượng Date
 * @returns {string} Ngày dạng dd/mm/yyyy
 * @throws {Error} Nếu ngày không hợp lệ
 */
export function formatIsoToVietnameseDate(isoString) {
  if (!isoString) throw new Error('Ngày không được để trống.');
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error('Định dạng ngày ISO không hợp lệ.');
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Chuyển ngày dạng yyyy-mm-dd (chuẩn HTML input date) sang định dạng hiển thị dd/mm/yyyy
 * @param {string} dateString - Chuỗi ngày dạng yyyy-mm-dd
 * @returns {string} Ngày dạng dd/mm/yyyy
 * @throws {Error} Nếu chuỗi truyền vào không đúng định dạng yyyy-mm-dd
 */
export function formatDateInputToDisplay(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Chuỗi ngày input không hợp lệ.');
  }
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error('Định dạng phải là yyyy-mm-dd.');
  }
  const [year, month, day] = parts;
  if (!year || !month || !day || year.length !== 4) {
    throw new Error('Định dạng yyyy-mm-dd không hợp lệ.');
  }
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

/**
 * So sánh hai ngày (chỉ so sánh phần năm/tháng/ngày)
 * @param {string|Date} date1 
 * @param {string|Date} date2 
 * @returns {number} -1 nếu date1 < date2, 1 nếu date1 > date2, 0 nếu bằng nhau
 * @throws {Error} Nếu 1 trong 2 ngày không hợp lệ
 */
export function compareDates(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Đối tượng ngày so sánh không hợp lệ.');
  }

  // Set time về 00:00:00 để chỉ so sánh ngày
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  if (d1.getTime() < d2.getTime()) return -1;
  if (d1.getTime() > d2.getTime()) return 1;
  return 0;
}

/**
 * Tính số ngày giữa hai ngày
 * @param {string|Date} startDate 
 * @param {string|Date} endDate 
 * @returns {number} Số ngày (chênh lệch tuyệt đối)
 * @throws {Error} Nếu ngày không hợp lệ
 */
export function calculateDaysBetween(startDate, endDate) {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Ngày truyền vào không hợp lệ.');
  }

  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}