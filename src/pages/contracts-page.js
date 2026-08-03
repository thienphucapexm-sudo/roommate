import { ContractService } from '../services/contract-service.js';
import { RoomService } from '../services/room-service.js';
import { TenantService } from '../services/tenant-service.js';
import { ContractFormComponent } from '../components/contract-form.js';
import { ContractDetailComponent } from '../components/contract-detail.js';
import { CONTRACT_STATUS, CONTRACT_STATUS_LABELS } from '../constants/statuses.js';
import { Toast } from '../components/toast.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';
import { formatVND } from '../utils/currency-utils.js';

export class ContractsPage {
  constructor() {
    this.filters = {
      keyword: '',
      status: '',
      roomId: ''
    };
  }

  render() {
    const container = document.createElement('div');
    container.className = 'contracts-container';
    container.setAttribute('data-testid', 'contracts-page');

    const rooms = RoomService.getRooms();

    container.innerHTML = `
      <div class="contracts-toolbar">
        <div class="contracts-filters">
          <input 
            type="text" 
            class="contracts-search-input" 
            placeholder="Tìm theo Mã HĐ, Phòng, Tên khách..." 
            data-testid="input-search-contract"
          />
          <select class="contracts-filter-select" data-testid="select-filter-status">
            <option value="">-- Tất cả trạng thái --</option>
            <option value="${CONTRACT_STATUS.PENDING}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.PENDING]}</option>
            <option value="${CONTRACT_STATUS.ACTIVE}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.ACTIVE]}</option>
            <option value="${CONTRACT_STATUS.EXPIRING_SOON}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.EXPIRING_SOON]}</option>
            <option value="${CONTRACT_STATUS.EXPIRED}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.EXPIRED]}</option>
            <option value="${CONTRACT_STATUS.TERMINATED}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.TERMINATED]}</option>
            <option value="${CONTRACT_STATUS.CANCELLED}">${CONTRACT_STATUS_LABELS[CONTRACT_STATUS.CANCELLED]}</option>
          </select>
          <select class="contracts-filter-select" data-testid="select-filter-room">
            <option value="">-- Tất cả phòng --</option>
            ${rooms.map(r => `<option value="${r.id}">Phòng ${r.number}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="btn-add-contract" data-testid="btn-add-contract">
          + Thêm hợp đồng
        </button>
      </div>

      <div class="contracts-table-wrapper" id="contracts-table-container"></div>
    `;

    this.attachEvents(container);
    this.renderTable(container);

    return container;
  }

  attachEvents(container) {
    const searchInput = container.querySelector('[data-testid="input-search-contract"]');
    const statusSelect = container.querySelector('[data-testid="select-filter-status"]');
    const roomSelect = container.querySelector('[data-testid="select-filter-room"]');
    const addBtn = container.querySelector('[data-testid="btn-add-contract"]');

    searchInput.addEventListener('input', (e) => {
      this.filters.keyword = e.target.value;
      this.renderTable(container);
    });

    statusSelect.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.renderTable(container);
    });

    roomSelect.addEventListener('change', (e) => {
      this.filters.roomId = e.target.value;
      this.renderTable(container);
    });

    addBtn.addEventListener('click', () => {
      this.openContractModal(container, null);
    });
  }

  renderTable(container) {
    const tableContainer = container.querySelector('#contracts-table-container');
    
    let contracts = ContractService.searchContracts(this.filters.keyword);
    
    if (this.filters.status) {
      contracts = contracts.filter(c => c.status === this.filters.status);
    }
    if (this.filters.roomId) {
      contracts = contracts.filter(c => String(c.roomId) === String(this.filters.roomId));
    }

    if (contracts.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state" data-testid="empty-state" style="text-align:center; padding: 2rem;">
          <p class="text-muted">Không tìm thấy hợp đồng nào.</p>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <table class="contracts-table" data-testid="contracts-table">
        <thead>
          <tr>
            <th>Mã HĐ</th>
            <th>Phòng</th>
            <th>Người Đại Diện</th>
            <th>Thời Hạn</th>
            <th>Giá Thuê</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => this.renderRow(c)).join('')}
        </tbody>
      </table>
    `;

    tableContainer.querySelector('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const contract = ContractService.getContractById(id);

      if (action === 'detail') this.openDetailModal(contract);
      if (action === 'edit') this.openContractModal(container, contract);
      if (action === 'activate') this.activateContract(container, id);
      if (action === 'extend') this.extendContractPrompt(container, contract);
      if (action === 'end') this.endContractConfirm(container, contract);
      if (action === 'cancel') this.cancelContractConfirm(container, contract);
    });
  }

  renderRow(contract) {
    const room = RoomService.getRoomById(contract.roomId);
    const tenant = TenantService.getTenantById(contract.tenantId);

    const badgeClasses = {
      [CONTRACT_STATUS.PENDING]: 'badge-pending',
      [CONTRACT_STATUS.ACTIVE]: 'badge-active',
      [CONTRACT_STATUS.EXPIRING_SOON]: 'badge-expiring',
      [CONTRACT_STATUS.EXPIRED]: 'badge-expired',
      [CONTRACT_STATUS.TERMINATED]: 'badge-terminated',
      [CONTRACT_STATUS.CANCELLED]: 'badge-cancelled',
    };

    const isPending = contract.status === CONTRACT_STATUS.PENDING;
    const isActive = contract.status === CONTRACT_STATUS.ACTIVE || contract.status === CONTRACT_STATUS.EXPIRING_SOON;

    return `
      <tr data-testid="contract-row-${contract.id}">
        <td><strong>#${contract.id}</strong></td>
        <td>Phòng ${room ? room.number : 'N/A'}</td>
        <td>${tenant ? tenant.fullName : 'N/A'}</td>
        <td>${contract.startDate} ~ ${contract.endDate}</td>
        <td>${formatVND(contract.rentalPrice)}</td>
        <td>
          <span class="badge-status ${badgeClasses[contract.status]}">
            ${CONTRACT_STATUS_LABELS[contract.status] || contract.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" data-action="detail" data-id="${contract.id}" data-testid="btn-detail-${contract.id}">Xem</button>
            ${isPending ? `<button class="btn btn-primary btn-sm" data-action="edit" data-id="${contract.id}" data-testid="btn-edit-${contract.id}">Sửa</button>` : ''}
            ${isPending ? `<button class="btn btn-success btn-sm" data-action="activate" data-id="${contract.id}" data-testid="btn-activate-${contract.id}">Kích hoạt</button>` : ''}
            ${isActive ? `<button class="btn btn-warning btn-sm" data-action="extend" data-id="${contract.id}" data-testid="btn-extend-${contract.id}">Gia hạn</button>` : ''}
            ${isActive ? `<button class="btn btn-danger btn-sm" data-action="end" data-id="${contract.id}" data-testid="btn-end-${contract.id}">Kết thúc</button>` : ''}
            ${isPending ? `<button class="btn btn-danger btn-sm" data-action="cancel" data-id="${contract.id}" data-testid="btn-cancel-${contract.id}">Hủy</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  openContractModal(container, contract) {
    const modal = ContractFormComponent.render({
      contract,
      onSubmit: (formData, closeModal, onError) => {
        try {
          if (contract && contract.id) {
            ContractService.updateContract(contract.id, formData);
            Toast.show('Cập nhật hợp đồng nháp thành công!', 'success');
          } else {
            ContractService.createContract(formData);
            Toast.show('Thêm hợp đồng mới thành công!', 'success');
          }
          closeModal();
          this.renderTable(container);
        } catch (err) {
          onError(err.message);
        }
      }
    });
    document.body.appendChild(modal);
  }

  openDetailModal(contract) {
    const modal = ContractDetailComponent.render({ contract });
    document.body.appendChild(modal);
  }

  activateContract(container, id) {
    try {
      ContractService.activateContract(id);
      Toast.show('Đã kích hoạt hợp đồng thành công!', 'success');
      this.renderTable(container);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  extendContractPrompt(container, contract) {
    const newEndDate = prompt('Nhập ngày kết thúc mới (YYYY-MM-DD):', contract.endDate);
    if (!newEndDate) return;

    try {
      ContractService.extendContract(contract.id, newEndDate);
      Toast.show('Gia hạn hợp đồng thành công!', 'success');
      this.renderTable(container);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  endContractConfirm(container, contract) {
    ConfirmDialog.show({
      title: 'Thanh lý / Kết thúc Hợp đồng',
      message: `Bạn có chắc chắn muốn kết thúc hợp đồng #${contract.id}? Phòng sẽ chuyển về trạng thái Trống nếu không còn HĐ khác.`,
      onConfirm: () => {
        try {
          ContractService.endContract(contract.id);
          Toast.show('Đã kết thúc hợp đồng.', 'success');
          this.renderTable(container);
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  }

  cancelContractConfirm(container, contract) {
    ConfirmDialog.show({
      title: 'Hủy Hợp đồng',
      message: `Xác nhận hủy hợp đồng #${contract.id}?`,
      onConfirm: () => {
        try {
          ContractService.cancelContract(contract.id);
          Toast.show('Đã hủy hợp đồng.', 'success');
          this.renderTable(container);
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  }
}