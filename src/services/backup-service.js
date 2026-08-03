import { storageService } from './storage-service.js';
import { validateImportData, REQUIRED_COLLECTIONS } from '../business/import-validator.js';

export class BackupService {
  /**
   * Xuất toàn bộ dữ liệu hiện tại dưới dạng Object
   * @returns {Object} Dữ liệu toàn bộ các collection
   */
  exportData() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };

    REQUIRED_COLLECTIONS.forEach((collectionName) => {
      backupData[collectionName] = storageService.getCollection(collectionName) || [];
    });

    return backupData;
  }

  /**
   * Tạo file JSON và kích hoạt tải về máy với tên file chứa ngày giờ
   */
  downloadBackup() {
    const data = this.exportData();
    const jsonString = JSON.stringify(data, null, 2);

    // Tạo tên file có ngày giờ dạng YYYYMMDD_HHMMSS
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    const filename = `RoomMate_Backup_${timestamp}.json`;

    // Khởi tạo Blob và kích hoạt tải xuống
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Đọc nội dung file JSON do người dùng tải lên
   * @param {File} file - File được chọn từ input
   * @returns {Promise<Object>} Promise trả về dữ liệu JSON đã parse
   */
  readJsonFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Chưa chọn file.'));
        return;
      }

      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        reject(new Error('File được chọn phải có định dạng .json.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('File không chứa cú pháp JSON hợp lệ.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Lỗi trong quá trình đọc file.'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Kiểm tra dữ liệu backup
   * @param {Object} data
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validateBackupData(data) {
    return validateImportData(data);
  }

  /**
   * Tạo bản sao lưu tự động trước khi ghi đè dữ liệu
   */
  createBackupBeforeImport() {
    const currentData = this.exportData();
    const timestamp = new Date().toISOString();
    const autoBackupKey = `roommate_auto_backup_${timestamp}`;

    try {
      localStorage.setItem(autoBackupKey, JSON.stringify(currentData));
    } catch (e) {
      console.warn('Không đủ dung lượng lưu trữ bản sao lưu tự động vào LocalStorage.', e);
    }
  }

  /**
   * Nhập dữ liệu từ JSON vào hệ thống
   * @param {Object} data - Dữ liệu JSON cần import
   * @param {Object} options
   * @param {'overwrite'|'merge'} [options.mode='overwrite'] - Chế độ ghi đè hoặc gộp
   * @returns {{ success: boolean, errors?: string[] }}
   */
  importData(data, options = { mode: 'overwrite' }) {
    // 1. Kiểm tra tính hợp lệ của dữ liệu trước khi xử lý
    const validation = this.validateBackupData(data);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // 2. Nếu chế độ ghi đè (overwrite), tự động tạo bản sao lưu dữ liệu cũ
    if (options.mode === 'overwrite') {
      this.createBackupBeforeImport();

      // Cập nhật/ghi đè từng collection
      REQUIRED_COLLECTIONS.forEach((collectionName) => {
        storageService.setCollection(collectionName, data[collectionName]);
      });
    } else if (options.mode === 'merge') {
      // Chế độ gộp dữ liệu: giữ dữ liệu cũ, chỉ thêm các bản ghi có id chưa tồn tại
      REQUIRED_COLLECTIONS.forEach((collectionName) => {
        const existingItems = storageService.getCollection(collectionName) || [];
        const newItems = data[collectionName] || [];

        const existingIds = new Set(existingItems.map((item) => item.id).filter(Boolean));
        const itemsToAdd = newItems.filter((item) => !item.id || !existingIds.has(item.id));

        const mergedItems = [...existingItems, ...itemsToAdd];
        storageService.setCollection(collectionName, mergedItems);
      });
    }

    return {
      success: true,
    };
  }

  /**
   * Xóa toàn bộ dữ liệu hệ thống
   */
  resetAllData() {
    REQUIRED_COLLECTIONS.forEach((collectionName) => {
      storageService.setCollection(collectionName, []);
    });
  }

  /**
   * Khôi phục dữ liệu mẫu ban đầu (Seed Data)
   * @param {Object} seedData - Dữ liệu mẫu ban đầu
   */
  restoreSeedData(seedData) {
    if (!seedData) return;
    this.resetAllData();
    this.importData(seedData, { mode: 'overwrite' });
  }
}

export const backupService = new BackupService();