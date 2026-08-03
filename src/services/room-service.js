import { StorageService } from './storage-service.js';
import { RoomValidator } from '../business/room-validator.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';
import { ROOM_STATUS, CONTRACT_STATUS, TENANT_STATUS } from '../constants/statuses.js';

/**
 * Service quản lý logic nghiệp vụ cho Phòng
 */
export class RoomService {
  /**
   * Lấy tất cả phòng
   * @returns {Array}
   */
  static getRooms() {
    return StorageService.getAll(STORAGE_KEYS.ROOMS);
  }

  /**
   * Lấy thông tin phòng theo ID
   * @param {string} id 
   * @returns {Object|null}
   */
  static getRoomById(id) {
    if (!id) return null;
    return StorageService.getById(STORAGE_KEYS.ROOMS, id);
  }

  /**
   * Thêm phòng mới
   * @param {Object} roomData 
   * @returns {Object} Phòng vừa được tạo
   */
  static createRoom(roomData) {
    RoomValidator.validate(roomData);

    const normalizedNumber = RoomValidator.normalizeRoomNumber(roomData.number);

    // Kiểm tra trùng mã phòng
    const isDuplicate = StorageService.exists(
      STORAGE_KEYS.ROOMS,
      (room) => RoomValidator.normalizeRoomNumber(room.number) === normalizedNumber
    );

    if (isDuplicate) {
      throw new Error(`Mã/Số phòng "${normalizedNumber}" đã tồn tại trong hệ thống.`);
    }

    const newRoom = {
      ...roomData,
      number: normalizedNumber,
      status: roomData.status || ROOM_STATUS.AVAILABLE
    };

    return StorageService.create(STORAGE_KEYS.ROOMS, newRoom);
  }

  /**
   * Cập nhật thông tin phòng
   * @param {string} id 
   * @param {Object} updateData 
   * @returns {Object} Phòng sau khi cập nhật
   */
  static updateRoom(id, updateData) {
    const existingRoom = this.getRoomById(id);
    if (!existingRoom) {
      throw new Error(`Không tìm thấy phòng với ID "${id}".`);
    }

    const mergedData = { ...existingRoom, ...updateData };
    RoomValidator.validate(mergedData);

    // Kiểm tra trùng mã phòng nếu có đổi mã
    if (updateData.number) {
      const normalizedNumber = RoomValidator.normalizeRoomNumber(updateData.number);
      const isDuplicate = StorageService.exists(
        STORAGE_KEYS.ROOMS,
        (room) => String(room.id) !== String(id) && RoomValidator.normalizeRoomNumber(room.number) === normalizedNumber
      );

      if (isDuplicate) {
        throw new Error(`Mã/Số phòng "${normalizedNumber}" đã tồn tại trong hệ thống.`);
      }
      mergedData.number = normalizedNumber;
    }

    // Kiểm tra ràng buộc hợp đồng đang hiệu lực
    const activeContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS).filter(
      (c) => String(c.roomId) === String(id) && 
             (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.EXPIRING_SOON)
    );

    const hasActiveContract = activeContracts.length > 0;

    // Quy tắc: Không cho chuyển phòng thành trống (AVAILABLE) nếu có hợp đồng đang hiệu lực
    if (hasActiveContract && mergedData.status === ROOM_STATUS.AVAILABLE) {
      throw new Error('Không thể chuyển phòng sang trạng thái "Trống" khi đang có hợp đồng hiệu lực.');
    }

    // Quy tắc: Không cho chuyển phòng đang thuê/bảo trì bất hợp lý khi đang có hợp đồng
    if (hasActiveContract && mergedData.status === ROOM_STATUS.MAINTENANCE) {
      throw new Error('Không thể chuyển phòng sang "Bảo trì" khi đang có hợp đồng hiệu lực.');
    }

    return StorageService.update(STORAGE_KEYS.ROOMS, id, mergedData);
  }

  /**
   * Xóa phòng
   * @param {string} id 
   * @returns {boolean}
   */
  static deleteRoom(id) {
    const existingRoom = this.getRoomById(id);
    if (!existingRoom) {
      throw new Error(`Không tìm thấy phòng với ID "${id}".`);
    }

    // Quy tắc: Không xóa phòng có hợp đồng đang hiệu lực
    const hasActiveContract = StorageService.exists(
      STORAGE_KEYS.CONTRACTS,
      (c) => String(c.roomId) === String(id) && 
             (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.EXPIRING_SOON)
    );

    if (hasActiveContract) {
      throw new Error('Không thể xóa phòng đang có hợp đồng đang hiệu lực.');
    }

    return StorageService.remove(STORAGE_KEYS.ROOMS, id);
  }

  /**
   * Tìm kiếm phòng theo từ khóa (Mã phòng, tầng, mô tả)
   * @param {string} keyword 
   * @returns {Array}
   */
  static searchRooms(keyword) {
    if (!keyword || typeof keyword !== 'string') return this.getRooms();

    const term = keyword.trim().toLowerCase();
    return this.getRooms().filter((room) => {
      const numberMatch = room.number && room.number.toLowerCase().includes(term);
      const floorMatch = room.floor !== undefined && String(room.floor).includes(term);
      const descMatch = room.description && room.description.toLowerCase().includes(term);
      return numberMatch || floorMatch || descMatch;
    });
  }

  /**
   * Lọc danh sách phòng theo điều kiện
   * @param {Object} filters - { status, floor, minPrice, maxPrice }
   * @returns {Array}
   */
  static filterRooms(filters = {}) {
    let rooms = this.getRooms();

    if (filters.status) {
      rooms = rooms.filter((r) => r.status === filters.status);
    }

    if (filters.floor !== undefined && filters.floor !== null && filters.floor !== '') {
      rooms = rooms.filter((r) => Number(r.floor) === Number(filters.floor));
    }

    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      rooms = rooms.filter((r) => Number(r.price) >= Number(filters.minPrice));
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      rooms = rooms.filter((r) => Number(r.price) <= Number(filters.maxPrice));
    }

    return rooms;
  }

  /**
   * Lấy danh sách các phòng sẵn sàng cho thuê (Trạng thái AVAILABLE & không sửa chữa)
   * @returns {Array}
   */
  static getAvailableRooms() {
    return this.getRooms().filter(
      (room) => room.status === ROOM_STATUS.AVAILABLE && room.status !== ROOM_STATUS.MAINTENANCE
    );
  }

  /**
   * Lấy thông tin tỉ lệ lấp đầy & danh sách người ở hiện tại của 1 phòng
   * @param {string} roomId 
   * @returns {Object} { room, currentTenantsCount, maxTenants, tenants, contract }
   */
  static getRoomOccupancy(roomId) {
    const room = this.getRoomById(roomId);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với ID "${roomId}".`);
    }

    // Lấy khách thuê đang ở trong phòng này
    const tenants = StorageService.getAll(STORAGE_KEYS.TENANTS).filter(
      (t) => String(t.roomId) === String(roomId) && t.status === TENANT_STATUS.ACTIVE
    );

    // Lấy hợp đồng hiệu lực của phòng
    const activeContract = StorageService.getAll(STORAGE_KEYS.CONTRACTS).find(
      (c) => String(c.roomId) === String(roomId) && 
             (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.EXPIRING_SOON)
    ) || null;

    return {
      roomId: room.id,
      roomNumber: room.number,
      status: room.status,
      currentTenantsCount: tenants.length,
      maxTenants: room.maxTenants,
      isFull: tenants.length >= room.maxTenants,
      tenants: tenants,
      activeContract: activeContract
    };
  }
}