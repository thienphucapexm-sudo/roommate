import { isEmptyString } from '../utils/validation-utils.js';
import { ROOM_STATUS } from '../constants/statuses.js';
import { validateOccupancyLimit, hasOverlappingContract } from './contract-utils.js';

export class ContractValidator {
  /**
   * Kiểm tra tính hợp lệ toàn diện cho thông tin hợp đồng.
   * @param {Object} contract - Thông tin hợp đồng cần kiểm tra
   * @param {Object} [room=null] - Thông tin phòng tương ứng
   * @param {Array<Object>} [existingContracts=[]] - Danh sách hợp đồng hiện có để check trùng lịch
   * @throws {Error} Khi phát hiện bất kỳ ràng buộc nghiệp vụ nào vi phạm
   */
  static validateContract(contract, room = null, existingContracts = []) {
    if (!contract || typeof contract !== 'object') {
      throw new Error('Dữ liệu hợp đồng không hợp lệ.');
    }

    // 1. Kiểm tra Chọn phòng & Người thuê
    if (!contract.roomId || isEmptyString(String(contract.roomId))) {
      throw new Error('Vui lòng chọn phòng thuê.');
    }

    if (!contract.tenantId || isEmptyString(String(contract.tenantId))) {
      throw new Error('Vui lòng chọn người đại diện ký hợp đồng.');
    }

    // 2. Kiểm tra Trạng thái Phòng (Phòng bảo trì / tạm ngưng không được ký)
    if (room) {
      if (room.status === ROOM_STATUS.MAINTENANCE) {
        throw new Error('Phòng đang bảo trì hoặc tạm ngưng không được phép tạo hợp đồng mới.');
      }

      // 3. Kiểm tra Sức chứa phòng
      const allTenants = [contract.tenantId, ...(contract.memberIds || [])];
      // Bỏ trùng lặp ID người thuê nếu có
      const uniqueTenants = [...new Set(allTenants.map((id) => String(id)))];
      validateOccupancyLimit(room, uniqueTenants);
    }

    // 4. Kiểm tra Thời gian
    if (!contract.startDate || isEmptyString(contract.startDate)) {
      throw new Error('Ngày bắt đầu hợp đồng không được để trống.');
    }

    if (!contract.endDate || isEmptyString(contract.endDate)) {
      throw new Error('Ngày kết thúc hợp đồng không được để trống.');
    }

    const start = new Date(contract.startDate).getTime();
    const end = new Date(contract.endDate).getTime();

    if (isNaN(start)) {
      throw new Error('Ngày bắt đầu hợp đồng không hợp lệ.');
    }

    if (isNaN(end)) {
      throw new Error('Ngày kết thúc hợp đồng không hợp lệ.');
    }

    if (end <= start) {
      throw new Error('Ngày kết thúc hợp đồng phải diễn ra sau ngày bắt đầu.');
    }

    // 5. Kiểm tra Giá thuê & Tiền cọc (Không âm)
    if (contract.rentalPrice === undefined || contract.rentalPrice === null || contract.rentalPrice === '') {
      throw new Error('Giá thuê không được để trống.');
    }

    const rentalPrice = Number(contract.rentalPrice);
    if (isNaN(rentalPrice) || rentalPrice < 0) {
      throw new Error('Giá thuê phải là số lớn hơn hoặc bằng 0.');
    }

    if (contract.depositAmount !== undefined && contract.depositAmount !== null && contract.depositAmount !== '') {
      const depositAmount = Number(contract.depositAmount);
      if (isNaN(depositAmount) || depositAmount < 0) {
        throw new Error('Tiền cọc phải là số lớn hơn hoặc bằng 0.');
      }
    }

    // 6. Kiểm tra Trùng lặp thời gian trên cùng phòng
    if (Array.isArray(existingContracts) && existingContracts.length > 0) {
      if (hasOverlappingContract(contract, existingContracts)) {
        throw new Error('Phòng đã có hợp đồng khác còn hiệu lực trong khoảng thời gian này.');
      }
    }
  }
}

/**
 * Export độc lập hàm validateContract theo yêu cầu đề bài
 */
export const validateContract = ContractValidator.validateContract;