/**
 * Định nghĩa Hash Routes cho toàn bộ ứng dụng
 */
export const ROUTES = Object.freeze({
  DASHBOARD: '#/dashboard',
  ROOMS: '#/rooms',
  TENANTS: '#/tenants',
  CONTRACTS: '#/contracts',
  METERS: '#/meters',
  SERVICES: '#/services',
  INVOICES: '#/invoices',
  PAYMENTS: '#/payments',
  DEBTS: '#/debts',
  REPORTS: '#/reports',
  SETTINGS: '#/settings'
});

export const ROUTE_TITLES = Object.freeze({
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.ROOMS]: 'Danh sách phòng',
  [ROUTES.TENANTS]: 'Danh sách người thuê',
  [ROUTES.CONTRACTS]: 'Danh sách hợp đồng',
  [ROUTES.METERS]: 'Ghi chỉ số điện nước',
  [ROUTES.SERVICES]: 'Danh sách dịch vụ',
  [ROUTES.INVOICES]: 'Danh sách hóa đơn',
  [ROUTES.PAYMENTS]: 'Thanh toán',
  [ROUTES.DEBTS]: 'Công nợ',
  [ROUTES.REPORTS]: 'Báo cáo',
  [ROUTES.SETTINGS]: 'Cài đặt & Sao lưu'
});