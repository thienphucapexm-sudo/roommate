/**
 * Chuyển đổi giá trị nhập bất kỳ thành number an toàn
 * @param {any} value - Giá trị cần ép kiểu số
 * @param {number} [defaultValue=0] - Giá trị mặc định nếu ép kiểu thất bại
 * @returns {number} Kết quả số đã ép kiểu
 */
export function safeParseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  // Nếu là chuỗi chứa phẩy/chấm tiền tệ, hỗ trợ làm sạch
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}