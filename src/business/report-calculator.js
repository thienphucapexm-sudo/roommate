/**
 * Tính các chỉ số thống kê về phòng
 * @param {Array} rooms - Danh sách phòng
 * @returns {{ totalRooms: number, vacantRooms: number, rentedRooms: number, maintenanceRooms: number, occupancyRate: number }}
 */
export function calculateRoomMetrics(rooms = []) {
  if (!Array.isArray(rooms)) {
    return { totalRooms: 0, vacantRooms: 0, rentedRooms: 0, maintenanceRooms: 0, occupancyRate: 0 };
  }

  const totalRooms = rooms.length;
  let vacantRooms = 0;
  let rentedRooms = 0;
  let maintenanceRooms = 0;

  rooms.forEach((room) => {
    const status = String(room?.status || '').toUpperCase();
    if (status === 'RENTED' || status === 'OCCUPIED') {
      rentedRooms += 1;
    } else if (status === 'MAINTENANCE' || status === 'REPAIRING') {
      maintenanceRooms += 1;
    } else {
      vacantRooms += 1;
    }
  });

  const occupancyRate = totalRooms > 0 ? Number(((rentedRooms / totalRooms) * 100).toFixed(2)) : 0;

  return {
    totalRooms,
    vacantRooms,
    rentedRooms,
    maintenanceRooms,
    occupancyRate,
  };
}

/**
 * Tính tổng số người thuê hiện tại từ danh sách hợp đồng hoặc khách thuê
 * @param {Array} tenantsOrContracts - Danh sách khách thuê hoặc hợp đồng đang hiệu lực
 * @returns {number}
 */
export function calculateTotalTenants(tenantsOrContracts = []) {
  if (!Array.isArray(tenantsOrContracts)) return 0;
  
  return tenantsOrContracts.reduce((sum, item) => {
    // Nếu là danh sách hợp đồng có thông tin số người ở
    if (item?.tenantCount) {
      return sum + Number(item.tenantCount);
    }
    // Nếu là danh sách khách thuê còn hoạt động
    if (item?.status === 'ACTIVE' || item?.status === undefined) {
      return sum + 1;
    }
    return sum;
  }, 0);
}

/**
 * Thống kê doanh thu (tổng tiền hóa đơn) và thực thu (tiền đã thanh toán) theo từng tháng
 * @param {Array} invoices - Danh sách hóa đơn
 * @param {Array} payments - Danh sách giao dịch thanh toán
 * @returns {Array<{ month: string, revenue: number, actualCollected: number }>}
 */
