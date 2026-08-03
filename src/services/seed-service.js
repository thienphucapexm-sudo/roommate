import { StorageService } from './storage-service.js';
import { SEED_DATA } from '../data/seed-data.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';

/**
 * Service quản lý khởi tạo và làm sạch dữ liệu mẫu cho ứng dụng RoomMate
 */
export class SeedService {
  /**
   * Khởi tạo dữ liệu mẫu nếu hệ thống chưa có dữ liệu (Lần đầu chạy app)
   * Không đè dữ liệu nếu đã tồn tại dữ liệu trước đó.
   * @returns {boolean} true nếu đã nạp seed data, false nếu đã có sẵn dữ liệu
   */
  static seedIfEmpty() {
    const existingRooms = StorageService.getAll(STORAGE_KEYS.ROOMS);
    
    if (existingRooms && existingRooms.length > 0) {
      console.log('[SeedService] Dữ liệu đã tồn tại, bỏ qua bước khởi tạo.');
      return false;
    }

    console.log('[SeedService] Phát hiện LocalStorage trống. Đang nạp dữ liệu mẫu...');
    this.resetToSeedData();
    return true;
  }

  /**
   * Khôi phục toàn bộ hệ thống về bộ dữ liệu mẫu ban đầu (Overwrite)
   */
  static resetToSeedData() {
    StorageService.clearAll();

    Object.keys(SEED_DATA).forEach((key) => {
      const data = SEED_DATA[key];
      if (Array.isArray(data)) {
        StorageService.replaceAll(key, data);
      } else if (typeof data === 'object') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    });

    console.log('[SeedService] Đã khôi phục dữ liệu mẫu thành công.');
  }
}