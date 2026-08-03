import './styles/main.css';
import { renderLayout, updateActiveNav } from './components/layout.js';

/**
 * Màn hình Mặc định (Dashboard)
 * @param {HTMLElement} container
 */
function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="container-fluid" data-testid="dashboard-page">
      <div class="card border-0 shadow-sm">
        <div class="card-body p-4">
          <h3 class="card-title text-primary mb-3">Dashboard</h3>
          <p class="card-text text-muted">Chào mừng bạn đến với hệ thống quản lý nhà trọ RoomMate.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Màn hình Placeholders cho các phân hệ khác (khi chưa phát triển chi tiết)
 * @param {HTMLElement} container
 * @param {string} pageKey
 */
function renderPlaceholderPage(container, pageKey) {
  container.innerHTML = `
    <div class="container-fluid" data-testid="page-${pageKey}">
      <div class="card border-0 shadow-sm">
        <div class="card-body p-4">
          <h4 class="card-title text-capitalize mb-2">${pageKey.replace('-', ' ')}</h4>
          <p class="text-muted m-0">Nội dung màn hình đang được phát triển...</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Bộ điều hướng Hash Router đơn giản
 */
function handleRouting() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Lấy tên route từ hash (Mặc định là 'dashboard')
  const hash = window.location.hash.replace('#', '') || 'dashboard';

  updateActiveNav(hash);

  if (hash === 'dashboard') {
    renderDashboardPage(mainContent);
  } else {
    renderPlaceholderPage(mainContent, hash);
  }
}

/**
 * Khởi chạy ứng dụng
 */
function initApp() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  // 1. Render bộ khung Layout
  renderLayout(appRoot);

  // 2. Lắng nghe sự kiện đổi Hash URL
  window.addEventListener('hashchange', handleRouting);

  // 3. Tải route lần đầu tiên
  handleRouting();
}

// Khởi tạo app khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initApp);