export function calculateMonthlyRevenueAndCollection(invoices = [], payments = []) {
  if (!Array.isArray(invoices)) return [];

  const resultMap = {};

  // 1. Thống kê tổng doanh thu theo tháng hóa đơn (trừ hóa đơn CANCELLED)
  invoices.forEach((inv) => {
    if (inv?.status === 'CANCELLED') return;

    const month = inv?.month || 'Chưa xác định';
    if (!resultMap[month]) {
      resultMap[month] = { month, revenue: 0, actualCollected: 0 };
    }
    resultMap[month].revenue += Number(inv?.total) || 0;
  });

  // 2. Thống kê tiền thực thu theo tháng dựa trên ngày thanh toán thực tế
  if (Array.isArray(payments)) {
    payments.forEach((pay) => {
      const payAmount = Number(pay?.amount) || 0;
      if (payAmount <= 0) return;

      const dateStr = pay?.paymentDate || pay?.createdAt;
      const month = dateStr ? dateStr.substring(0, 7) : 'Chưa xác định';

      if (!resultMap[month]) {
        resultMap[month] = { month, revenue: 0, actualCollected: 0 };
      }
      resultMap[month].actualCollected += payAmount;
    });
  }

  return Object.values(resultMap).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Tính tổng công nợ và số lượng hóa đơn quá hạn
 * @param {Array} invoices - Danh sách hóa đơn
 * @param {Array} payments - Danh sách giao dịch thanh toán
 * @param {string} [currentDate] - Ngày mốc so sánh (YYYY-MM-DD)
 * @returns {{ totalDebt: number, overdueInvoiceCount: number }}
 */
export function calculateDebtAndOverdueMetrics(invoices = [], payments = [], currentDate) {
  if (!Array.isArray(invoices)) {
    return { totalDebt: 0, overdueInvoiceCount: 0 };
  }

  const todayStr = currentDate || new Date().toISOString().substring(0, 10);
  let totalDebt = 0;
  let overdueInvoiceCount = 0;

  // Gom nhóm tổng thanh toán theo từng invoiceId
  const paymentMap = {};
  if (Array.isArray(payments)) {
    payments.forEach((p) => {
      const invId = String(p.invoiceId);
      paymentMap[invId] = (paymentMap[invId] || 0) + (Number(p.amount) || 0);
    });
  }

  invoices.forEach((inv) => {
    if (inv?.status === 'CANCELLED') return;

    const total = Number(inv?.total) || 0;
    const paid = paymentMap[String(inv.id)] || Number(inv?.paidAmount) || 0;
    const remaining = Math.max(0, total - paid);

    if (remaining > 0) {
      totalDebt += remaining;
      // Kiểm tra xem có bị quá hạn không
      if (inv?.dueDate && todayStr > inv.dueDate) {
        overdueInvoiceCount += 1;
      }
    }
  });

  return { totalDebt, overdueInvoiceCount };
}

/**
 * Tính tổng chỉ số điện/nước tiêu thụ theo tháng
 * @param {Array} serviceReadings - Danh sách chỉ số điện nước (hoặc hóa đơn chứa thông tin tiêu thụ)
 * @returns {{ monthlyElectricity: Array<{month: string, totalUsage: number}>, monthlyWater: Array<{month: string, totalUsage: number}> }}
 */
export function calculateMonthlyUtilityUsage(serviceReadings = []) {
  if (!Array.isArray(serviceReadings)) {
    return { monthlyElectricity: [], monthlyWater: [] };
  }

  const eleMap = {};
  const waterMap = {};

  serviceReadings.forEach((item) => {
    const month = item?.month || 'Chưa xác định';

    // Điện tiêu thụ
    const eleUsage = Number(item?.electricityUsage) || Number(item?.electricityAmount) || 0;
    eleMap[month] = (eleMap[month] || 0) + eleUsage;

    // Nước tiêu thụ
    const waterUsage = Number(item?.waterUsage) || Number(item?.waterAmount) || 0;
    waterMap[month] = (waterMap[month] || 0) + waterUsage;
  });

  const monthlyElectricity = Object.keys(eleMap)
    .sort()
    .map((month) => ({ month, totalUsage: eleMap[month] }));

  const monthlyWater = Object.keys(waterMap)
    .sort()
    .map((month) => ({ month, totalUsage: waterMap[month] }));

  return { monthlyElectricity, monthlyWater };
}

/**
 * Tính mức điện tiêu thụ theo từng phòng
 * @param {Array} serviceReadings - Danh sách chỉ số/hóa đơn
 * @param {Array} rooms - Danh sách phòng
 * @returns {Array<{ roomId: string|number, roomName: string, totalUsage: number }>}
 */
export function calculateElectricityByRoom(serviceReadings = [], rooms = []) {
  if (!Array.isArray(serviceReadings)) return [];

  const roomMap = {};

  serviceReadings.forEach((item) => {
    const roomId = String(item?.roomId);
    const usage = Number(item?.electricityUsage) || 0;

    if (!roomMap[roomId]) {
      const room = rooms.find((r) => String(r.id) === roomId);
      roomMap[roomId] = {
        roomId: item?.roomId,
        roomName: room ? room.name : `Phòng ${roomId}`,
        totalUsage: 0,
      };
    }
    roomMap[roomId].totalUsage += usage;
  });

  return Object.values(roomMap);
}

/**
 * Phân tích tỷ lệ phân bổ trạng thái hóa đơn
 * @param {Array} invoices - Danh sách hóa đơn
 * @returns {Array<{ status: string, count: number, percentage: number }>}
 */
export function calculateInvoiceStatusDistribution(invoices = []) {
  if (!Array.isArray(invoices) || invoices.length === 0) return [];

  const totalInvoices = invoices.length;
  const statusMap = {};

  invoices.forEach((inv) => {
    const status = inv?.status || 'UNKNOWN';
    statusMap[status] = (statusMap[status] || 0) + 1;
  });

  return Object.keys(statusMap).map((status) => {
    const count = statusMap[status];
    return {
      status,
      count,
      percentage: Number(((count / totalInvoices) * 100).toFixed(2)),
    };
  });
}

/**
 * Thống kê tổng số tiền thanh toán theo phương thức
 * @param {Array} payments - Danh sách giao dịch thanh toán
 * @returns {Array<{ method: string, totalAmount: number, count: number, percentage: number }>}
 */
export function calculatePaymentByMethod(payments = []) {
  if (!Array.isArray(payments) || payments.length === 0) return [];

  const methodMap = {};
  let totalAllAmount = 0;

  payments.forEach((p) => {
    const amount = Number(p?.amount) || 0;
    if (amount <= 0) return;

    const method = p?.method || 'OTHER';
    if (!methodMap[method]) {
      methodMap[method] = { method, totalAmount: 0, count: 0 };
    }

    methodMap[method].totalAmount += amount;
    methodMap[method].count += 1;
    totalAllAmount += amount;
  });

  return Object.values(methodMap).map((item) => ({
    ...item,
    percentage: totalAllAmount > 0 ? Number(((item.totalAmount / totalAllAmount) * 100).toFixed(2)) : 0,
  }));
}

/**
 * Tìm danh sách các hợp đồng sắp hết hạn
 * @param {Array} contracts - Danh sách hợp đồng
 * @param {Array} rooms - Danh sách phòng
 * @param {number} [daysThreshold=30] - Khoảng thời gian cảnh báo (mặc định 30 ngày)
 * @param {string} [currentDate] - Ngày mốc kiểm tra (YYYY-MM-DD)
 * @returns {Array<{ id: string|number, roomId: string|number, roomName: string, endDate: string, daysRemaining: number }>}
 */
export function getExpiringContractsList(contracts = [], rooms = [], daysThreshold = 30, currentDate) {
  if (!Array.isArray(contracts)) return [];

  const now = currentDate ? new Date(currentDate) : new Date();
  now.setHours(0, 0, 0, 0);

  return contracts
    .filter((c) => c?.status === 'ACTIVE' && c?.endDate)
    .map((c) => {
      const end = new Date(c.endDate);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const room = rooms.find((r) => String(r.id) === String(c.roomId));

      return {
        id: c.id,
        roomId: c.roomId,
        roomName: room ? room.name : `Phòng ${c.roomId}`,
        endDate: c.endDate,
        daysRemaining,
      };
    })
    .filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= daysThreshold)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}