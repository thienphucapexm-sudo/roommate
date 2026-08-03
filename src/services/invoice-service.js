import {
  calculateElectricAmount,
  calculateWaterAmount,
  calculateFixedServiceAmount,
  calculatePerPersonAmount,
  calculatePerVehicleAmount,
  calculateSubtotal,
  calculateDiscount,
  calculateInvoiceTotal,
  calculateRemainingDebt,
  determineInvoiceStatus,
} from '../business/invoice-calculator.js';
import { validateInvoice } from '../business/invoice-validator.js';

/**
 * Service quản lý toàn bộ vòng đời và nghiệp vụ Hóa đơn cho RoomMate
 */
export class InvoiceService {
  /**
   * @param {Object} repositories - Các repository cung cấp dữ liệu
   * @param {Object} repositories.invoiceRepo
   * @param {Object} repositories.contractRepo
   * @param {Object} repositories.meterReadingRepo
   */
  constructor({ invoiceRepo, contractRepo, meterReadingRepo }) {
    this.invoiceRepo = invoiceRepo;
    this.contractRepo = contractRepo;
    this.meterReadingRepo = meterReadingRepo;
  }

  /**
   * Lấy danh sách tất cả hóa đơn
   */
  async getInvoices() {
    return await this.invoiceRepo.findAll();
  }

