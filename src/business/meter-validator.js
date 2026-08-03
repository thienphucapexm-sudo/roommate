/**
 * Kiểm tra tính hợp lệ của một chỉ số đồng hồ điện/nước.
 * @param {any} reading - Giá trị chỉ số cần kiểm tra
 * @param {string} [fieldName='Chỉ số đồng hồ'] - Tên trường dữ liệu dùng cho thông báo lỗi
 * @returns {number} Giá trị đã ép kiểu thành Number
 */
export function validateMeterReading(reading, fieldName = 'Chỉ số đồng hồ') {
  if (reading === null || reading === undefined || reading === '') {
    throw new Error(`${fieldName} không được để trống.`);
  }

  const num = Number(reading);

  if (isNaN(num)) {
    throw new Error(`${fieldName} phải là một số hợp lệ.`);
  }

  if (num < 0) {
    throw new Error(`${fieldName} không được là số âm (giá trị nhập: ${reading}).`);
  }

  return num;
}

/**
 * Kiểm tra tính nhất quán giữa chỉ số kỳ trước và chỉ số ghi nhận hiện tại.
 * @param {Object} currentReading - { electricIndex, waterIndex }
 * @param {Object} previousReading - { electricIndex, waterIndex }
 * @throws {Error} Khi chỉ số mới nhỏ hơn chỉ số cũ
 */
export function validatePreviousIndex(currentReading = {}, previousReading = {}) {
  if (!currentReading || typeof currentReading !== 'object') {
    throw new Error('Dữ liệu chỉ số kỳ hiện tại không hợp lệ.');
  }

  if (previousReading && typeof previousReading === 'object') {
    // 1. Validate Điện
    if (currentReading.electricIndex !== undefined && previousReading.electricIndex !== undefined) {
      const currentElectric = validateMeterReading(currentReading.electricIndex, 'Chỉ số điện mới');
      const prevElectric = validateMeterReading(previousReading.electricIndex, 'Chỉ số điện kỳ trước');

      if (currentElectric < prevElectric) {
        throw new Error(
          `Chỉ số điện mới (${currentElectric}) không được nhỏ hơn chỉ số điện kỳ trước (${prevElectric}).`
        );
      }
    }

    // 2. Validate Nước
    if (currentReading.waterIndex !== undefined && previousReading.waterIndex !== undefined) {
      const currentWater = validateMeterReading(currentReading.waterIndex, 'Chỉ số nước mới');
      const prevWater = validateMeterReading(previousReading.waterIndex, 'Chỉ số nước kỳ trước');

      if (currentWater < prevWater) {
        throw new Error(
          `Chỉ số nước mới (${currentWater}) không được nhỏ hơn chỉ số nước kỳ trước (${prevWater}).`
        );
      }
    }
  }
}