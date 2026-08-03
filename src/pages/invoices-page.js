import { InvoiceService } from '../services/invoice-service.js';
import { InvoiceDetailComponent } from '../components/invoice-detail.js';
import { InvoiceFormComponent } from '../components/invoice-form.js';

export class InvoicesPage {
  /**
   * @param {Object} options
   * @param {InvoiceService} options.invoiceService - Service nghiệp vụ hóa đơn
   */
  constructor({ invoiceService }) {
    this.invoiceService = invoiceService || new InvoiceService({});
    this.filters = {
      month: new Date().toISOString().substring(0, 7),
      roomId: '',
      status: '',
      searchId: '',
    };
  }

  async render() {
    const container = document.createElement('div');
    container.className = 'invoice-page-container';
    container.setAttribute('data-testid', 'invoices-page');

    container.innerHTML = `
      <div class="invoice-header-section">
        <h2>🧾 Quản Lý Hóa Đơn</h2>
        <div class="invoice-top-actions">
          <button class="invoice-btn invoice-btn-secondary" id="btn-batch-generate" data-testid="btn-batch-generate">
            ⚡ Sinh HĐ Hàng Loạt
          </button>
          <button class="invoice-btn invoice-btn-primary" id="btn-create-single" data-testid="btn-create-single">
            + Tạo Hóa Đơn Thường
          </button>
        </div>
      </div>

      <!-- Khối bộ lọc -->
      <div class="invoice-filter-card">
        <div class="invoice-filter-group">
          <label>Mã HĐ / Tìm kiếm:</label>
          <input 
            type="text" 
            class="invoice-input" 
            id="filter-search-id" 
            placeholder="Nhập mã HĐ..." 
            value="${this.filters.searchId}"
            data-testid="input-search-id"
          />
        </div>

        <div class="invoice-filter-group">
          <label>Chọn tháng:</label>
          <input 
            type="month" 
            class="invoice-input" 
            id="filter-month" 
            value="${this.filters.month}"
            data-testid="select-filter-month"
          />
        </div>

        <div class="invoice-filter-group">
          <label>Phòng:</label>
          <input 
            type="text" 
            class="invoice-input invoice-input-sm" 
            id="filter-room" 
            placeholder="Số phòng..." 
            value="${this.filters.roomId}"
            data-testid="input-filter-room"
          />
        </div>

        <div class="invoice-filter-group">
          <label>Trạng thái:</label>
          <select class="invoice-input" id="filter-status" data-testid="select-filter-status">
            <option value="">-- Tất cả --</option>
            <option value="UNPAID" ${this.filters.status === 'UNPAID' ? 'selected' : ''}>Chưa thanh toán</option>
            <option value="PARTIAL" ${this.filters.status === 'PARTIAL' ? 'selected' : ''}>Thanh toán 1 phần</option>
            <option value="PAID" ${this.filters.status === 'PAID' ? 'selected' : ''}>Đã thanh toán</option>
            <option value="OVERDUE" ${this.filters.status === 'OVERDUE' ? 'selected' : ''}>Quá hạn</option>
            <option value="CANCELLED" ${this.filters.status === 'CANCELLED' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </div>
      </div>

      <!-- Khối thống kê tổng số tiền -->
      <div class="invoice-stats-grid" id="invoice-stats-container" data-testid="invoice-stats-summary">
        <!-- Render động -->
      </div>

      <!-- Bảng danh sách hóa đơn -->
      <div class="invoice-table-wrapper" id="invoices-table-container">
        <!-- Render động -->
      </div>
    `;

    this.attachEvents(container);
    await this.loadAndRenderData(container);

    return container;
  }

