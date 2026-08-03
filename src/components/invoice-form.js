export class InvoiceFormComponent {
  /**
   * Render modal chỉnh sửa hoặc tạo mới hóa đơn nháp
   * @param {Object} options
   * @param {Object} [options.invoice] - Bản ghi hóa đơn nếu sửa
   * @param {Function} options.onSubmit - Callback xử lý submit
   * @param {Function} options.onClose - Callback khi đóng modal
   */
  static render({ invoice = null, onSubmit, onClose }) {
    const isEdit = Boolean(invoice && invoice.id);
    const backdrop = document.createElement('div');
    backdrop.className = 'invoice-modal-backdrop';
    backdrop.setAttribute('data-testid', 'invoice-form-modal');

    const defaultItems = invoice?.items || [
      { name: 'Tiền thuê phòng', unitPrice: 0, quantity: 1, amount: 0 }
    ];

    backdrop.innerHTML = `
      <div class="invoice-modal-content invoice-modal-lg">
        <div class="invoice-modal-header">
          <h3>${isEdit ? `Chỉnh Sửa Hóa Đơn Nháp #${invoice.id}` : 'Tạo Hóa Đơn Mới'}</h3>
          <button type="button" class="invoice-modal-close" data-testid="btn-close-form-modal">&times;</button>
        </div>
        <form class="invoice-modal-body" id="invoice-edit-form" data-testid="invoice-form">
          <div class="invoice-form-row">
            <div class="invoice-form-group">
              <label>Mã Phòng <span class="required">*</span></label>
              <input 
                type="text" 
                name="roomId" 
                class="invoice-input" 
                value="${invoice?.roomId ?? ''}" 
                placeholder="Ví dụ: 101"
                ${isEdit ? 'disabled' : ''}
                data-testid="input-invoice-room"
              />
            </div>

            <div class="invoice-form-group">
              <label>Tháng Hóa Đơn <span class="required">*</span></label>
              <input 
                type="month" 
                name="month" 
                class="invoice-input" 
                value="${invoice?.month ?? new Date().toISOString().substring(0, 7)}" 
                ${isEdit ? 'disabled' : ''}
                data-testid="input-invoice-month"
              />
            </div>

            <div class="invoice-form-group">
              <label>Hạn Thanh Toán <span class="required">*</span></label>
              <input 
                type="date" 
                name="dueDate" 
                class="invoice-input" 
                value="${invoice?.dueDate ?? ''}" 
                data-testid="input-invoice-duedate"
              />
            </div>
          </div>

          <div class="invoice-section-title">
            <span>📋 Danh Sách Các Khoản Dịch Vụ / Chi Phí</span>
            <button type="button" class="invoice-btn invoice-btn-sm invoice-btn-secondary" id="btn-add-item" data-testid="btn-add-item">+ Thêm khoản</button>
          </div>

          <div id="items-container" class="invoice-items-form-list">
            <!-- Render động các dòng item -->
          </div>

          <div class="invoice-form-row invoice-summary-form-row">
            <div class="invoice-form-group">
              <label>Giảm giá (đ)</label>
              <input 
                type="number" 
                name="discount" 
                class="invoice-input" 
                value="${invoice?.discount ?? 0}" 
                min="0"
                data-testid="input-invoice-discount"
              />
            </div>

            <div class="invoice-form-group">
              <label>Số tiền đã trả (đ)</label>
              <input 
                type="number" 
                name="paidAmount" 
                class="invoice-input" 
                value="${invoice?.paidAmount ?? 0}" 
                min="0"
                data-testid="input-invoice-paid"
              />
            </div>
          </div>

          <div class="invoice-error-box" id="form-error-box" style="display: none;" data-testid="invoice-form-error"></div>

          <div class="invoice-form-actions">
            <button type="button" class="invoice-btn invoice-btn-secondary" id="btn-cancel-form" data-testid="btn-cancel-form">Hủy</button>
            <button type="submit" class="invoice-btn invoice-btn-primary" data-testid="btn-submit-invoice">
              ${isEdit ? 'Cập Nhật Bản Nháp' : 'Tạo Bản Nháp'}
            </button>
          </div>
        </form>
      </div>
    `;

    const form = backdrop.querySelector('#invoice-edit-form');
    const itemsContainer = backdrop.querySelector('#items-container');
    const errorBox = backdrop.querySelector('#form-error-box');

    // Hàm render danh sách items trong form
    const renderItemsInputs = (items) => {
      itemsContainer.innerHTML = items
        .map(
          (item, idx) => `
        <div class="invoice-item-row-form" data-index="${idx}" data-testid="form-item-row-${idx}">
          <input 
            type="text" 
            class="invoice-input item-name" 
            placeholder="Tên khoản chi" 
            value="${item.name || ''}" 
            data-testid="input-item-name-${idx}"
          />
          <input 
            type="number" 
            class="invoice-input item-price" 
            placeholder="Đơn giá" 
            value="${item.unitPrice ?? 0}" 
            min="0"
            data-testid="input-item-price-${idx}"
          />
          <input 
            type="number" 
            class="invoice-input item-qty" 
            placeholder="SL" 
            value="${item.quantity ?? 1}" 
            min="1"
            data-testid="input-item-qty-${idx}"
          />
          <button type="button" class="invoice-btn-icon btn-remove-item" data-index="${idx}" data-testid="btn-remove-item-${idx}">&times;</button>
        </div>
      `
        )
        .join('');
    };

    let currentItems = [...defaultItems];
    renderItemsInputs(currentItems);

    backdrop.querySelector('#btn-add-item').addEventListener('click', () => {
      currentItems.push({ name: '', unitPrice: 0, quantity: 1, amount: 0 });
      renderItemsInputs(currentItems);
    });

    itemsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-remove-item')) {
        const idx = parseInt(e.target.dataset.index, 10);
        if (currentItems.length > 1) {
          currentItems.splice(idx, 1);
          renderItemsInputs(currentItems);
        } else {
          alert('Hóa đơn phải có ít nhất 1 khoản mục.');
        }
      }
    });

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.invoice-modal-close').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-cancel-form').addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      // Thu thập items từ DOM
      const itemRows = itemsContainer.querySelectorAll('.invoice-item-row-form');
      const updatedItems = Array.from(itemRows).map((row) => {
        const name = row.querySelector('.item-name').value;
        const unitPrice = Number(row.querySelector('.item-price').value || 0);
        const quantity = Number(row.querySelector('.item-qty').value || 1);
        return {
          name,
          unitPrice,
          quantity,
          amount: unitPrice * quantity
        };
      });

      const formData = {
        roomId: isEdit ? invoice.roomId : form.roomId.value.trim(),
        month: isEdit ? invoice.month : form.month.value,
        dueDate: form.dueDate.value,
        discount: Number(form.discount.value || 0),
        paidAmount: Number(form.paidAmount.value || 0),
        items: updatedItems
      };

      onSubmit(
        formData,
        handleClose,
        (errMsg) => {
          errorBox.textContent = errMsg;
          errorBox.style.display = 'block';
        }
      );
    });

    return backdrop;
  }
}