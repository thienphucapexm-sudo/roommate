import { CONTRACT_STATUS, ROOM_STATUS } from '../constants/statuses.js';

/**
 * Kiểm tra xem 2 khoảng thời gian [startA, endA] và [startB, endB] có bị chồng lấp (giao nhau) không.
 * @param {string|Date} startA 
 * @param {string|Date} endA 
 * @param {string|Date} startB 
 * @param {string|Date} endB 
 * @returns {boolean}
 */
export function isDateRangeOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (isNaN(sA) || isNaN(eA) || isNaN(sB) || isNaN(eB)) {
    return false;
  }

  // 2 khoảng [A1, A2] và [B1, B2] giao nhau khi max(A1, B1) <= min(A2, B2)
  return Math.max(sA, sB) <= Math.min(eA, eB);
}

/**
 * Kiểm tra xem hợp đồng mới/cập nhật có bị trùng thời gian với hợp đồng đã có trên cùng một phòng hay không.
 * @param {Object} newContract - Hợp đồng cần kiểm tra
 * @param {Array<Object>} existingContracts - Danh sách hợp đồng hiện có
 * @returns {boolean}
 */
export function hasOverlappingContract(newContract, existingContracts = []) {
  if (!newContract || !newContract.roomId || !newContract.startDate || !newContract.endDate) {
    return false;
  }

  return existingContracts.some((contract) => {
    // Bỏ qua chính nó khi cập nhật hợp đồng
    if (newContract.id && String(contract.id) === String(newContract.id)) {
      return false;
    }

    // Chỉ kiểm tra trên cùng phòng
    if (String(contract.roomId) !== String(newContract.roomId)) {
      return false;
    }

    // Bỏ qua các hợp đồng đã bị hủy/chấm dứt
    if (contract.status === CONTRACT_STATUS.CANCELLED || contract.status === CONTRACT_STATUS.TERMINATED) {
      return false;
    }

    return isDateRangeOverlap(
      newContract.startDate,
      newContract.endDate,
      contract.startDate,
      contract.endDate
    );
  });
}

/**
 * Kiểm tra hợp đồng có đang hiệu lực ở ngày hiện tại hay không.
 * @param {Object} contract 
 * @param {string|Date} [currentDate=new Date()] 
 * @returns {boolean}
 */
export function isContractActive(contract, currentDate = new Date()) {
  if (!contract || !contract.startDate || !contract.endDate) return false;

  // Nếu hợp đồng có trạng thái bị chấm dứt hoặc hủy thì coi như không còn active
  if (contract.status === CONTRACT_STATUS.CANCELLED || contract.status === CONTRACT_STATUS.TERMINATED) {
    return false;
  }

  const now = new Date(currentDate).getTime();
  const start = new Date(contract.startDate).getTime();
  const end = new Date(contract.endDate).getTime();

  return now >= start && now <= end;
}

/**
 * Kiểm tra hợp đồng có sắp hết hạn hay không (nằm trong ngưỡng warningDays).
 * @param {Object} contract 
 * @param {string|Date} [currentDate=new Date()] 
 * @param {number} [warningDays=30] 
 * @returns {boolean}
 */
export function isContractExpiringSoon(contract, currentDate = new Date(), warningDays = 30) {
  if (!isContractActive(contract, currentDate)) return false;

  const now = new Date(currentDate).getTime();
  const end = new Date(contract.endDate).getTime();

  const diffInDays = (end - now) / (1000 * 60 * 60 * 24);

  return diffInDays >= 0 && diffInDays <= warningDays;
}

/**
 * Tự động xác định trạng thái của hợp đồng dựa vào mốc thời gian.
 * @param {Object} contract 
 * @param {string|Date} [currentDate=new Date()] 
 * @param {number} [warningDays=30] 
 * @returns {string} Trạng thái CONTRACT_STATUS
 */
export function determineContractStatus(contract, currentDate = new Date(), warningDays = 30) {
  if (!contract) return CONTRACT_STATUS.CANCELLED;

  // Giữ nguyên các trạng thái chủ động như CANCELLED hoặc TERMINATED
  if (contract.status === CONTRACT_STATUS.CANCELLED || contract.status === CONTRACT_STATUS.TERMINATED) {
    return contract.status;
  }

  const now = new Date(currentDate).getTime();
  const start = new Date(contract.startDate).getTime();
  const end = new Date(contract.endDate).getTime();

  if (now < start) {
    return CONTRACT_STATUS.PENDING; // Chưa đến ngày bắt đầu
  }

  if (now > end) {
    return CONTRACT_STATUS.EXPIRED; // Đã quá hạn
  }

  if (isContractExpiringSoon(contract, currentDate, warningDays)) {
    return CONTRACT_STATUS.EXPIRING_SOON; // Sắp hết hạn
  }

  return CONTRACT_STATUS.ACTIVE; // Đang hiệu lực
}

/**
 * Kiểm tra số lượng khách thuê có vượt quá sức chứa tối đa của phòng không.
 * @param {Object} room 
 * @param {Array<string|number>} tenantIds - Danh sách người thuê (chủ HĐ + ở ghép)
 * @throws {Error} Nếu số lượng người vượt mức cho phép
 */
export function validateOccupancyLimit(room, tenantIds = []) {
  if (!room) {
    throw new Error('Thông tin phòng không tồn tại.');
  }

  const maxTenants = Number(room.maxTenants) || 1;
  const count = Array.isArray(tenantIds) ? tenantIds.length : 0;

  if (count > maxTenants) {
    throw new Error(`Số lượng người ở (${count} người) vượt quá sức chứa tối đa của phòng (${maxTenants} người).`);
  }
}