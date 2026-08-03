import { StorageService } from './storage-service.js';
import { TenantValidator } from '../business/tenant-validator.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';
import { TENANT_STATUS, CONTRACT_STATUS } from '../constants/statuses.js';

/**
 * Service quản lý logic nghiệp vụ cho Người thuê
 */
export class TenantService {
  /**
   * Lấy danh sách người thuê đang hoạt động (Mặc định ẩn người thuê đã lưu trữ)
   * @param {boolean} includeArchived - Có bao gồm người thuê đã lưu trữ hay không
   * @returns {Array}
   */
  static getTenants(includeArchived = false) {
    const tenants = StorageService.getAll(STORAGE_KEYS.TENANTS);
    if (includeArchived) {
      return tenants;
    }
    return tenants.filter((tenant) => tenant.status !== TENANT_STATUS.ARCHIVED);
  }

  /**
   * Lấy thông tin người thuê theo ID
   * @param {string} id 
   * @returns {Object|null}
   */
  static getTenantById(id) {
    if (!id) return null;
    return StorageService.getById(STORAGE_KEYS.TENANTS, id);
  }

  /**
   * Tạo mới người thuê
   * @param {Object} tenantData 
   * @returns {Object} Người thuê vừa tạo
   */
  static createTenant(tenantData) {
    TenantValidator.validate(tenantData);

    const normalizedPhone = TenantValidator.normalizePhone(tenantData.phone);
    const normalizedIdCard = TenantValidator.normalizeIdCard(tenantData.idCard);

    // Kiểm tra trùng CCCD (chỉ check khi người dùng có nhập CCCD)
    if (normalizedIdCard) {
      const isDuplicateIdCard = StorageService.exists(
        STORAGE_KEYS.TENANTS,
        (t) => t.idCard && TenantValidator.normalizeIdCard(t.idCard) === normalizedIdCard
      );

      if (isDuplicateIdCard) {
        throw new Error(`Số CCCD/CMND "${normalizedIdCard}" đã tồn tại trong hệ thống.`);
      }
    }

    const newTenant = {
      ...tenantData,
      fullName: tenantData.fullName.trim(),
      phone: normalizedPhone,
      idCard: normalizedIdCard || '',
      email: tenantData.email ? tenantData.email.trim() : '',
      status: tenantData.status || TENANT_STATUS.ACTIVE
    };

    return StorageService.create(STORAGE_KEYS.TENANTS, newTenant);
  }

  /**
   * Cập nhật thông tin người thuê
   * @param {string} id 
   * @param {Object} updateData 
   * @returns {Object} Dữ liệu người thuê sau cập nhật
   */
  static updateTenant(id, updateData) {
    const existingTenant = this.getTenantById(id);
    if (!existingTenant) {
      throw new Error(`Không tìm thấy người thuê với ID "${id}".`);
    }

    const mergedData = { ...existingTenant, ...updateData };
    TenantValidator.validate(mergedData);

    const normalizedPhone = TenantValidator.normalizePhone(mergedData.phone);
    const normalizedIdCard = TenantValidator.normalizeIdCard(mergedData.idCard);

    // Kiểm tra trùng CCCD nếu người thuê đổi CCCD hoặc cập nhật mới
    if (normalizedIdCard) {
      const isDuplicateIdCard = StorageService.exists(
        STORAGE_KEYS.TENANTS,
        (t) => String(t.id) !== String(id) && 
               t.idCard && 
               TenantValidator.normalizeIdCard(t.idCard) === normalizedIdCard
      );

      if (isDuplicateIdCard) {
        throw new Error(`Số CCCD/CMND "${normalizedIdCard}" đã tồn tại trong hệ thống.`);
      }
    }

    mergedData.fullName = mergedData.fullName.trim();
    mergedData.phone = normalizedPhone;
    mergedData.idCard = normalizedIdCard || '';
    mergedData.email = mergedData.email ? mergedData.email.trim() : '';

    return StorageService.update(STORAGE_KEYS.TENANTS, id, mergedData);
  }

  /**
   * Lưu trữ người thuê (Soft delete / Chuyển trạng thái ARCHIVED)
   * @param {string} id 
   * @returns {Object}
   */
  static archiveTenant(id) {
    const tenant = this.getTenantById(id);
    if (!tenant) {
      throw new Error(`Không tìm thấy người thuê với ID "${id}".`);
    }

    // Kiểm tra xem người thuê có hợp đồng đang hiệu lực không
    const hasActiveContract = this.hasActiveContract(id);
    if (hasActiveContract) {
      throw new Error('Không thể lưu trữ người thuê đang có hợp đồng hiệu lực.');
    }

    return StorageService.update(STORAGE_KEYS.TENANTS, id, {
      ...tenant,
      status: TENANT_STATUS.ARCHIVED
    });
  }

