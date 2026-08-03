/**
 * Utility ép kiểu và kiểm tra số hợp lệ không âm
 * @param {any} val - Giá trị cần kiểm tra
 * @param {string} fieldName - Tên trường dùng để hiển thị lỗi
 * @returns {number}
 */
const parseNonNegativeNumber = (val, fieldName) => {
  const num = Number(val);
  if (isNaN(num)) {
    throw new Error(`${fieldName} phải là một số hợp lệ.`);
  }
  if (num < 0) {
    throw new Error(`${fieldName} không được là số âm.`);
  }
  return num;
};

/**
 * Tính tiền điện dựa trên sản lượng và đơn giá
 * @param {number} usage - Số kWh tiêu thụ
 * @param {number} unitPrice - Đơn giá/kWh
 * @returns {number}
 */
export function calculateElectricAmount(usage, unitPrice) {
  const validUsage = parseNonNegativeNumber(usage, 'Sản lượng điện');
  const validUnitPrice = parseNonNegativeNumber(unitPrice, 'Đơn giá điện');
  return validUsage * validUnitPrice;
}

/**
 * Tính tiền nước dựa trên sản lượng và đơn giá
 * @param {number} usage - Số m³ tiêu thụ
 * @param {number} unitPrice - Đơn giá/m³
 * @returns {number}
 */
export function calculateWaterAmount(usage, unitPrice) {
  const validUsage = parseNonNegativeNumber(usage, 'Sản lượng nước');
  const validUnitPrice = parseNonNegativeNumber(unitPrice, 'Đơn giá nước');
  return validUsage * validUnitPrice;
}

/**
 * Tính tiền dịch vụ cố định theo tháng
 * @param {number} unitPrice - Đơn giá dịch vụ cố định
 * @returns {number}
 */
export function calculateFixedServiceAmount(unitPrice) {
  return parseNonNegativeNumber(unitPrice, 'Đơn giá dịch vụ cố định');
}

/**
 * Tính tiền dịch vụ theo đầu người
 * @param {number} personCount - Số lượng người
 * @param {number} unitPrice - Đơn giá/người
 * @returns {number}
 */
export function calculatePerPersonAmount(personCount, unitPrice) {
  const validCount = parseNonNegativeNumber(personCount, 'Số lượng người');
  const validUnitPrice = parseNonNegativeNumber(unitPrice, 'Đơn giá/người');
  return validCount * validUnitPrice;
}

/**
 * Tính tiền dịch vụ/gửi xe theo số lượng xe
 * @param {number} vehicleCount - Số lượng xe
 * @param {number} unitPrice - Đơn giá/xe
 * @returns {number}
 */
export function calculatePerVehicleAmount(vehicleCount, unitPrice) {
  const validCount = parseNonNegativeNumber(vehicleCount, 'Số lượng xe');
  const validUnitPrice = parseNonNegativeNumber(unitPrice, 'Đơn giá/xe');
  return validCount * validUnitPrice;
}

/**
 * Tính tổng tạm tính (Subtotal) từ danh sách các khoản mục
 * @param {Array<{amount: number}>} items - Danh sách các khoản tiền
 * @returns {number}
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) {
    throw new Error('Danh sách khoản mục phải là một mảng.');
  }

  return items.reduce((sum, item, index) => {
    const amount = parseNonNegativeNumber(
      item?.amount ?? 0,
      `Số tiền của khoản mục thứ ${index + 1}`
    );
    return sum + amount;
  }, 0);
}

/**
 * Tính và xác minh tiền giảm giá (Discount)
 * @param {number} subtotal - Tổng tiền tạm tính
 * @param {number} discount - Số tiền giảm giá
 * @returns {number}
 */
export function calculateDiscount(subtotal, discount) {
  const validSubtotal = parseNonNegativeNumber(subtotal, 'Tạm tính');
  const validDiscount = parseNonNegativeNumber(discount ?? 0, 'Giảm giá');

  if (validDiscount > validSubtotal) {
    throw new Error('Số tiền giảm giá không được lớn hơn tổng tiền tạm tính.');
  }

  return validDiscount;
}

/**
 * Tính tổng tiền hóa đơn sau giảm giá
 * @param {Array<{amount: number}>|number} itemsOrSubtotal - Danh sách các khoản mục hoặc tổng tạm tính
 * @param {number} discount - Số tiền giảm giá
 * @returns {number}
 */
export function calculateInvoiceTotal(itemsOrSubtotal, discount = 0) {
  let subtotal = 0;

  if (Array.isArray(itemsOrSubtotal)) {
    subtotal = calculateSubtotal(itemsOrSubtotal);
  } else {
    subtotal = parseNonNegativeNumber(itemsOrSubtotal, 'Tổng tạm tính');
  }

  const validDiscount = calculateDiscount(subtotal, discount);
  const total = subtotal - validDiscount;

  return total < 0 ? 0 : total;
}

/**
 * Tính số tiền còn nợ lại
 * @param {number} total - Tổng tiền hóa đơn
 * @param {number} paidAmount - Số tiền đã thanh toán
 * @returns {number}
 */
export function calculateRemainingDebt(total, paidAmount = 0) {
  const validTotal = parseNonNegativeNumber(total, 'Tổng tiền hóa đơn');
  const validPaid = parseNonNegativeNumber(paidAmount, 'Số tiền đã thanh toán');

  const remaining = validTotal - validPaid;
  return remaining < 0 ? 0 : remaining;
}

/**
 * Xử lý xác định trạng thái hóa đơn dựa theo số tiền và thời hạn
 * @param {number} total - Tổng tiền hóa đơn
 * @param {number} paidAmount - Số tiền đã thanh toán
 * @param {string|Date} dueDate - Hạn thanh toán
 * @param {string|Date} [currentDate] - Ngày hiện tại để so sánh
 * @returns {'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'}
 */
export function determineInvoiceStatus(total, paidAmount = 0, dueDate, currentDate = new Date()) {
  const validTotal = parseNonNegativeNumber(total, 'Tổng tiền hóa đơn');
  const validPaid = parseNonNegativeNumber(paidAmount, 'Số tiền đã thanh toán');

  // 1. Đã thanh toán đủ (hoặc thừa)
  if (validPaid >= validTotal && validTotal > 0) {
    return 'PAID';
  }

  if (validTotal === 0 && validPaid === 0) {
    return 'PAID';
  }

  // Chuyển đổi định dạng ngày để so sánh
  const due = new Date(dueDate);
  const current = new Date(currentDate);

  // Set thời gian về 00:00:00 để so sánh chính xác theo ngày
  due.setHours(23, 59, 59, 999);

  const isOverdue = !isNaN(due.getTime()) && current > due;

  // 2. Chưa trả đủ và đã quá hạn
  if (isOverdue) {
    return 'OVERDUE';
  }

  // 3. Trả một phần (chưa quá hạn)
  if (validPaid > 0 && validPaid < validTotal) {
    return 'PARTIAL';
  }

  // 4. Chưa trả đồng nào (chưa quá hạn)
  return 'UNPAID';
}