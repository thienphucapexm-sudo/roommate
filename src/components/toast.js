/**
 * Hiển thị thông báo Toast góc màn hình bằng Bootstrap Toast
 * @param {string} message - Nội dung thông báo
 * @param {'success' | 'danger' | 'warning' | 'info'} type - Loại thông báo
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const bgClasses = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-info text-white'
  };

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center border-0 ${bgClasses[type] || bgClasses.info}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.setAttribute('data-testid', `toast-${type}`);

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  // Khởi tạo Bootstrap Toast instance
  const bsToast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
  bsToast.show();

  // Tự động xóa DOM node sau khi ẩn
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}