import { reportService } from '../services/report-service.js';
import { createReportFiltersHtml } from '../components/report-filters.js';

// Lưu trữ instance của Chart.js để destroy trước khi render mới
let revenueVsCollectionChartInstance = null;
let utilityByRoomChartInstance = null;
let invoiceStatusChartInstance = null;

export function renderReportsPage(container) {
  // 1. Lấy dữ liệu báo cáo từ ReportService (không tính toán tại page)
  const revenueCollectionData = reportService.getRevenueVsCollectionChartData() || {
    labels: [],
    revenueData: [],
    collectionData: [],
  };
  const elecByRoomData = reportService.getElectricityByRoomChartData() || { labels: [], data: [] };
  const utilityData = reportService.getUtilityConsumptionChartData() || {
    labels: [],
    electricityData: [],
    waterData: [],
  };
  const invoiceStatusData = reportService.getInvoiceStatusChartData() || {
    labels: [],
    counts: [],
    percentages: [],
  };
  const paymentMethodData = reportService.getPaymentMethodChartData() || {
    labels: [],
    amounts: [],
    percentages: [],
  };

  // Danh sách các tháng có dữ liệu để nạp vào bộ lọc
  const availableMonths = [...new Set([...revenueCollectionData.labels, ...utilityData.labels])].sort();

  // 2. Render khung HTML giao diện
  const html = `
    <div class="reports-page" data-testid="reports-page">
      <div class="page-header">
        <h2>Báo cáo & Thống kê hệ thống</h2>
      </div>

      <!-- Khung Bộ lọc thời gian -->
      <div id="filters-wrapper">
        ${createReportFiltersHtml({ availableMonths })}
      </div>

      <div class="reports-grid">
        <!-- 1 & 2. Biểu đồ + Bảng: Doanh thu & Thực thu theo tháng -->
        <section class="report-section full-width" data-testid="section-revenue-collection">
          <div class="section-header">
            <h3>1 & 2. Doanh thu vs Thực thu theo tháng</h3>
          </div>
          <div class="chart-container">
            <canvas id="revenue-collection-chart" data-testid="revenue-collection-chart"></canvas>
            <div id="revenue-collection-empty" class="chart-empty hidden" data-testid="revenue-collection-empty">
              Không có dữ liệu doanh thu & thực thu.
            </div>
          </div>
          <div class="table-container">
            <table class="report-table" data-testid="table-revenue-collection">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Doanh thu hóa đơn (đ)</th>
                  <th>Tiền thực thu (đ)</th>
                  <th>Chênh lệch (Chưa thu)</th>
                </tr>
              </thead>
              <tbody id="body-revenue-collection">
                <!-- Data rendered dynamically -->
              </tbody>
            </table>
          </div>
        </section>

        <!-- 3, 4 & 5. Biểu đồ + Bảng: Công nợ, Điện & Nước tiêu thụ theo phòng -->
        <section class="report-section full-width" data-testid="section-room-metrics">
          <div class="section-header">
            <h3>3, 4 & 5. Tiêu thụ Điện & Nước theo phòng</h3>
          </div>
          <div class="chart-container">
            <canvas id="utility-room-chart" data-testid="utility-room-chart"></canvas>
            <div id="utility-room-empty" class="chart-empty hidden" data-testid="utility-room-empty">
              Không có dữ liệu điện nước theo phòng.
            </div>
          </div>
          <div class="table-container">
            <table class="report-table" data-testid="table-utility-room">
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Điện tiêu thụ (kWh)</th>
                </tr>
              </thead>
              <tbody id="body-utility-room">
                <!-- Data rendered dynamically -->
              </tbody>
            </table>
          </div>
        </section>

        <!-- 6. Biểu đồ + Bảng: Trạng thái hóa đơn -->
        <section class="report-section half-width" data-testid="section-invoice-status">
          <div class="section-header">
            <h3>6. Trạng thái hóa đơn</h3>
          </div>
          <div class="chart-container doughnut-container">
            <canvas id="invoice-status-chart" data-testid="invoice-status-chart"></canvas>
            <div id="invoice-status-empty" class="chart-empty hidden" data-testid="invoice-status-empty">
              Không có dữ liệu trạng thái hóa đơn.
            </div>
          </div>
          <div class="table-container">
            <table class="report-table" data-testid="table-invoice-status">
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th>Số lượng</th>
                  <th>Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody id="body-invoice-status">
                <!-- Data rendered dynamically -->
              </tbody>
            </table>
          </div>
        </section>

        <!-- 7. Bảng: Thanh toán theo phương thức -->
        <section class="report-section half-width" data-testid="section-payment-method">
          <div class="section-header">
            <h3>7. Thanh toán theo phương thức</h3>
          </div>
          <div class="table-container">
            <table class="report-table" data-testid="table-payment-method">
              <thead>
                <tr>
                  <th>Phương thức</th>
                  <th>Tổng tiền (đ)</th>
                  <th>Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody id="body-payment-method">
                <!-- Data rendered dynamically -->
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // 3. Quản lý trạng thái lọc và render dữ liệu/biểu đồ
  let currentMonthFilter = '';

  function renderAll() {
    // Lọc dữ liệu theo tháng nếu người dùng chọn
    let filteredRevenueLabels = revenueCollectionData.labels;
    let filteredRevenueData = revenueCollectionData.revenueData;
    let filteredCollectionData = revenueCollectionData.collectionData;

    if (currentMonthFilter) {
      const indices = [];
      filteredRevenueLabels.forEach((label, idx) => {
        if (label === currentMonthFilter) indices.push(idx);
      });

      filteredRevenueLabels = indices.map((i) => revenueCollectionData.labels[i]);
      filteredRevenueData = indices.map((i) => revenueCollectionData.revenueData[i]);
      filteredCollectionData = indices.map((i) => revenueCollectionData.collectionData[i]);
    }

    // Render Tables
    renderTableRevenueCollection(container, filteredRevenueLabels, filteredRevenueData, filteredCollectionData);
    renderTableUtilityRoom(container, elecByRoomData);
    renderTableInvoiceStatus(container, invoiceStatusData);
    renderTablePaymentMethod(container, paymentMethodData);

    // Render Charts
    renderRevenueCollectionChart(container, filteredRevenueLabels, filteredRevenueData, filteredCollectionData);
    renderUtilityRoomChart(container, elecByRoomData);
    renderInvoiceStatusChart(container, invoiceStatusData);
  }

  // Bind Events
  const selectMonth = container.querySelector('#report-filter-month');
  const btnReset = container.querySelector('#btn-reset-report-filters');

  if (selectMonth) {
    selectMonth.addEventListener('change', (e) => {
      currentMonthFilter = e.target.value;
      renderAll();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentMonthFilter = '';
      if (selectMonth) selectMonth.value = '';
      renderAll();
    });
  }

  // Khởi tạo render ban đầu
  renderAll();
}

/* ==========================================================================
   CÁC HÀM RENDER BẢNG DỮ LIỆU & XỬ LÝ DỮ LIỆU RỖNG
   ========================================================================== */

function renderTableRevenueCollection(container, labels, revenue, collection) {
  const tbody = container.querySelector('#body-revenue-collection');
  if (!tbody) return;

  if (!labels || labels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center empty-msg" data-testid="empty-revenue">Không có dữ liệu doanh thu.</td></tr>`;
    return;
  }

  tbody.innerHTML = labels
    .map((month, idx) => {
      const rev = revenue[idx] || 0;
      const col = collection[idx] || 0;
      const diff = rev - col;
      return `
        <tr>
          <td>${month}</td>
          <td>${rev.toLocaleString('vi-VN')} đ</td>
          <td class="text-success">${col.toLocaleString('vi-VN')} đ</td>
          <td class="${diff > 0 ? 'text-danger' : ''}">${diff.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    })
    .join('');
}

function renderTableUtilityRoom(container, elecData) {
  const tbody = container.querySelector('#body-utility-room');
  if (!tbody) return;

  if (!elecData.labels || elecData.labels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center empty-msg" data-testid="empty-utility">Không có dữ liệu điện nước theo phòng.</td></tr>`;
    return;
  }

  tbody.innerHTML = elecData.labels
    .map((roomName, idx) => {
      const usage = elecData.data[idx] || 0;
      return `
        <tr>
          <td class="font-bold">${roomName}</td>
          <td>${usage.toLocaleString('vi-VN')} kWh</td>
        </tr>
      `;
    })
    .join('');
}

