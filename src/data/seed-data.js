import { STORAGE_KEYS } from '../constants/storage-keys.js';
import { ROOM_STATUS, TENANT_STATUS, CONTRACT_STATUS, INVOICE_STATUS } from '../constants/statuses.js';
import { PAYMENT_METHODS } from '../constants/payment-methods.js';

export const SEED_DATA = Object.freeze({
  // 1. DỊCH VỤ (6 dịch vụ)
  [STORAGE_KEYS.SERVICES]: [
    { id: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500, unit: 'kWh', description: 'Tiền điện tính theo công tơ', active: true },
    { id: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000, unit: 'm3', description: 'Tiền nước sinh hoạt theo khối', active: true },
    { id: 'srv-03', name: 'Internet / Wi-Fi', type: 'FIXED_ROOM', price: 100000, unit: 'Phòng/Tháng', description: 'Mạng cáp quang tốc độ cao', active: true },
    { id: 'srv-04', name: 'Rác sinh hoạt', type: 'FIXED_ROOM', price: 30000, unit: 'Phòng/Tháng', description: 'Chi phí thu gom rác', active: true },
    { id: 'srv-05', name: 'Gửi xe máy', type: 'FIXED_TENANT', price: 50000, unit: 'Xe/Tháng', description: 'Phí trông xe tầng trệt', active: true },
    { id: 'srv-06', name: 'Vệ sinh hành lang', type: 'FIXED_ROOM', price: 20000, unit: 'Phòng/Tháng', description: 'Dọn dẹp khu vực chung', active: true }
  ],

  // 2. PHÒNG (10 phòng: 7 Đang thuê, 2 Trống, 1 Bảo trì)
  [STORAGE_KEYS.ROOMS]: [
    { id: 'room-101', number: '101', floor: 1, area: 25, price: 3000000, deposit: 3000000, maxTenants: 2, status: ROOM_STATUS.RENTED, description: 'Có gác xép, máy lạnh' },
    { id: 'room-102', number: '102', floor: 1, area: 25, price: 3000000, deposit: 3000000, maxTenants: 2, status: ROOM_STATUS.RENTED, description: 'Cửa sổ thoáng mát' },
    { id: 'room-103', number: '103', floor: 1, area: 20, price: 2500000, deposit: 2500000, maxTenants: 2, status: ROOM_STATUS.AVAILABLE, description: 'Phòng trống, vào ở ngay' },
    { id: 'room-201', number: '201', floor: 2, area: 30, price: 3500000, deposit: 3500000, maxTenants: 3, status: ROOM_STATUS.RENTED, description: 'Ban công rộng, đầy đủ nội thất' },
    { id: 'room-202', number: '202', floor: 2, area: 30, price: 3500000, deposit: 3500000, maxTenants: 3, status: ROOM_STATUS.RENTED, description: 'Phòng góc, 2 cửa sổ' },
    { id: 'room-203', number: '203', floor: 2, area: 22, price: 2800000, deposit: 2800000, maxTenants: 2, status: ROOM_STATUS.MAINTENANCE, description: 'Đang sửa đường ống nước' },
    { id: 'room-301', number: '301', floor: 3, area: 35, price: 4000000, deposit: 4000000, maxTenants: 4, status: ROOM_STATUS.RENTED, description: 'Phòng studio rộng rãi' },
    { id: 'room-302', number: '302', floor: 3, area: 30, price: 3600000, deposit: 3600000, maxTenants: 3, status: ROOM_STATUS.RENTED, description: 'Có sẵn tủ lạnh, tủ áo' },
    { id: 'room-303', number: '303', floor: 3, area: 20, price: 2500000, deposit: 2500000, maxTenants: 2, status: ROOM_STATUS.AVAILABLE, description: 'Phòng trống mới sơn lại' },
    { id: 'room-401', number: '401', floor: 4, area: 35, price: 3800000, deposit: 3800000, maxTenants: 4, status: ROOM_STATUS.RENTED, description: 'Tầng thượng thoáng mát' }
  ],

  // 3. NGƯỜI THUÊ (15 người thuê)
  [STORAGE_KEYS.TENANTS]: [
    { id: 'tnt-01', fullName: 'Nguyen Van An', identityCard: '036098001111', phone: '0912345678', email: 'an.nguyen@gmail.com', gender: 'Nam', roomId: 'room-101', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-02', fullName: 'Tran Thi Binh', identityCard: '036098002222', phone: '0923456789', email: 'binh.tran@gmail.com', gender: 'Nu', roomId: 'room-101', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-03', fullName: 'Le Van Cuong', identityCard: '036098003333', phone: '0934567890', email: 'cuong.le@gmail.com', gender: 'Nam', roomId: 'room-102', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-04', fullName: 'Pham Minh Dung', identityCard: '036098004444', phone: '0945678901', email: 'dung.pham@gmail.com', gender: 'Nam', roomId: 'room-201', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-05', fullName: 'Hoang Thi Em', identityCard: '036098005555', phone: '0956789012', email: 'em.hoang@gmail.com', gender: 'Nu', roomId: 'room-201', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-06', fullName: 'Vu Quang Giang', identityCard: '036098006666', phone: '0967890123', email: 'giang.vu@gmail.com', gender: 'Nam', roomId: 'room-201', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-07', fullName: 'Dang Thi Hoa', identityCard: '036098007777', phone: '0978901234', email: 'hoa.dang@gmail.com', gender: 'Nu', roomId: 'room-202', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-08', fullName: 'Bui Gia Huy', identityCard: '036098008888', phone: '0989012345', email: 'huy.bui@gmail.com', gender: 'Nam', roomId: 'room-301', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-09', fullName: 'Ngo Khanh Linh', identityCard: '036098009999', phone: '0990123456', email: 'linh.ngo@gmail.com', gender: 'Nu', roomId: 'room-301', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-10', fullName: 'Do Thanh Nam', identityCard: '036098010000', phone: '0901234567', email: 'nam.do@gmail.com', gender: 'Nam', roomId: 'room-302', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-11', fullName: 'Dinh Thi Oanh', identityCard: '036098011111', phone: '0911223344', email: 'oanh.dinh@gmail.com', gender: 'Nu', roomId: 'room-401', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-12', fullName: 'Phan Thanh Phong', identityCard: '036098012222', phone: '0922334455', email: 'phong.phan@gmail.com', gender: 'Nam', roomId: 'room-401', status: TENANT_STATUS.ACTIVE },
    { id: 'tnt-13', fullName: 'Trinh Van Quan', identityCard: '036098013333', phone: '0933445566', email: 'quan.trinh@gmail.com', gender: 'Nam', roomId: null, status: TENANT_STATUS.MOVED_OUT },
    { id: 'tnt-14', fullName: 'Mai Thi Son', identityCard: '036098014444', phone: '0944556677', email: 'son.mai@gmail.com', gender: 'Nu', roomId: null, status: TENANT_STATUS.MOVED_OUT },
    { id: 'tnt-15', fullName: 'Cao Van Thang', identityCard: '036098015555', phone: '0955667788', email: 'thang.cao@gmail.com', gender: 'Nam', roomId: 'room-302', status: TENANT_STATUS.ACTIVE }
  ],

  // 4. HỢP ĐỒNG (8 hợp đồng: 6 Đang hiệu lực, 1 Sắp hết hạn, 1 Đã thanh lý)
  [STORAGE_KEYS.CONTRACTS]: [
    {
      id: 'ctr-101',
      contractNumber: 'HD-101-2026',
      roomId: 'room-101',
      representativeId: 'tnt-01',
      tenantIds: ['tnt-01', 'tnt-02'],
      agreedPrice: 3000000,
      depositAmount: 3000000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 },
        { serviceId: 'srv-04', name: 'Rác', type: 'FIXED_ROOM', price: 30000 }
      ]
    },
    {
      id: 'ctr-102',
      contractNumber: 'HD-102-2025',
      roomId: 'room-102',
      representativeId: 'tnt-03',
      tenantIds: ['tnt-03'],
      agreedPrice: 3000000,
      depositAmount: 3000000,
      startDate: '2025-08-15',
      endDate: '2026-08-15', // Sắp hết hạn (Tháng 8/2026)
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.EXPIRING_SOON,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 }
      ]
    },
    {
      id: 'ctr-201',
      contractNumber: 'HD-201-2026',
      roomId: 'room-201',
      representativeId: 'tnt-04',
      tenantIds: ['tnt-04', 'tnt-05', 'tnt-06'],
      agreedPrice: 3500000,
      depositAmount: 3500000,
      startDate: '2026-02-01',
      endDate: '2027-02-01',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 },
        { serviceId: 'srv-04', name: 'Rác', type: 'FIXED_ROOM', price: 30000 },
        { serviceId: 'srv-05', name: 'Xe máy', type: 'FIXED_TENANT', price: 50000, quantity: 2 }
      ]
    },
    {
      id: 'ctr-202',
      contractNumber: 'HD-202-2026',
      roomId: 'room-202',
      representativeId: 'tnt-07',
      tenantIds: ['tnt-07'],
      agreedPrice: 3500000,
      depositAmount: 3500000,
      startDate: '2026-03-01',
      endDate: '2027-03-01',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 }
      ]
    },
    {
      id: 'ctr-301',
      contractNumber: 'HD-301-2026',
      roomId: 'room-301',
      representativeId: 'tnt-08',
      tenantIds: ['tnt-08', 'tnt-09'],
      agreedPrice: 4000000,
      depositAmount: 4000000,
      startDate: '2026-01-15',
      endDate: '2027-01-15',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 },
        { serviceId: 'srv-04', name: 'Rác', type: 'FIXED_ROOM', price: 30000 }
      ]
    },
    {
      id: 'ctr-302',
      contractNumber: 'HD-302-2026',
      roomId: 'room-302',
      representativeId: 'tnt-10',
      tenantIds: ['tnt-10', 'tnt-15'],
      agreedPrice: 3600000,
      depositAmount: 3600000,
      startDate: '2026-04-01',
      endDate: '2027-04-01',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 }
      ]
    },
    {
      id: 'ctr-401',
      contractNumber: 'HD-401-2026',
      roomId: 'room-401',
      representativeId: 'tnt-11',
      tenantIds: ['tnt-11', 'tnt-12'],
      agreedPrice: 3800000,
      depositAmount: 3800000,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      serviceSnapshots: [
        { serviceId: 'srv-01', name: 'Điện', type: 'INDEX', price: 3500 },
        { serviceId: 'srv-02', name: 'Nước', type: 'INDEX', price: 20000 },
        { serviceId: 'srv-03', name: 'Internet', type: 'FIXED_ROOM', price: 100000 }
      ]
    },
    {
      id: 'ctr-old-01',
      contractNumber: 'HD-203-2025',
      roomId: 'room-203',
      representativeId: 'tnt-13',
      tenantIds: ['tnt-13'],
      agreedPrice: 2800000,
      depositAmount: 2800000,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      paymentCycleDay: 5,
      status: CONTRACT_STATUS.TERMINATED,
      serviceSnapshots: []
    }
  ],

  // 5. CHỈ SỐ ĐIỆN NƯỚC (3 tháng: 05/2026, 06/2026, 07/2026)
  [STORAGE_KEYS.METER_READINGS]: [
    // Tháng 05/2026
    { id: 'mtr-2026-05-101', roomId: 'room-101', period: '2026-05', oldElectric: 100, newElectric: 180, oldWater: 20, newWater: 28, recordedAt: '2026-05-31' },
    { id: 'mtr-2026-05-102', roomId: 'room-102', period: '2026-05', oldElectric: 150, newElectric: 210, oldWater: 30, newWater: 36, recordedAt: '2026-05-31' },
    { id: 'mtr-2026-05-201', roomId: 'room-201', period: '2026-05', oldElectric: 200, newElectric: 310, oldWater: 40, newWater: 52, recordedAt: '2026-05-31' },
    { id: 'mtr-2026-05-301', roomId: 'room-301', period: '2026-05', oldElectric: 300, newElectric: 420, oldWater: 50, newWater: 65, recordedAt: '2026-05-31' },

    // Tháng 06/2026
    { id: 'mtr-2026-06-101', roomId: 'room-101', period: '2026-06', oldElectric: 180, newElectric: 265, oldWater: 28, newWater: 37, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-102', roomId: 'room-102', period: '2026-06', oldElectric: 210, newElectric: 280, oldWater: 36, newWater: 43, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-201', roomId: 'room-201', period: '2026-06', oldElectric: 310, newElectric: 435, oldWater: 52, newWater: 66, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-202', roomId: 'room-202', period: '2026-06', oldElectric: 100, newElectric: 190, oldWater: 10, newWater: 18, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-301', roomId: 'room-301', period: '2026-06', oldElectric: 420, newElectric: 550, oldWater: 65, newWater: 81, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-302', roomId: 'room-302', period: '2026-06', oldElectric: 80, newElectric: 175, oldWater: 15, newWater: 24, recordedAt: '2026-06-30' },
    { id: 'mtr-2026-06-401', roomId: 'room-401', period: '2026-06', oldElectric: 500, newElectric: 630, oldWater: 80, newWater: 94, recordedAt: '2026-06-30' },

    // Tháng 07/2026
    { id: 'mtr-2026-07-101', roomId: 'room-101', period: '2026-07', oldElectric: 265, newElectric: 350, oldWater: 37, newWater: 46, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-102', roomId: 'room-102', period: '2026-07', oldElectric: 280, newElectric: 345, oldWater: 43, newWater: 50, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-201', roomId: 'room-201', period: '2026-07', oldElectric: 435, newElectric: 560, oldWater: 66, newWater: 80, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-202', roomId: 'room-202', period: '2026-07', oldElectric: 190, newElectric: 285, oldWater: 18, newWater: 27, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-301', roomId: 'room-301', period: '2026-07', oldElectric: 550, newElectric: 690, oldWater: 81, newWater: 98, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-302', roomId: 'room-302', period: '2026-07', oldElectric: 175, newElectric: 270, oldWater: 24, newWater: 33, recordedAt: '2026-07-31' },
    { id: 'mtr-2026-07-401', roomId: 'room-401', period: '2026-07', oldElectric: 630, newElectric: 770, oldWater: 94, newWater: 110, recordedAt: '2026-07-31' }
  ],

  // 6. HÓA ĐƠN (10 hóa đơn đủ các trạng thái)
  [STORAGE_KEYS.INVOICES]: [
    // Tháng 05 (Đã thanh toán)
    {
      id: 'inv-2026-05-101',
      code: 'HD-202605-101',
      contractId: 'ctr-101',
      roomId: 'room-101',
      period: '2026-05',
      roomPrice: 3000000,
      electricAmount: 280000, // (180-100)*3500
      waterAmount: 160000,    // (28-20)*20000
      otherServicesAmount: 130000,
      totalAmount: 3570000,
      paidAmount: 3570000,
      remainingAmount: 0,
      dueDate: '2026-06-05',
      status: INVOICE_STATUS.PAID
    },
    // Tháng 06 (Đã thanh toán)
    {
      id: 'inv-2026-06-101',
      code: 'HD-202606-101',
      contractId: 'ctr-101',
      roomId: 'room-101',
      period: '2026-06',
      roomPrice: 3000000,
      electricAmount: 297500, // (265-180)*3500
      waterAmount: 180000,    // (37-28)*20000
      otherServicesAmount: 130000,
      totalAmount: 3607500,
      paidAmount: 3607500,
      remainingAmount: 0,
      dueDate: '2026-07-05',
      status: INVOICE_STATUS.PAID
    },
    {
      id: 'inv-2026-06-102',
      code: 'HD-202606-102',
      contractId: 'ctr-102',
      roomId: 'room-102',
      period: '2026-06',
      roomPrice: 3000000,
      electricAmount: 245000,
      waterAmount: 140000,
      otherServicesAmount: 100000,
      totalAmount: 3485000,
      paidAmount: 3485000,
      remainingAmount: 0,
      dueDate: '2026-07-05',
      status: INVOICE_STATUS.PAID
    },
    // Tháng 07 - Đã thanh toán
    {
      id: 'inv-2026-07-101',
      code: 'HD-202607-101',
      contractId: 'ctr-101',
      roomId: 'room-101',
      period: '2026-07',
      roomPrice: 3000000,
      electricAmount: 297500, // (350-265)*3500
      waterAmount: 180000,    // (46-37)*20000
      otherServicesAmount: 130000,
      totalAmount: 3607500,
      paidAmount: 3607500,
      remainingAmount: 0,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.PAID
    },
    // Tháng 07 - Quá hạn (Overdue)
    {
      id: 'inv-2026-07-102',
      code: 'HD-202607-102',
      contractId: 'ctr-102',
      roomId: 'room-102',
      period: '2026-07',
      roomPrice: 3000000,
      electricAmount: 227500,
      waterAmount: 140000,
      otherServicesAmount: 100000,
      totalAmount: 3467500,
      paidAmount: 0,
      remainingAmount: 3467500,
      dueDate: '2026-08-01', // Đã quá hạn so với hiện tại (03/08/2026)
      status: INVOICE_STATUS.OVERDUE
    },
    // Tháng 07 - Thanh toán một phần (Partially Paid)
    {
      id: 'inv-2026-07-201',
      code: 'HD-202607-201',
      contractId: 'ctr-201',
      roomId: 'room-201',
      period: '2026-07',
      roomPrice: 3500000,
      electricAmount: 437500,
      waterAmount: 280000,
      otherServicesAmount: 230000,
      totalAmount: 4447500,
      paidAmount: 2000000,
      remainingAmount: 2447500,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.PARTIALLY_PAID
    },
    // Tháng 07 - Chưa thanh toán (Unpaid)
    {
      id: 'inv-2026-07-202',
      code: 'HD-202607-202',
      contractId: 'ctr-202',
      roomId: 'room-202',
      period: '2026-07',
      roomPrice: 3500000,
      electricAmount: 332500,
      waterAmount: 180000,
      otherServicesAmount: 100000,
      totalAmount: 4112500,
      paidAmount: 0,
      remainingAmount: 4112500,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.UNPAID
    },
    {
      id: 'inv-2026-07-301',
      code: 'HD-202607-301',
      contractId: 'ctr-301',
      roomId: 'room-301',
      period: '2026-07',
      roomPrice: 4000000,
      electricAmount: 490000,
      waterAmount: 340000,
      otherServicesAmount: 130000,
      totalAmount: 4960000,
      paidAmount: 4960000,
      remainingAmount: 0,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.PAID
    },
    {
      id: 'inv-2026-07-302',
      code: 'HD-202607-302',
      contractId: 'ctr-302',
      roomId: 'room-302',
      period: '2026-07',
      roomPrice: 3600000,
      electricAmount: 332500,
      waterAmount: 180000,
      otherServicesAmount: 100000,
      totalAmount: 4212500,
      paidAmount: 0,
      remainingAmount: 4212500,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.UNPAID
    },
    {
      id: 'inv-2026-07-401',
      code: 'HD-202607-401',
      contractId: 'ctr-401',
      roomId: 'room-401',
      period: '2026-07',
      roomPrice: 3800000,
      electricAmount: 490000,
      waterAmount: 320000,
      otherServicesAmount: 100000,
      totalAmount: 4710000,
      paidAmount: 4710000,
      remainingAmount: 0,
      dueDate: '2026-08-05',
      status: INVOICE_STATUS.PAID
    }
  ],

  // 7. GIAO DỊCH THANH TOÁN (8 giao dịch)
  [STORAGE_KEYS.PAYMENTS]: [
    { id: 'pay-01', receiptCode: 'PT-202606-01', invoiceId: 'inv-2026-05-101', amount: 3570000, paymentDate: '2026-06-03', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'An chuyen khoan tien phong T5' },
    { id: 'pay-02', receiptCode: 'PT-202607-01', invoiceId: 'inv-2026-06-101', amount: 3607500, paymentDate: '2026-07-02', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'An chuyen khoan T6' },
    { id: 'pay-03', receiptCode: 'PT-202607-02', invoiceId: 'inv-2026-06-102', amount: 3485000, paymentDate: '2026-07-04', method: PAYMENT_METHODS.CASH, note: 'Cuong dong tien mat T6' },
    { id: 'pay-04', receiptCode: 'PT-202608-01', invoiceId: 'inv-2026-07-101', amount: 3607500, paymentDate: '2026-08-01', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'An chuyen khoan T7' },
    { id: 'pay-05', receiptCode: 'PT-202608-02', invoiceId: 'inv-2026-07-201', amount: 2000000, paymentDate: '2026-08-02', method: PAYMENT_METHODS.CASH, note: 'Dung tra truoc 2 trieu' },
    { id: 'pay-06', receiptCode: 'PT-202608-03', invoiceId: 'inv-2026-07-301', amount: 4960000, paymentDate: '2026-08-02', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'Huy chuyen khoan du T7' },
    { id: 'pay-07', receiptCode: 'PT-202608-04', invoiceId: 'inv-2026-07-401', amount: 4710000, paymentDate: '2026-08-03', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'Oanh chuyen khoan T7' },
    { id: 'pay-08', receiptCode: 'PT-202608-05', invoiceId: 'inv-2026-07-201', amount: 1000000, paymentDate: '2026-08-03', method: PAYMENT_METHODS.BANK_TRANSFER, note: 'Dung chuyen them 1 trieu' }
  ],

  // 8. CÀI ĐẶT
  [STORAGE_KEYS.SETTINGS]: {
    houseName: 'Nhà Trọ RoomMate Premium',
    ownerName: 'Nguyễn Văn Chủ',
    phone: '0909123456',
    address: '123 Đường 3/2, Quận Ninh Kiều, Cần Thơ',
    bankName: 'MB Bank',
    bankAccount: '9999999999',
    bankAccountName: 'NGUYEN VAN CHU',
    overdueDaysLimit: 5
  }
});