import { generateUniqueId } from '../utils/id-utils.js';
import { getCurrentIsoDate } from '../utils/date-utils.js';

const COLLECTION_KEYS = Object.freeze({
  rooms: 'roommate_rooms',
  tenants: 'roommate_tenants',
  contracts: 'roommate_contracts',
  invoices: 'roommate_invoices',
  utilityReadings: 'roommate_meter_readings',
  services: 'roommate_services',
  payments: 'roommate_payments',
});

/**
 * Service thao tác dùng chung với LocalStorage cho ứng dụng RoomMate
 */
export class StorageService {
  /**
   * Giải mã JSON an toàn với giá trị fallback nếu bị lỗi
   * @param {string|null} value - Chuỗi JSON cần parse
   * @param {any} fallback - Giá trị mặc định nếu parse lỗi hoặc null
   * @returns {any}
   */
  static safeParse(value, fallback = []) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('[StorageService] Lỗi JSON.parse:', error);
      return fallback;
    }
  }

  /**
   * Lấy toàn bộ danh sách bản ghi theo Storage Key
   * @param {string} key 
   * @returns {Array} Danh sách bản ghi (mảng rỗng nếu chưa có)
   */
  static getAll(key) {
    if (!key) throw new Error('[StorageService] Key không được để trống.');
    const data = localStorage.getItem(key);
    const parsed = this.safeParse(data, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  /**
   * Lấy một bản ghi theo ID
   * @param {string} key 
   * @param {string|number} id 
   * @returns {Object|null} Bản ghi tìm thấy hoặc null
   */
  static getById(key, id) {
    if (id === null || id === undefined) return null;
    const items = this.getAll(key);
    const item = items.find((it) => String(it.id) === String(id));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  /**
   * Thêm mới một bản ghi
   * @param {string} key 
   * @param {Object} item 
   * @returns {Object} Bản ghi đã được thêm mới (kèm id, createdAt, updatedAt)
   * @throws {Error} Nếu item không phải object hoặc trùng ID
   */
  static create(key, item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('[StorageService] Dữ liệu tạo mới phải là một Object.');
    }

    const items = this.getAll(key);
    const newItem = JSON.parse(JSON.stringify(item));

    // Đảm bảo có ID
    if (!newItem.id) {
      newItem.id = generateUniqueId();
    } else {
      // Kiểm tra trùng ID
      const isDuplicate = items.some((it) => String(it.id) === String(newItem.id));
      if (isDuplicate) {
        throw new Error(`[StorageService] Bản ghi với ID "${newItem.id}" đã tồn tại.`);
      }
    }

    const now = getCurrentIsoDate();
    newItem.createdAt = newItem.createdAt || now;
    newItem.updatedAt = now;

    items.push(newItem);
    localStorage.setItem(key, JSON.stringify(items));

    return JSON.parse(JSON.stringify(newItem));
  }

  /**
   * Cập nhật một bản ghi theo ID
   * @param {string} key 
   * @param {string|number} id 
   * @param {Object} changes 
   * @returns {Object} Bản ghi sau khi cập nhật
   * @throws {Error} Nếu không tìm thấy ID hoặc changes không phải object
   */
  static update(key, id, changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new Error('[StorageService] Dữ liệu thay đổi phải là một Object.');
    }

    const items = this.getAll(key);
    const index = items.findIndex((it) => String(it.id) === String(id));

    if (index === -1) {
      throw new Error(`[StorageService] Không tìm thấy bản ghi với ID "${id}" để cập nhật.`);
    }

    const currentItem = items[index];
    const updatedItem = {
      ...currentItem,
      ...JSON.parse(JSON.stringify(changes)),
      id: currentItem.id, // Đảm bảo không bị sửa ID
      createdAt: currentItem.createdAt, // Đảm bảo giữ nguyên ngày tạo
      updatedAt: getCurrentIsoDate()
    };

    items[index] = updatedItem;
    localStorage.setItem(key, JSON.stringify(items));

    return JSON.parse(JSON.stringify(updatedItem));
  }

  /**
   * Xóa một bản ghi theo ID
   * @param {string} key 
   * @param {string|number} id 
   * @returns {boolean} true nếu xóa thành công, false nếu không tìm thấy
   */
  static remove(key, id) {
    const items = this.getAll(key);
    const initialLength = items.length;
    const filteredItems = items.filter((it) => String(it.id) !== String(id));

    if (filteredItems.length === initialLength) {
      return false;
    }

    localStorage.setItem(key, JSON.stringify(filteredItems));
    return true;
  }

  /**
   * Kiểm tra bản ghi tồn tại theo điều kiện (predicate)
   * @param {string} key 
   * @param {Function} predicate - Hàm điều kiện (item => boolean)
   * @returns {boolean}
   */
  static exists(key, predicate) {
    if (typeof predicate !== 'function') {
      throw new Error('[StorageService] Predicate phải là một hàm.');
    }
    const items = this.getAll(key);
    return items.some(predicate);
  }

  /**
   * Ghi đè toàn bộ danh sách bản ghi của một key
   * @param {string} key 
   * @param {Array} items 
   * @returns {Array} Danh sách mới đã được lưu
   */
  static replaceAll(key, items) {
    if (!Array.isArray(items)) {
      throw new Error('[StorageService] Dữ liệu thay thế phải là một Mảng.');
    }
    const clonedItems = JSON.parse(JSON.stringify(items));
    localStorage.setItem(key, JSON.stringify(clonedItems));
    return clonedItems;
  }

  /**
   * Xóa dữ liệu của một key cụ thể
   * @param {string} key 
   */
  static clearKey(key) {
    if (key) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Xóa toàn bộ dữ liệu LocalStorage
   */
  static clearAll() {
    localStorage.clear();
  }

  /**
   * Export toàn bộ dữ liệu trong LocalStorage dưới dạng Object
   * @returns {Object} Dữ liệu toàn bộ app
   */
  static exportAll() {
    const exportData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const raw = localStorage.getItem(key);
        exportData[key] = this.safeParse(raw, raw);
      }
    }
    return exportData;
  }

  /**
   * Import dữ liệu từ một Object vào LocalStorage
   * @param {Object} data 
   * @returns {boolean} true nếu import thành công
   * @throws {Error} Nếu data không phải Object
   */
  static importAll(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('[StorageService] Dữ liệu import phải là một Object hợp lệ.');
    }

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    });

    return true;
  }

  // =========================================================================
  // BỔ SUNG CÁC HELPER METHOD CHO INSTANCE (Tương thích với ReportService & các service khác)
  // =========================================================================

  getRooms() {
    return StorageService.getAll('rooms');
  }

  getTenants() {
    return StorageService.getAll('tenants');
  }

  getContracts() {
    return StorageService.getAll('contracts');
  }

  getInvoices() {
    return StorageService.getAll('invoices');
  }

  getPayments() {
    return StorageService.getAll('payments');
  }

  getServices() {
    return StorageService.getAll('services');
  }

  getMeterReadings() {
    return StorageService.getAll('meter_readings');
  }

  // Wrapper gọi static method từ instance
  getAll(key) {
    return StorageService.getAll(key);
  }

  // BackupService works with portable collection names, while application
  // services use the namespaced LocalStorage keys above.
  getCollection(collectionName) {
    return StorageService.getAll(COLLECTION_KEYS[collectionName] || collectionName);
  }

  setCollection(collectionName, items) {
    return StorageService.replaceAll(COLLECTION_KEYS[collectionName] || collectionName, items);
  }

  getById(key, id) {
    return StorageService.getById(key, id);
  }

  create(key, item) {
    return StorageService.create(key, item);
  }

  update(key, id, changes) {
    return StorageService.update(key, id, changes);
  }

  remove(key, id) {
    return StorageService.remove(key, id);
  }
}

// Export instance dùng chung
export const storageService = new StorageService();
