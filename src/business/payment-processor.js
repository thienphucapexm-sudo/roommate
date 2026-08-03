/**
 * Tính tổng số tiền đã thanh toán từ danh sách các giao dịch
 * @param {Array<{amount: number}>} payments - Danh sách các giao dịch thanh toán
 * @returns {number} Tổng số tiền đã thanh toán
 */
export function calculateTotalPaid(payments = []) {
  if (!Array.isArray(payments)) return 0;

  return payments.reduce((sum, payment) => {
    const amount = Number(payment?.amount);
    return sum + (!isNaN(amount) && amount > 0 ? amount : 0);
  }, 0);
}

/**
 * Tính số tiền còn nợ lại của hóa đơn
 * @param {number} invoiceTotal - Tổng tiền hóa đơn
 * @param {Array<{amount: number}>} payments - Danh sách các giao dịch thanh toán
 * @returns {number} Số tiền còn nợ (tối thiểu là 0)
 */
export function calculateRemainingAmount(invoiceTotal = 0, payments = []) {
  const totalPaid = calculateTotalPaid(payments);
  const remaining = Number(invoiceTotal) - totalPaid;
  return remaining > 0 ? remaining : 0;
}

/**
 * Xác định trạng thái thanh toán của hóa đơn
 * @param {number} invoiceTotal - Tổng tiền hóa đơn
 * @param {Array<{amount: number}>} payments - Danh sách giao dịch
 * @param {string} dueDate - Hạn thanh toán (YYYY-MM-DD)
 * @param {string} [currentDate] - Ngày hiện tại để so sánh (YYYY-MM-DD), mặc định là hôm nay
 * @returns {string} Trạng thái: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UNPAID'
 */
export function determinePaymentStatus(invoiceTotal = 0, payments = [], dueDate, currentDate) {
  const totalPaid = calculateTotalPaid(payments);
  const total = Number(invoiceTotal);

  if (totalPaid >= total && total > 0) {
    return 'PAID';
  }

  const todayStr = currentDate || new Date().toISOString().substring(0, 10);

  if (totalPaid > 0) {
    if (dueDate && todayStr > dueDate) {
      return 'OVERDUE';
    }
    return 'PARTIAL';
  }

  if (dueDate && todayStr > dueDate) {
    return 'OVERDUE';
  }

  return 'UNPAID';
}

/**
 * Kiểm tra xem một giao dịch thanh toán có thể xóa được hay không
 * @param {Object} payment - Giao dịch thanh toán cần xóa
 * @param {Object} invoice - Hóa đơn chứa giao dịch
 * @returns {{ canDelete: boolean, reason?: string }}
 */
export function canDeletePayment(payment, invoice) {
  if (!payment) {
    return { canDelete: false, reason: 'Giao dịch thanh toán không tồn tại.' };
  }

  if (!invoice) {
    return { canDelete: false, reason: 'Không tìm thấy hóa đơn liên quan.' };
  }

  if (invoice.status === 'CANCELLED') {
    return { canDelete: false, reason: 'Không thể thao tác trên hóa đơn đã hủy.' };
  }

  return { canDelete: true };
}

/**
 * Phân nhóm các giao dịch thanh toán theo phương thức thanh toán
 * @param {Array<{method: string, amount: number}>} payments - Danh sách các giao dịch
 * @returns {Object.<string, Array>} Đối tượng gồm danh sách thanh toán gom nhóm theo phương thức
 */
export function groupPaymentsByMethod(payments = []) {
  if (!Array.isArray(payments)) return {};

  return payments.reduce((acc, payment) => {
    const method = payment?.method || 'OTHER';
    if (!acc[method]) {
      acc[method] = [];
    }
    acc[method].push(payment);
    return acc;
  }, {});
}