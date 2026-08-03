import { TenantValidator } from '../business/tenant-validator.js';

export class TenantFormComponent {
  /**
   * Render và quản lý Modal Form (Thêm / Sửa)
   * @param {Object} props { tenant, onSubmit, onClose }
   * @returns {HTMLElement}
   */
  static render({ tenant = null, onSubmit, onClose }) {
    const isEdit = Boolean(tenant && tenant.id);
    
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('data-testid', 'tenant-form-modal');

    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Cập Nhật Người Thuê' : 'Thêm Người Thuê Mới'}</h3>
          <button type="button" class="modal-close-btn" data-testid="btn-close-modal">&times;</button>
        </div>
        <form class="tenant-form" id="tenant-form" data-testid="tenant-form">
          <div class="form-group">
            <label for="tenant-fullName">Họ và tên <span style="color: red;">*</span></label>
            <input 
              type="text" 
              id="tenant-fullName" 
              name="fullName" 
              class="form-control" 
              value="${tenant?.fullName || ''}" 
              placeholder="Nguyễn Văn A"
              data-testid="input-tenant-fullName"
            />
            <div class="error-message" id="err-fullName" data-testid="err-tenant-fullName"></div>
          </div>

          <div class="form-group">
            <label for="tenant-phone">Số điện thoại <span style="color: red;">*</span></label>
            <input 
              type="text" 
              id="tenant-phone" 
              name="phone" 
              class="form-control" 
              value="${tenant?.phone || ''}" 
              placeholder="0912345678"
              data-testid="input-tenant-phone"
            />
            <div class="error-message" id="err-phone" data-testid="err-tenant-phone"></div>
          </div>

          <div class="form-group">
            <label for="tenant-idCard">Số CCCD / CMND</label>
            <input 
              type="text" 
              id="tenant-idCard" 
              name="idCard" 
              class="form-control" 
              value="${tenant?.idCard || ''}" 
              placeholder="012345678901"
              data-testid="input-tenant-idCard"
            />
            <div class="error-message" id="err-idCard" data-testid="err-tenant-idCard"></div>
          </div>

          <div class="form-group">
            <label for="tenant-email">Email</label>
            <input 
              type="email" 
              id="tenant-email" 
              name="email" 
              class="form-control" 
              value="${tenant?.email || ''}" 
              placeholder="example@gmail.com"
              data-testid="input-tenant-email"
            />
            <div class="error-message" id="err-email" data-testid="err-tenant-email"></div>
          </div>

          <div class="form-group">
            <label for="tenant-address">Địa chỉ thường trú / Quê quán</label>

            <input 
              type="text" 
              id="tenant-address" 
              name="address" 
              class="form-control" 
              value="${tenant?.address || ''}" 
              placeholder="Thành phố Cần Thơ"
              data-testid="input-tenant-address"
            />
            <div class="error-message" id="err-address"></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-tenant" data-testid="btn-cancel-tenant">Hủy</button>
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-tenant">${isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
          </div>
        </form>
      </div>
    `;

    // Gắn Sự Kiện
    const form = backdrop.querySelector('#tenant-form');
    const closeBtn = backdrop.querySelector('[data-testid="btn-close-modal"]');
    const cancelBtn = backdrop.querySelector('#btn-cancel-tenant');

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Clear errors
      backdrop.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      backdrop.querySelectorAll('.form-control').forEach(el => el.classList.remove('has-error'));

      const formData = {
        fullName: form.fullName.value,
        phone: form.phone.value,
        idCard: form.idCard.value,
        email: form.email.value,
        address: form.address.value
      };

      try {
        TenantValidator.validate(formData);
        onSubmit(formData, handleClose, (errorMessage) => {
          TenantFormComponent.showInlineError(backdrop, errorMessage);
        });
      } catch (error) {
        TenantFormComponent.showInlineError(backdrop, error.message);
      }
    });

    return backdrop;
  }

  /**
   * Hiển thị lỗi inline
   */
  static showInlineError(modalElement, errorMessage) {
    const msg = errorMessage.toLowerCase();
    let targetId = 'err-fullName';
    let inputName = 'fullName';

    if (msg.includes('họ và tên') || msg.includes('tên')) {
      targetId = 'err-fullName';
      inputName = 'fullName';
    } else if (msg.includes('điện thoại') || msg.includes('phone')) {
      targetId = 'err-phone';
      inputName = 'phone';
    } else if (msg.includes('cccd') || msg.includes('cmnd')) {
      targetId = 'err-idCard';
      inputName = 'idCard';
    } else if (msg.includes('email')) {
      targetId = 'err-email';
      inputName = 'email';
    }

    const errContainer = modalElement.querySelector(`#${targetId}`);
    const inputControl = modalElement.querySelector(`[name="${inputName}"]`);

    if (errContainer) errContainer.textContent = errorMessage;
    if (inputControl) inputControl.classList.add('has-error');
  }
}