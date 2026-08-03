/**
 * Kiểm tra tính hợp lệ của giao dịch thanh toán
 * @param {Object} payment - Dữ liệu thanh toán cần kiểm tra
 * @param {number} payment.amount - Số tiền thanh toán
 * @param {string} [payment.paymentDate] - Ngày thanh toán
 * @param {Object} invoice - Hóa đơn liên quan
 * @param {number} invoice.total - Tổng tiền hóa đơn
 * @param {number} invoice.paidAmount - Số tiền đã thanh toán trước đó
 * @param {string} invoice.status - Trạng thái hóa đơn ('CANCELLED', 'PAID', ...)
 * @returns {{ isValid: boolean, errors: string[] }} Kết quả kiểm tra
 */
export function validatePayment(payment, invoice) {
  const errors = [];

  // 1. Kiểm tra tồn tại hóa đơn
  if (!invoice) {
    return {
      isValid: false,
      errors: ['Không tìm thấy thông tin hóa đơn tương ứng.'],
    };
  }

  // 2. Không thanh toán cho hóa đơn đã hủy
  if (invoice.status === 'CANCELLED') {
    errors.push('Không thể thực hiện thanh toán cho hóa đơn đã bị hủy.');
  }

  // 3. Số tiền thanh toán phải lớn hơn 0
  const amount = Number(payment?.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('Số tiền thanh toán phải lớn hơn 0.');
  }

  const currentPaid = Number(invoice.paidAmount) || 0;
  const total = Number(invoice.total) || 0;
  const remainingDebt = total - currentPaid;

  // 4. Không thanh toán thêm cho hóa đơn đã trả đủ
  if (currentPaid >= total || invoice.status === 'PAID') {
    errors.push('Hóa đơn này đã được thanh toán đầy đủ.');
  }

  // 5. Số tiền thanh toán không được vượt quá công nợ còn lại
  if (amount > remainingDebt && remainingDebt > 0) {
    errors.push(
      `Số tiền thanh toán (${amount.toLocaleString('vi-VN')} đ) không được vượt quá số tiền còn nợ (${remainingDebt.toLocaleString('vi-VN')} đ).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}