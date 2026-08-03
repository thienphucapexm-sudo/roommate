import { backupService } from '../services/backup-service.js';
import { seedService } from '../services/seed-service.js';

export function renderSettingsPage(container) {
  let selectedFile = null;
  let parsedJsonData = null;

  function render() {
    // Lấy thống kê số lượng bản ghi hiện tại từ BackupService
    const currentData = backupService.exportData();

    container.innerHTML = `
      <div class="settings-page" data-testid="settings-page">
        <div class="page-header">
          <h2>Cài đặt & Quản lý dữ liệu hệ thống</h2>
        </div>

        <div class="settings-grid">
          <!-- 1. Thống kê số lượng bản ghi theo Collection -->
          <section class="settings-card" data-testid="section-data-stats">
            <div class="card-header">
              <h3>Thống kê dữ liệu hiện tại</h3>
            </div>
            <div class="card-body">
              <div class="stats-list" data-testid="stats-collection-list">
                <div class="stat-row">
                  <span>Phòng (Rooms):</span>
                  <strong data-testid="stat-count-rooms">${currentData.rooms?.length || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Khách thuê (Tenants):</span>
                  <strong data-testid="stat-count-tenants">${currentData.tenants?.length || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Hợp đồng (Contracts):</span>
                  <strong data-testid="stat-count-contracts">${currentData.contracts?.length || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Hóa đơn (Invoices):</span>
                  <strong data-testid="stat-count-invoices">${currentData.invoices?.length || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Chỉ số điện nước (UtilityReadings):</span>
                  <strong data-testid="stat-count-utilityReadings">${currentData.utilityReadings?.length || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Dịch vụ (Services):</span>
                  <strong data-testid="stat-count-services">${currentData.services?.length || 0}</strong>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. Export Dữ liệu JSON -->
          <section class="settings-card" data-testid="section-export-data">
            <div class="card-header">
              <h3>Xuất dữ liệu (Export)</h3>
            </div>
            <div class="card-body">
              <p class="description">
                Tải xuống toàn bộ dữ liệu của hệ thống dưới dạng file file sao lưu định dạng JSON.
              </p>
              <button type="button" id="btn-export-json" class="btn btn-primary" data-testid="btn-export-json">
                Tải xuống tập tin JSON
              </button>
            </div>
          </section>

          <!-- 3. Import Dữ liệu JSON -->
          <section class="settings-card full-width" data-testid="section-import-data">
            <div class="card-header">
              <h3>Nhập dữ liệu (Import JSON)</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label for="input-file-json">Chọn tập tin backup JSON:</label>
                <input
                  type="file"
                  id="input-file-json"
                  accept=".json,application/json"
                  class="file-input"
                  data-testid="input-file-json"
                />
              </div>

              <!-- Xem trước thông tin file đã chọn -->
              <div id="file-info-preview" class="file-preview hidden" data-testid="file-info-preview">
                <!-- Inner HTML injected via JS -->
              </div>

              <!-- Cảnh báo / Lỗi Validation -->
              <div id="import-validation-msg" class="validation-box hidden" data-testid="import-validation-msg"></div>

              <div class="form-actions hidden" id="import-actions-wrapper">
                <button type="button" id="btn-import-overwrite" class="btn btn-danger" data-testid="btn-import-overwrite">
                  Ghi đè dữ liệu (Có sao lưu)
                </button>
                <button type="button" id="btn-import-merge" class="btn btn-secondary" data-testid="btn-import-merge">
                  Gộp vào dữ liệu cũ
                </button>
              </div>
            </div>
          </section>

          <!-- 4. Quản lý Dữ liệu Mẫu & Thao tác Nguy hiểm -->
          <section class="settings-card full-width danger-zone" data-testid="section-danger-zone">
            <div class="card-header danger-header">
              <h3>Cấu hình nâng cao & Thao tác nguy hiểm</h3>
            </div>
            <div class="card-body danger-body">
              <div class="danger-action-item">
                <div>
                  <strong>Tạo / Khôi phục dữ liệu mẫu (Seed Data)</strong>
                  <p class="description">Nạp lại bộ dữ liệu mẫu mặc định ban đầu để thử nghiệm hệ thống.</p>
                </div>
                <button type="button" id="btn-restore-seed" class="btn btn-warning" data-testid="btn-restore-seed">
                  Khôi phục Seed Data
                </button>
              </div>

              <hr class="divider" />

              <div class="danger-action-item">
                <div>
                  <strong class="text-danger">Xóa toàn bộ dữ liệu hệ thống</strong>
                  <p class="description">Xóa vĩnh viễn tất cả danh mục phòng, hợp đồng, hóa đơn... Hành động này không thể hoàn tác!</p>
                </div>
                <button type="button" id="btn-reset-all" class="btn btn-danger-dark" data-testid="btn-reset-all">
                  Xóa sạch toàn bộ dữ liệu
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // 1. Export JSON
    const btnExport = container.querySelector('#btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        backupService.downloadBackup();
      });
    }

    // 2. Chọn File & Read/Validate
    const fileInput = container.querySelector('#input-file-json');
    const filePreview = container.querySelector('#file-info-preview');
    const valBox = container.querySelector('#import-validation-msg');
    const actionsWrapper = container.querySelector('#import-actions-wrapper');

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
          selectedFile = null;
          parsedJsonData = null;
          filePreview.classList.add('hidden');
          valBox.classList.add('hidden');
          actionsWrapper.classList.add('hidden');
          return;
        }

        selectedFile = file;

        try {
          // Sử dụng BackupService để đọc file
          parsedJsonData = await backupService.readJsonFile(file);

          // Hiển thị thông tin file
          filePreview.innerHTML = `
            <div class="file-details">
              <strong>Tên file:</strong> ${file.name} | 
              <strong>Kích thước:</strong> ${(file.size / 1024).toFixed(2)} KB | 
              <strong>Lần cuối sửa:</strong> ${new Date(file.lastModified).toLocaleString('vi-VN')}
            </div>
          `;
          filePreview.classList.remove('hidden');

          // Validate thông qua BackupService
          const validation = backupService.validateBackupData(parsedJsonData);

          if (validation.isValid) {
            valBox.className = 'validation-box success-box';
            valBox.innerHTML = '✔ File hợp lệ và sẵn sàng để nhập dữ liệu.';
            valBox.classList.remove('hidden');
            actionsWrapper.classList.remove('hidden');
          } else {
            valBox.className = 'validation-box error-box';
            valBox.innerHTML = `
              <strong>Không thể import file do có lỗi cấu trúc:</strong>
              <ul>
                ${validation.errors.map((err) => `<li>${err}</li>`).join('')}
              </ul>
            `;
            valBox.classList.remove('hidden');
            actionsWrapper.classList.add('hidden');
          }
        } catch (err) {
          valBox.className = 'validation-box error-box';
          valBox.innerHTML = `<strong>Lỗi:</strong> ${err.message}`;
          valBox.classList.remove('hidden');
          actionsWrapper.classList.add('hidden');
        }
      });
    }

    // 3. Import Mode: Overwrite (Ghi đè)
    const btnOverwrite = container.querySelector('#btn-import-overwrite');
    if (btnOverwrite) {
      btnOverwrite.addEventListener('click', () => {
        if (!parsedJsonData) return;

        const confirmOverwrite = window.confirm(
          'CẢNH BÁO: Thao tác này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng dữ liệu mới từ file JSON!\n' +
            'Hệ thống sẽ tự động tạo một bản sao lưu dữ liệu cũ trước khi thực hiện.\n\nBạn có chắc chắn muốn tiếp tục?'
        );

        if (confirmOverwrite) {
          const res = backupService.importData(parsedJsonData, { mode: 'overwrite' });
          if (res.success) {
            alert('Nhập dữ liệu thành công!');
            render(); // Render lại trang để cập nhật số liệu
          } else {
            alert(`Nhập dữ liệu thất bại: ${res.errors.join('; ')}`);
          }
        }
      });
    }

    // 4. Import Mode: Merge (Gộp)
    const btnMerge = container.querySelector('#btn-import-merge');
    if (btnMerge) {
      btnMerge.addEventListener('click', () => {
        if (!parsedJsonData) return;

        const res = backupService.importData(parsedJsonData, { mode: 'merge' });
        if (res.success) {
          alert('Gộp dữ liệu thành công!');
          render();
        } else {
          alert(`Gộp dữ liệu thất bại: ${res.errors.join('; ')}`);
        }
      });
    }

    // 5. Khôi phục Seed Data
    const btnSeed = container.querySelector('#btn-restore-seed');
    if (btnSeed) {
      btnSeed.addEventListener('click', () => {
        const confirmSeed = window.confirm(
          'XÁC NHẬN: Bạn có chắc chắn muốn khôi phục dữ liệu mẫu ban đầu không? Dữ liệu hiện tại sẽ bị xóa sạch.'
        );

        if (confirmSeed) {
          if (typeof seedService?.getSeedData === 'function') {
            const seedData = seedService.getSeedData();
            backupService.restoreSeedData(seedData);
          } else if (typeof seedService?.initSeedData === 'function') {
            seedService.initSeedData();
          }
          alert('Đã khôi phục dữ liệu mẫu thành công!');
          render();
        }
      });
    }

    // 6. Xóa sạch toàn bộ dữ liệu
    const btnReset = container.querySelector('#btn-reset-all');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const firstConfirm = window.confirm(
          'NGUY HIỂM: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu hệ thống không?'
        );

        if (firstConfirm) {
          const secondConfirm = window.prompt(
            'Để xác nhận hành động này, vui lòng gõ "DELETE" vào ô bên dưới:'
          );

          if (secondConfirm === 'DELETE') {
            backupService.resetAllData();
            alert('Đã xóa toàn bộ dữ liệu hệ thống.');
            render();
          } else {
            alert('Mã xác nhận không chính xác. Thao tác xóa đã bị hủy.');
          }
        }
      });
    }
  }

  // Khởi chạy render ban đầu
  render();
}