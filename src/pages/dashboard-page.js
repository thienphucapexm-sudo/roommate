import { reportService } from '../services/report-service.js';
import { createStatCardHtml } from '../components/stat-card.js';
import { createAlertListHtml } from '../components/alert-list.js';

// Lưu trữ instance của Chart.js để hủy (destroy) trước khi vẽ mới
let revenueChartInstance = null;
let roomStatusChartInstance = null;

export function renderDashboardPage(container) {
  // 1. Tải toàn bộ dữ liệu chỉ số tổng quan từ ReportService (không tính toán tại đây)
  const overview = reportService.getOverviewReport() || {};
  const utilityData = reportService.getUtilityConsumptionChartData() || { labels: [], electricityData: [], waterData: [] };
  const revenueChartData = reportService.getRevenueVsCollectionChartData() || { labels: [], revenueData: [], collectionData: [] };
  const expiringContracts = reportService.getExpiringContracts(30) || [];

  // Lấy chỉ số điện/nước tháng hiện tại (phần tử cuối cùng)
  const currentMonthElec = utilityData.electricityData.length > 0
    ? utilityData.electricityData[utilityData.electricityData.length - 1]
    : 0;

  const currentMonthWater = utilityData.waterData.length > 0
    ? utilityData.waterData[utilityData.waterData.length - 1]
    : 0;

  // Lấy doanh thu tháng gần nhất
  const currentMonthRevenue = revenueChartData.revenueData.length > 0
    ? revenueChartData.revenueData[revenueChartData.revenueData.length - 1]
    : 0;

  // 2. Tổng hợp danh sách cảnh báo cho AlertList
  const alerts = [];
  if (overview.overdueInvoiceCount > 0) {
    alerts.push({
      id: 'overdue-invoices',
      type: 'danger',
      message: `Có ${overview.overdueInvoiceCount} hóa đơn đã quá hạn thanh toán!`,
      detail: 'Vui lòng kiểm tra mục công nợ để nhắc nhở khách thuê.',
      link: '#/debts',
    });
  }

  if (expiringContracts.length > 0) {
    alerts.push({
      id: 'expiring-contracts',
      type: 'warning',
      message: `Có ${expiringContracts.length} hợp đồng sắp hết hạn trong 30 ngày tới.`,
      detail: expiringContracts.map((c) => `${c.roomName} (${c.daysRemaining} ngày)`).join(', '),
      link: '#/contracts',
    });
  }

  if (overview.vacantRooms > 0) {
    alerts.push({
      id: 'vacant-rooms',
      type: 'info',
      message: `Hiện có ${overview.vacantRooms} phòng còn trống.`,
      detail: 'Sẵn sàng để đăng tin cho thuê mới.',
      link: '#/rooms',
    });
  }

  // 3. Render khung HTML chính
  const html = `
    <div class="dashboard-page" data-testid="dashboard-page">
      <div class="dashboard-header">
        <h2>Bảng điều khiển (Dashboard)</h2>
      </div>

      <!-- Khung Thẻ chỉ số (Stat Cards Grid) -->
      <div class="stats-grid" data-testid="stats-grid">
        ${createStatCardHtml({
          title: 'Tổng số phòng',
          value: overview.totalRooms || 0,
          subText: 'Tổng quy mô hệ thống',
          testId: 'stat-total-rooms',
        })}

        ${createStatCardHtml({
          title: 'Phòng đang thuê',
          value: overview.rentedRooms || 0,
          variant: 'success',
          testId: 'stat-rented-rooms',
        })}

        ${createStatCardHtml({
          title: 'Phòng trống',
          value: overview.vacantRooms || 0,
          variant: 'warning',
          testId: 'stat-vacant-rooms',
        })}

        ${createStatCardHtml({
          title: 'Tỷ lệ lấp đầy',
          value: `${overview.occupancyRate || 0}%`,
          variant: 'primary',
          testId: 'stat-occupancy-rate',
        })}

        ${createStatCardHtml({
          title: 'Người thuê hiện tại',
          value: overview.totalTenants || 0,
          subText: 'Đang cư trú',
          testId: 'stat-total-tenants',
        })}

        ${createStatCardHtml({
          title: 'Doanh thu tháng',
          value: `${(currentMonthRevenue || 0).toLocaleString('vi-VN')} đ`,
          variant: 'success',
          testId: 'stat-monthly-revenue',
        })}

        ${createStatCardHtml({
          title: 'Tổng công nợ',
          value: `${(overview.totalDebt || 0).toLocaleString('vi-VN')} đ`,
          variant: 'danger',
          testId: 'stat-total-debt',
        })}

        ${createStatCardHtml({
          title: 'Hóa đơn quá hạn',
          value: overview.overdueInvoiceCount || 0,
          variant: 'danger',
          testId: 'stat-overdue-invoices',
        })}

        ${createStatCardHtml({
          title: 'Điện tiêu thụ tháng',
          value: `${(currentMonthElec || 0).toLocaleString('vi-VN')} kWh`,
          variant: 'info',
          testId: 'stat-monthly-electric',
        })}

        ${createStatCardHtml({
          title: 'Nước tiêu thụ tháng',
          value: `${(currentMonthWater || 0).toLocaleString('vi-VN')} m³`,
          variant: 'info',
          testId: 'stat-monthly-water',
        })}
      </div>

      <!-- Khung hiển thị Cảnh báo & Biểu đồ -->
      <div class="dashboard-content-grid">
        <!-- Khung Cảnh báo -->
        <div class="dashboard-card alerts-card">
          <div class="card-header">
            <h3>Danh sách cảnh báo</h3>
          </div>
          <div class="card-body">
            ${createAlertListHtml(alerts)}
          </div>
        </div>

        <!-- Khung Biểu đồ trạng thái phòng -->
        <div class="dashboard-card chart-card">
          <div class="card-header">
            <h3>Tỷ lệ Trạng thái Phòng</h3>
          </div>
          <div class="card-body chart-container">
            <canvas id="room-status-chart" data-testid="room-status-chart"></canvas>
            <div id="room-status-empty" class="chart-empty hidden" data-testid="room-status-empty">
              Chưa có dữ liệu phòng
            </div>
          </div>
        </div>

        <!-- Khung Biểu đồ doanh thu 6 tháng gần nhất -->
        <div class="dashboard-card chart-card full-width">
          <div class="card-header">
            <h3>Doanh thu & Thực thu (6 tháng gần nhất)</h3>
          </div>
          <div class="card-body chart-container">
            <canvas id="revenue-chart" data-testid="revenue-chart"></canvas>
            <div id="revenue-empty" class="chart-empty hidden" data-testid="revenue-empty">
              Chưa có dữ liệu doanh thu
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // 4. Khởi tạo các biểu đồ Chart.js sau khi DOM đã được gắn
  initCharts(overview, revenueChartData, container);
}

/**
 * Hàm khởi tạo và quản lý biểu đồ Chart.js
 */
function initCharts(overview, revenueChartData, container) {
  // Kiểm tra thư viện Chart.js đã nạp chưa
  if (typeof window.Chart === 'undefined') {
    console.warn('Thư viện Chart.js chưa được tải.');
    return;
  }

  // --- 1. Vẽ Biểu đồ Trạng thái Phòng (Doughnut Chart) ---
  const roomStatusCanvas = container.querySelector('#room-status-chart');
  const roomStatusEmpty = container.querySelector('#room-status-empty');

  // Hủy instance cũ nếu đã tồn tại
  if (roomStatusChartInstance) {
    roomStatusChartInstance.destroy();
    roomStatusChartInstance = null;
  }

  const rented = overview.rentedRooms || 0;
  const vacant = overview.vacantRooms || 0;
  const maintenance = overview.maintenanceRooms || 0;
  const hasRoomData = rented > 0 || vacant > 0 || maintenance > 0;

  if (!hasRoomData) {
    roomStatusCanvas.classList.add('hidden');
    roomStatusEmpty.classList.remove('hidden');
  } else {
    roomStatusCanvas.classList.remove('hidden');
    roomStatusEmpty.classList.add('hidden');

    roomStatusChartInstance = new window.Chart(roomStatusCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Đang thuê', 'Phòng trống', 'Bảo trì/Sửa chữa'],
        datasets: [
          {
            data: [rented, vacant, maintenance],
            backgroundColor: ['#16a34a', '#f59e0b', '#6b7280'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  // --- 2. Vẽ Biểu đồ Doanh thu 6 tháng gần nhất (Bar Chart) ---
  const revenueCanvas = container.querySelector('#revenue-chart');
  const revenueEmpty = container.querySelector('#revenue-empty');

  // Hủy instance cũ nếu đã tồn tại
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
    revenueChartInstance = null;
  }

  // Cắt lấy tối đa 6 tháng gần nhất
  const allLabels = revenueChartData.labels || [];
  const allRevenue = revenueChartData.revenueData || [];
  const allCollection = revenueChartData.collectionData || [];

  const startIndex = Math.max(0, allLabels.length - 6);
  const labels = allLabels.slice(startIndex);
  const revenueData = allRevenue.slice(startIndex);
  const collectionData = allCollection.slice(startIndex);

  const hasRevenueData = labels.length > 0 && revenueData.some((val) => val > 0);

  if (!hasRevenueData) {
    revenueCanvas.classList.add('hidden');
    revenueEmpty.classList.remove('hidden');
  } else {
    revenueCanvas.classList.remove('hidden');
    revenueEmpty.classList.add('hidden');

    revenueChartInstance = new window.Chart(revenueCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu (Hóa đơn)',
            data: revenueData,
            backgroundColor: '#2563eb',
            borderRadius: 4,
          },
          {
            label: 'Thực thu (Đã trả)',
            data: collectionData,
            backgroundColor: '#16a34a',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString('vi-VN') + ' đ';
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }
}