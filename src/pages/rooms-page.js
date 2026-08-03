import { RoomService } from '../services/room-service.js';
import { RoomFormComponent } from '../components/room-form.js';
import { ROOM_STATUS } from '../constants/statuses.js';
import { Toast } from '../components/toast.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';

export class RoomsPage {
  constructor() {
    this.searchKeyword = '';
    this.statusFilter = '';
    this.sortOrder = 'asc'; // 'asc' | 'desc'
  }

  /**
   * Render toàn bộ trang
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement('div');
    container.className = 'rooms-container';
    container.setAttribute('data-testid', 'rooms-page');

    container.innerHTML = `
      <div class="rooms-toolbar">
        <div class="rooms-filters">
          <input 
            type="text" 
            class="rooms-search-input" 
            placeholder="Tìm kiếm theo mã phòng..." 
            data-testid="input-search-room"
          />
          <select class="rooms-filter-select" data-testid="select-filter-status">
            <option value="">-- Tất cả trạng thái --</option>
            <option value="${ROOM_STATUS.AVAILABLE}">Trống</option>
            <option value="${ROOM_STATUS.RENTED}">Đang thuê</option>
            <option value="${ROOM_STATUS.MAINTENANCE}">Bảo trì</option>
          </select>
          <select class="rooms-sort-select" data-testid="select-sort-price">
            <option value="asc">Giá: Thấp đến Cao</option>
            <option value="desc">Giá: Cao đến Thấp</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-add-room" data-testid="btn-add-room">
          + Thêm phòng
        </button>
      </div>

      <div class="rooms-table-wrapper" id="rooms-table-container">
        <!-- Bảng dữ liệu render tại đây -->
      </div>
    `;

    this.attachEvents(container);
    this.renderTable(container);

    return container;
  }

  /**
   * Đăng ký sự kiện
   */
  attachEvents(container) {
    const searchInput = container.querySelector('[data-testid="input-search-room"]');
    const statusSelect = container.querySelector('[data-testid="select-filter-status"]');
    const sortSelect = container.querySelector('[data-testid="select-sort-price"]');
    const addBtn = container.querySelector('[data-testid="btn-add-room"]');

    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value;
      this.renderTable(container);
    });

    statusSelect.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.renderTable(container);
    });

    sortSelect.addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
      this.renderTable(container);
    });

    addBtn.addEventListener('click', () => {
      this.openRoomModal(container, null);
    });
  }

  /**
   * Render bảng dữ liệu phòng
   */
  renderTable(container) {
    const tableContainer = container.querySelector('#rooms-table-container');

    // 1. Lọc và Tìm kiếm bằng RoomService
    let rooms = RoomService.searchRooms(this.searchKeyword);
    if (this.statusFilter) {
      rooms = rooms.filter((r) => r.status === this.statusFilter);
    }

    // 2. Sắp xếp theo giá
    rooms.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      return this.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });

    // 3. Xử lý UI Trạng thái rỗng (Empty State)
    if (rooms.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state" data-testid="empty-state">
          <div class="empty-state-icon">🏠</div>
          <p>Không tìm thấy phòng nào phù hợp.</p>
        </div>
      `;
      return;
    }

    // 4. Render Bảng
    tableContainer.innerHTML = `
      <table class="rooms-table" data-testid="rooms-table">
        <thead>
          <tr>
            <th>Mã Phòng</th>
            <th>Tầng</th>
            <th>Giá thuê</th>
            <th>Sức chứa</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${rooms.map((room) => this.renderRow(room)).join('')}
        </tbody>
      </table>
    `;

    // 5. Gán sự kiện cho các nút Action trên bảng (Dùng Event Delegation)
    const tableBody = tableContainer.querySelector('tbody');
    tableBody.addEventListener('click', (e) => {
      const btnDetail = e.target.closest('[data-action="detail"]');
      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnDelete = e.target.closest('[data-action="delete"]');

      if (btnDetail) {
        const id = btnDetail.dataset.id;
        this.openDetailModal(id);
      } else if (btnEdit) {
        const id = btnEdit.dataset.id;
        const room = RoomService.getRoomById(id);
        if (room) this.openRoomModal(container, room);
      } else if (btnDelete) {
        const id = btnDelete.dataset.id;
        const room = RoomService.getRoomById(id);
        if (room) this.confirmDeleteRoom(container, room);
      }
    });
  }

  /**
   * Render HTML cho 1 dòng dữ liệu
   */
  renderRow(room) {
    return `
      <tr data-testid="room-row-${room.id}">
        <td><strong>${room.number}</strong></td>
        <td>Tầng ${room.floor || 1}</td>
        <td>${Number(room.price).toLocaleString('vi-VN')} đ</td>
        <td>${room.maxTenants} người</td>
        <td>${this.renderStatusBadge(room.status)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" data-action="detail" data-id="${room.id}" data-testid="btn-view-${room.id}">Xem</button>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${room.id}" data-testid="btn-edit-${room.id}">Sửa</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${room.id}" data-testid="btn-delete-${room.id}">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Badge trạng thái
   */
  renderStatusBadge(status) {
    switch (status) {
      case ROOM_STATUS.AVAILABLE:
        return `<span class="badge badge-available">Trống</span>`;
      case ROOM_STATUS.RENTED:
        return `<span class="badge badge-rented">Đang thuê</span>`;
      case ROOM_STATUS.MAINTENANCE:
        return `<span class="badge badge-maintenance">Bảo trì</span>`;
      default:
        return `<span class="badge">${status}</span>`;
    }
  }

  /**
   * Mở Modal Form (Thêm/Sửa)
   */
  openRoomModal(container, room) {
    const modal = RoomFormComponent.render({
      room,
      onSubmit: (formData, closeModal, onError) => {
        try {
          if (room && room.id) {
            RoomService.updateRoom(room.id, formData);
            Toast.show('Cập nhật thông tin phòng thành công!', 'success');
          } else {
            RoomService.createRoom(formData);
            Toast.show('Thêm phòng mới thành công!', 'success');
          }
          closeModal();
          this.renderTable(container); // Re-render lại danh sách
        } catch (error) {
          onError(error.message);
        }
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Xác nhận và xóa phòng
   */
  confirmDeleteRoom(container, room) {
    ConfirmDialog.show({
      title: 'Xác nhận xóa phòng',
      message: `Bạn có chắc chắn muốn xóa phòng "${room.number}"? Thao tác này không thể hoàn tác.`,
      onConfirm: () => {
        try {
          RoomService.deleteRoom(room.id);
          Toast.show(`Đã xóa phòng "${room.number}" thành công!`, 'success');
          this.renderTable(container); // Re-render lại danh sách
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }
    });
  }

  /**
   * Xem chi tiết phòng
   */
  openDetailModal(roomId) {
    try {
      const occupancy = RoomService.getRoomOccupancy(roomId);
      const room = RoomService.getRoomById(roomId);

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.setAttribute('data-testid', 'room-detail-modal');

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Chi tiết phòng ${room.number}</h3>
            <button type="button" class="modal-close-btn">&times;</button>
          </div>
          <div class="details-list">
            <div class="details-item"><label>Mã phòng:</label><span>${room.number}</span></div>
            <div class="details-item"><label>Tầng:</label><span>${room.floor || 1}</span></div>
            <div class="details-item"><label>Giá thuê:</label><span>${Number(room.price).toLocaleString('vi-VN')} đ</span></div>
            <div class="details-item"><label>Sức chứa:</label><span>${occupancy.currentTenantsCount} / ${room.maxTenants} người</span></div>
            <div class="details-item"><label>Trạng thái:</label><span>${this.renderStatusBadge(room.status)}</span></div>
            <div class="details-item"><label>Mô tả:</label><span>${room.description || 'Không có mô tả'}</span></div>
          </div>
          <div class="form-actions" style="padding: 1rem; border-top: 1px solid #e5e7eb;">
            <button class="btn btn-secondary" id="btn-close-detail">Đóng</button>
          </div>
        </div>
      `;

      const closeHandler = () => modal.remove();
      modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
      modal.querySelector('#btn-close-detail').addEventListener('click', closeHandler);

      document.body.appendChild(modal);
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  }
}

/** Entry point for the hash router. */
export function renderRoomsPage(container) {
  container.appendChild(new RoomsPage().render());
}
