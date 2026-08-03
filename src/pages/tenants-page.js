import { TenantService } from '../services/tenant-service.js';
import { TenantFormComponent } from '../components/tenant-form.js';
import { TENANT_STATUS } from '../constants/statuses.js';
import { Toast } from '../components/toast.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';

export class TenantsPage {
  constructor() {
    this.searchKeyword = '';
    this.statusFilter = 'ALL_ACTIVE'; // 'ALL_ACTIVE' | 'ARCHIVED' | 'ALL'
  }

  /**
   * Render toàn bộ trang
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement('div');
    container.className = 'tenants-container';
    container.setAttribute('data-testid', 'tenants-page');

    container.innerHTML = `
      <div class="tenants-toolbar">
        <div class="tenants-filters">
          <input 
            type="text" 
            class="tenants-search-input" 
            placeholder="Tìm theo tên, SĐT hoặc CCCD..." 
            data-testid="input-search-tenant"
          />
          <select class="tenants-filter-select" data-testid="select-filter-status">
            <option value="ALL_ACTIVE">Đang hoạt động</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
            <option value="ALL">-- Tất cả --</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-add-tenant" data-testid="btn-add-tenant">
          + Thêm người thuê
        </button>
      </div>

      <div class="tenants-table-wrapper" id="tenants-table-container">
        <!-- Table render here -->
      </div>
    `;

    this.attachEvents(container);
    this.renderTable(container);

    return container;
  }

  /**
   * Đăng ký sự kiện tìm kiếm, lọc
   */
  attachEvents(container) {
    const searchInput = container.querySelector('[data-testid="input-search-tenant"]');
    const statusSelect = container.querySelector('[data-testid="select-filter-status"]');
    const addBtn = container.querySelector('[data-testid="btn-add-tenant"]');

    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value;
      this.renderTable(container);
    });

    statusSelect.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.renderTable(container);
    });

    addBtn.addEventListener('click', () => {
      this.openTenantModal(container, null);
    });
  }

  /**
   * Render danh sách người thuê
   */
  renderTable(container) {
    const tableContainer = container.querySelector('#tenants-table-container');

    const includeArchived = this.statusFilter === 'ARCHIVED' || this.statusFilter === 'ALL';
    let tenants = TenantService.searchTenants(this.searchKeyword, includeArchived);

    // Lọc thủ công theo loại trạng thái cụ thể
    if (this.statusFilter === 'ALL_ACTIVE') {
      tenants = tenants.filter((t) => t.status !== TENANT_STATUS.ARCHIVED);
    } else if (this.statusFilter === 'ARCHIVED') {
      tenants = tenants.filter((t) => t.status === TENANT_STATUS.ARCHIVED);
    }

    // Xử lý Empty State
    if (tenants.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state" data-testid="empty-state">
          <div class="empty-state-icon">👤</div>
          <p>Không tìm thấy người thuê nào phù hợp.</p>
        </div>
      `;
      return;
    }

    // Render Table
    tableContainer.innerHTML = `
      <table class="tenants-table" data-testid="tenants-table">
        <thead>
          <tr>
            <th>Họ và Tên</th>
            <th>Số Điện Thoại</th>
            <th>CCCD / CMND</th>
            <th>Phòng Hiện Tại</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${tenants.map((tenant) => this.renderRow(tenant)).join('')}
        </tbody>
      </table>
    `;

    // Event Delegation cho action buttons
    const tableBody = tableContainer.querySelector('tbody');
    tableBody.addEventListener('click', (e) => {
      const btnHistory = e.target.closest('[data-action="history"]');
      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnArchive = e.target.closest('[data-action="archive"]');
      const btnDelete = e.target.closest('[data-action="delete"]');

      if (btnHistory) {
        this.openHistoryModal(btnHistory.dataset.id);
      } else if (btnEdit) {
        const tenant = TenantService.getTenantById(btnEdit.dataset.id);
        if (tenant) this.openTenantModal(container, tenant);
      } else if (btnArchive) {
        const tenant = TenantService.getTenantById(btnArchive.dataset.id);
        if (tenant) this.confirmArchiveTenant(container, tenant);
      } else if (btnDelete) {
        const tenant = TenantService.getTenantById(btnDelete.dataset.id);
        if (tenant) this.confirmDeleteTenant(container, tenant);
      }
    });
  }

  /**
   * Render dòng người thuê
   */
  renderRow(tenant) {
    const currentRoom = TenantService.getCurrentRoomOfTenant(tenant.id);
    const roomText = currentRoom 
      ? `<span class="badge-room">Phòng ${currentRoom.number}</span>`
      : `<span class="badge-no-room">Chưa thuê</span>`;

    const isArchived = tenant.status === TENANT_STATUS.ARCHIVED;

    return `
      <tr data-testid="tenant-row-${tenant.id}">
        <td><strong>${tenant.fullName}</strong></td>
        <td>${tenant.phone}</td>
        <td>${tenant.idCard || '---'}</td>
        <td>${roomText}</td>
        <td>
          ${isArchived 
            ? `<span class="badge badge-tenant-archived">Lưu trữ</span>` 
            : `<span class="badge badge-tenant-active">Hoạt động</span>`}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" data-action="history" data-id="${tenant.id}" data-testid="btn-history-${tenant.id}">Lịch sử</button>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${tenant.id}" data-testid="btn-edit-${tenant.id}">Sửa</button>
            ${!isArchived ? `<button class="btn btn-warning btn-sm" data-action="archive" data-id="${tenant.id}" data-testid="btn-archive-${tenant.id}">Lưu trữ</button>` : ''}
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${tenant.id}" data-testid="btn-delete-${tenant.id}">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Mở Modal Form
   */
  openTenantModal(container, tenant) {
    const modal = TenantFormComponent.render({
      tenant,
      onSubmit: (formData, closeModal, onError) => {
        try {
          if (tenant && tenant.id) {
            TenantService.updateTenant(tenant.id, formData);
            Toast.show('Cập nhật người thuê thành công!', 'success');
          } else {
            TenantService.createTenant(formData);
            Toast.show('Thêm người thuê mới thành công!', 'success');
          }
          closeModal();
          this.renderTable(container);
        } catch (error) {
          onError(error.message);
        }
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Xác nhận lưu trữ
   */
  confirmArchiveTenant(container, tenant) {
    ConfirmDialog.show({
      title: 'Xác nhận lưu trữ',
      message: `Bạn có muốn lưu trữ thông tin người thuê "${tenant.fullName}"? Người thuê đã lưu trữ sẽ không xuất hiện trong danh sách mặc định.`,
      onConfirm: () => {
        try {
          TenantService.archiveTenant(tenant.id);
          Toast.show(`Đã lưu trữ người thuê "${tenant.fullName}".`, 'success');
          this.renderTable(container);
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }
    });
  }

  /**
   * Xác nhận xóa
   */
  confirmDeleteTenant(container, tenant) {
    ConfirmDialog.show({
      title: 'Xác nhận xóa vĩnh viễn',
      message: `Bạn có chắc muốn xóa người thuê "${tenant.fullName}"? Thao tác này không thể hoàn tác.`,
      onConfirm: () => {
        try {
          TenantService.deleteTenant(tenant.id);
          Toast.show(`Đã xóa vĩnh viễn người thuê "${tenant.fullName}".`, 'success');
          this.renderTable(container);
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }
    });
  }

  /**
   * Xem lịch sử thuê phòng
   */
  openHistoryModal(tenantId) {
    try {
      const history = TenantService.getTenantRentalHistory(tenantId);
      const tenant = TenantService.getTenantById(tenantId);

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.setAttribute('data-testid', 'tenant-history-modal');

      const historyRows = history.length > 0
        ? history.map((item) => `
            <tr>
              <td><strong>Phòng ${item.roomNumber}</strong></td>
              <td>${item.startDate || '---'}</td>
              <td>${item.endDate || '---'}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="4" style="text-align: center; color: #9ca3af;">Chưa có lịch sử thuê hợp đồng nào.</td></tr>`;

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Lịch Sử Thuê - ${tenant.fullName}</h3>
            <button type="button" class="modal-close-btn">&times;</button>
          </div>
          <div class="history-modal-body">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Số Phòng</th>
                  <th>Ngày Bắt Đầu</th>
                  <th>Ngày Kết Thúc</th>
                  <th>Trạng Thái HB</th>
                </tr>
              </thead>
              <tbody>
                ${historyRows}
              </tbody>
            </table>
          </div>
          <div class="form-actions" style="padding: 1rem; border-top: 1px solid #e5e7eb;">
            <button class="btn btn-secondary" id="btn-close-history">Đóng</button>
          </div>
        </div>
      `;

      const closeHandler = () => modal.remove();
      modal.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
      modal.querySelector('#btn-close-history').addEventListener('click', closeHandler);

      document.body.appendChild(modal);
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  }
}

/** Entry point for the hash router. */
export function renderTenantsPage(container) {
  container.appendChild(new TenantsPage().render());
}