function renderTableInvoiceStatus(container, statusData) {
  const tbody = container.querySelector('#body-invoice-status');
  if (!tbody) return;

  if (!statusData.labels || statusData.labels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center empty-msg" data-testid="empty-invoice-status">Không có dữ liệu trạng thái hóa đơn.</td></tr>`;
    return;
  }

  tbody.innerHTML = statusData.labels
    .map((status, idx) => {
      const count = statusData.counts[idx] || 0;
      const pct = statusData.percentages[idx] || 0;
      return `
        <tr>
          <td><span class="badge-status">${status}</span></td>
          <td>${count}</td>
          <td>${pct}%</td>
        </tr>
      `;
    })
    .join('');
}

function renderTablePaymentMethod(container, paymentData) {
  const tbody = container.querySelector('#body-payment-method');
  if (!tbody) return;

  if (!paymentData.labels || paymentData.labels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center empty-msg" data-testid="empty-payment-method">Không có dữ liệu thanh toán.</td></tr>`;
    return;
  }

  tbody.innerHTML = paymentData.labels
    .map((method, idx) => {
      const amt = paymentData.amounts[idx] || 0;
      const pct = paymentData.percentages[idx] || 0;
      return `
        <tr>
          <td class="font-bold">${method}</td>
          <td class="text-success">${amt.toLocaleString('vi-VN')} đ</td>
          <td>${pct}%</td>
        </tr>
      `;
    })
    .join('');
}

