/**
 * Danh sách cấu hình 15 phân hệ ứng dụng RoomMate
 */
const NAV_ITEMS = [
  { page: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { page: 'rooms', label: 'Danh sách phòng', icon: 'bi-door-open' },
  { page: 'room-form', label: 'Form phòng', icon: 'bi-house-add' },
  { page: 'tenants', label: 'Danh sách người thuê', icon: 'bi-people' },
  { page: 'tenant-form', label: 'Form người thuê', icon: 'bi-person-plus' },
  { page: 'contracts', label: 'Danh sách hợp đồng', icon: 'bi-file-earmark-text' },
  { page: 'contract-form', label: 'Form hợp đồng', icon: 'bi-file-earmark-plus' },
  { page: 'utilities', label: 'Ghi chỉ số điện nước', icon: 'bi-lightning-charge' },
  { page: 'services', label: 'Danh sách dịch vụ', icon: 'bi-gear-wide-connected' },
  { page: 'invoices', label: 'Danh sách hóa đơn', icon: 'bi-receipt' },
  { page: 'invoice-detail', label: 'Chi tiết hóa đơn', icon: 'bi-receipt-cutoff' },
  { page: 'payments', label: 'Thanh toán', icon: 'bi-credit-card' },
  { page: 'debts', label: 'Công nợ', icon: 'bi-exclamation-triangle' },
  { page: 'reports', label: 'Báo cáo', icon: 'bi-bar-chart-line' },
  { page: 'settings', label: 'Cài đặt & Sao lưu', icon: 'bi-sliders' }
];

/**
 * Render Khung Layout chính gồm Sidebar, Header, Overlay và Main Content Area
 * @param {HTMLElement} containerElement
 */
export function renderLayout(containerElement) {
  const sidebarItemsHtml = NAV_ITEMS.map((item, index) => `
    <a 
      href="#${item.page}" 
      class="list-group-item list-group-item-action ${index === 0 ? 'active' : ''}" 
      data-page="${item.page}"
      data-testid="nav-${item.page}"
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
        <!-- Nội dung động của các màn hình sẽ render tại đây -->
      </main>
    </div>
  `;

  setupLayoutEvents();
}

/**
 * Đăng ký sự kiện toggle cho Sidebar trên giao diện Responsive
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
 * Cập nhật trạng thái Active của Menu Sidebar & Tiêu đề trang
 * @param {string} currentPage
 */
export function updateActiveNav(currentPage) {
  const navLinks = document.querySelectorAll('#sidebar-wrapper [data-page]');
  const pageTitle = document.getElementById('page-title');

  navLinks.forEach((link) => {
    const page = link.getAttribute('data-page');
    if (page === currentPage) {
      link.classList.add('active');
      const targetItem = NAV_ITEMS.find((item) => item.page === page);
      if (pageTitle && targetItem) {
        pageTitle.textContent = targetItem.label;
      }
    } else {
      link.classList.remove('active');
    }
  });

  // Tự động đóng Sidebar trên Mobile khi bấm chuyển trang
  document.body.classList.remove('sb-expanded');
}