  attachEvents(container) {
    const searchInput = container.querySelector('#filter-search-id');
    const monthInput = container.querySelector('#filter-month');
    const roomInput = container.querySelector('#filter-room');
    const statusSelect = container.querySelector('#filter-status');

    const handleFilterChange = async () => {
      this.filters.searchId = searchInput.value.trim();
      this.filters.month = monthInput.value;
      this.filters.roomId = roomInput.value.trim();
      this.filters.status = statusSelect.value;
      await this.loadAndRenderData(container);
    };

    searchInput.addEventListener('input', handleFilterChange);
    monthInput.addEventListener('change', handleFilterChange);
    roomInput.addEventListener('input', handleFilterChange);
    statusSelect.addEventListener('change', handleFilterChange);

    // Tạo hóa đơn cho 1 phòng
    container.querySelector('#btn-create-single').addEventListener('click', () => {
      this.openInvoiceFormModal(container, null);
    });

    // Tạo hóa đơn hàng loạt
    container.querySelector('#btn-batch-generate').addEventListener('click', async () => {
      if (!this.filters.month) {
        alert('Vui lòng chọn tháng để tự động sinh hóa đơn hàng loạt.');
        return;
      }

      if (confirm(`Bạn có chắc muốn tự động sinh hóa đơn cho tất cả các phòng hoạt động trong tháng ${this.filters.month}?`)) {
        try {
          const result = await this.invoiceService.generateInvoicesForMonth(this.filters.month);
          alert(
            `Hoàn tất sinh hóa đơn hàng loạt!\n- Thành công: ${result.successCount}\n- Thất bại: ${result.failureCount}`
          );
          await this.loadAndRenderData(container);
        } catch (err) {
          alert(`Lỗi khi sinh hóa đơn hàng loạt: ${err.message}`);
        }
      }
    });
  }

  async loadAndRenderData(container) {
    let invoices = await this.invoiceService.getInvoices();

    // Áp dụng bộ lọc
    if (this.filters.month) {
      invoices = invoices.filter((i) => i.month === this.filters.month);
    }
    if (this.filters.roomId) {
      invoices = invoices.filter((i) => String(i.roomId).includes(this.filters.roomId));
    }
    if (this.filters.status) {
      invoices = invoices.filter((i) => i.status === this.filters.status);
    }
    if (this.filters.searchId) {
      invoices = invoices.filter((i) => String(i.id).toLowerCase().includes(this.filters.searchId.toLowerCase()));
    }

    this.renderStats(container, invoices);
    this.renderTable(container, invoices);
  }

  renderStats(container, invoices) {
    const statsContainer = container.querySelector('#invoice-stats-container');

    const grandTotal = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const paidTotal = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const debtTotal = invoices.reduce((sum, i) => sum + (i.remainingDebt || 0), 0);

    const formatCurrency = (val) => Number(val).toLocaleString('vi-VN') + ' đ';

    statsContainer.innerHTML = `
      <div class="invoice-stat-card">
        <span class="stat-title">Tổng Tiền Hóa Đơn</span>
        <strong class="stat-value text-primary" data-testid="stat-total-amount">${formatCurrency(grandTotal)}</strong>
      </div>
      <div class="invoice-stat-card">
        <span class="stat-title">Đã Thanh Toán</span>
        <strong class="stat-value text-success" data-testid="stat-paid-amount">${formatCurrency(paidTotal)}</strong>
      </div>
      <div class="invoice-stat-card">
        <span class="stat-title">Còn Nợ</span>
        <strong class="stat-value text-danger" data-testid="stat-remaining-debt">${formatCurrency(debtTotal)}</strong>
      </div>
    `;
  }

