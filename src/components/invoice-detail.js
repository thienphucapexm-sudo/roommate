export class InvoiceDetailComponent {
  /**
   * Render giao diện chi tiết hóa đơn (dạng Modal/Drawer) có tích hợp tính năng in
   * @param {Object} options
   * @param {Object} options.invoice - Đối tượng hóa đơn chi tiết
   * @param {Function} options.onClose - Callback khi đóng
   * @param {Function} [options.onFinalize] - Callback chốt hóa đơn
   * @param {Function} [options.onCancel] - Callback hủy hóa đơn
   */
  static render({ invoice, onClose, onFinalize, onCancel }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'invoice-modal-backdrop';
    backdrop.setAttribute('data-testid', 'invoice-detail-modal');

    const getStatusBadge = (status) => {
      switch (status) {
        case 'PAID':
          return '<span class="invoice-badge badge-success" data-testid="badge-status">Đã thanh toán</span>';
        case 'PARTIAL':
          return '<span class="invoice-badge badge-warning" data-testid="badge-status">Thanh toán 1 phần</span>';
        case 'OVERDUE':
          return '<span class="invoice-badge badge-danger" data-testid="badge-status">Quá hạn</span>';
        case 'CANCELLED':
          return '<span class="invoice-badge badge-dark" data-testid="badge-status">Đã hủy</span>';
        default:
          return '<span class="invoice-badge badge-info" data-testid="badge-status">Chưa thanh toán</span>';
      }
    };

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    backdrop.innerHTML = `
      <div class="invoice-modal-content invoice-printable-area">
        <div class="invoice-modal-header no-print">
          <h3>Chi Tiết Hóa Đơn #${invoice.id}</h3>
          <div class="invoice-header-actions">
            <button type="button" class="invoice-btn invoice-btn-secondary" id="btn-print-invoice" data-testid="btn-print-invoice">
              🖨️ In Hóa Đơn
            </button>
            <button type="button" class="invoice-modal-close" data-testid="btn-close-detail">&times;</button>
          </div>
        </div>

        <div class="invoice-printable-wrapper">
          <div class="invoice-print-header">
            <div class="invoice-brand">
              <h2>ROOMMATE MANAGEMENT</h2>
              <p>Hóa Đơn Tiền Nhà & Dịch Vụ</p>
            </div>
            <div class="invoice-meta-top">
              <div><strong>Mã HĐ:</strong> #${invoice.id}</div>
              <div><strong>Kỳ thanh toán:</strong> ${invoice.month}</div>
              <div><strong>Ngày tạo:</strong> ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          <hr class="invoice-divider" />

          <div class="invoice-info-grid">
            <div class="invoice-info-block">
              <span class="info-label">Phòng:</span>
              <strong class="info-value">Phòng ${invoice.roomId}</strong>
            </div>
            <div class="invoice-info-block">
              <span class="info-label">Hạn thanh toán:</span>
              <span class="info-value">${invoice.dueDate || '--'}</span>
            </div>
            <div class="invoice-info-block">
              <span class="info-label">Loại hóa đơn:</span>
              <span class="info-value">${invoice.isFinalized ? 'Chính thức (Đã chốt)' : 'Bản nháp'}</span>
            </div>
            <div class="invoice-info-block">
              <span class="info-label">Trạng thái:</span>
              <div class="info-value">${getStatusBadge(invoice.status)}</div>
            </div>
          </div>

          <table class="invoice-items-table" data-testid="invoice-items-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Khoản mục</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-center">Số lượng</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || [])
                .map(
                  (item, idx) => `
                <tr data-testid="invoice-item-row-${idx}">
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${item.name}</strong></td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-center">${item.quantity ?? 1}</td>
                  <td class="text-right font-weight-bold">${formatCurrency(item.amount)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="invoice-summary-block">
            <div class="summary-row">
              <span>Tạm tính:</span>
              <strong>${formatCurrency(invoice.subtotal)}</strong>
            </div>
            <div class="summary-row text-danger">
              <span>Giảm giá:</span>
              <span>- ${formatCurrency(invoice.discount)}</span>
            </div>
            <div class="summary-row summary-row-total">
              <span>Tổng tiền:</span>
              <strong class="text-primary" data-testid="detail-total-amount">${formatCurrency(invoice.total)}</strong>
            </div>
            <div class="summary-row">
              <span>Đã thanh toán:</span>
              <span class="text-success" data-testid="detail-paid-amount">${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div class="summary-row summary-row-debt">
              <span>Còn nợ:</span>
              <strong class="text-danger" data-testid="detail-remaining-debt">${formatCurrency(invoice.remainingDebt)}</strong>
            </div>
          </div>
        </div>

        <div class="invoice-modal-footer no-print">
          ${
            !invoice.isFinalized && invoice.status !== 'CANCELLED'
              ? `<button class="invoice-btn invoice-btn-success" id="btn-finalize-modal" data-testid="btn-finalize-invoice">📌 Chốt Hóa Đơn</button>`
              : ''
          }
          ${
            invoice.paidAmount === 0 && invoice.status !== 'CANCELLED'
              ? `<button class="invoice-btn invoice-btn-danger" id="btn-cancel-modal" data-testid="btn-cancel-invoice">🚫 Hủy Hóa Đơn</button>`
              : ''
          }
          <button class="invoice-btn invoice-btn-secondary" id="btn-close-footer" data-testid="btn-close-footer">Đóng</button>
        </div>
      </div>
    `;

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.invoice-modal-close').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-close-footer').addEventListener('click', handleClose);

    backdrop.querySelector('#btn-print-invoice').addEventListener('click', () => {
      window.print();
    });

    const finalizeBtn = backdrop.querySelector('#btn-finalize-modal');
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', () => {
        if (typeof onFinalize === 'function') onFinalize(invoice.id, handleClose);
      });
    }

    const cancelBtn = backdrop.querySelector('#btn-cancel-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (typeof onCancel === 'function') onCancel(invoice.id, handleClose);
      });
    }

    return backdrop;
  }
}