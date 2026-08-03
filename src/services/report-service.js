import { storageService } from './storage-service.js';
import {
  calculateRoomMetrics,
  calculateTotalTenants,
  calculateMonthlyRevenueAndCollection,
  calculateDebtAndOverdueMetrics,
  calculateMonthlyUtilityUsage,
  calculateElectricityByRoom,
  calculateInvoiceStatusDistribution,
  calculatePaymentByMethod,
  getExpiringContractsList,
} from '../business/report-calculator.js';

export class ReportService {
  constructor(storage = storageService) {
    this.storage = storage;
  }

  /**
   * Tổng hợp toàn bộ các chỉ số báo cáo tổng quan của hệ thống
   * @param {string} [currentDate] - Ngày mốc so sánh (YYYY-MM-DD)
   * @returns {Object} Dữ liệu chỉ số tổng hợp
   */
  getOverviewReport(currentDate) {
    const rooms = this.storage.getRooms() || [];
    const contracts = this.storage.getContracts() || [];
    const invoices = this.storage.getInvoices() || [];
    const payments = this.storage.getPayments() || [];
    const tenants = this.storage.getTenants ? this.storage.getTenants() : [];

    const roomMetrics = calculateRoomMetrics(rooms);
    const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
    const totalTenants = calculateTotalTenants(tenants.length > 0 ? tenants : activeContracts);
    const debtMetrics = calculateDebtAndOverdueMetrics(invoices, payments, currentDate);

    return {
      ...roomMetrics,
      totalTenants,
      totalDebt: debtMetrics.totalDebt,
      overdueInvoiceCount: debtMetrics.overdueInvoiceCount,
    };
  }

  /**
   * Báo cáo so sánh Doanh thu (Hóa đơn) vs Thực thu (Tiền về) theo từng tháng
   * Cấu trúc phù hợp vẽ biểu đồ Cột / Đường song song
   * @returns {{ labels: string[], revenueData: number[], collectionData: number[] }}
   */
  getRevenueVsCollectionChartData() {
    const invoices = this.storage.getInvoices() || [];
    const payments = this.storage.getPayments() || [];

    const monthlyData = calculateMonthlyRevenueAndCollection(invoices, payments);

    return {
      labels: monthlyData.map((d) => d.month),
      revenueData: monthlyData.map((d) => d.revenue),
      collectionData: monthlyData.map((d) => d.actualCollected),
    };
  }

  /**
   * Báo cáo tiêu thụ điện nước theo tháng
   * Cấu trúc phù hợp vẽ biểu đồ Miền / Đường
   * @returns {{ labels: string[], electricityData: number[], waterData: number[] }}
   */
  getUtilityConsumptionChartData() {
    // Ưu tiên lấy từ serviceReadings, nếu không có sẽ lấy từ thông tin tiêu thụ trong invoices
    const readings = this.storage.getServiceReadings
      ? this.storage.getServiceReadings()
      : this.storage.getInvoices() || [];

    const { monthlyElectricity, monthlyWater } = calculateMonthlyUtilityUsage(readings);

    // Lấy danh sách tháng hợp nhất từ cả 2 mảng
    const monthSet = new Set([
      ...monthlyElectricity.map((e) => e.month),
      ...monthlyWater.map((w) => w.month),
    ]);
    const labels = Array.from(monthSet).sort();

    const electricityData = labels.map((m) => {
      const item = monthlyElectricity.find((e) => e.month === m);
      return item ? item.totalUsage : 0;
    });

    const waterData = labels.map((m) => {
      const item = monthlyWater.find((w) => w.month === m);
      return item ? item.totalUsage : 0;
    });

    return { labels, electricityData, waterData };
  }

  /**
   * Báo cáo tiêu thụ điện theo phòng
   * Cấu trúc phù hợp vẽ biểu đồ Cột / Thanh ngang
   * @returns {{ labels: string[], data: number[] }}
   */
  getElectricityByRoomChartData() {
    const readings = this.storage.getServiceReadings
      ? this.storage.getServiceReadings()
      : this.storage.getInvoices() || [];
    const rooms = this.storage.getRooms() || [];

    const roomData = calculateElectricityByRoom(readings, rooms);

    return {
      labels: roomData.map((r) => r.roomName),
      data: roomData.map((r) => r.totalUsage),
    };
  }

  /**
   * Báo cáo tỷ lệ trạng thái hóa đơn
   * Cấu trúc phù hợp vẽ biểu đồ Tròn (Pie/Doughnut)
   * @returns {{ labels: string[], counts: number[], percentages: number[] }}
   */
  getInvoiceStatusChartData() {
    const invoices = this.storage.getInvoices() || [];
    const distribution = calculateInvoiceStatusDistribution(invoices);

    return {
      labels: distribution.map((d) => d.status),
      counts: distribution.map((d) => d.count),
      percentages: distribution.map((d) => d.percentage),
    };
  }

  /**
   * Báo cáo thanh toán phân bổ theo phương thức
   * Cấu trúc phù hợp vẽ biểu đồ Tròn / Bánh xe
   * @returns {{ labels: string[], amounts: number[], percentages: number[] }}
   */
  getPaymentMethodChartData() {
    const payments = this.storage.getPayments() || [];
    const paymentMethods = calculatePaymentByMethod(payments);

    return {
      labels: paymentMethods.map((p) => p.method),
      amounts: paymentMethods.map((p) => p.totalAmount),
      percentages: paymentMethods.map((p) => p.percentage),
    };
  }

  /**
   * Lấy danh sách hợp đồng sắp hết hạn
   * @param {number} [daysThreshold=30] - Ngưỡng cảnh báo số ngày còn lại
   * @param {string} [currentDate] - Ngày mốc kiểm tra
   * @returns {Array}
   */
  getExpiringContracts(daysThreshold = 30, currentDate) {
    const contracts = this.storage.getContracts() || [];
    const rooms = this.storage.getRooms() || [];

    return getExpiringContractsList(contracts, rooms, daysThreshold, currentDate);
  }
}

export const reportService = new ReportService();