  renderTable(container, invoices) {
    const tableContainer = container.querySelector('#invoices-table-container');

    if (!invoices || invoices.length === 0) {
      tableContainer.innerHTML = `
        <div class="invoice-empty-state" data-testid="empty-state">
          Không tìm thấy hóa đơn nào phù hợp với bộ lọc.
        </div>
      `;
      return;
    }

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    const getStatusBadge = (status) => {
      switch (status) {
        case 'PAID':
          return '<span class="invoice-badge badge-success">Đã thanh toán</span>';
        case 'PARTIAL':
          return '<span class="invoice-badge badge-warning">Thanh toán 1 phần</span>';
        case 'OVERDUE':
          return '<span class="invoice-badge badge-danger">Quá hạn</span>';
        case 'CANCELLED':
          return '<span class="invoice-badge badge-dark">Đã hủy</span>';
        default:
          return '<span class="invoice-badge badge-info">Chưa thanh toán</span>';
      }
    };

    tableContainer.innerHTML = `
      <table class="invoice-table" data-testid="invoices-table">
        <thead>
          <tr>
            <th>Mã HĐ</th>
            <th>Phòng</th>
            <th>Tháng</th>
            <th>Tổng tiền</th>
            <th>Đã trả</th>
            <th>Còn nợ</th>
            <th>Loại</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .map(
              (i) => `
            <tr data-testid="invoice-row-${i.id}">
              <td><strong>#${i.id}</strong></td>
              <td><strong>Phòng ${i.roomId}</strong></td>
              <td>${i.month}</td>
              <td class="font-weight-bold">${formatCurrency(i.total)}</td>
              <td class="text-success">${formatCurrency(i.paidAmount)}</td>
              <td class="text-danger font-weight-bold">${formatCurrency(i.remainingDebt)}</td>
              <td>
                ${
                  i.isFinalized
                    ? '<span class="type-tag type-finalized">Đã chốt</span>'
                    : '<span class="type-tag type-draft">Bản nháp</span>'
                }
              </td>
              <td>${getStatusBadge(i.status)}</td>
              <td>
                <div class="invoice-action-buttons">
                  <button 
                    class="invoice-btn invoice-btn-sm invoice-btn-secondary" 
                    data-action="view" 
                    data-id="${i.id}"
                    data-testid="btn-view-${i.id}"
                  >
                    Xem
                  </button>
                  ${
                    !i.isFinalized && i.status !== 'CANCELLED'
                      ? `<button class="invoice-btn invoice-btn-sm invoice-btn-edit" data-action="edit" data-id="${i.id}" data-testid="btn-edit-${i.id}">Sửa</button>`
                      : ''
                  }
                  ${
                    !i.isFinalized && i.status !== 'CANCELLED'
                      ? `<button class="invoice-btn invoice-btn-sm invoice-btn-success" data-action="finalize" data-id="${i.id}" data-testid="btn-finalize-${i.id}">Chốt</button>`
                      : ''
                  }
                  ${
                    !i.isFinalized && i.paidAmount === 0
                      ? `<button class="invoice-btn invoice-btn-sm invoice-btn-danger" data-action="delete" data-id="${i.id}" data-testid="btn-delete-${i.id}">Xóa</button>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    tableContainer.querySelector('tbody').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'view') {
        const inv = await this.invoiceService.getInvoiceById(id);
        this.openInvoiceDetailModal(container, inv);
      } else if (action === 'edit') {
        const inv = await this.invoiceService.getInvoiceById(id);
        this.openInvoiceFormModal(container, inv);
      } else if (action === 'finalize') {
        await this.handleFinalize(container, id);
      } else if (action === 'delete') {
        await this.handleDeleteDraft(container, id);
      }
    });
  }

  openInvoiceDetailModal(container, invoice) {
    const modal = InvoiceDetailComponent.render({
      invoice,
      onClose: () => {},
      onFinalize: async (id, closeModal) => {
        if (confirm(`Bạn có chắc muốn CHỐT hóa đơn #${id}? Hóa đơn đã chốt sẽ không được sửa tùy ý.`)) {
          try {
            await this.invoiceService.finalizeInvoice(id);
            closeModal();
            await this.loadAndRenderData(container);
          } catch (err) {
            alert(`Lỗi khi chốt hóa đơn: ${err.message}`);
          }
        }
      },
      onCancel: async (id, closeModal) => {
        if (confirm(`XÁC NHẬN HỦY hóa đơn #${id}? Hóa đơn đã hủy không thể thanh toán.`)) {
          try {
            await this.invoiceService.cancelInvoice(id);
            closeModal();
            await this.loadAndRenderData(container);
          } catch (err) {
            alert(`Lỗi khi hủy hóa đơn: ${err.message}`);
          }
        }
      }
    });

    document.body.appendChild(modal);
  }

  openInvoiceFormModal(container, invoice = null) {
    const modal = InvoiceFormComponent.render({
      invoice,
      onClose: () => {},
      onSubmit: async (formData, closeModal, onError) => {
        try {
          if (invoice && invoice.id) {
            await this.invoiceService.updateDraftInvoice(invoice.id, formData);
          } else {
            await this.invoiceService.createInvoice(formData);
          }
          closeModal();
          await this.loadAndRenderData(container);
        } catch (err) {
          onError(err.message);
        }
      }
    });

    document.body.appendChild(modal);
  }

  async handleFinalize(container, id) {
    if (confirm(`Xác nhận chốt hóa đơn #${id}?`)) {
      try {
        await this.invoiceService.finalizeInvoice(id);
        await this.loadAndRenderData(container);
      } catch (err) {
        alert(`Không thể chốt hóa đơn: ${err.message}`);
      }
    }
  }

  async handleDeleteDraft(container, id) {
    if (confirm(`XÁC NHẬN XÓA bản nháp hóa đơn #${id}? Thao tác này không thể hoàn tác.`)) {
      try {
        await this.invoiceService.deleteDraftInvoice(id);
        await this.loadAndRenderData(container);
      } catch (err) {
        alert(`Không thể xóa hóa đơn: ${err.message}`);
      }
    }
  }
}