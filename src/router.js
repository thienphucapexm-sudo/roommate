/**
 * Định nghĩa danh sách đường dẫn Hash Route và dynamic import cho từng Page module
 */
const routes = {
  '#/dashboard': () => import('./pages/dashboard-page.js'),
  '#/rooms': () => import('./pages/rooms-page.js'),
  '#/tenants': () => import('./pages/tenants-page.js'),
  '#/contracts': () => import('./pages/contracts-page.js'),
  '#/meters': () => import('./pages/meter-readings-page.js'),
  '#/services': () => import('./pages/services-page.js'),
  '#/invoices': () => import('./pages/invoices-page.js'),
  '#/payments': () => import('./pages/payments-page.js'),
  '#/debts': () => import('./pages/debts-page.js'),
  '#/reports': () => import('./pages/reports-page.js'),
  '#/settings': () => import('./pages/settings-page.js'),
};

/**
 * Render giao diện trang 404 Not Found
 * @param {HTMLElement} container 
 */
function renderNotFoundPage(container) {
  container.innerHTML = `
    <div class="container-fluid" data-testid="page-404">
      <div class="card border-0 shadow-sm text-center py-5">
        <div class="card-body">
          <h1 class="display-1 text-secondary font-weight-bold">404</h1>
          <h3 class="card-title text-dark">Không tìm thấy trang</h3>
          <p class="card-text text-muted mb-4">Đường dẫn bạn truy cập không tồn tại hoặc đã bị dời đi.</p>
          <a href="#/dashboard" class="btn btn-primary" data-testid="btn-back-home">
            <i class="bi bi-house-door me-1"></i> Quay về Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Lớp Router điều hướng ứng dụng Single Page
 */
export class Router {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.contentElement - Container hiển thị nội dung trang
   * @param {Function} options.onRouteChanged - Callback chạy sau khi chuyển trang thành công
   */
  constructor({ contentElement, onRouteChanged }) {
    this.contentElement = contentElement;
    this.onRouteChanged = onRouteChanged;
  }

  /**
   * Khởi tạo Router và lắng nghe sự kiện hashchange
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Nếu chưa có Hash URL hoặc là #/, tự động điều hướng về #/dashboard
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/dashboard';
      return;
    }

    this.handleRoute();
  }

  /**
   * Xử lý khớp route và render page tương ứng
   */
  async handleRoute() {
    const currentHash = window.location.hash || '#/dashboard';
    const routeLoader = routes[currentHash];

    if (!routeLoader) {
      renderNotFoundPage(this.contentElement);
      if (typeof this.onRouteChanged === 'function') {
        this.onRouteChanged('404');
      }
      return;
    }

    try {
      // Dynamic import module trang tương ứng
      const module = await routeLoader();

      // Linh hoạt lấy hàm render (renderPage hoặc render[PageName]Page)
      const renderFn =
        module.renderPage ||
        module.renderDashboardPage ||
        module.renderRoomsPage ||
        module.renderTenantsPage ||
        module.renderContractsPage ||
        module.renderMeterReadingsPage ||
        module.renderServicesPage ||
        module.renderInvoicesPage ||
        module.renderPaymentsPage ||
        module.renderDebtsPage ||
        module.renderReportsPage ||
        module.renderSettingsPage ||
        module.default;

      if (typeof renderFn === 'function') {
        this.contentElement.innerHTML = ''; // Dọn dẹp container trước khi render mới
        renderFn(this.contentElement);
      } else {
        console.error(`Không tìm thấy hàm render hợp lệ trong module [${currentHash}]`);
        renderNotFoundPage(this.contentElement);
      }

      if (typeof this.onRouteChanged === 'function') {
        this.onRouteChanged(currentHash);
      }
    } catch (error) {
      console.error(`Lỗi khi tải trang [${currentHash}]:`, error);
      renderNotFoundPage(this.contentElement);
    }
  }
}