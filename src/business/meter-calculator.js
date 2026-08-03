import { validateMeterReading } from './meter-validator.js';

/**
 * Tính sản lượng điện/nước sử dụng giữa 2 kỳ chỉ số.
 * @param {number|string} oldIndex - Chỉ số cũ
 * @param {number|string} newIndex - Chỉ số mới
 * @param {string} [label='điện/nước'] - Tên loại dịch vụ phục vụ cho thông báo lỗi
 * @returns {number} Số lượng sử dụng
 */
export function calculateUsage(oldIndex, newIndex, label = 'điện/nước') {
  const oldNum = validateMeterReading(oldIndex, `Chỉ số cũ (${label})`);
  const newNum = validateMeterReading(newIndex, `Chỉ số mới (${label})`);

  if (newNum < oldNum) {
    throw new Error(`Chỉ số mới (${newNum}) không được nhỏ hơn chỉ số cũ (${oldNum}) đối với dịch vụ ${label}.`);
  }

  const usage = newNum - oldNum;

  if (isNaN(usage)) {
    throw new Error(`Lỗi tính toán chỉ số ${label}: Kết quả không hợp lệ (NaN).`);
  }

  return usage;
}

/**
 * Tính sản lượng điện sử dụng.
 * @param {number|string} oldIndex 
 * @param {number|string} newIndex 
 * @returns {number}
 */
export function calculateElectricUsage(oldIndex, newIndex) {
  return calculateUsage(oldIndex, newIndex, 'điện');
}

/**
 * Tính sản lượng nước sử dụng.
 * @param {number|string} oldIndex 
 * @param {number|string} newIndex 
 * @returns {number}
 */
export function calculateWaterUsage(oldIndex, newIndex) {
  return calculateUsage(oldIndex, newIndex, 'nước');
}

/**
 * Phát hiện tiêu thụ bất thường so với kỳ trước.
 * @param {number|string} currentUsage - Sản lượng kỳ này
 * @param {number|string} previousUsage - Sản lượng kỳ trước
 * @param {number} [thresholdPercent=50] - Ngưỡng cảnh báo (%)
 * @returns {{ isAbnormal: boolean, percentageIncrease: number, message: string }}
 */
export function detectAbnormalUsage(currentUsage, previousUsage, thresholdPercent = 50) {
  const current = validateMeterReading(currentUsage, 'Sản lượng kỳ này');
  const previous = validateMeterReading(previousUsage, 'Sản lượng kỳ trước');

  // Kỳ trước sử dụng bằng 0 -> Không có cơ sở để báo tăng đột biến theo %
  if (previous === 0) {
    return {
      isAbnormal: false,
      percentageIncrease: 0,
      message: 'Sản lượng kỳ trước bằng 0, không tính biến động.'
    };
  }

  const diff = current - previous;
  const percentageIncrease = (diff / previous) * 100;

  const isAbnormal = percentageIncrease >= thresholdPercent;

  return {
    isAbnormal,
    percentageIncrease: Math.round(percentageIncrease * 100) / 100, // Làm tròn 2 chữ số thập phân
    message: isAbnormal
      ? `Sản lượng tiêu thụ tăng ${percentageIncrease.toFixed(1)}% so với tháng trước (vượt ngưỡng cảnh báo ${thresholdPercent}%).`
      : 'Sản lượng tiêu thụ ở mức bình thường.'
  };
}

/**
 * Lấy mã tháng liền trước dựa vào định dạng "YYYY-MM".
 * @param {string} monthKey - Định dạng "YYYY-MM" (Ví dụ: "2026-03")
 * @returns {string} Mã tháng trước (Ví dụ: "2026-02")
 */
export function getPreviousMonthKey(monthKey) {
  if (!monthKey || typeof monthKey !== 'string' || !/^\d{4}-\d{2}$/.test(monthKey)) {
    throw new Error('Mã tháng không đúng định dạng YYYY-MM (Ví dụ: 2026-03).');
  }

  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error('Giá trị năm hoặc tháng không hợp lệ.');
  }

  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${formattedMonth}`;
}