  /**
   * Xóa vĩnh viễn người thuê
   * @param {string} id 
   * @returns {boolean}
   */
  static deleteTenant(id) {
    const tenant = this.getTenantById(id);
    if (!tenant) {
      throw new Error(`Không tìm thấy người thuê với ID "${id}".`);
    }

    // Quy tắc: Không xóa người thuê có hợp đồng đang hiệu lực
    const hasActiveContract = this.hasActiveContract(id);
    if (hasActiveContract) {
      throw new Error('Không thể xóa người thuê đang có hợp đồng hiệu lực. Vui lòng lưu trữ thay thế.');
    }

    return StorageService.remove(STORAGE_KEYS.TENANTS, id);
  }

  /**
   * Tìm kiếm người thuê theo tên, số điện thoại hoặc CCCD (Mặc định không gồm bản ghi lưu trữ)
   * @param {string} keyword 
   * @param {boolean} includeArchived 
   * @returns {Array}
   */
  static searchTenants(keyword, includeArchived = false) {
    const tenants = this.getTenants(includeArchived);
    if (!keyword || typeof keyword !== 'string') return tenants;

    const term = keyword.trim().toLowerCase();
    const normalizedTerm = TenantValidator.normalizePhone(term);

    return tenants.filter((tenant) => {
      const nameMatch = tenant.fullName && tenant.fullName.toLowerCase().includes(term);
      const phoneMatch = tenant.phone && tenant.phone.includes(normalizedTerm);
      const idCardMatch = tenant.idCard && tenant.idCard.toLowerCase().includes(term);

      return nameMatch || phoneMatch || idCardMatch;
    });
  }

  /**
   * Lấy lịch sử thuê phòng của người thuê (Danh sách các hợp đồng)
   * @param {string} tenantId 
   * @returns {Array}
   */
  static getTenantRentalHistory(tenantId) {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error(`Không tìm thấy người thuê với ID "${tenantId}".`);
    }

    const allContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);
    const rooms = StorageService.getAll(STORAGE_KEYS.ROOMS);

    // Lọc hợp đồng mà người thuê tham gia (chủ hợp đồng hoặc thành viên ở ghép)
    const history = allContracts.filter((contract) => {
      const isPrimary = String(contract.tenantId) === String(tenantId);
      const isMember = Array.isArray(contract.memberIds) && 
                       contract.memberIds.some((memberId) => String(memberId) === String(tenantId));
      return isPrimary || isMember;
    });

    // Ép thêm thông tin phòng vào lịch sử hợp đồng để tiện truy xuất
    return history.map((contract) => {
      const room = rooms.find((r) => String(r.id) === String(contract.roomId)) || null;
      return {
        ...contract,
        roomNumber: room ? room.number : 'N/A',
        roomPrice: room ? room.price : 0
      };
    });
  }

  /**
   * Lấy thông tin phòng hiện tại người thuê đang ở
   * @param {string} tenantId 
   * @returns {Object|null} Thông tin phòng hoặc null nếu chưa/không thuê phòng nào
   */
  static getCurrentRoomOfTenant(tenantId) {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error(`Không tìm thấy người thuê với ID "${tenantId}".`);
    }

    const allContracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS);

    // Tìm hợp đồng đang có hiệu lực
    const activeContract = allContracts.find((contract) => {
      const isActiveStatus = contract.status === CONTRACT_STATUS.ACTIVE || 
                             contract.status === CONTRACT_STATUS.EXPIRING_SOON;

      if (!isActiveStatus) return false;

      const isPrimary = String(contract.tenantId) === String(tenantId);
      const isMember = Array.isArray(contract.memberIds) && 
                       contract.memberIds.some((memberId) => String(memberId) === String(tenantId));

      return isPrimary || isMember;
    });

    if (!activeContract) return null;

    return StorageService.getById(STORAGE_KEYS.ROOMS, activeContract.roomId);
  }

  /**
   * Helper kiểm tra người thuê có đang có hợp đồng hiệu lực hay không
   * @private
   */
  static hasActiveContract(tenantId) {
    return StorageService.exists(
      STORAGE_KEYS.CONTRACTS,
      (c) => (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.EXPIRING_SOON) &&
             (String(c.tenantId) === String(tenantId) || 
             (Array.isArray(c.memberIds) && c.memberIds.some((mId) => String(mId) === String(tenantId))))
    );
  }
}