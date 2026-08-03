/**
 * Kiểm tra chuỗi có bị rỗng/chỉ chứa khoảng trắng hay không
 * @param {string} value 
 * @returns {boolean} true nếu rỗng hoặc null/undefined
 */
export function isEmptyString(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return String(value).trim().length === 0;
  return value.trim().length === 0;
}

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng đầu số chuẩn 03|05|07|08|09)
 * @param {string} phone 
 * @returns {boolean} true nếu là SĐT Việt Nam hợp lệ
 */
export function isValidVietnamesePhone(phone) {
  if (typeof phone !== 'string') return false;
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone.trim());
}

/**
 * Kiểm tra số truyền vào có phải là số không âm (>= 0)
 * @param {number|string} value 
 * @returns {boolean} true nếu là số >= 0
 */
export function isNonNegativeNumber(value) {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
}

/**
 * Kiểm tra đối tượng/chuỗi truyền vào có phải là ngày hợp lệ hay không
 * @param {string|Date} date 
 * @returns {boolean} true nếu là ngày hợp lệ
 */
export function isValidDate(date) {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}