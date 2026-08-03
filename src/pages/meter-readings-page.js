import { MeterReadingService } from '../services/meter-reading-service.js';
import { MeterReadingFormComponent } from '../components/meter-reading-form.js';

export class MeterReadingsPage {
  constructor() {
    // Khởi tạo tháng hiện tại dạng YYYY-MM
    this.selectedMonth = new Date().toISOString().substring(0, 7);
    this.selectedRoomId = '';
  }

  render() {
    const container = document.createElement('div');
    container.className = 'meter-page-container';
    container.setAttribute('data-testid', 'meter-readings-page');

    container.innerHTML = `
      <div class="meter-header-section">
        <h2>⚡ Quản Lý Chỉ Số Điện Nước</h2>
        <button class="meter-btn meter-btn-primary" id="btn-add-reading" data-testid="btn-add-reading">
          + Ghi chỉ số mới
        </button>
      </div>

      <!-- Bộ lọc -->
      <div class="meter-filter-card">
        <div class="meter-filter-group">
          <label>Chọn tháng:</label>
          <input 
            type="month" 
            class="meter-input" 
            id="filter-month" 
            value="${this.selectedMonth}" 
            data-testid="select-filter-month"
          />
        </div>

        <div class="meter-filter-group">
          <label>Lọc theo phòng:</label>
          <select class="meter-input" id="filter-room" data-testid="select-filter-room">
            <option value="">-- Tất cả các phòng --</option>
          </select>
        </div>
      </div>

      <!-- Khối danh sách phòng chưa ghi chỉ số -->
      <div class="meter-unrecorded-card" id="unrecorded-rooms-container" data-testid="unrecorded-rooms-section">
        <!-- Render động danh sách phòng chưa ghi -->
      </div>

      <!-- Bảng danh sách bản ghi -->
      <div class="meter-table-wrapper" id="readings-table-container">
        <!-- Render động bảng chỉ số -->
      </div>
    `;

    this.attachEvents(container);
    this.populateRoomFilter(container);
    this.renderPageData(container);

    return container;
  }

  attachEvents(container) {
    const monthFilter = container.querySelector('#filter-month');
    const roomFilter = container.querySelector('#filter-room');
    const addBtn = container.querySelector('#btn-add-reading');

    monthFilter.addEventListener('change', (e) => {
      this.selectedMonth = e.target.value;
      this.populateRoomFilter(container);
      this.renderPageData(container);
    });

    roomFilter.addEventListener('change', (e) => {
      this.selectedRoomId = e.target.value;
      this.renderPageData(container);
    });

    addBtn.addEventListener('click', () => {
      this.openReadingModal(container, null);
    });
  }

  /**
   * Đổ danh sách phòng vào dropdown bộ lọc
   */
  populateRoomFilter(container) {
    const roomSelect = container.querySelector('#filter-room');
    const unrecordedRooms = MeterReadingService.getRoomsWithoutReading(this.selectedMonth);
    const recordedReadings = MeterReadingService.filterReadings({ month: this.selectedMonth });

    // Gom danh sách phòng từ cả bản ghi đã ghi và phòng chưa ghi
    const roomMap = new Map();

    recordedReadings.forEach((r) => {
      roomMap.set(String(r.roomId), r.roomName || `Phòng ${r.roomId}`);
    });

    unrecordedRooms.forEach((r) => {
      roomMap.set(String(r.id), r.name || `Phòng ${r.roomNumber || r.id}`);
    });

    let optionsHtml = '<option value="">-- Tất cả các phòng --</option>';
    roomMap.forEach((name, id) => {
      optionsHtml += `<option value="${id}" ${this.selectedRoomId === id ? 'selected' : ''}>${name}</option>`;
    });

    roomSelect.innerHTML = optionsHtml;
  }

  /**
   * Render dữ liệu chính cho trang
   */
  renderPageData(container) {
    this.renderUnrecordedRooms(container);
    this.renderReadingsTable(container);
  }

