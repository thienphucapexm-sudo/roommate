/**
 * Tạo ID chuỗi duy nhất dựa trên Crypto API (UUID v4) hoặc timestamp kèm random fallback
 * @returns {string} ID chuỗi duy nhất
 */
export function generateUniqueId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}