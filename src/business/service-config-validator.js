import { isEmptyString } from '../utils/validation-utils.js';

// Danh sách các cách tính hợp lệ
export const CHARGE_TYPES = {
  USAGE: 'usage',           // Theo lượng sử dụng (điện, nước...)
  FIXED: 'fixed',           // Cố định theo phòng
  PER_PERSON: 'perPerson',   // Theo số người
  PER_VEHICLE: 'perVehicle', // Theo số xe
  MANUAL: 'manual'          // Nhập thủ công
};

export class ServiceConfigValidator {
  /**
   * Validate dữ liệu cấu hình dịch vụ
   * @param {Object} serviceConfig 
   * @param {Array<Object>} existingServices 
   */
  static validate(serviceConfig, existingServices = []) {
    if (!serviceConfig || typeof serviceConfig !== 'object') {
      throw new Error('Dữ liệu dịch vụ không hợp lệ.');
    }

    // 1. Kiểm tra Mã dịch vụ
    if (!serviceConfig.code || isEmptyString(serviceConfig.code)) {
      throw new Error('Mã dịch vụ không được để trống.');
    }

    const cleanCode = String(serviceConfig.code).trim().toLowerCase();
    const isDuplicateCode = existingServices.some(s => 
      String(s.id) !== String(serviceConfig.id) && 
      String(s.code).trim().toLowerCase() === cleanCode
    );

    if (isDuplicateCode) {
      throw new Error(`Mã dịch vụ "${serviceConfig.code}" đã tồn tại trong hệ thống.`);
    }

    // 2. Kiểm tra Tên dịch vụ
    if (!serviceConfig.name || isEmptyString(serviceConfig.name)) {
      throw new Error('Tên dịch vụ không được để trống.');
    }

    // 3. Kiểm tra Cách tính
    const validChargeTypes = Object.values(CHARGE_TYPES);
    if (!serviceConfig.chargeType || !validChargeTypes.includes(serviceConfig.chargeType)) {
      throw new Error('Cách tính phí dịch vụ không hợp lệ.');
    }

    // 4. Kiểm tra Đơn giá (Không âm, trừ loại manual có thể khởi tạo = 0)
    if (serviceConfig.unitPrice === undefined || serviceConfig.unitPrice === null || serviceConfig.unitPrice === '') {
      throw new Error('Đơn giá không được để trống.');
    }

    const price = Number(serviceConfig.unitPrice);
    if (isNaN(price) || price < 0) {
      throw new Error('Đơn giá dịch vụ phải là số lớn hơn hoặc bằng 0.');
    }
  }
}