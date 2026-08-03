import { storageService } from './storage-service.js';
import { calculateTotalPaid, calculateRemainingAmount } from '../business/payment-processor.js';

export class DebtService {
  constructor(storage = storageService) {
    this.storage = storage;
  }

  /**
   * Tính số ngày quá hạn của hóa đơn
   * @param {string} dueDate - Hạn thanh toán (YYYY-MM-DD)
   * @param {string} [currentDate] - Ngày hiện tại (YYYY-MM-DD)
   * @returns {number} Số ngày quá hạn (0 nếu chưa quá hạn hoặc không có dueDate)
   */
  calculateDaysOverdue(dueDate, currentDate) {
    if (!dueDate) return 0;

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const current = currentDate ? new Date(currentDate) : new Date();
    current.setHours(0, 0, 0, 0);

    const diffTime = current.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Lấy danh sách toàn bộ hóa đơn còn nợ (bao gồm chưa trả đủ và chưa bị hủy)
   * @returns {Array} Danh sách hóa đơn còn nợ kèm thông tin dư nợ và phòng
   */
  getOutstandingInvoices() {
    const invoices = this.storage.getInvoices() || [];
    const payments = this.storage.getPayments() || [];
    const rooms = this.storage.getRooms() || [];

    return invoices
      .filter((inv) => inv.status !== 'CANCELLED')
      .map((inv) => {
        const invPayments = payments.filter((p) => String(p.invoiceId) === String(inv.id));
        const totalPaid = calculateTotalPaid(invPayments);
        const remainingAmount = calculateRemainingAmount(inv.total, invPayments);
        const room = rooms.find((r) => String(r.id) === String(inv.roomId));

        return {
          ...inv,
          paidAmount: totalPaid,
          remainingAmount,
          roomName: room ? room.name : `Phòng ${inv.roomId}`,
        };
      })
      .filter((inv) => inv.remainingAmount > 0);
  }

  /**
   * Lấy danh sách hóa đơn quá hạn
   * @param {string} [currentDate] - Ngày mốc so sánh
   * @returns {Array}
   */
  getOverdueInvoices(currentDate) {
    const outstanding = this.getOutstandingInvoices();
    return outstanding
      .map((inv) => ({
        ...inv,
        daysOverdue: this.calculateDaysOverdue(inv.dueDate, currentDate),
      }))
      .filter((inv) => inv.daysOverdue > 0);
  }

  /**
   * Tính tổng tất cả công nợ hiện tại
   * @returns {number}
   */
  getTotalDebt() {
    const outstanding = this.getOutstandingInvoices();
    return outstanding.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  }

  /**
   * Thống kê công nợ gom nhóm theo từng phòng
   * @returns {Array<{roomId: string, roomName: string, totalDebt: number, invoiceCount: number}>}
   */
  getDebtByRoom() {
    const outstanding = this.getOutstandingInvoices();
    const debtMap = {};

    outstanding.forEach((inv) => {
      const key = String(inv.roomId);
      if (!debtMap[key]) {
        debtMap[key] = {
          roomId: inv.roomId,
          roomName: inv.roomName,
          totalDebt: 0,
          invoiceCount: 0,
        };
      }
      debtMap[key].totalDebt += inv.remainingAmount;
      debtMap[key].invoiceCount += 1;
    });

    return Object.values(debtMap).sort((a, b) => b.totalDebt - a.totalDebt);
  }

  /**
   * Thống kê công nợ gom nhóm theo tháng
   * @returns {Array<{month: string, totalDebt: number, invoiceCount: number}>}
   */
  getDebtByMonth() {
    const outstanding = this.getOutstandingInvoices();
    const monthMap = {};

    outstanding.forEach((inv) => {
      const monthKey = inv.month || 'Chưa xác định';
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          totalDebt: 0,
          invoiceCount: 0,
        };
      }
      monthMap[monthKey].totalDebt += inv.remainingAmount;
      monthMap[monthKey].invoiceCount += 1;
    });

    return Object.values(monthMap);
  }
}

export const debtService = new DebtService();