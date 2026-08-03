/**
 * Danh sách cấu hình 11 đường dẫn menu chính ứng dụng RoomMate
 */
const NAV_ITEMS = [
  { hash: '#/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { hash: '#/rooms', label: 'Danh sách phòng', icon: 'bi-door-open' },
  { hash: '#/tenants', label: 'Danh sách người thuê', icon: 'bi-people' },
  { hash: '#/contracts', label: 'Danh sách hợp đồng', icon: 'bi-file-earmark-text' },
  { hash: '#/meters', label: 'Ghi chỉ số điện nước', icon: 'bi-lightning-charge' },
  { hash: '#/services', label: 'Danh sách dịch vụ', icon: 'bi-gear-wide-connected' },
  { hash: '#/invoices', label: 'Danh sách hóa đơn', icon: 'bi-receipt' },
  { hash: '#/payments', label: 'Thanh toán', icon: 'bi-credit-card' },
  { hash: '#/debts', label: 'Công nợ', icon: 'bi-exclamation-triangle' },
  { hash: '#/reports', label: 'Báo cáo', icon: 'bi-bar-chart-line' },
  { hash: '#/settings', label: 'Cài đặt & Sao lưu', icon: 'bi-sliders' }
];

/**
 * Render Khung Layout chính bao gồm Sidebar, Header và Main Content Container
 * @param {HTMLElement} containerElement
 */
export function renderLayout(containerElement) {
  const sidebarItemsHtml = NAV_ITEMS.map((item) => `
    <a 
      href="${item.hash}" 
      class="list-group-item list-group-item-action" 
      data-hash="${item.hash}"
      data-testid="nav-${item.hash.replace('#/', '')}"
    >
      <i class="bi ${item.icon} me-2"></i>${item.label}
    </a>
  `).join('');

  containerElement.innerHTML = `
    <!-- Overlay dùng cho màn hình Mobile -->
    <div id="sidebar-overlay" data-testid="sidebar-overlay"></div>

    <!-- Sidebar Wrapper -->
    <div id="sidebar-wrapper" data-testid="sidebar">
      <div class="sidebar-heading text-white">
        <i class="bi bi-building me-2 text-primary"></i>RoomMate
      </div>
      <div class="list-group list-group-flush overflow-y-auto" style="max-height: calc(100vh - var(--header-height));">
        ${sidebarItemsHtml}
      </div>
    </div>

    <!-- Page Content Wrapper -->
    <div id="page-content-wrapper">
      <!-- Top Navigation Header -->
      <nav class="navbar top-navbar d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <button class="btn btn-outline-secondary d-lg-none me-3" id="sidebar-toggle" data-testid="sidebar-toggle">
            <i class="bi bi-list"></i>
          </button>
          <h5 class="m-0 font-weight-bold" id="page-title" data-testid="page-title">Dashboard</h5>
        </div>
        <div class="d-flex align-items-center">
          <span class="text-muted small me-2"><i class="bi bi-house-door me-1"></i>Nhà trọ Demo</span>
        </div>
      </nav>

      <!-- Main Content Container -->
      <main id="main-content" data-testid="main-content">
        <!-- Nội dung sẽ được Router render vào đây -->
      </main>
    </div>
  `;

  setupLayoutEvents();
}

/**
 * Đăng ký các sự kiện tương tác của Layout (Toggle Mobile Sidebar)
 */
function setupLayoutEvents() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');

  const toggleSidebar = () => {
    document.body.classList.toggle('sb-expanded');
  };

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);
}

/**
 * Cập nhật trạng thái Active trên Sidebar Menu & Tiêu đề trang theo Hash hiện tại
 * @param {string} currentHash - Hash URL hiện tại (Ví dụ: '#/rooms')
 */
export function updateActiveNav(currentHash) {
  const navLinks = document.querySelectorAll('#sidebar-wrapper [data-hash]');
  const pageTitle = document.getElementById('page-title');

  let matchedItem = null;

  navLinks.forEach((link) => {
    const hash = link.getAttribute('data-hash');
    if (hash === currentHash) {
      link.classList.add('active');
      matchedItem = NAV_ITEMS.find((item) => item.hash === hash);
    } else {
      link.classList.remove('active');
    }
  });

  if (pageTitle) {
    if (matchedItem) {
      pageTitle.textContent = matchedItem.label;
    } else if (currentHash === '404') {
      pageTitle.textContent = '404 Not Found';
    }
  }

  // Tự động đóng Sidebar khi chuyển trang trên thiết bị di động
  document.body.classList.remove('sb-expanded');
}