/* ==========================================================================
   CÁC HÀM RENDER BIỂU ĐỒ CHART.JS (HỦY INSTANCE CŨ TRƯỚC KHỊ VẼ MỚI)
   ========================================================================== */

function renderRevenueCollectionChart(container, labels, revenue, collection) {
  const canvas = container.querySelector('#revenue-collection-chart');
  const emptyEl = container.querySelector('#revenue-collection-empty');

  if (revenueVsCollectionChartInstance) {
    revenueVsCollectionChartInstance.destroy();
    revenueVsCollectionChartInstance = null;
  }

  const hasData = labels && labels.length > 0 && (revenue.some((v) => v > 0) || collection.some((v) => v > 0));

  if (!hasData || typeof window.Chart === 'undefined') {
    canvas.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  revenueVsCollectionChartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Doanh thu (Hóa đơn)',
          data: revenue,
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
        {
          label: 'Thực thu (Tiền về)',
          data: collection,
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
            callback: (val) => val.toLocaleString('vi-VN') + ' đ',
          },
        },
      },
    },
  });
}

function renderUtilityRoomChart(container, elecData) {
  const canvas = container.querySelector('#utility-room-chart');
  const emptyEl = container.querySelector('#utility-room-empty');

  if (utilityByRoomChartInstance) {
    utilityByRoomChartInstance.destroy();
    utilityByRoomChartInstance = null;
  }

  const hasData = elecData.labels && elecData.labels.length > 0 && elecData.data.some((v) => v > 0);

  if (!hasData || typeof window.Chart === 'undefined') {
    canvas.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  utilityByRoomChartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: elecData.labels,
      datasets: [
        {
          label: 'Điện tiêu thụ (kWh)',
          data: elecData.data,
          backgroundColor: '#0284c7',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Biểu đồ cột ngang
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    },
  });
}

function renderInvoiceStatusChart(container, statusData) {
  const canvas = container.querySelector('#invoice-status-chart');
  const emptyEl = container.querySelector('#invoice-status-empty');

  if (invoiceStatusChartInstance) {
    invoiceStatusChartInstance.destroy();
    invoiceStatusChartInstance = null;
  }

  const hasData = statusData.labels && statusData.labels.length > 0 && statusData.counts.some((v) => v > 0);

  if (!hasData || typeof window.Chart === 'undefined') {
    canvas.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  invoiceStatusChartInstance = new window.Chart(canvas, {
    type: 'pie',
    data: {
      labels: statusData.labels,
      datasets: [
        {
          data: statusData.counts,
          backgroundColor: ['#16a34a', '#f59e0b', '#dc2626', '#6b7280'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
      },
    },
  });
}