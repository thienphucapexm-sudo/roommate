import { debtService } from '../services/debt-service.js';
import { storageService } from '../services/storage-service.js';

export function renderDebtsPage(container) {
  // Không truy cập LocalStorage trực tiếp - dùng storageService để lấy bộ lọc phòng/tháng
  const rooms = storageService.getRooms() || [];
  const invoices = storageService.getInvoices() || [];

  // Lấy các tháng duy nhất có trong danh sách hóa đơn
  const availableMonths = [...new Set(invoices.map((inv) => inv.month).filter(Boolean))].sort();

  const html = `
    <div class="debts-page" data-testid="debts-page">
      <div class="page-header">
        <h2>Theo dõi công nợ</h2>
      </div>

      <!-- Khung Thống kê Tổng công nợ -->
      <div class="debt-summary-card" data-testid="debt-summary-card">
        <div class="summary-info">
          <span class="summary-label">TỔNG CÔNG NỢ HIỆN TẠI</span>
          <h1 id="total-debt-amount" class="summary-value" data-testid="total-debt-amount">0 đ</h1>
        </div>
        <div class="summary-badge" id="overdue-summary-badge" data-testid="overdue-summary-badge">
          0 hóa đơn quá hạn
        </div>
      </div>

      <!-- Bộ lọc -->
      <div class="filters-card" data-testid="debt-filters">
        <div class="filter-group">
          <label for="filter-room">Lọc theo phòng</label>
          <select id="filter-room" data-testid="filter-room">
            <option value="">-- Tất cả phòng --</option>
            ${rooms.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label for="filter-month">Lọc theo tháng</label>
          <select id="filter-month" data-testid="filter-month">
            <option value="">-- Tất cả các tháng --</option>
            ${availableMonths.map((m) => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group filter-checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="filter-overdue-only" data-testid="filter-overdue-only" />
            Chỉ xem hóa đơn quá hạn
          </label>
        </div>

        <div class="filter-actions">
          <button id="btn-reset-filters" class="btn btn-link" data-testid="btn-reset-filters">Xóa bộ lọc</button>
        </div>
      </div>

      <!-- Bảng danh sách công nợ -->
      <div class="table-container">
        <table class="debts-table" data-testid="debts-table">
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Phòng</th>
              <th>Tháng</th>
              <th>Hạn thanh toán</th>
              <th>Số tiền hóa đơn</th>
              <th>Đã trả</th>
              <th>Còn nợ (Giảm dần)</th>
              <th>Quá hạn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="debts-table-body" data-testid="debts-table-body">
            <!-- Dữ liệu render động -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Binding DOM elements
  const totalDebtEl = container.querySelector('#total-debt-amount');
  const overdueBadgeEl = container.querySelector('#overdue-summary-badge');
  const filterRoom = container.querySelector('#filter-room');
  const filterMonth = container.querySelector('#filter-month');
  const filterOverdueOnly = container.querySelector('#filter-overdue-only');
  const btnResetFilters = container.querySelector('#btn-reset-filters');
  const tableBody = container.querySelector('#debts-table-body');

  function renderData() {
    let outstandingList = debtService.getOutstandingInvoices();
    const currentDateStr = new Date().toISOString().substring(0, 10);

    // Bổ sung số ngày quá hạn vào danh sách
    outstandingList = outstandingList.map((inv) => ({
      ...inv,
      daysOverdue: debtService.calculateDaysOverdue(inv.dueDate, currentDateStr),
    }));

    // Cập nhật thẻ tổng số tiền công nợ
    const totalDebt = debtService.getTotalDebt();
    totalDebtEl.textContent = `${totalDebt.toLocaleString('vi-VN')} đ`;

    const overdueCount = debtService.getOverdueInvoices(currentDateStr).length;
    overdueBadgeEl.textContent = `${overdueCount} hóa đơn quá hạn`;
    if (overdueCount > 0) {
      overdueBadgeEl.classList.add('badge-danger');
    } else {
      overdueBadgeEl.classList.remove('badge-danger');
    }

    // Áp dụng bộ lọc
    if (filterRoom.value) {
      outstandingList = outstandingList.filter((inv) => String(inv.roomId) === String(filterRoom.value));
    }

    if (filterMonth.value) {
      outstandingList = outstandingList.filter((inv) => inv.month === filterMonth.value);
    }

    if (filterOverdueOnly.checked) {
      outstandingList = outstandingList.filter((inv) => inv.daysOverdue > 0);
    }

    // Quy tắc: Sắp xếp công nợ giảm dần
    outstandingList.sort((a, b) => b.remainingAmount - a.remainingAmount);

    if (outstandingList.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center empty-msg" data-testid="empty-debts-msg">
            Không có dữ liệu công nợ phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = outstandingList
      .map((inv) => {
        const invoiceCode = inv.code || `#${inv.id}`;
        const totalFormatted = Number(inv.total || 0).toLocaleString('vi-VN');
        const paidFormatted = Number(inv.paidAmount || 0).toLocaleString('vi-VN');
        const remainingFormatted = Number(inv.remainingAmount || 0).toLocaleString('vi-VN');

        const overdueText = inv.daysOverdue > 0 
          ? `<span class="badge-overdue" data-testid="overdue-days">${inv.daysOverdue} ngày</span>` 
          : `<span class="badge-normal">Đang trong hạn</span>`;

        return `
          <tr data-testid="debt-row-${inv.id}">
            <td class="font-mono">${invoiceCode}</td>
            <td class="font-bold">${inv.roomName}</td>
            <td>${inv.month || '---'}</td>
            <td>${inv.dueDate || '---'}</td>
            <td>${totalFormatted} đ</td>
            <td class="text-success">${paidFormatted} đ</td>
            <td class="text-danger font-bold" data-testid="remaining-amount">${remainingFormatted} đ</td>
            <td>${overdueText}</td>
            <td>
              <a 
                href="#/invoices/${inv.id}" 
                class="btn-detail-link" 
                data-testid="link-invoice-detail-${inv.id}"
              >
                Xem chi tiết
              </a>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Sự kiện thay đổi bộ lọc
  [filterRoom, filterMonth, filterOverdueOnly].forEach((el) => {
    el.addEventListener('change', renderData);
  });

  // Xóa bộ lọc
  btnResetFilters.addEventListener('click', () => {
    filterRoom.value = '';
    filterMonth.value = '';
    filterOverdueOnly.checked = false;
    renderData();
  });

  // Tải dữ liệu ban đầu
  renderData();
}