  /**
   * Render danh sách các phòng chưa ghi chỉ số
   */
  renderUnrecordedRooms(container) {
    const wrapper = container.querySelector('#unrecorded-rooms-container');
    const unrecordedRooms = MeterReadingService.getRoomsWithoutReading(this.selectedMonth);

    if (!this.selectedMonth || unrecordedRooms.length === 0) {
      wrapper.style.display = 'none';
      wrapper.innerHTML = '';
      return;
    }

    wrapper.style.display = 'block';
    wrapper.innerHTML = `
      <div class="meter-unrecorded-header">
        ⚠️ <strong>Phòng chưa ghi chỉ số tháng ${this.selectedMonth} (${unrecordedRooms.length} phòng):</strong>
      </div>
      <div class="meter-unrecorded-list">
        ${unrecordedRooms
          .map(
            (room) => `
          <div class="meter-unrecorded-chip" data-testid="unrecorded-room-chip-${room.id}">
            <span>${room.name || 'Phòng ' + (room.roomNumber || room.id)}</span>
            <button 
              class="meter-chip-action-btn" 
              data-action="quick-add" 
              data-room-id="${room.id}"
              data-testid="btn-quick-record-${room.id}"
            >
              + Ghi nhanh
            </button>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    wrapper.querySelectorAll('[data-action="quick-add"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const roomId = e.target.dataset.roomId;
        this.openReadingModal(container, null, roomId);
      });
    });
  }

  /**
   * Render bảng danh sách bản ghi điện nước
   */
  renderReadingsTable(container) {
    const tableWrapper = container.querySelector('#readings-table-container');

    const filters = { month: this.selectedMonth };
    if (this.selectedRoomId) {
      filters.roomId = this.selectedRoomId;
    }

    const readings = MeterReadingService.filterReadings(filters);

    if (readings.length === 0) {
      tableWrapper.innerHTML = `
        <div class="meter-empty-state" data-testid="empty-state">
          <p>Không có dữ liệu ghi nhận chỉ số điện nước cho ${
            this.selectedMonth ? `tháng ${this.selectedMonth}` : 'tiêu chí chọn'
          }.</p>
        </div>
      `;
      return;
    }

    tableWrapper.innerHTML = `
      <table class="meter-table" data-testid="meter-readings-table">
        <thead>
          <tr>
            <th>Tháng</th>
            <th>Phòng</th>
            <th>Điện (Cũ -> Mới)</th>
            <th>Sản lượng Điện</th>
            <th>Nước (Cũ -> Mới)</th>
            <th>Sản lượng Nước</th>
            <th>Cảnh báo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${readings
            .map((r) => {
              const prev = MeterReadingService.getPreviousReading(r.roomId, r.month);
              const roomDisplayName = r.roomName || `Phòng ${r.roomId}`;

              return `
              <tr data-testid="meter-row-${r.id}" class="${r.hasWarning ? 'meter-row-warning' : ''}">
                <td><strong>${r.month}</strong></td>
                <td><strong>${roomDisplayName}</strong></td>
                <td>
                  <span class="meter-index-badge">${r.oldElectric}</span> 
                  👉 
                  <span class="meter-index-badge font-weight-bold">${r.newElectric}</span>
                  ${
                    prev && prev.newElectric !== r.oldElectric
                      ? `<div class="meter-text-muted" title="Lệch chỉ số cuối tháng trước (${prev.newElectric})">⚠️ Lệch kỳ trước (${prev.newElectric})</div>`
                      : ''
                  }
                </td>
                <td><strong class="text-primary">${r.electricUsage} kWh</strong></td>
                <td>
                  <span class="meter-index-badge">${r.oldWater}</span> 
                  👉 
                  <span class="meter-index-badge font-weight-bold">${r.newWater}</span>
                  ${
                    prev && prev.newWater !== r.oldWater
                      ? `<div class="meter-text-muted" title="Lệch chỉ số cuối tháng trước (${prev.newWater})">⚠️ Lệch kỳ trước (${prev.newWater})</div>`
                      : ''
                  }
                </td>
                <td><strong class="text-info">${r.waterUsage} m³</strong></td>
                <td>
                  ${
                    r.hasWarning && r.warnings && r.warnings.length > 0
                      ? `<div class="meter-warning-tag" title="${r.warnings.join(' | ')}">
                          ⚠️ ${r.warnings.length} Cảnh báo
                         </div>`
                      : '<span class="meter-ok-tag">✓ Bình thường</span>'
                  }
                </td>
                <td>
                  <div class="meter-action-buttons">
                    <button 
                      class="meter-btn meter-btn-sm meter-btn-edit" 
                      data-action="edit" 
                      data-id="${r.id}"
                      data-testid="btn-edit-${r.id}"
                    >
                      Sửa
                    </button>
                    <button 
                      class="meter-btn meter-btn-sm meter-btn-danger" 
                      data-action="delete" 
                      data-id="${r.id}"
                      data-testid="btn-delete-${r.id}"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    `;

    // Gán sự kiện click cho các nút Sửa/Xóa trong bảng
    tableWrapper.querySelector('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'edit') {
        const reading = MeterReadingService.getReadingById(id);
        if (reading) this.openReadingModal(container, reading);
      } else if (action === 'delete') {
        this.handleDelete(container, id);
      }
    });
  }

  /**
   * Mở Modal Form Thêm/Sửa chỉ số
   */
  openReadingModal(container, reading = null, presetRoomId = '') {
    const unrecorded = MeterReadingService.getRoomsWithoutReading(this.selectedMonth);

    // Chuẩn bị thông tin nếu là tạo mới với phòng được chọn trước từ danh sách chưa ghi
    const targetReading = reading || (presetRoomId ? { roomId: presetRoomId, month: this.selectedMonth } : null);

    const modal = MeterReadingFormComponent.render({
      reading: targetReading,
      availableRooms: unrecorded,
      defaultMonth: this.selectedMonth,
      onSubmit: (formData, closeModal, onError, onWarning) => {
        try {
          let result;
          if (reading && reading.id) {
            result = MeterReadingService.updateReading(reading.id, formData);
          } else {
            result = MeterReadingService.createReading(formData);
          }

          if (result.warnings && result.warnings.length > 0) {
            onWarning(result.warnings);
            setTimeout(() => {
              closeModal();
              this.populateRoomFilter(container);
              this.renderPageData(container);
            }, 1800);
          } else {
            closeModal();
            this.populateRoomFilter(container);
            this.renderPageData(container);
          }
        } catch (error) {
          onError(error.message);
        }
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Xử lý xóa bản ghi
   */
  handleDelete(container, id) {
    const reading = MeterReadingService.getReadingById(id);
    if (!reading) return;

    const confirmMsg = `Bạn có chắc chắn muốn xóa bản ghi chỉ số tháng ${reading.month} của phòng này?`;
    if (confirm(confirmMsg)) {
      try {
        MeterReadingService.deleteReading(id);
        this.populateRoomFilter(container);
        this.renderPageData(container);
      } catch (error) {
        alert(`Lỗi khi xóa: ${error.message}`);
      }
    }
  }
}