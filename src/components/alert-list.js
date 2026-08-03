/**
 * Render danh sách các cảnh báo (Alert List)
 * @param {Array<{ id: string, type: string, message: string, detail?: string, link?: string }>} alerts
 * @returns {string} Chuỗi HTML danh sách cảnh báo
 */
export function createAlertListHtml(alerts = []) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return `
      <div class="alert-list-empty" data-testid="alert-list-empty">
        <p>Không có cảnh báo nào cần xử lý.</p>
      </div>
    `;
  }

  return `
    <div class="alert-list" data-testid="alert-list">
      ${alerts
        .map((alert) => {
          const typeClass = alert.type ? `alert-item-${alert.type}` : 'alert-item-warning';
          return `
            <div class="alert-item ${typeClass}" data-testid="alert-item-${alert.id || 'info'}">
              <div class="alert-content">
                <span class="alert-message">${alert.message}</span>
                ${alert.detail ? `<span class="alert-detail">${alert.detail}</span>` : ''}
              </div>
              ${
                alert.link
                  ? `<a href="${alert.link}" class="alert-action-link" data-testid="alert-link-${alert.id}">Xem</a>`
                  : ''
              }
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}