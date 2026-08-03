/**
 * Hiển thị Hộp thoại xác nhận dùng chung
 * @param {Object} options
 * @param {string} options.title - Tiêu đề hộp thoại
 * @param {string} options.message - Nội dung xác nhận
 * @param {Function} options.onConfirm - Hàm callback xử lý khi người dùng bấm "Đồng ý"
 */
export function showConfirmDialog({ title, message, onConfirm }) {
  const modalEl = document.getElementById('global-confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const bodyEl = document.getElementById('confirm-modal-body');
  const btnAction = document.getElementById('confirm-modal-btn-action');

  if (!modalEl) return;

  if (titleEl) titleEl.textContent = title || 'Xác nhận';
  if (bodyEl) bodyEl.textContent = message || 'Bạn có chắc chắn muốn thực hiện thao tác này?';

  // Lấy hoặc tạo instance Bootstrap Modal
  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  // Xóa listener cũ trên nút Đồng ý để tránh lặp sự kiện
  const newBtnAction = btnAction.cloneNode(true);
  btnAction.parentNode.replaceChild(newBtnAction, btnAction);

  newBtnAction.addEventListener('click', () => {
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
    bsModal.hide();
  });

  bsModal.show();
}

// Giữ API đối tượng cho các trang đã dùng ConfirmDialog.show(...).
export const ConfirmDialog = {
  show: showConfirmDialog,
};
