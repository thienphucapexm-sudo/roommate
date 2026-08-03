/**
 * Render bộ lọc thời gian cho trang báo cáo
 * @param {Object} options
 * @param {string} [options.selectedMonth] - Tháng được chọn (dạng YYYY-MM)
 * @param {Array<string>} [options.availableMonths=[]] - Danh sách các tháng có sẵn
 * @returns {string} Chuỗi HTML của bộ lọc
 */
export function createReportFiltersHtml({ selectedMonth = '', availableMonths = [] } = {}) {
  return `
    <div class="report-filters-card" data-testid="report-filters">
      <div class="filter-group">
        <label for="report-filter-month">Chọn tháng báo cáo:</label>
        <select id="report-filter-month" class="filter-select" data-testid="report-filter-month">
          <option value="">-- Tất cả thời gian --</option>
          ${availableMonths
            .map(
              (m) => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>Tháng ${m}</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="filter-actions">
        <button type="button" id="btn-reset-report-filters" class="btn btn-secondary" data-testid="btn-reset-report-filters">
          Xóa lọc
        </button>
      </div>
    </div>
  `;
}