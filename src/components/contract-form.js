import { RoomService } from '../services/room-service.js';
import { TenantService } from '../services/tenant-service.js';
import { ContractValidator } from '../business/contract-validator.js';
import { formatVND } from '../utils/currency-utils.js';
import { ROOM_STATUS } from '../constants/statuses.js';

export class ContractFormComponent {
  static render({ contract = null, onSubmit, onClose }) {
    const isEdit = Boolean(contract && contract.id);

    // Lọc danh sách phòng phù hợp (Bỏ phòng đang bảo trì)
    const allRooms = RoomService.getRooms();
    const availableRooms = allRooms.filter(r => r.status !== ROOM_STATUS.MAINTENANCE || (contract && String(contract.roomId) === String(r.id)));
    const tenants = TenantService.getTenants();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('data-testid', 'contract-form-modal');

    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Chỉnh Sửa Hợp Đồng (Nháp)' : 'Tạo Hợp Đồng Mới'}</h3>
          <button type="button" class="modal-close-btn" data-testid="btn-close-modal">&times;</button>
        </div>
        <form class="modal-body" id="contract-form" data-testid="contract-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Chọn Phòng <span style="color:red;">*</span></label>
              <select name="roomId" class="form-control" data-testid="select-contract-room">
                <option value="">-- Chọn phòng --</option>
                ${availableRooms.map(r => `
                  <option value="${r.id}" ${contract?.roomId == r.id ? 'selected' : ''}>
                    Phòng ${r.number} (${formatVND(r.price)} - Tối đa ${r.maxTenants} người)
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Người đại diện ký <span style="color:red;">*</span></label>
              <select name="tenantId" class="form-control" data-testid="select-contract-tenant">
                <option value="">-- Chọn khách thuê --</option>
                ${tenants.map(t => `
                  <option value="${t.id}" ${contract?.tenantId == t.id ? 'selected' : ''}>
                    ${t.fullName} - ${t.phone}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group full-width">
              <label>Người ở cùng (Ở ghép)</label>
              <div class="members-select-box" id="members-box" data-testid="members-select-box">
                <!-- Checkbox người ở cùng sẽ render động -->
              </div>
            </div>

            <div class="form-group">
              <label>Ngày bắt đầu <span style="color:red;">*</span></label>
              <input type="date" name="startDate" class="form-control" value="${contract?.startDate || ''}" data-testid="input-contract-start-date" />
            </div>

            <div class="form-group">
              <label>Ngày kết thúc <span style="color:red;">*</span></label>
              <input type="date" name="endDate" class="form-control" value="${contract?.endDate || ''}" data-testid="input-contract-end-date" />
            </div>

            <div class="form-group">
              <label>Giá thuê thỏa thuận (VNĐ) <span style="color:red;">*</span></label>
              <input type="number" name="rentalPrice" class="form-control" value="${contract?.rentalPrice ?? ''}" placeholder="Tự động lấy giá phòng nếu trống" data-testid="input-contract-price" />
            </div>

            <div class="form-group">
              <label>Tiền cọc (VNĐ)</label>
              <input type="number" name="depositAmount" class="form-control" value="${contract?.depositAmount ?? 0}" data-testid="input-contract-deposit" />
            </div>
          </div>

          <div class="error-message" id="modal-error" style="color:red; font-size: 0.85rem;" data-testid="contract-form-error"></div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel" data-testid="btn-cancel-contract">Hủy</button>
            <button type="submit" class="btn btn-primary" data-testid="btn-submit-contract">${isEdit ? 'Cập nhật' : 'Tạo hợp đồng'}</button>
          </div>
        </form>
      </div>
    `;

    const form = backdrop.querySelector('#contract-form');
    const tenantSelect = backdrop.querySelector('[name="tenantId"]');
    const roomSelect = backdrop.querySelector('[name="roomId"]');
    const priceInput = backdrop.querySelector('[name="rentalPrice"]');
    const membersBox = backdrop.querySelector('#members-box');
    const errorContainer = backdrop.querySelector('#modal-error');

    // Cập nhật danh sách người ở ghép khi đổi người đại diện
    const updateMembersList = () => {
      const selectedPrimaryId = tenantSelect.value;
      const memberIds = contract?.memberIds || [];

      membersBox.innerHTML = tenants
        .filter(t => String(t.id) !== String(selectedPrimaryId))
        .map(t => `
          <label class="member-item">
            <input type="checkbox" name="memberIds" value="${t.id}" ${memberIds.includes(String(t.id)) ? 'checked' : ''} data-testid="chk-member-${t.id}" />
            ${t.fullName} (${t.phone})
          </label>
        `).join('');
    };

    // Tự động điền giá phòng
    roomSelect.addEventListener('change', (e) => {
      const room = RoomService.getRoomById(e.target.value);
      if (room && (!priceInput.value || !isEdit)) {
        priceInput.value = room.price;
      }
    });

    tenantSelect.addEventListener('change', updateMembersList);
    updateMembersList();

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.modal-close-btn').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-cancel').addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorContainer.textContent = '';

      const checkedMembers = Array.from(form.querySelectorAll('input[name="memberIds"]:checked')).map(cb => cb.value);

      const formData = {
        roomId: form.roomId.value,
        tenantId: form.tenantId.value,
        memberIds: checkedMembers,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        rentalPrice: form.rentalPrice.value,
        depositAmount: form.depositAmount.value
      };

      try {
        const room = RoomService.getRoomById(formData.roomId);
        ContractValidator.validateContract(formData, room);
        onSubmit(formData, handleClose, (err) => { errorContainer.textContent = err; });
      } catch (err) {
        errorContainer.textContent = err.message;
      }
    });

    return backdrop;
  }
}