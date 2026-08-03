import { StorageService } from './storage-service.js';
import { RoomService } from './room-service.js';
import { ContractValidator } from '../business/contract-validator.js';
import { 
  determineContractStatus, 
  isContractActive, 
  hasOverlappingContract 
} from '../business/contract-utils.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';
import { CONTRACT_STATUS, ROOM_STATUS } from '../constants/statuses.js';

/**
 * Service quản lý logic nghiệp vụ cho Hợp đồng thuê phòng
 */
export class ContractService {
  /**
   * Lấy tất cả hợp đồng và tự động cập nhật trạng thái theo thời gian thực
   * @returns {Array<Object>}
   */
  static getContracts() {
    const contracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);
    const currentDate = new Date();
    
    // Tự động đồng bộ trạng thái theo mốc thời gian hiện tại
    return contracts.map((contract) => {
      const calculatedStatus = determineContractStatus(contract, currentDate);
      if (calculatedStatus !== contract.status) {
        const updated = { ...contract, status: calculatedStatus };
        StorageService.update(STORAGE_KEYS.CONTRACTS, contract.id, updated);
        return updated;
      }
      return contract;
    });
  }

  /**
   * Lấy hợp đồng theo ID
   * @param {string} id 
   * @returns {Object|null}
   */
  static getContractById(id) {
    if (!id) return null;
    const contract = StorageService.getById(STORAGE_KEYS.CONTRACTS, id);
    if (!contract) return null;

    // Tự động tính toán lại trạng thái khi truy vấn chi tiết
    const calculatedStatus = determineContractStatus(contract, new Date());
    if (calculatedStatus !== contract.status) {
      return StorageService.update(STORAGE_KEYS.CONTRACTS, id, {
        ...contract,
        status: calculatedStatus
      });
    }

    return contract;
  }

  /**
   * Tạo hợp đồng mới
   * @param {Object} contractData 
   * @returns {Object} Hợp đồng vừa tạo
   */
  static createContract(contractData) {
    const room = RoomService.getRoomById(contractData.roomId);
    if (!room) {
      throw new Error('Phòng thuê không tồn tại.');
    }

    const existingContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);

    // 1. Validate dữ liệu & Quy tắc nghiệp vụ
    ContractValidator.validateContract(contractData, room, existingContracts);

    // Snapshot giá thuê hiện tại của phòng nếu người dùng không truyền giá riêng
    const rentalPrice = contractData.rentalPrice !== undefined && contractData.rentalPrice !== ''
      ? Number(contractData.rentalPrice)
      : Number(room.price);

    const depositAmount = contractData.depositAmount !== undefined && contractData.depositAmount !== ''
      ? Number(contractData.depositAmount)
      : 0;

    const initialStatus = contractData.status || determineContractStatus({
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      status: CONTRACT_STATUS.PENDING
    }, new Date());

    const newContractPayload = {
      ...contractData,
      roomId: String(contractData.roomId),
      tenantId: String(contractData.tenantId),
      memberIds: Array.isArray(contractData.memberIds) ? contractData.memberIds.map(String) : [],
      rentalPrice,
      depositAmount,
      status: initialStatus,
      createdAt: new Date().toISOString()
    };

    // 2. Lưu hợp đồng
    const createdContract = StorageService.create(STORAGE_KEYS.CONTRACTS, newContractPayload);

    // 3. Nếu hợp đồng kích hoạt ngay lập tức -> Cập nhật phòng sang ĐANG THUÊ
    if (isContractActive(createdContract, new Date())) {
      try {
        RoomService.updateRoomStatus(room.id, ROOM_STATUS.RENTED);
      } catch (error) {
        // Rollback hợp đồng nếu cập nhật phòng thất bại (Đảm bảo tính nhất quán)
        StorageService.remove(STORAGE_KEYS.CONTRACTS, createdContract.id);
        throw new Error(`Không thể cập nhật trạng thái phòng: ${error.message}`);
      }
    }

    return createdContract;
  }

  /**
   * Cập nhật thông tin hợp đồng
   * @param {string} id 
   * @param {Object} updateData 
   * @returns {Object} Hợp đồng sau khi chỉnh sửa
   */
  static updateContract(id, updateData) {
    const existingContract = this.getContractById(id);
    if (!existingContract) {
      throw new Error(`Không tìm thấy hợp đồng với ID "${id}".`);
    }

    // Không được sửa tùy ý hợp đồng đã kết thúc hoặc đã hủy
    if (existingContract.status === CONTRACT_STATUS.EXPIRED || 
        existingContract.status === CONTRACT_STATUS.TERMINATED || 
        existingContract.status === CONTRACT_STATUS.CANCELLED) {
      throw new Error('Không thể chỉnh sửa hợp đồng đã kết thúc, đã thanh lý hoặc đã bị hủy.');
    }

    const mergedContract = { ...existingContract, ...updateData, id };
    const room = RoomService.getRoomById(mergedContract.roomId);
    if (!room) {
      throw new Error('Phòng thuê không tồn tại.');
    }

    const allContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);
    ContractValidator.validateContract(mergedContract, room, allContracts);

    const updated = StorageService.update(STORAGE_KEYS.CONTRACTS, id, mergedContract);
    
    // Đồng bộ lại trạng thái phòng nếu thay đổi liên quan đến ngày hiệu lực
    this.syncRoomStatus(mergedContract.roomId);

    return updated;
  }

  /**
   * Kích hoạt hợp đồng (Chuyển sang ACTIVE)
   * @param {string} id 
   * @returns {Object}
   */
  static activateContract(id) {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Không tìm thấy hợp đồng với ID "${id}".`);
    }

    if (contract.status === CONTRACT_STATUS.ACTIVE) {
      return contract;
    }

    if (contract.status === CONTRACT_STATUS.EXPIRED || 
        contract.status === CONTRACT_STATUS.TERMINATED || 
        contract.status === CONTRACT_STATUS.CANCELLED) {
      throw new Error('Không thể kích hoạt hợp đồng đã hết hạn, đã hủy hoặc đã thanh lý.');
    }

    const updatedContract = StorageService.update(STORAGE_KEYS.CONTRACTS, id, {
      ...contract,
      status: CONTRACT_STATUS.ACTIVE
    });

    // Cập nhật trạng thái phòng thành RENTED
    RoomService.updateRoomStatus(contract.roomId, ROOM_STATUS.RENTED);

    return updatedContract;
  }

  /**
   * Gia hạn hợp đồng (Thay đổi ngày kết thúc mới)
   * @param {string} id 
   * @param {string} newEndDate 
   * @returns {Object}
   */
  static extendContract(id, newEndDate) {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Không tìm thấy hợp đồng với ID "${id}".`);
    }

    if (contract.status === CONTRACT_STATUS.CANCELLED || contract.status === CONTRACT_STATUS.TERMINATED) {
      throw new Error('Không thể gia hạn hợp đồng đã hủy hoặc thanh lý.');
    }

    const extendedContract = { ...contract, endDate: newEndDate };
    const room = RoomService.getRoomById(contract.roomId);
    const allContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);

    // Validate lại thời gian kết thúc mới và kiểm tra trùng lặp
    ContractValidator.validateContract(extendedContract, room, allContracts);

    const calculatedStatus = determineContractStatus(extendedContract, new Date());

    const updated = StorageService.update(STORAGE_KEYS.CONTRACTS, id, {
      ...extendedContract,
      status: calculatedStatus
    });

    this.syncRoomStatus(contract.roomId);

    return updated;
  }

  /**
   * Kết thúc/Thanh lý hợp đồng
   * @param {string} id 
   * @param {string} [actualEndDate] - Ngày kết thúc thực tế (tùy chọn)
   * @returns {Object}
   */
  static endContract(id, actualEndDate) {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Không tìm thấy hợp đồng với ID "${id}".`);
    }

    const endDate = actualEndDate || contract.endDate;

    const updatedContract = StorageService.update(STORAGE_KEYS.CONTRACTS, id, {
      ...contract,
      endDate: endDate,
      status: CONTRACT_STATUS.TERMINATED,
      terminatedAt: new Date().toISOString()
    });

    // Giải phóng phòng nếu không còn hợp đồng hiệu lực khác
    this.syncRoomStatus(contract.roomId);

    return updatedContract;
  }

  /**
   * Hủy hợp đồng
   * @param {string} id 
   * @returns {Object}
   */
  static cancelContract(id) {
    const contract = this.getContractById(id);
    if (!contract) {
      throw new Error(`Không tìm thấy hợp đồng với ID "${id}".`);
    }

    const updatedContract = StorageService.update(STORAGE_KEYS.CONTRACTS, id, {
      ...contract,
      status: CONTRACT_STATUS.CANCELLED,
      cancelledAt: new Date().toISOString()
    });

    // Đồng bộ lại trạng thái phòng
    this.syncRoomStatus(contract.roomId);

    return updatedContract;
  }

  /**
   * Tìm kiếm hợp đồng theo từ khóa (Mã HĐ, Tên phòng, Thông tin khách)
   * @param {string} keyword 
   * @returns {Array<Object>}
   */
  static searchContracts(keyword) {
    const contracts = this.getContracts();
    if (!keyword || typeof keyword !== 'string') return contracts;

    const term = keyword.trim().toLowerCase();
    const rooms = RoomService.getRooms();
    const tenants = StorageService.getAll(STORAGE_KEYS.TENANTS);

    return contracts.filter((contract) => {
      const room = rooms.find((r) => String(r.id) === String(contract.roomId));
      const tenant = tenants.find((t) => String(t.id) === String(contract.tenantId));

      const matchId = String(contract.id).toLowerCase().includes(term);
      const matchRoom = room && (room.number.toLowerCase().includes(term) || room.name?.toLowerCase().includes(term));
      const matchTenant = tenant && (tenant.fullName.toLowerCase().includes(term) || tenant.phone.includes(term));

      return matchId || matchRoom || matchTenant;
    });
  }

  /**
   * Lọc hợp đồng đa điều kiện
   * @param {Object} filters { status, roomId, tenantId, startDate, endDate }
   * @returns {Array<Object>}
   */
  static filterContracts(filters = {}) {
    let contracts = this.getContracts();

    if (filters.status) {
      contracts = contracts.filter((c) => c.status === filters.status);
    }

    if (filters.roomId) {
      contracts = contracts.filter((c) => String(c.roomId) === String(filters.roomId));
    }

    if (filters.tenantId) {
      contracts = contracts.filter((c) => 
        String(c.tenantId) === String(filters.tenantId) || 
        (Array.isArray(c.memberIds) && c.memberIds.some((mId) => String(mId) === String(filters.tenantId)))
      );
    }

    if (filters.startDate) {
      const filterStart = new Date(filters.startDate).getTime();
      contracts = contracts.filter((c) => new Date(c.startDate).getTime() >= filterStart);
    }

    if (filters.endDate) {
      const filterEnd = new Date(filters.endDate).getTime();
      contracts = contracts.filter((c) => new Date(c.endDate).getTime() <= filterEnd);
    }

    return contracts;
  }

  /**
   * Lấy hợp đồng đang hiệu lực duy nhất của một phòng
   * @param {string} roomId 
   * @returns {Object|null}
   */
  static getActiveContractByRoom(roomId) {
    if (!roomId) return null;
    const contracts = this.getContracts();
    const currentDate = new Date();

    return contracts.find((c) => 
      String(c.roomId) === String(roomId) && 
      (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.EXPIRING_SOON) &&
      isContractActive(c, currentDate)
    ) || null;
  }

  /**
   * Lấy danh sách các hợp đồng sắp hết hạn trong N ngày tới
   * @param {number} [days=30] 
   * @returns {Array<Object>}
   */
  static getExpiringContracts(days = 30) {
    const contracts = this.getContracts();
    const currentDate = new Date();

    return contracts.filter((contract) => {
      if (contract.status === CONTRACT_STATUS.CANCELLED || contract.status === CONTRACT_STATUS.TERMINATED) {
        return false;
      }

      const end = new Date(contract.endDate).getTime();
      const now = currentDate.getTime();
      const diffInDays = (end - now) / (1000 * 60 * 60 * 24);

      return diffInDays >= 0 && diffInDays <= days;
    });
  }

  /**
   * Helper đồng bộ trạng thái phòng dựa trên tất cả hợp đồng hiện tại
   * @private
   */
  static syncRoomStatus(roomId) {
    const room = RoomService.getRoomById(roomId);
    if (!room) return;

    // Bỏ qua phòng đang bảo trì
    if (room.status === ROOM_STATUS.MAINTENANCE) return;

    const activeContract = this.getActiveContractByRoom(roomId);

    if (activeContract) {
      if (room.status !== ROOM_STATUS.RENTED) {
        RoomService.updateRoomStatus(roomId, ROOM_STATUS.RENTED);
      }
    } else {
      if (room.status !== ROOM_STATUS.AVAILABLE) {
        RoomService.updateRoomStatus(roomId, ROOM_STATUS.AVAILABLE);
      }
    }
  }
}