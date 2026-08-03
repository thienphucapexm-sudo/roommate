import { StorageService } from './storage-service.js';
import { STORAGE_KEYS } from '../constants/storage-keys.js';
import { 
  calculateElectricUsage, 
  calculateWaterUsage, 
  getPreviousMonthKey, 
  detectAbnormalUsage 
} from '../business/meter-calculator.js';
import { 
  validateMeterReading, 
  validatePreviousIndex 
} from '../business/meter-validator.js';

export class MeterReadingService {
  /**
   * Lấy danh sách tất cả các bản ghi chỉ số điện nước
   */
  static getReadings() {
    return StorageService.getAll(STORAGE_KEYS.METER_READINGS) || [];
  }

  /**
   * Lấy bản ghi chỉ số theo ID
   */
  static getReadingById(id) {
    if (!id) return null;
    return StorageService.getById(STORAGE_KEYS.METER_READINGS, id);
  }

  /**
   * Lấy bản ghi chỉ số theo Phòng và Tháng (YYYY-MM)
   */
  static getReadingByRoomAndMonth(roomId, month) {
    if (!roomId || !month) return null;
    const readings = this.getReadings();
    return readings.find(
      (r) => String(r.roomId) === String(roomId) && String(r.month) === String(month)
    ) || null;
  }

  /**
   * Lấy chỉ số kỳ trước liền kề của một phòng
   */
  static getPreviousReading(roomId, month) {
    if (!roomId || !month) return null;
    const previousMonth = getPreviousMonthKey(month);
    return this.getReadingByRoomAndMonth(roomId, previousMonth);
  }

  /**
   * Lấy danh sách các phòng có hợp đồng hiệu lực trong tháng nhưng CHƯA ghi chỉ số
   */
  static getRoomsWithoutReading(month) {
    if (!month) return [];

    const contracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS) || [];
    const rooms = StorageService.getAll(STORAGE_KEYS.ROOMS) || [];
    const readings = this.getReadings();

    // Lọc các hợp đồng có hiệu lực trong tháng được chọn
    // Quy tắc: Contract.startDate <= ngày cuối tháng VÀ (Contract.endDate >= ngày đầu tháng HOẶC đang ACTIVE/chưa thanh lý)
    const activeContracts = contracts.filter((contract) => {
      if (contract.status === 'EXPIRED' || contract.status === 'TERMINATED') {
        if (!contract.endDate) return false;
        const endMonth = contract.endDate.substring(0, 7);
        if (endMonth < month) return false;
      }

      if (contract.startDate) {
        const startMonth = contract.startDate.substring(0, 7);
        if (startMonth > month) return false;
      }

      return true;
    });

    const activeRoomIds = new Set(activeContracts.map((c) => String(c.roomId)));

    // Lấy ID các phòng đã có ghi chép trong tháng
    const recordedRoomIds = new Set(
      readings
        .filter((r) => String(r.month) === String(month))
        .map((r) => String(r.roomId))
    );

