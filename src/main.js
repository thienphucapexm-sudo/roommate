import './styles/main.css';
import './styles/dashboard.css';
import './styles/room.css';
import './styles/tenants.css';
import './styles/contracts.css';
import './styles/meter-readings.css';
import './styles/invoices.css';
import './styles/payments.css';
import './styles/debts.css';
import './styles/reports.css';
import './styles/settings.css';
import { renderLayout, updateActiveNav } from './components/layout.js';
import { Router } from './router.js';

/**
 * Khởi chạy ứng dụng RoomMate
 */
function initApp() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  // 1. Render bộ khung giao diện chính (Sidebar, Topbar, Main Content Area)
  renderLayout(appRoot);

  const mainContent = document.getElementById('main-content');

  // 2. Khởi tạo Hash Router
  const router = new Router({
    contentElement: mainContent,
    onRouteChanged: (currentHash) => {
      // Đồng bộ menu active trên Sidebar mỗi khi thay đổi route
      updateActiveNav(currentHash);
    }
  });

  // 3. Kích hoạt Router
  router.init();
}

// Chạy ứng dụng sau khi DOM đã load hoàn tất
document.addEventListener('DOMContentLoaded', initApp);
