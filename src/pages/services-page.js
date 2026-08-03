import { ServiceConfigService } from '../services/service-config-service.js';
import { ServiceConfigFormComponent } from '../components/service-config-form.js';
import { Toast } from '../components/toast.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';
import { formatVND } from '../utils/currency-utils.js';

export class ServicesPage {
  constructor() {
    this.searchKeyword = '';
    this.statusFilter = 'ALL'; // 'ALL' | 'ACTIVE' | 'INACTIVE'
  }

  render() {
    const container = document.createElement('div');
    container.className = 'services-container';
    container.setAttribute('data-testid', 'services-page');

    container.innerHTML = `
      <div class="tenants-toolbar">
        <div class="tenants-filters">
          <input 
            type="text" 
            class="tenants-search-input" 
            placeholder="Tìm theo mã hoặc tên dịch vụ..." 
            data-testid="input-search-service"
          />
          <select class="tenants-filter-select" data-testid="select-filter-status">
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="ACTIVE">Đang áp dụng</option>
            <option value="INACTIVE">Ngưng áp dụng</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-add-service" data-testid="btn-add-service">
          + Thêm dịch vụ
        </button>
      </div>

      <div class="tenants-table-wrapper" id="services-table-container"></div>
    `;

    this.attachEvents(container);
    this.renderTable(container);

    return container;
  }

  attachEvents(container) {
    const searchInput = container.querySelector('[data-testid="input-search-service"]');
    const statusSelect = container.querySelector('[data-testid="select-filter-status"]');
    const addBtn = container.querySelector('[data-testid="btn-add-service"]');

    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value;
      this.renderTable(container);
    });

    statusSelect.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.renderTable(container);
    });

    addBtn.addEventListener('click', () => {
      this.openServiceModal(container, null);
    });
  }

  renderTable(container) {
    const tableContainer = container.querySelector('#services-table-container');

    let services = ServiceConfigService.searchServices(this.searchKeyword);

    if (this.statusFilter === 'ACTIVE') {
      services = services.filter((s) => s.isActive);
    } else if (this.statusFilter === 'INACTIVE') {
      services = services.filter((s) => !s.isActive);
    }

    if (services.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state" data-testid="empty-state" style="text-align:center; padding: 2rem;">
          <p class="text-muted">Không tìm thấy cấu hình dịch vụ nào.</p>
        </div>
      `;
      return;
    }

    const chargeTypeLabels = {
      usage: 'Theo chỉ số sử dụng',
      fixed: 'Cố định / Phòng',
      perPerson: 'Theo số người',
      perVehicle: 'Theo số xe',
      manual: 'Nhập thủ công'
    };

    tableContainer.innerHTML = `
      <table class="tenants-table" data-testid="services-table">
        <thead>
          <tr>
            <th>Mã Dịch Vụ</th>
            <th>Tên Dịch Vụ</th>
            <th>Cách Tính</th>
            <th>Đơn Giá</th>
            <th>Đơn Vị</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${services.map((service) => `
            <tr data-testid="service-row-${service.id}">
              <td><strong>${service.code}</strong></td>
              <td>${service.name}</td>
              <td>${chargeTypeLabels[service.chargeType] || service.chargeType}</td>
              <td>${formatVND(service.unitPrice)}</td>
              <td>${service.unit || '---'}</td>
              <td>
                ${service.isActive 
                  ? `<span class="badge badge-tenant-active">Đang áp dụng</span>` 
                  : `<span class="badge badge-tenant-archived">Ngưng áp dụng</span>`}
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-primary btn-sm" data-action="edit" data-id="${service.id}" data-testid="btn-edit-${service.id}">Sửa</button>
                  ${service.isActive 
                    ? `<button class="btn btn-warning btn-sm" data-action="deactivate" data-id="${service.id}" data-testid="btn-deactivate-${service.id}">Ngưng</button>`
                    : `<button class="btn btn-success btn-sm" data-action="reactivate" data-id="${service.id}" data-testid="btn-reactivate-${service.id}">Kích hoạt lại</button>`
                  }
                  <button class="btn btn-danger btn-sm" data-action="delete" data-id="${service.id}" data-testid="btn-delete-${service.id}">Xóa</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableContainer.querySelector('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const service = ServiceConfigService.getServiceById(id);

      if (action === 'edit') {
        this.openServiceModal(container, service);
      } else if (action === 'deactivate') {
        this.confirmDeactivate(container, service);
      } else if (action === 'reactivate') {
        this.reactivateService(container, service);
      } else if (action === 'delete') {
        this.confirmDelete(container, service);
      }
    });
  }

  openServiceModal(container, service) {
    const modal = ServiceConfigFormComponent.render({
      service,
      onSubmit: (formData, closeModal, onError) => {
        try {
          if (service && service.id) {
            ServiceConfigService.updateService(service.id, formData);
            Toast.show('Cập nhật dịch vụ thành công!', 'success');
          } else {
            ServiceConfigService.createService(formData);
            Toast.show('Thêm dịch vụ mới thành công!', 'success');
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

  confirmDeactivate(container, service) {
    ConfirmDialog.show({
      title: 'Xác nhận ngưng áp dụng',
      message: `Bạn có muốn ngưng áp dụng dịch vụ "${service.name}"? Dịch vụ sẽ không xuất hiện khi tính hóa đơn mới.`,
      onConfirm: () => {
        try {
          ServiceConfigService.deactivateService(service.id);
          Toast.show(`Đã ngưng áp dụng dịch vụ "${service.name}".`, 'success');
          this.renderTable(container);
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }
    });
  }

  reactivateService(container, service) {
    try {
      ServiceConfigService.reactivateService(service.id);
      Toast.show(`Đã kích hoạt lại dịch vụ "${service.name}".`, 'success');
      this.renderTable(container);
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  }

  confirmDelete(container, service) {
    ConfirmDialog.show({
      title: 'Xác nhận xóa dịch vụ',
      message: `Bạn có chắc muốn xóa dịch vụ "${service.name}"? Thao tác chỉ thành công nếu dịch vụ chưa từng ghi nhận vào hóa đơn nào.`,
      onConfirm: () => {
        try {
          ServiceConfigService.deleteService(service.id);
          Toast.show(`Đã xóa dịch vụ "${service.name}".`, 'success');
          this.renderTable(container);
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }
    });
  }
}

/** Entry point for the hash router. */
export function renderServicesPage(container) {
  container.appendChild(new ServicesPage().render());
}