    // Lọc các phòng thuộc danh sách hợp đồng hiệu lực nhưng chưa được ghi số
    return rooms.filter(
      (room) => activeRoomIds.has(String(room.id)) && !recordedRoomIds.has(String(room.id))
    );
  }

  /**
   * Lọc danh sách ghi chép chỉ số theo nhiều tiêu chí
   */
  static filterReadings(filters = {}) {
    let readings = this.getReadings();

    if (filters.month) {
      readings = readings.filter((r) => String(r.month) === String(filters.month));
    }

    if (filters.roomId) {
      readings = readings.filter((r) => String(r.roomId) === String(filters.roomId));
    }

    if (filters.hasWarning !== undefined) {
      readings = readings.filter((r) => Boolean(r.hasWarning) === Boolean(filters.hasWarning));
    }

    return readings;
  }

  /**
   * Kiểm tra xem phòng có hợp đồng hiệu lực trong tháng chỉ định không
   */
  static validateRoomContractForMonth(roomId, month) {
    const contracts = StorageService.getAll(STORAGE_KEYS.CONTRACTS) || [];
    
    const validContract = contracts.find((contract) => {
      if (String(contract.roomId) !== String(roomId)) return false;

      if (contract.status === 'EXPIRED' || contract.status === 'TERMINATED') {
        if (contract.endDate && contract.endDate.substring(0, 7) < month) return false;
      }

      if (contract.startDate && contract.startDate.substring(0, 7) > month) return false;

      return true;
    });

    if (!validContract) {
      throw new Error(`Phòng (ID: ${roomId}) không có hợp đồng thuê có hiệu lực trong tháng ${month}.`);
    }

    return validContract;
  }

  /**
   * Ghi chỉ số mới cho phòng
   */
  static createReading(data) {
    const { roomId, month, oldElectric, newElectric, oldWater, newWater, recordedAt } = data;

    // 1. Kiểm tra phòng và tháng
    if (!roomId || !month) {
      throw new Error('Mã phòng và tháng ghi chỉ số không được để trống.');
    }

    // 2. Quy tắc: Chỉ ghi chỉ số cho phòng có hợp đồng hiệu lực trong tháng đó
    this.validateRoomContractForMonth(roomId, month);

    // 3. Quy tắc: Mỗi phòng chỉ có 1 bản ghi trong 1 tháng
    const existing = this.getReadingByRoomAndMonth(roomId, month);
    if (existing) {
      throw new Error(`Phòng này đã được ghi nhận chỉ số cho tháng ${month}.`);
    }

    // 4. Tự lấy chỉ số cũ tháng trước nếu người dùng không truyền vào
    const prevReading = this.getPreviousReading(roomId, month);
    
    const effectiveOldElectric = oldElectric !== undefined && oldElectric !== null && oldElectric !== ''
      ? oldElectric
      : (prevReading ? prevReading.newElectric : 0);

    const effectiveOldWater = oldWater !== undefined && oldWater !== null && oldWater !== ''
      ? oldWater
      : (prevReading ? prevReading.newWater : 0);

    // 5. Cảnh báo nếu chỉ số cũ nhập vào khác chỉ số mới tháng trước
    const warnings = [];
    if (prevReading) {
      if (Number(effectiveOldElectric) !== Number(prevReading.newElectric)) {
        warnings.push(
          `Chỉ số điện đầu kỳ (${effectiveOldElectric}) lệch với chỉ số điện cuối tháng trước (${prevReading.newElectric}).`
        );
      }
      if (Number(effectiveOldWater) !== Number(prevReading.newWater)) {
        warnings.push(
          `Chỉ số nước đầu kỳ (${effectiveOldWater}) lệch với chỉ số nước cuối tháng trước (${prevReading.newWater}).`
        );
      }
    }

    // 6. Validate & Tự tính lượng điện, nước tiêu thụ
    const electricUsage = calculateElectricUsage(effectiveOldElectric, newElectric);
    const waterUsage = calculateWaterUsage(effectiveOldWater, newWater);

    // 7. Cảnh báo tiêu thụ bất thường so với tháng trước
    if (prevReading) {
      const elecAbnormal = detectAbnormalUsage(electricUsage, prevReading.electricUsage);
      if (elecAbnormal.isAbnormal) {
        warnings.push(`Cảnh báo điện: ${elecAbnormal.message}`);
      }

      const waterAbnormal = detectAbnormalUsage(waterUsage, prevReading.waterUsage);
      if (waterAbnormal.isAbnormal) {
        warnings.push(`Cảnh báo nước: ${waterAbnormal.message}`);
      }
    }

    // 8. Lưu thông tin
    const payload = {
      roomId,
      month,
      oldElectric: Number(effectiveOldElectric),
      newElectric: Number(newElectric),
      electricUsage,
      oldWater: Number(effectiveOldWater),
      newWater: Number(newWater),
      waterUsage,
      warnings,
      hasWarning: warnings.length > 0,
      recordedAt: recordedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const createdRecord = StorageService.create(STORAGE_KEYS.METER_READINGS, payload);

    return {
      data: createdRecord,
      warnings
    };
  }

  /**
   * Cập nhật chỉ số điện nước
   */
  static updateReading(id, data) {
    const existingRecord = this.getReadingById(id);
    if (!existingRecord) {
      throw new Error(`Không tìm thấy bản ghi chỉ số với ID "${id}".`);
    }

    const roomId = data.roomId || existingRecord.roomId;
    const month = data.month || existingRecord.month;

    // 1. Kiểm tra nếu thay đổi phòng hoặc tháng thì phòng đó phải có hợp đồng hiệu lực
    if (roomId !== existingRecord.roomId || month !== existingRecord.month) {
      this.validateRoomContractForMonth(roomId, month);

      const duplicateCheck = this.getReadingByRoomAndMonth(roomId, month);
      if (duplicateCheck && String(duplicateCheck.id) !== String(id)) {
        throw new Error(`Đã tồn tại bản ghi chỉ số cho phòng này trong tháng ${month}.`);
      }
    }

    // 2. Kiểm tra hóa đơn liên quan đã tồn tại chưa
    const invoices = StorageService.getAll(STORAGE_KEYS.INVOICES) || [];
    const relatedInvoice = invoices.find(
      (inv) => String(inv.roomId) === String(roomId) && String(inv.month) === String(month)
    );

    const invoiceWarnings = [];
    if (relatedInvoice) {
      invoiceWarnings.push(
        `CẢNH BÁO: Hóa đơn tháng ${month} của phòng này đã được khởi tạo (Mã HD: ${relatedInvoice.code || relatedInvoice.id}). Việc chỉnh sửa chỉ số sẽ không tự động cập nhật lại số tiền trên hóa đơn cũ này.`
      );
    }

    // 3. Chuẩn bị giá trị chỉ số
    const oldElectric = data.oldElectric !== undefined ? data.oldElectric : existingRecord.oldElectric;
    const newElectric = data.newElectric !== undefined ? data.newElectric : existingRecord.newElectric;
    const oldWater = data.oldWater !== undefined ? data.oldWater : existingRecord.oldWater;
    const newWater = data.newWater !== undefined ? data.newWater : existingRecord.newWater;

    // 4. Cảnh báo lệch với tháng trước
    const warnings = [...invoiceWarnings];
    const prevReading = this.getPreviousReading(roomId, month);
    
    if (prevReading && String(prevReading.id) !== String(id)) {
      if (Number(oldElectric) !== Number(prevReading.newElectric)) {
        warnings.push(
          `Chỉ số điện đầu kỳ (${oldElectric}) lệch với chỉ số điện cuối tháng trước (${prevReading.newElectric}).`
        );
      }
      if (Number(oldWater) !== Number(prevReading.newWater)) {
        warnings.push(
          `Chỉ số nước đầu kỳ (${oldWater}) lệch với chỉ số nước cuối tháng trước (${prevReading.newWater}).`
        );
      }
    }

    // 5. Tự tính toán lại sản lượng
    const electricUsage = calculateElectricUsage(oldElectric, newElectric);
    const waterUsage = calculateWaterUsage(oldWater, newWater);

    if (prevReading && String(prevReading.id) !== String(id)) {
      const elecAbnormal = detectAbnormalUsage(electricUsage, prevReading.electricUsage);
      if (elecAbnormal.isAbnormal) {
        warnings.push(`Cảnh báo điện: ${elecAbnormal.message}`);
      }

      const waterAbnormal = detectAbnormalUsage(waterUsage, prevReading.waterUsage);
      if (waterAbnormal.isAbnormal) {
        warnings.push(`Cảnh báo nước: ${waterAbnormal.message}`);
      }
    }

    const payload = {
      ...existingRecord,
      ...data,
      roomId,
      month,
      oldElectric: Number(oldElectric),
      newElectric: Number(newElectric),
      electricUsage,
      oldWater: Number(oldWater),
      newWater: Number(newWater),
      waterUsage,
      warnings,
      hasWarning: warnings.length > 0,
      updatedAt: new Date().toISOString()
    };

    const updatedRecord = StorageService.update(STORAGE_KEYS.METER_READINGS, id, payload);

    return {
      data: updatedRecord,
      warnings
    };
  }

  /**
   * Xóa bản ghi chỉ số
   */
  static deleteReading(id) {
    const reading = this.getReadingById(id);
    if (!reading) {
      throw new Error(`Không tìm thấy bản ghi chỉ số với ID "${id}".`);
    }

    // Kiểm tra xem đã có hóa đơn xuất dựa trên chỉ số này chưa
    const invoices = StorageService.getAll(STORAGE_KEYS.INVOICES) || [];
    const relatedInvoice = invoices.find(
      (inv) => String(inv.roomId) === String(reading.roomId) && String(inv.month) === String(reading.month)
    );

    if (relatedInvoice) {
      throw new Error(
        `Không thể xóa chỉ số này vì đã tồn tại hóa đơn tháng ${reading.month} liên quan (Mã HD: ${relatedInvoice.code || relatedInvoice.id}).`
      );
    }

    return StorageService.remove(STORAGE_KEYS.METER_READINGS, id);
  }
}