  /**
   * Lấy thông tin hóa đơn theo ID
   */
  async getInvoiceById(id) {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) {
      throw new Error(`Không tìm thấy hóa đơn với ID: ${id}`);
    }
    return invoice;
  }

  /**
   * Lấy hóa đơn của một phòng trong một tháng nhất định
   */
  async getInvoiceByRoomAndMonth(roomId, month) {
    return await this.invoiceRepo.findByRoomAndMonth(roomId, month);
  }

  /**
   * Tạo một hóa đơn mới thủ công từ dữ liệu truyền vào
   */
  async createInvoice(data) {
    // 1. Kiểm tra mỗi phòng chỉ có 1 hóa đơn trong 1 tháng
    const existingInvoice = await this.getInvoiceByRoomAndMonth(data.roomId, data.month);
    if (existingInvoice) {
      throw new Error(`Phòng ${data.roomId} đã tồn tại hóa đơn cho tháng ${data.month}.`);
    }

    // 2. Tính toán tổng tiền
    const subtotal = calculateSubtotal(data.items || []);
    const discount = calculateDiscount(subtotal, data.discount || 0);
    const total = calculateInvoiceTotal(subtotal, discount);
    const paidAmount = data.paidAmount || 0;
    const remainingDebt = calculateRemainingDebt(total, paidAmount);
    const status = data.status || determineInvoiceStatus(total, paidAmount, data.dueDate);

    const newInvoice = {
      ...data,
      isFinalized: data.isFinalized ?? false,
      items: data.items || [],
      subtotal,
      discount,
      total,
      paidAmount,
      remainingDebt,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Kiểm tra tính hợp lệ của hóa đơn
    const validation = validateInvoice(newInvoice);
    if (!validation.isValid) {
      throw new Error(`Hóa đơn không hợp lệ: ${validation.errors.join('; ')}`);
    }

    return await this.invoiceRepo.create(newInvoice);
  }

  /**
   * Tự động sinh hóa đơn cho 1 phòng dựa trên Hợp đồng và Chỉ số Điện/Nước
   */
  async generateInvoiceForRoom(roomId, month) {
    // 1. Kiểm tra phòng đã có hóa đơn trong tháng chưa
    const existingInvoice = await this.getInvoiceByRoomAndMonth(roomId, month);
    if (existingInvoice) {
      throw new Error(`Phòng ${roomId} đã có hóa đơn cho tháng ${month}.`);
    }

    // 2. Kiểm tra hợp đồng còn hiệu lực trong tháng
    const contract = await this.contractRepo.findActiveContractByRoom(roomId, month);
    if (!contract) {
      throw new Error(`Phòng ${roomId} không có hợp đồng còn hiệu lực trong tháng ${month}.`);
    }

    // 3. Kiểm tra bản ghi điện nước tương ứng
    const meterReading = await this.meterReadingRepo.findByRoomAndMonth(roomId, month);
    if (!meterReading) {
      throw new Error(`Phòng ${roomId} chưa có chỉ số điện nước cho tháng ${month}.`);
    }

    const items = [];

    // 4. Lấy giá thuê phòng từ hợp đồng và snapshot
    if (contract.roomPrice && contract.roomPrice > 0) {
      items.push({
        type: 'RENT',
        name: 'Tiền thuê phòng',
        unitPrice: contract.roomPrice,
        quantity: 1,
        amount: calculateFixedServiceAmount(contract.roomPrice),
      });
    }

    // 5. Tính tiền điện từ bản ghi chỉ số và snapshot
    const electricUsage = meterReading.electricNew - meterReading.electricOld;
    const electricAmount = calculateElectricAmount(electricUsage, meterReading.electricUnitPrice);
    items.push({
      type: 'ELECTRIC',
      name: 'Tiền điện',
      unitPrice: meterReading.electricUnitPrice,
      quantity: electricUsage,
      amount: electricAmount,
    });

    // 6. Tính tiền nước từ bản ghi chỉ số và snapshot
    const waterUsage = meterReading.waterNew - meterReading.waterOld;
    const waterAmount = calculateWaterAmount(waterUsage, meterReading.waterUnitPrice);
    items.push({
      type: 'WATER',
      name: 'Tiền nước',
      unitPrice: meterReading.waterUnitPrice,
      quantity: waterUsage,
      amount: waterAmount,
    });

    // 7. Lấy các dịch vụ đang áp dụng từ hợp đồng và snapshot
    if (Array.isArray(contract.services)) {
      for (const service of contract.services) {
        let amount = 0;
        let quantity = service.quantity || 1;

        switch (service.type) {
          case 'FIXED':
            amount = calculateFixedServiceAmount(service.unitPrice);
            break;
          case 'PER_PERSON':
            quantity = service.personCount ?? contract.tenantCount ?? 1;
            amount = calculatePerPersonAmount(quantity, service.unitPrice);
            break;
          case 'PER_VEHICLE':
            quantity = service.vehicleCount ?? contract.vehicleCount ?? 1;
            amount = calculatePerVehicleAmount(quantity, service.unitPrice);
            break;
          default:
            amount = calculateFixedServiceAmount(service.unitPrice);
        }

        items.push({
          type: service.type || 'SERVICE',
          name: service.name,
          unitPrice: service.unitPrice,
          quantity: quantity,
          amount: amount,
        });
      }
    }

    // 8. Tính tổng tiền và tạo hóa đơn nháp (Draft)
    const subtotal = calculateSubtotal(items);
    const discount = 0;
    const total = calculateInvoiceTotal(subtotal, discount);
    const dueDate = contract.paymentDueDate || `${month}-05`; // Mặc định ngày 5 hàng tháng

    const invoiceData = {
      roomId,
      contractId: contract.id,
      month,
      items,
      subtotal,
      discount,
      total,
      paidAmount: 0,
      remainingDebt: total,
      dueDate,
      status: determineInvoiceStatus(total, 0, dueDate),
      isFinalized: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = validateInvoice(invoiceData);
    if (!validation.isValid) {
      throw new Error(`Hóa đơn tự động không hợp lệ: ${validation.errors.join('; ')}`);
    }

    return await this.invoiceRepo.create(invoiceData);
  }

  /**
   * Tự động sinh hóa đơn hàng loạt cho tất cả các phòng hoạt động trong tháng
   */
  async generateInvoicesForMonth(month) {
    const activeContracts = await this.contractRepo.findAllActiveContractsForMonth(month);
    const createdInvoices = [];
    const errors = [];

    for (const contract of activeContracts) {
      try {
        const invoice = await this.generateInvoiceForRoom(contract.roomId, month);
        createdInvoices.push(invoice);
      } catch (error) {
        errors.push({
          roomId: contract.roomId,
          message: error.message,
        });
      }
    }

    return {
      successCount: createdInvoices.length,
      failureCount: errors.length,
      invoices: createdInvoices,
      errors,
    };
  }

  /**
   * Cập nhật hóa đơn nháp (chưa chốt)
   */
  async updateDraftInvoice(id, updateData) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.isFinalized) {
      throw new Error('Hóa đơn đã chốt không thể sửa tùy ý.');
    }

    if (invoice.status === 'CANCELLED') {
      throw new Error('Hóa đơn đã hủy không thể chỉnh sửa.');
    }

    const items = updateData.items || invoice.items;
    const subtotal = calculateSubtotal(items);
    const discount = calculateDiscount(subtotal, updateData.discount ?? invoice.discount);
    const total = calculateInvoiceTotal(subtotal, discount);
    const paidAmount = updateData.paidAmount ?? invoice.paidAmount ?? 0;
    const remainingDebt = calculateRemainingDebt(total, paidAmount);
    const dueDate = updateData.dueDate || invoice.dueDate;
    const status = determineInvoiceStatus(total, paidAmount, dueDate);

    const updatedInvoice = {
      ...invoice,
      ...updateData,
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      remainingDebt,
      dueDate,
      status,
      updatedAt: new Date().toISOString(),
    };

    const validation = validateInvoice(updatedInvoice);
    if (!validation.isValid) {
      throw new Error(`Dữ liệu hóa đơn cập nhật không hợp lệ: ${validation.errors.join('; ')}`);
    }

    return await this.invoiceRepo.update(id, updatedInvoice);
  }

  /**
   * Chốt hóa đơn (Chuyển trạng thái từ nháp sang chốt chính thức)
   */
  async finalizeInvoice(id) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.isFinalized) {
      throw new Error('Hóa đơn này đã được chốt trước đó.');
    }

    if (invoice.status === 'CANCELLED') {
      throw new Error('Hóa đơn đã hủy không thể chốt.');
    }

    return await this.invoiceRepo.update(id, {
      ...invoice,
      isFinalized: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Hủy hóa đơn
   */
  async cancelInvoice(id) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.paidAmount > 0) {
      throw new Error('Hóa đơn đã thanh toán hoặc thanh toán một phần không thể hủy.');
    }

    return await this.invoiceRepo.update(id, {
      ...invoice,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Xóa hóa đơn nháp
   */
  async deleteDraftInvoice(id) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.isFinalized) {
      throw new Error('Không thể xóa hóa đơn đã chốt.');
    }

    if (invoice.paidAmount > 0 || invoice.status === 'PAID' || invoice.status === 'PARTIAL') {
      throw new Error('Hóa đơn đã thanh toán không được xóa.');
    }

    return await this.invoiceRepo.delete(id);
  }

  /**
   * Tính toán lại số tiền và trạng thái cho hóa đơn (Dùng khi cập nhật lại các khoản mục)
   */
  async recalculateInvoice(id) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.isFinalized) {
      throw new Error('Hóa đơn đã chốt không thể tính toán lại.');
    }

    const subtotal = calculateSubtotal(invoice.items);
    const discount = calculateDiscount(subtotal, invoice.discount);
    const total = calculateInvoiceTotal(subtotal, discount);
    const remainingDebt = calculateRemainingDebt(total, invoice.paidAmount);
    const status = determineInvoiceStatus(total, invoice.paidAmount, invoice.dueDate);

    const recalculatedInvoice = {
      ...invoice,
      subtotal,
      discount,
      total,
      remainingDebt,
      status,
      updatedAt: new Date().toISOString(),
    };

    return await this.invoiceRepo.update(id, recalculatedInvoice);
  }

  /**
   * Lọc danh sách hóa đơn theo các bộ lọc
   * @param {Object} filters
   * @param {string} [filters.roomId]
   * @param {string} [filters.month]
   * @param {string} [filters.status]
   * @param {boolean} [filters.isFinalized]
   */
  async filterInvoices(filters = {}) {
    const invoices = await this.getInvoices();

    return invoices.filter((inv) => {
      if (filters.roomId && String(inv.roomId) !== String(filters.roomId)) return false;
      if (filters.month && inv.month !== filters.month) return false;
      if (filters.status && inv.status !== filters.status) return false;
      if (filters.isFinalized !== undefined && inv.isFinalized !== filters.isFinalized) return false;
      return true;
    });
  }
}