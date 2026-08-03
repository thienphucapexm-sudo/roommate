import { RoomValidator } from '../business/room-validator.js';
import { ROOM_STATUS } from '../constants/statuses.js';

export class RoomFormComponent {
  /**
   * Render và quản lý Modal Form (Thêm / Sửa)
   * @param {Object} props { room, onSubmit, onClose }
   * @returns {HTMLElement}
   */
  static render({ room = null, onSubmit, onClose }) {
    const isEdit = Boolean(room && room.id);
    
    const backdrop = document.createElement('div');
    backdrop.className = 'room-modal-backdrop';
    backdrop.setAttribute('data-testid', 'room-form-modal');

    backdrop.innerHTML = `
      <div class="room-modal-content">
        <div class="room-modal-header">
          <h3>${isEdit ? 'Cập Nhật Thông Tin Phòng' : 'Thêm Phòng Mới'}</h3>
          <button type="button" class="room-modal-close-btn" data-testid="btn-close-modal">&times;</button>
        </div>
        <form class="room-form" id="room-form" data-testid="room-form">
          <div class="form-group">
            <label for="room-number">Mã / Số phòng <span style="color: red;">*</span></label>
            <input 
              type="text" 
              id="room-number" 
              name="number" 
              class="form-control" 
              value="${room?.number || ''}" 
              data-testid="input-room-number"
            />
            <div class="error-message" id="err-number" data-testid="err-room-number"></div>
          </div>

          <div class="form-group">
            <label for="room-price">Giá thuê (VNĐ) <span style="color: red;">*</span></label>
            <input 
              type="number" 
              id="room-price" 
              name="price" 
              class="form-control" 
              value="${room?.price ?? ''}" 
              data-testid="input-room-price"
            />
            <div class="error-message" id="err-price" data-testid="err-room-price"></div>
          </div>

          <div class="form-group">
            <label for="room-floor">Tầng</label>
            <input 
              type="number" 
              id="room-floor" 
              name="floor" 
              class="form-control" 
              value="${room?.floor ?? 1}" 
              data-testid="input-room-floor"
            />
            <div class="error-message" id="err-floor" data-testid="err-room-floor"></div>
          </div>

          <div class="form-group">
            <label for="room-maxTenants">Số người tối đa <span style="color: red;">*</span></label>
            <input 
              type="number" 
              id="room-maxTenants" 
              name="maxTenants" 
              class="form-control" 
              value="${room?.maxTenants ?? 2}" 
              data-testid="input-room-maxTenants"
            />
            <div class="error-message" id="err-maxTenants" data-testid="err-room-maxTenants"></div>
          </div>

          <div class="form-group">
            <label for="room-status">Trạng thái</label>
            <select id="room-status" name="status" class="form-control" data-testid="select-room-status">
              <option value="${ROOM_STATUS.AVAILABLE}" ${room?.status === ROOM_STATUS.AVAILABLE ? 'selected' : ''}>Trống</option>
              <option value="${ROOM_STATUS.RENTED}" ${room?.status === ROOM_STATUS.RENTED ? 'selected' : ''}>Đang thuê</option>
              <option value="${ROOM_STATUS.MAINTENANCE}" ${room?.status === ROOM_STATUS.MAINTENANCE ? 'selected' : ''}>Bảo trì / Sửa chữa</option>
            </select>
            <div class="error-message" id="err-status" data-testid="err-room-status"></div>
          </div>

          <div class="form-group">
            <label for="room-description">Mô tả / Ghi chú</label>
            <textarea 
              id="room-description" 
              name="description" 
              class="form-control" 
              rows="2"
              data-testid="input-room-description"
            >${room?.description || ''}</textarea>
            <div class="error-message" id="err-description"></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-form" data-testid="btn-cancel-room">Hủy</button>
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-room">${isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
          </div>
        </form>
      </div>
    `;

    // Gắn Sự Kiện
    const form = backdrop.querySelector('#room-form');
    const closeBtn = backdrop.querySelector('[data-testid="btn-close-modal"]');
    const cancelBtn = backdrop.querySelector('#btn-cancel-form');

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Reset lỗi cũ
      backdrop.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      backdrop.querySelectorAll('.form-control').forEach(el => el.classList.remove('has-error'));

      const formData = {
        number: form.number.value,
        price: form.price.value !== '' ? Number(form.price.value) : '',
        floor: form.floor.value !== '' ? Number(form.floor.value) : 1,
        maxTenants: form.maxTenants.value !== '' ? Number(form.maxTenants.value) : '',
        status: form.status.value,
        description: form.description.value
      };

      // Client Validation
      try {
        RoomValidator.validate(formData);
        onSubmit(formData, handleClose, (errorMessage) => {
          // Callback khi có lỗi từ Service gửi ngược lại
          RoomFormComponent.showInlineError(backdrop, errorMessage);
        });
      } catch (error) {
        RoomFormComponent.showInlineError(backdrop, error.message);
      }
    });

    return backdrop;
  }

  /**
   * Hiển thị lỗi ngay bên dưới trường nhập tương ứng
   */
  static showInlineError(modalElement, errorMessage) {
    const msg = errorMessage.toLowerCase();
    let targetId = 'err-number';
    let inputName = 'number';

    if (msg.includes('mã') || msg.includes('số phòng')) {
      targetId = 'err-number';
      inputName = 'number';
    } else if (msg.includes('trạng thái')) {
      targetId = 'err-status';
      inputName = 'status';
    } else if (msg.includes('giá')) {
      targetId = 'err-price';
      inputName = 'price';
    } else if (msg.includes('người tối đa')) {
      targetId = 'err-maxTenants';
      inputName = 'maxTenants';
    } else if (msg.includes('tầng')) {
      targetId = 'err-floor';
      inputName = 'floor';
    }

    const errContainer = modalElement.querySelector(`#${targetId}`);
    const inputControl = modalElement.querySelector(`[name="${inputName}"]`);

    if (errContainer) errContainer.textContent = errorMessage;
    if (inputControl) inputControl.classList.add('has-error');
  }
}
