import { RoomService } from '../services/room-service.js';
import { TenantService } from '../services/tenant-service.js';
import { formatVND } from '../utils/currency-utils.js';
import { CONTRACT_STATUS_LABELS } from '../constants/statuses.js';

export class ContractDetailComponent {
  static render({ contract, onClose }) {
    const room = RoomService.getRoomById(contract.roomId);
    const primaryTenant = TenantService.getTenantById(contract.tenantId);
    
    const members = Array.isArray(contract.memberIds)
      ? contract.memberIds.map(id => TenantService.getTenantById(id)).filter(Boolean)
      : [];

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('data-testid', 'contract-detail-modal');

    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Chi Tiết Hợp Đồng #${contract.id}</h3>
          <button type="button" class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" data-testid="contract-detail-content">
          <div class="detail-row">
            <span class="detail-label">Trạng thái:</span>
            <span class="detail-value">${CONTRACT_STATUS_LABELS[contract.status] || contract.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số phòng:</span>
            <span class="detail-value">Phòng ${room ? room.number : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Người đại diện:</span>
            <span class="detail-value">${primaryTenant ? `${primaryTenant.fullName} (${primaryTenant.phone})` : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Người ở cùng:</span>
            <span class="detail-value">${members.length > 0 ? members.map(m => m.fullName).join(', ') : 'Không có'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Thời hạn:</span>
            <span class="detail-value">${contract.startDate} đến ${contract.endDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Giá thuê:</span>
            <span class="detail-value">${formatVND(contract.rentalPrice)} / tháng</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tiền cọc:</span>
            <span class="detail-value">${formatVND(contract.depositAmount)}</span>
          </div>
        </div>
        <div class="form-actions" style="padding: 1rem; border-top: 1px solid #e5e7eb;">
          <button class="btn btn-secondary" id="btn-close-detail" data-testid="btn-close-detail">Đóng</button>
        </div>
      </div>
    `;

    const handleClose = () => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    };

    backdrop.querySelector('.modal-close-btn').addEventListener('click', handleClose);
    backdrop.querySelector('#btn-close-detail').addEventListener('click', handleClose);

    return backdrop;
  }
}