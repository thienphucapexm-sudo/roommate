import { CHARGE_TYPES } from '../business/service-config-validator.js';

export class ServiceConfigFormComponent {
  static render({ service = null, onSubmit, onClose }) {
    const isEdit = Boolean(service && service.id);

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('data-testid', 'service-form-modal');

    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}</h3>
          <button type="button" class="modal-close-btn" data-testid="btn-close-modal">&times;</button>
        </div>
        <form class="modal-body" id="service-form" data-testid="service-form">
          <div class="form-group">
            <label>Mã dịch vụ <span style="color:red;">*</span></label>

            <input 
              type="text" 
              name="code" 
              class="form-control" 
              value="${service?.code || ''}" 
              placeholder="Ví dụ: ELECTRIC, WATER..." 
              ${isEdit ? 'readonly' : ''}
              data-testid="input-service-code"
            />
          </div>

          <div class="form-group">
            <label>Tên dịch vụ <span style="color:red;">*</span></label>

            <input 
              type="text" 
              name="name" 
              class="form-control" 
              value="${service?.name || ''}" 
              placeholder="Ví dụ: Tiền điện, Tiền nước..." 
              data-testid="input-service-name"
            />
          </div>

          <div class="form-group">
            <label>Cách tính phí <span style="color:red;">*</span></label>

            <select name="chargeType" class="form-control" data-testid="select-service-charge-type">
              <option value="${CHARGE_TYPES.USAGE}" ${service?.chargeType === CHARGE_TYPES.USAGE ? 'selected' : ''}>Theo chỉ số sử dụng (usage)</option>
              <option value="${CHARGE_TYPES.FIXED}" ${service?.chargeType === CHARGE_TYPES.FIXED ? 'selected' : ''}>Cố định theo phòng (fixed)</option>
              <option value="${CHARGE_TYPES.PER_PERSON}" ${service?.chargeType === CHARGE_TYPES.PER_PERSON ? 'selected' : ''}>Theo số người (perPerson)</option>
              <option value="${CHARGE_TYPES.PER_VEHICLE}" ${service?.chargeType === CHARGE_TYPES.PER_VEHICLE ? 'selected' : ''}>Theo số xe (perVehicle)</option>
              <option value="${CHARGE_TYPES.MANUAL}" ${service?.chargeType === CHARGE_TYPES.MANUAL ? 'selected' : ''}>Nhập thủ công (manual)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Đơn vị tính</label>
            <input 
              type="text" 
              name="unit" 
              class="form-control" 
              value="${service?.unit || ''}" 
              placeholder="kWh, m3, Người, Xe, Khối..." 
              data-testid="input-service-unit"
            />
          </div>

          <div class="form-group">
            <label>Đơn giá (VNĐ) <span style="color:red;">*</span></label>

            <input 
              type="number" 
              name="unitPrice" 
              class="form-control" 
              value="${service?.unitPrice ?? 0}" 
              placeholder="0" 
              data-testid="input-service-unit-price"
            />
          </div>

          <div class="error-message" id="modal-error" style="color:red; font-size:0.85rem;" data-testid="service-form-error"></div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel" data-testid="btn-cancel-service">Hủy</button>
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-service">${isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
          </div>
        </form>
      </div>
    `;

    const form = backdrop.querySelector('#service-form');
    const errorContainer = backdrop.querySelector('#modal-error');

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.modal-close-btn').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-cancel').addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorContainer.textContent = '';

      const formData = {
        code: form.code.value,
        name: form.name.value,
        chargeType: form.chargeType.value,
        unit: form.unit.value,
        unitPrice: form.unitPrice.value
      };

      onSubmit(formData, handleClose, (errMessage) => {
        errorContainer.textContent = errMessage;
      });
    });

    return backdrop;
  }
}