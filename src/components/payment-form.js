import { paymentService } from '../services/payment-service.js';

export function renderPaymentForm(container, { invoices = [], rooms = [], onSuccess, onCancel }) {
  // Lọc chỉ những hóa đơn còn nợ và chưa bị hủy
  const unpaidInvoices = invoices.filter((inv) => {
    if (inv.status === 'CANCELLED' || inv.status === 'PAID') return false;
    const paid = paymentService.getTotalPaidByInvoice(inv.id);
    return Number(inv.total) - paid > 0;
  });

  let selectedInvoice = null;
  let remainingDebt = 0;

  const html = `
    <form id="payment-form" class="payment-form" data-testid="payment-form">
      <h3 class="form-title">Tạo giao dịch thanh toán</h3>
      
      <div class="form-group">
        <label for="invoice-select">Chọn hóa đơn còn nợ *</label>
        <select id="invoice-select" name="invoiceId" required data-testid="invoice-select">
          <option value="">-- Chọn hóa đơn --</option>
          ${unpaidInvoices
            .map((inv) => {
              const room = rooms.find((r) => String(r.id) === String(inv.roomId));
              const roomName = room ? room.name : `Phòng ${inv.roomId}`;
              return `<option value="${inv.id}">${inv.code || `#${inv.id}`} - ${roomName} (${inv.month || ''})</option>`;
            })
            .join('')}
        </select>
      </div>

      <!-- Khung hiển thị chi tiết tài chính của hóa đơn -->
      <div id="invoice-summary" class="invoice-summary-card hidden" data-testid="invoice-summary">
        <div class="summary-item">
          <span class="label">Tổng hóa đơn:</span>
          <span id="summary-total" class="value" data-testid="summary-total">0 đ</span>
        </div>
        <div class="summary-item">
          <span class="label">Đã thanh toán:</span>
          <span id="summary-paid" class="value text-success" data-testid="summary-paid">0 đ</span>
        </div>
        <div class="summary-item highlight">
          <span class="label">Còn nợ:</span>
          <span id="summary-remaining" class="value text-danger" data-testid="summary-remaining">0 đ</span>
        </div>
      </div>

      <div class="form-group">
        <label for="payment-amount">Số tiền thanh toán (VNĐ) *</label>
        <input 
          type="number" 
          id="payment-amount" 
          name="amount" 
          min="1" 
          step="1000" 
          required 
          placeholder="Nhập số tiền..."
          data-testid="payment-amount-input"
        />
        <small id="amount-error" class="error-text hidden" data-testid="amount-error">
          Số tiền không được vượt quá số tiền còn nợ.
        </small>
      </div>

      <div class="form-group">
        <label for="payment-method">Phương thức thanh toán *</label>
        <select id="payment-method" name="method" required data-testid="payment-method-select">
          <option value="CASH">Tiền mặt</option>
          <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
          <option value="E_WALLET">Ví điện tử</option>
        </select>
      </div>

      <div class="form-group">
        <label for="payment-date">Ngày thanh toán *</label>
        <input 
          type="date" 
          id="payment-date" 
          name="paymentDate" 
          value="${new Date().toISOString().substring(0, 10)}" 
          required 
          data-testid="payment-date-input"
        />
      </div>

      <div class="form-group">
        <label for="payment-note">Ghi chú</label>
        <textarea id="payment-note" name="note" rows="2" placeholder="Nhập ghi chú (nếu có)..." data-testid="payment-note-input"></textarea>
      </div>

      <div id="form-error-msg" class="alert alert-danger hidden" data-testid="form-error-msg"></div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel-payment" data-testid="btn-cancel-payment">Hủy</button>
        <button type="submit" class="btn btn-primary" id="btn-submit-payment" data-testid="btn-submit-payment">Xác nhận thanh toán</button>
      </div>
    </form>
  `;

  container.innerHTML = html;

  // Binding DOM elements
  const form = container.querySelector('#payment-form');
  const invoiceSelect = container.querySelector('#invoice-select');
  const summaryCard = container.querySelector('#invoice-summary');
  const summaryTotal = container.querySelector('#summary-total');
  const summaryPaid = container.querySelector('#summary-paid');
  const summaryRemaining = container.querySelector('#summary-remaining');
  const amountInput = container.querySelector('#payment-amount');
  const amountError = container.querySelector('#amount-error');
  const formErrorMsg = container.querySelector('#form-error-msg');
  const btnCancel = container.querySelector('#btn-cancel-payment');

  // Sự kiện chọn hóa đơn -> Hiển thị chi tiết số tiền
  invoiceSelect.addEventListener('change', (e) => {
    const invId = e.target.value;
    selectedInvoice = invoices.find((inv) => String(inv.id) === String(invId));

    if (selectedInvoice) {
      const total = Number(selectedInvoice.total) || 0;
      const paid = paymentService.getTotalPaidByInvoice(selectedInvoice.id);
      remainingDebt = Math.max(0, total - paid);

      summaryTotal.textContent = `${total.toLocaleString('vi-VN')} đ`;
      summaryPaid.textContent = `${paid.toLocaleString('vi-VN')} đ`;
      summaryRemaining.textContent = `${remainingDebt.toLocaleString('vi-VN')} đ`;

      amountInput.max = remainingDebt;
      amountInput.placeholder = `Tối đa ${remainingDebt.toLocaleString('vi-VN')} đ`;
      summaryCard.classList.remove('hidden');
    } else {
      selectedInvoice = null;
      remainingDebt = 0;
      summaryCard.classList.add('hidden');
      amountInput.removeAttribute('max');
    }
  });

  // Kiểm tra thời gian thực số tiền nhập không vượt quá công nợ
  amountInput.addEventListener('input', () => {
    const val = Number(amountInput.value);
    if (selectedInvoice && val > remainingDebt) {
      amountError.classList.remove('hidden');
    } else {
      amountError.classList.add('hidden');
    }
  });

  // Xử lý gửi biểu mẫu
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formErrorMsg.classList.add('hidden');

    const formData = new FormData(form);
    const amount = Number(formData.get('amount'));

    if (selectedInvoice && amount > remainingDebt) {
      amountError.classList.remove('hidden');
      return;
    }

    try {
      const paymentData = {
        invoiceId: formData.get('invoiceId'),
        amount: amount,
        method: formData.get('method'),
        paymentDate: formData.get('paymentDate'),
        note: formData.get('note'),
      };

      paymentService.createPayment(paymentData);

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      formErrorMsg.textContent = err.message || 'Có lỗi xảy ra khi lưu giao dịch.';
      formErrorMsg.classList.remove('hidden');
    }
  });

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (typeof onCancel === 'function') onCancel();
    });
  }
}