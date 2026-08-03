/**
 * Định dạng số thành chuỗi tiền tệ Việt Nam (VND)
 * @param {number|string} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi định dạng (Ví dụ: "1.500.000 ₫")
 * @throws {Error} Nếu số tiền truyền vào không hợp lệ
 */
export function formatVND(amount) {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(numericAmount)) {
    throw new Error('Số tiền phải là một số hợp lệ.');
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numericAmount);
}