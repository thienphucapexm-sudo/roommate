/**
 * Render một thẻ chỉ số thống kê (Stat Card)
 * @param {Object} options
 * @param {string} options.title - Tiêu đề chỉ số
 * @param {string|number} options.value - Giá trị chỉ số
 * @param {string} [options.subText] - Văn bản phụ chú giải
 * @param {string} [options.variant='default'] - Variant màu sắc ('default', 'primary', 'success', 'warning', 'danger', 'info')
 * @param {string} [options.testId] - Attribute data-testid cho testing
 * @returns {string} Chuỗi HTML của thẻ
 */
export function createStatCardHtml({ title, value, subText = '', variant = 'default', testId = '' }) {
  const testAttr = testId ? `data-testid="${testId}"` : '';

  return `
    <div class="stat-card stat-card-${variant}" ${testAttr}>
      <div class="stat-card-body">
        <span class="stat-card-title">${title}</span>
        <h3 class="stat-card-value" ${testId ? `data-testid="${testId}-value"` : ''}>
          ${value !== undefined && value !== null ? value : '---'}
        </h3>
        ${subText ? `<p class="stat-card-subtext">${subText}</p>` : ''}
      </div>
    </div>
  `;
}