/**
 * Trạng thái Phòng
 */
export const ROOM_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE'
});

export const ROOM_STATUS_LABELS = Object.freeze({
  [ROOM_STATUS.AVAILABLE]: 'Trống',
  [ROOM_STATUS.RENTED]: 'Đã thuê',
  [ROOM_STATUS.MAINTENANCE]: 'Đang bảo trì'
});

export const ROOM_STATUS_BADGES = Object.freeze({
  [ROOM_STATUS.AVAILABLE]: 'bg-success',
  [ROOM_STATUS.RENTED]: 'bg-primary',
  [ROOM_STATUS.MAINTENANCE]: 'bg-warning text-dark'
});

/**
 * Trạng thái Người thuê
 */
export const TENANT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  MOVED_OUT: 'MOVED_OUT'
});

export const TENANT_STATUS_LABELS = Object.freeze({
  [TENANT_STATUS.ACTIVE]: 'Đang ở',
  [TENANT_STATUS.MOVED_OUT]: 'Đã chuyển đi'
});

export const TENANT_STATUS_BADGES = Object.freeze({
  [TENANT_STATUS.ACTIVE]: 'bg-success',
  [TENANT_STATUS.MOVED_OUT]: 'bg-secondary'
});

/**
 * Trạng thái Hợp đồng
 */
export const CONTRACT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED'
});

export const CONTRACT_STATUS_LABELS = Object.freeze({
  [CONTRACT_STATUS.PENDING]: 'Chờ hiệu lực',
  [CONTRACT_STATUS.ACTIVE]: 'Đang hiệu lực',
  [CONTRACT_STATUS.EXPIRING_SOON]: 'Sắp hết hạn',
  [CONTRACT_STATUS.EXPIRED]: 'Hết hạn',
  [CONTRACT_STATUS.TERMINATED]: 'Đã thanh lý'
});

export const CONTRACT_STATUS_BADGES = Object.freeze({
  [CONTRACT_STATUS.PENDING]: 'bg-info text-white',
  [CONTRACT_STATUS.ACTIVE]: 'bg-success',
  [CONTRACT_STATUS.EXPIRING_SOON]: 'bg-warning text-dark',
  [CONTRACT_STATUS.EXPIRED]: 'bg-secondary',
  [CONTRACT_STATUS.TERMINATED]: 'bg-danger'
});

/**
 * Trạng thái Hóa đơn
 */
export const INVOICE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
});

export const INVOICE_STATUS_LABELS = Object.freeze({
  [INVOICE_STATUS.DRAFT]: 'Nháp',
  [INVOICE_STATUS.UNPAID]: 'Chờ thanh toán',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'Thanh toán 1 phần',
  [INVOICE_STATUS.PAID]: 'Đã thanh toán',
  [INVOICE_STATUS.OVERDUE]: 'Quá hạn',
  [INVOICE_STATUS.CANCELLED]: 'Đã hủy'
});

export const INVOICE_STATUS_BADGES = Object.freeze({
  [INVOICE_STATUS.DRAFT]: 'bg-secondary',
  [INVOICE_STATUS.UNPAID]: 'bg-warning text-dark',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'bg-info text-white',
  [INVOICE_STATUS.PAID]: 'bg-success',
  [INVOICE_STATUS.OVERDUE]: 'bg-danger',
  [INVOICE_STATUS.CANCELLED]: 'bg-dark'
});