import { paymentService } from '../services/payment-service.js';
import { storageService } from '../services/storage-service.js';
import { renderPaymentForm } from '../components/payment-form.js';

export function renderPaymentsPage(container) {
  let invoices = storageService.getInvoices() || [];
  let rooms = storageService.getRooms() || [];

  const html = `
    <div class="payments-page" data-testid="payments-page">
      <div class="page-header">
        <h2>Quản lý thanh toán</h2>
        <button id="btn-open-create-modal" class="btn btn-primary" data-testid="btn-open-create-modal">
          + Ghi nhận thanh toán
        </button>
      </div>

      <!-- Bộ lọc -->
      <div class="filters-card" data-testid="payment-filters">
        <div class="filter-group">
          <label>Phòng</label>
          <select id="filter-room" data-testid="filter-room">
            <option value="">-- Tất cả phòng --</option>
            ${rooms.map((r) => `<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Phương thức</label>
          <select id="filter-method" data-testid="filter-method">
            <option value="">-- Tất cả phương thức --</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="E_WALLET">Ví điện tử</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Từ ngày</label>
          <input type="date" id="filter-from-date" data-testid="filter-from-date" />
        </div>

        <div class="filter-group">
          <label>Đến ngày</label>
          <input type="date" id="filter-to-date" data-testid="filter-to-date" />
        </div>

        <div class="filter-actions">
          <button id="btn-reset-filters" class="btn btn-link" data-testid="btn-reset-filters">Xóa bộ lọc</button>
        </div>
      </div>

      <!-- Khung hiển thị Form tạo giao dịch (Modal) -->
      <div id="payment-modal" class="payment-modal hidden" data-testid="payment-modal">
        <div class="modal-content">
          <div id="modal-form-container"></div>
        </div>
      </div>

      <!-- Bảng danh sách giao dịch -->
      <div class="table-container">
        <table class="payments-table" data-testid="payments-table">
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Mã hóa đơn</th>
              <th>Phòng</th>
              <th>Ngày thanh toán</th>
              <th>Phương thức</th>
              <th>Số tiền</th>
              <th>Ghi chú</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="payments-table-body" data-testid="payments-table-body">
            <!-- Render danh sách động -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind DOM Elements
  const modal = container.querySelector('#payment-modal');
  const modalFormContainer = container.querySelector('#modal-form-container');
  const btnOpenModal = container.querySelector('#btn-open-create-modal');
  const tableBody = container.querySelector('#payments-table-body');

  const filterRoom = container.querySelector('#filter-room');
  const filterMethod = container.querySelector('#filter-method');
  const filterFromDate = container.querySelector('#filter-from-date');
  const filterToDate = container.querySelector('#filter-to-date');
  const btnResetFilters = container.querySelector('#btn-reset-filters');

  // Phương thức hiển thị danh sách đã lọc
  function refreshPaymentList() {
    invoices = storageService.getInvoices() || [];
    rooms = storageService.getRooms() || [];

    const filters = {
      method: filterMethod.value,
      fromDate: filterFromDate.value,
      toDate: filterToDate.value,
    };

    let payments = paymentService.filterPayments(filters);

    // Lọc theo Phòng
    if (filterRoom.value) {
      const selectedRoomId = String(filterRoom.value);
      const roomInvoiceIds = invoices
        .filter((inv) => String(inv.roomId) === selectedRoomId)
        .map((inv) => String(inv.id));

      payments = payments.filter((p) => roomInvoiceIds.includes(String(p.invoiceId)));
    }

    if (payments.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center empty-msg" data-testid="empty-payments-msg">
            Không tìm thấy giao dịch thanh toán nào.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = payments
      .map((p) => {
        const invoice = invoices.find((inv) => String(inv.id) === String(p.invoiceId));
        const room = invoice ? rooms.find((r) => String(r.id) === String(invoice.roomId)) : null;
        
        const invoiceCode = invoice ? invoice.code || `#${invoice.id}` : '---';
        const roomName = room ? room.name : '---';
        const methodText = mapPaymentMethod(p.method);
        const formattedAmount = Number(p.amount || 0).toLocaleString('vi-VN');

        return `
          <tr data-testid="payment-row-${p.id}">
            <td class="font-mono" data-testid="payment-code">${p.id}</td>
            <td><span class="badge-invoice">${invoiceCode}</span></td>
            <td>${roomName}</td>
            <td>${p.paymentDate || (p.createdAt ? p.createdAt.substring(0, 10) : '---')}</td>
            <td><span class="method-tag method-${p.method}">${methodText}</span></td>
            <td class="amount-text font-bold text-success">+${formattedAmount} đ</td>
            <td>${p.note || '-'}</td>
            <td>
              <button 
                class="btn-delete-payment btn-danger-link" 
                data-id="${p.id}" 
                data-testid="btn-delete-payment-${p.id}"
                title="Xóa giao dịch"
              >
                Xóa
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Binding sự kiện xóa giao dịch
    tableBody.querySelectorAll('.btn-delete-payment').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const paymentId = e.target.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa giao dịch thanh toán này? Hóa đơn liên quan sẽ được tính toán lại.')) {
          try {
            paymentService.deletePayment(paymentId);
            refreshPaymentList();
          } catch (err) {
            alert(err.message || 'Xóa thanh toán thất bại.');
          }
        }
      });
    });
  }

  // Mở modal tạo thanh toán mới
  btnOpenModal.addEventListener('click', () => {
    invoices = storageService.getInvoices() || [];
    rooms = storageService.getRooms() || [];

    renderPaymentForm(modalFormContainer, {
      invoices,
      rooms,
      onSuccess: () => {
        modal.classList.add('hidden');
        refreshPaymentList();
      },
      onCancel: () => {
        modal.classList.add('hidden');
      },
    });

    modal.classList.remove('hidden');
  });

  // Lắng nghe thay đổi bộ lọc
  [filterRoom, filterMethod, filterFromDate, filterToDate].forEach((element) => {
    element.addEventListener('change', refreshPaymentList);
  });

  // Xóa bộ lọc
  btnResetFilters.addEventListener('click', () => {
    filterRoom.value = '';
    filterMethod.value = '';
    filterFromDate.value = '';
    filterToDate.value = '';
    refreshPaymentList();
  });

  // Lần tải đầu tiên
  refreshPaymentList();
}

/**
 * Chuyển đổi mã phương thức sang văn bản hiển thị
 */
function mapPaymentMethod(method) {
  switch (method) {
    case 'CASH':
      return 'Tiền mặt';
    case 'BANK_TRANSFER':
      return 'Chuyển khoản';
    case 'E_WALLET':
      return 'Ví điện tử';
    default:
      return method || 'Khác';
  }
}
