import { isEmptyString, isNonNegativeNumber } from '../utils/validation-utils.js';

/**
 * Validator kiểm tra dữ liệu đầu vào cho Phòng
 */
export class RoomValidator {
  /**
   * Chuẩn hóa mã/số phòng (Loại bỏ khoảng trắng thừa, viết hoa)
   * @param {string} roomNumber 
   * @returns {string}
   */
  static normalizeRoomNumber(roomNumber) {
    if (typeof roomNumber !== 'string') return '';
    return roomNumber.trim().toUpperCase();
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu phòng
   * @param {Object} roomData 
   * @throws {Error} Nếu dữ liệu không hợp lệ
   */
  static validate(roomData) {
    if (!roomData || typeof roomData !== 'object') {
      throw new Error('Dữ liệu phòng không hợp lệ.');
    }

    // 1. Kiểm tra mã phòng / số phòng (Bắt buộc)
    const normalizedNumber = this.normalizeRoomNumber(roomData.number);
    if (isEmptyString(normalizedNumber)) {
      throw new Error('Mã/Số phòng không được để trống.');
    }

    // 2. Tên/Mô tả phòng (Bắt buộc nếu hệ thống dùng tên riêng, hoặc mặc định lấy từ số phòng)
    if (roomData.name !== undefined && isEmptyString(roomData.name)) {
      throw new Error('Tên phòng không được để trống.');
    }

    // 3. Giá thuê không âm
    if (!isNonNegativeNumber(roomData.price)) {
      throw new Error('Giá thuê phòng phải là một số không âm.');
    }

    // 4. Tiền cọc không âm (nếu có)
    if (roomData.deposit !== undefined && !isNonNegativeNumber(roomData.deposit)) {
      throw new Error('Tiền cọc phải là một số không âm.');
    }

    // 5. Số người tối đa phải lớn hơn 0
    const maxTenants = Number(roomData.maxTenants);
    if (isNaN(maxTenants) || maxTenants <= 0 || !Number.isInteger(maxTenants)) {
      throw new Error('Số người tối đa phải là một số nguyên lớn hơn 0.');
    }

    // 6. Tầng phải >= 0
    if (roomData.floor !== undefined) {
      const floor = Number(roomData.floor);
      if (isNaN(floor) || floor < 0 || !Number.isInteger(floor)) {
        throw new Error('Số tầng phải là số nguyên không âm.');
      }
    }
  }
}