import { storageService } from './storage-service.js';
import { validatePayment } from '../business/payment-validator.js';
import {
  calculateTotalPaid,
  determinePaymentStatus,
  canDeletePayment,
} from '../business/payment-processor.js';

export class PaymentService {
  constructor(storage = storageService) {
    this.storage = storage;
  }

  /**
   * Lấy toàn bộ danh sách giao dịch thanh toán
   * @returns {Array}
   */
  getPayments() {
    return this.storage.getPayments() || [];
  }

  /**
   * Lấy thông tin giao dịch thanh toán theo ID
   * @param {string|number} id 
   * @returns {Object|null}
   */
  getPaymentById(id) {
    const payments = this.getPayments();
    return payments.find((p) => String(p.id) === String(id)) || null;
  }

  /**
   * Lấy danh sách giao dịch thanh toán thuộc một hóa đơn
   * @param {string|number} invoiceId 
   * @returns {Array}
   */
  getPaymentsByInvoice(invoiceId) {
    const payments = this.getPayments();
    return payments.filter((p) => String(p.invoiceId) === String(invoiceId));
  }

  /**
   * Tính tổng số tiền đã thanh toán cho một hóa đơn dựa trên danh sách giao dịch
   * @param {string|number} invoiceId 
   * @returns {number}
   */
  getTotalPaidByInvoice(invoiceId) {
    const invoicePayments = this.getPaymentsByInvoice(invoiceId);
    return calculateTotalPaid(invoicePayments);
  }

  /**
   * Đồng bộ lại số tiền đã trả và trạng thái của hóa đơn dựa trên toàn bộ giao dịch hiện có
   * @param {string|number} invoiceId 
   * @returns {Object} Hóa đơn sau khi được cập nhật
   */
  syncInvoicePaymentStatus(invoiceId) {
    const invoice = this.storage.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error(`Không tìm thấy hóa đơn với ID: ${invoiceId}`);
    }

    // Không thay đổi trạng thái nếu hóa đơn đã bị HỦY
    if (invoice.status === 'CANCELLED') {
      return invoice;
    }

    const invoicePayments = this.getPaymentsByInvoice(invoiceId);
    const totalPaid = calculateTotalPaid(invoicePayments);
    const newStatus = determinePaymentStatus(
      invoice.total,
      invoicePayments,
      invoice.dueDate
    );

    const updatedInvoice = {
      ...invoice,
      paidAmount: totalPaid,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this.storage.updateInvoice(updatedInvoice);
    return updatedInvoice;
  }

  /**
   * Tạo mới một giao dịch thanh toán và cập nhật lại hóa đơn
   * @param {Object} data 
   * @param {string|number} data.invoiceId - ID hóa đơn
   * @param {number} data.amount - Số tiền thanh toán
   * @param {string} [data.method] - Phương thức thanh toán
   * @param {string} [data.note] - Ghi chú
   * @returns {Object} Giao dịch thanh toán vừa tạo
   */
  createPayment(data) {
    const { invoiceId, amount, method = 'CASH', note = '' } = data || {};

    // 1. Kiểm tra tồn tại hóa đơn
    const invoice = this.storage.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Hóa đơn không tồn tại.');
    }

    // 2. Validate dữ liệu đầu vào dựa trên PaymentValidator
    const paymentData = {
      amount: Number(amount),
      invoiceId,
      method,
      note,
      paymentDate: data.paymentDate || new Date().toISOString(),
    };

    const validation = validatePayment(paymentData, invoice);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    // 3. Thực hiện lưu transaction bằng cơ chế khôi phục (rollback) để tránh bất đồng bộ
    const newPayment = {
      id: data.id || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...paymentData,
      createdAt: new Date().toISOString(),
    };

    const previousPayments = this.getPayments();
    const previousInvoice = { ...invoice };

    try {
      // Lưu thanh toán mới
      this.storage.savePayment(newPayment);

      // Cập nhật lại số tiền và trạng thái hóa đơn
      this.syncInvoicePaymentStatus(invoiceId);

      return newPayment;
    } catch (error) {
      // Khôi phục dữ liệu nguyên trạng nếu có lỗi trong quá trình cập nhật
      this.storage.saveAllPayments(previousPayments);
      this.storage.updateInvoice(previousInvoice);
      throw new Error(`Thanh toán thất bại: ${error.message}`);
    }
  }

  /**
   * Xóa một giao dịch thanh toán và tính toán lại hóa đơn
   * @param {string|number} id - ID giao dịch thanh toán
   * @returns {boolean} True nếu xóa thành công
   */
  deletePayment(id) {
    const payment = this.getPaymentById(id);
    if (!payment) {
      throw new Error('Giao dịch thanh toán không tồn tại.');
    }

    const invoice = this.storage.getInvoiceById(payment.invoiceId);
    
    // Kiểm tra điều kiện có cho phép xóa hay không
    const deleteCheck = canDeletePayment(payment, invoice);
    if (!deleteCheck.canDelete) {
      throw new Error(deleteCheck.reason);
    }

    const previousPayments = this.getPayments();
    const previousInvoice = { ...invoice };

    try {
      // Xóa giao dịch thanh toán
      this.storage.deletePayment(id);

      // Tính lại công nợ và cập nhật trạng thái hóa đơn
      this.syncInvoicePaymentStatus(payment.invoiceId);

      return true;
    } catch (error) {
      // Rollback lại dữ liệu nếu xảy ra lỗi
      this.storage.saveAllPayments(previousPayments);
      if (previousInvoice) {
        this.storage.updateInvoice(previousInvoice);
      }
      throw new Error(`Xóa thanh toán thất bại: ${error.message}`);
    }
  }

  /**
   * Lọc danh sách các giao dịch thanh toán theo các tiêu chí
   * @param {Object} filters 
   * @param {string|number} [filters.invoiceId]
   * @param {string} [filters.method]
   * @param {string} [filters.fromDate] - Định dạng YYYY-MM-DD hoặc ISO string
   * @param {string} [filters.toDate] - Định dạng YYYY-MM-DD hoặc ISO string
   * @returns {Array}
   */
  filterPayments(filters = {}) {
    let payments = this.getPayments();

    if (filters.invoiceId) {
      payments = payments.filter((p) => String(p.invoiceId) === String(filters.invoiceId));
    }

    if (filters.method) {
      payments = payments.filter((p) => p.method === filters.method);
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate).getTime();
      payments = payments.filter((p) => new Date(p.paymentDate || p.createdAt).getTime() >= from);
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate).getTime();
      payments = payments.filter((p) => new Date(p.paymentDate || p.createdAt).getTime() <= to);
    }

    return payments;
  }
}

export const paymentService = new PaymentService();