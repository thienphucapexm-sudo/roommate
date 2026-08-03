import { isEmptyString } from '../utils/validation-utils.js';

/**
 * Validator kiểm tra dữ liệu đầu vào cho Người thuê
 */
export class TenantValidator {
  /**
   * Chuẩn hóa số điện thoại (Xóa khoảng trắng, gạch nối, chấm)
   * @param {string} phone 
   * @returns {string}
   */
  static normalizePhone(phone) {
    if (typeof phone !== 'string') return '';
    return phone.replace(/[\s\.\-\(\)]/g, '');
  }

  /**
   * Chuẩn hóa CCCD/CMND (Xóa khoảng trắng, viết hoa nếu có ký tự)
   * @param {string} idCard 
   * @returns {string}
   */
  static normalizeIdCard(idCard) {
    if (typeof idCard !== 'string') return '';
    return idCard.trim().toUpperCase();
  }

  /**
   * Kiểm tra định dạng số điện thoại Việt Nam đơn giản (10 chữ số, bắt đầu bằng 0)
   * @param {string} phone 
   * @returns {boolean}
   */
  static isValidPhone(phone) {
    const normalized = this.normalizePhone(phone);
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(normalized);
  }

  /**
   * Kiểm tra định dạng CCCD/CMND (9 hoặc 12 chữ số)
   * @param {string} idCard 
   * @returns {boolean}
   */
  static isValidIdCard(idCard) {
    const normalized = this.normalizeIdCard(idCard);
    if (!normalized) return true; // CCCD là tùy chọn (nếu nhập mới check)
    const idCardRegex = /^(\d{9}|\d{12})$/;
    return idCardRegex.test(normalized);
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu người thuê
   * @param {Object} tenantData 
   * @throws {Error} Nếu dữ liệu không hợp lệ
   */
  static validate(tenantData) {
    if (!tenantData || typeof tenantData !== 'object') {
      throw new Error('Dữ liệu người thuê không hợp lệ.');
    }

    // 1. Họ tên bắt buộc
    if (isEmptyString(tenantData.fullName)) {
      throw new Error('Họ và tên người thuê không được để trống.');
    }

    // 2. Số điện thoại bắt buộc và đúng định dạng
    if (isEmptyString(tenantData.phone)) {
      throw new Error('Số điện thoại không được để trống.');
    }

    if (!this.isValidPhone(tenantData.phone)) {
      throw new Error('Số điện thoại không đúng định dạng (Ví dụ: 0912345678).');
    }

    // 3. Email (nếu có thì kiểm tra định dạng)
    if (tenantData.email && !isEmptyString(tenantData.email)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tenantData.email.trim())) {
        throw new Error('Email không đúng định dạng.');
      }
    }

    // 4. CCCD/CMND (nếu nhập thì phải đúng định dạng)
    if (tenantData.idCard && !isEmptyString(tenantData.idCard)) {
      if (!this.isValidIdCard(tenantData.idCard)) {
        throw new Error('Số CCCD/CMND không hợp lệ (Phải bao gồm 9 hoặc 12 chữ số).');
      }
    }
  }
}