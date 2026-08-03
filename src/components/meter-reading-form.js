import { MeterReadingService } from '../services/meter-reading-service.js';
import { calculateElectricUsage, calculateWaterUsage } from '../business/meter-calculator.js';

export class MeterReadingFormComponent {
  /**
   * Render modal/form nhập chỉ số điện nước cho một phòng
   * @param {Object} options
   * @param {Object} [options.reading] - Bản ghi đã có nếu là Sửa
   * @param {Array<Object>} [options.availableRooms] - Danh sách phòng khả dụng
   * @param {string} [options.defaultMonth] - Tháng mặc định (YYYY-MM)
   * @param {Function} options.onSubmit - Callback khi submit thành công
   * @param {Function} options.onClose - Callback khi đóng modal
   */
  static render({ reading = null, availableRooms = [], defaultMonth = '', onSubmit, onClose }) {
    const isEdit = Boolean(reading && reading.id);
    const selectedMonth = reading?.month || defaultMonth || new Date().toISOString().substring(0, 7);

    const backdrop = document.createElement('div');
    backdrop.className = 'meter-modal-backdrop';
    backdrop.setAttribute('data-testid', 'meter-reading-form-modal');

    backdrop.innerHTML = `
      <div class="meter-modal-content">
        <div class="meter-modal-header">
          <h3>${isEdit ? 'Chỉnh Sửa Chỉ Số Điện Nước' : 'Ghi Chỉ Số Điện Nước Mới'}</h3>
          <button type="button" class="meter-modal-close" data-testid="btn-close-modal">&times;</button>
        </div>
        <form class="meter-modal-body" id="meter-form" data-testid="meter-reading-form">
          <div class="meter-form-row">
            <div class="meter-form-group">
              <label>Tháng <span class="required">*</span></label>
              <input 
                type="month" 
                name="month" 
                class="meter-input" 
                value="${selectedMonth}" 
                ${isEdit ? 'disabled' : ''}
                data-testid="input-meter-month"
              />
            </div>

            <div class="meter-form-group">
              <label>Phòng <span class="required">*</span></label>
              ${
                isEdit
                  ? `<input type="text" class="meter-input" value="${reading.roomName || 'Phòng ' + reading.roomId}" disabled />
                     <input type="hidden" name="roomId" value="${reading.roomId}" />`
                  : `<select name="roomId" class="meter-input" data-testid="select-meter-room">
                      <option value="">-- Chọn phòng --</option>
                      ${availableRooms
                        .map(
                          (r) =>
                            `<option value="${r.id}" ${
                              reading?.roomId === r.id ? 'selected' : ''
                            }>${r.name || 'Phòng ' + r.roomNumber || r.id}</option>`
                        )
                        .join('')}
                    </select>`
              }
            </div>
          </div>

          <div class="meter-section-title">⚡ Chỉ số Điện (kWh)</div>
          <div class="meter-form-row">
            <div class="meter-form-group">
              <label>Chỉ số cũ</label>
              <input 
                type="number" 
                name="oldElectric" 
                class="meter-input" 
                value="${reading?.oldElectric ?? 0}" 
                placeholder="0" 
                min="0"
                data-testid="input-old-electric"
              />
            </div>

            <div class="meter-form-group">
              <label>Chỉ số mới <span class="required">*</span></label>
              <input 
                type="number" 
                name="newElectric" 
                class="meter-input" 
                value="${reading?.newElectric ?? ''}" 
                placeholder="Nhập chỉ số mới" 
                min="0"
                data-testid="input-new-electric"
              />
            </div>

            <div class="meter-form-group">
              <label>Tiêu thụ</label>
              <input 
                type="text" 
                id="calculated-electric-usage" 
                class="meter-input meter-readonly-highlight" 
                value="${reading?.electricUsage ?? 0}" 
                readonly 
                data-testid="display-electric-usage"
              />
            </div>
          </div>

          <div class="meter-section-title">💧 Chỉ số Nước (m³)</div>
          <div class="meter-form-row">
            <div class="meter-form-group">
              <label>Chỉ số cũ</label>
              <input 
                type="number" 
                name="oldWater" 
                class="meter-input" 
                value="${reading?.oldWater ?? 0}" 
                placeholder="0" 
                min="0"
                data-testid="input-old-water"
              />
            </div>

            <div class="meter-form-group">
              <label>Chỉ số mới <span class="required">*</span></label>
              <input 
                type="number" 
                name="newWater" 
                class="meter-input" 
                value="${reading?.newWater ?? ''}" 
                placeholder="Nhập chỉ số mới" 
                min="0"
                data-testid="input-new-water"
              />
            </div>

            <div class="meter-form-group">
              <label>Tiêu thụ</label>
              <input 
                type="text" 
                id="calculated-water-usage" 
                class="meter-input meter-readonly-highlight" 
                value="${reading?.waterUsage ?? 0}" 
                readonly 
                data-testid="display-water-usage"
              />
            </div>
          </div>

          <div class="meter-error-box" id="form-error-box" style="display: none;" data-testid="meter-form-error"></div>
          <div class="meter-warning-box" id="form-warning-box" style="display: none;" data-testid="meter-form-warning"></div>

          <div class="meter-form-actions">
            <button type="button" class="meter-btn meter-btn-secondary" id="btn-cancel-meter" data-testid="btn-cancel-meter">Hủy</button>
            <button type="submit" class="meter-btn meter-btn-primary" data-testid="btn-submit-meter">${isEdit ? 'Cập nhật' : 'Lưu bản ghi'}</button>
          </div>
        </form>
      </div>
    `;

    const form = backdrop.querySelector('#meter-form');
    const errorBox = backdrop.querySelector('#form-error-box');
    const warningBox = backdrop.querySelector('#form-warning-box');
    const roomSelect = form.querySelector('[name="roomId"]');
    const monthInput = form.querySelector('[name="month"]');

    const oldElecInput = form.querySelector('[name="oldElectric"]');
    const newElecInput = form.querySelector('[name="newElectric"]');
    const elecUsageDisplay = backdrop.querySelector('#calculated-electric-usage');

    const oldWaterInput = form.querySelector('[name="oldWater"]');
    const newWaterInput = form.querySelector('[name="newWater"]');
    const waterUsageDisplay = backdrop.querySelector('#calculated-water-usage');

    // Hàm tự động cập nhật lại chỉ số cũ dựa theo phòng + tháng được chọn
    const autoFetchPreviousIndex = () => {
      if (isEdit) return;

      const roomId = roomSelect ? roomSelect.value : reading?.roomId;
      const month = monthInput ? monthInput.value : selectedMonth;

      if (roomId && month) {
        const prevReading = MeterReadingService.getPreviousReading(roomId, month);
        if (prevReading) {
          oldElecInput.value = prevReading.newElectric;
          oldWaterInput.value = prevReading.newWater;
        } else {
          oldElecInput.value = 0;
          oldWaterInput.value = 0;
        }
        recalculateUsage();
      }
    };

    // Hàm tính toán tự động lượng tiêu thụ
    const recalculateUsage = () => {
      // Điện
      try {
        const usageElec = calculateElectricUsage(oldElecInput.value, newElecInput.value);
        elecUsageDisplay.value = `${usageElec} kWh`;
      } catch (_) {
        elecUsageDisplay.value = '--';
      }

      // Nước
      try {
        const usageWater = calculateWaterUsage(oldWaterInput.value, newWaterInput.value);
        waterUsageDisplay.value = `${usageWater} m³`;
      } catch (_) {
        waterUsageDisplay.value = '--';
      }
    };

    // Lắng nghe sự kiện input để tính sản lượng tức thì
    oldElecInput.addEventListener('input', recalculateUsage);
    newElecInput.addEventListener('input', recalculateUsage);
    oldWaterInput.addEventListener('input', recalculateUsage);
    newWaterInput.addEventListener('input', recalculateUsage);

    if (roomSelect) roomSelect.addEventListener('change', autoFetchPreviousIndex);
    if (monthInput && !isEdit) monthInput.addEventListener('change', autoFetchPreviousIndex);

    // Chạy thử lần đầu khi load
    if (!isEdit && roomSelect?.value) {
      autoFetchPreviousIndex();
    } else {
      recalculateUsage();
    }

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.meter-modal-close').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-cancel-meter').addEventListener('click', handleClose);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      errorBox.textContent = '';
      warningBox.style.display = 'none';
      warningBox.textContent = '';

      const formData = {
        month: isEdit ? reading.month : form.month.value,
        roomId: isEdit ? reading.roomId : form.roomId.value,
        oldElectric: form.oldElectric.value,
        newElectric: form.newElectric.value,
        oldWater: form.oldWater.value,
        newWater: form.newWater.value
      };

      onSubmit(
        formData,
        handleClose,
        (errMsg) => {
          errorBox.textContent = errMsg;
          errorBox.style.display = 'block';
        },
        (warnMsgs) => {
          if (Array.isArray(warnMsgs) && warnMsgs.length > 0) {
            warningBox.innerHTML = `<strong>Lưu ý / Cảnh báo:</strong><ul>${warnMsgs
              .map((w) => `<li>${w}</li>`)
              .join('')}</ul>`;
            warningBox.style.display = 'block';
          }
        }
      );
    });

    return backdrop;
  }
}