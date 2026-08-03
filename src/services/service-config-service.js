import { StorageService } from './storage-service.js';
import { ServiceConfigValidator } from '../business/service-config-validator.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';

export class ServiceConfigService {
  /**
   * Lấy danh sách tất cả dịch vụ
   */
  static getServices() {
    return StorageService.getAll(STORAGE_KEYS.SERVICE_CONFIGS) || [];
  }

  /**
   * Lấy thông tin dịch vụ theo ID
   */
  static getServiceById(id) {
    if (!id) return null;
    return StorageService.getById(STORAGE_KEYS.SERVICE_CONFIGS, id);
  }

  /**
   * Thêm dịch vụ mới
   */
  static createService(serviceData) {
    const existingServices = this.getServices();
    
    ServiceConfigValidator.validate(serviceData, existingServices);

    const payload = {
      ...serviceData,
      code: String(serviceData.code).trim().toUpperCase(),
      name: String(serviceData.name).trim(),
      unitPrice: Number(serviceData.unitPrice),
      isActive: serviceData.isActive !== undefined ? Boolean(serviceData.isActive) : true,
      createdAt: new Date().toISOString()
    };

    return StorageService.create(STORAGE_KEYS.SERVICE_CONFIGS, payload);
  }

  /**
   * Cập nhật dịch vụ
   * Lưu ý: Việc cập nhật đơn giá dịch vụ tại đây chỉ ảnh hưởng đến các tính toán hóa đơn trong tương lai.
   * Các hóa đơn cũ lưu thông tin dịch vụ theo dạng snapshot sẽ không bị thay đổi.
   */
  static updateService(id, updateData) {
    const existing = this.getServiceById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy dịch vụ với ID "${id}".`);
    }

    const merged = { ...existing, ...updateData, id };
    const allServices = this.getServices();

    ServiceConfigValidator.validate(merged, allServices);

    const payload = {
      ...merged,
      code: String(merged.code).trim().toUpperCase(),
      name: String(merged.name).trim(),
      unitPrice: Number(merged.unitPrice),
      updatedAt: new Date().toISOString()
    };

    return StorageService.update(STORAGE_KEYS.SERVICE_CONFIGS, id, payload);
  }

  /**
   * Ngưng áp dụng dịch vụ
   */
  static deactivateService(id) {
    const service = this.getServiceById(id);
    if (!service) {
      throw new Error(`Không tìm thấy dịch vụ với ID "${id}".`);
    }

    return StorageService.update(STORAGE_KEYS.SERVICE_CONFIGS, id, {
      ...service,
      isActive: false,
      deactivatedAt: new Date().toISOString()
    });
  }

  /**
   * Kích hoạt lại dịch vụ
   */
  static reactivateService(id) {
    const service = this.getServiceById(id);
    if (!service) {
      throw new Error(`Không tìm thấy dịch vụ với ID "${id}".`);
    }

    return StorageService.update(STORAGE_KEYS.SERVICE_CONFIGS, id, {
      ...service,
      isActive: true,
      reactivatedAt: new Date().toISOString()
    });
  }

  /**
   * Xóa vĩnh viễn dịch vụ (Chỉ xóa khi chưa được sử dụng trong hóa đơn nào)
   */
  static deleteService(id) {
    const service = this.getServiceById(id);
    if (!service) {
      throw new Error(`Không tìm thấy dịch vụ với ID "${id}".`);
    }

    // Kiểm tra xem dịch vụ đã từng có trong hóa đơn chưa
    const invoices = StorageService.getAll(STORAGE_KEYS.INVOICES) || [];
    const isUsedInInvoice = invoices.some((invoice) => {
      const items = invoice.items || invoice.services || [];
      return items.some((item) => String(item.serviceId) === String(id) || String(item.code) === String(service.code));
    });

    if (isUsedInInvoice) {
      throw new Error('Dịch vụ này đã được ghi nhận trong hóa đơn. Không thể xóa cứng, vui lòng chuyển sang "Ngưng áp dụng".');
    }

    return StorageService.remove(STORAGE_KEYS.SERVICE_CONFIGS, id);
  }

  /**
   * Tìm kiếm dịch vụ theo tên hoặc mã
   */
  static searchServices(keyword) {
    const services = this.getServices();
    if (!keyword || typeof keyword !== 'string') return services;

    const term = keyword.trim().toLowerCase();
    return services.filter((s) => 
      s.code.toLowerCase().includes(term) || 
      s.name.toLowerCase().includes(term)
    );
  }

  /**
   * Lọc dịch vụ theo trạng thái hoạt động
   */
  static filterServicesByStatus(isActiveFilter) {
    const services = this.getServices();
    if (isActiveFilter === 'ALL' || isActiveFilter === undefined || isActiveFilter === null) {
      return services;
    }

    const isActive = isActiveFilter === 'ACTIVE' || isActiveFilter === true;
    return services.filter((s) => Boolean(s.isActive) === isActive);
  }
}