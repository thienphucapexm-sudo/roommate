/**
 * Danh sách các collection bắt buộc phải có trong file backup
 */
export const REQUIRED_COLLECTIONS = [
  'rooms',
  'tenants',
  'contracts',
  'invoices',
  'utilityReadings',
  'services',
];

/**
 * Kiểm tra tính hợp lệ của dữ liệu backup JSON
 * @param {any} data - Dữ liệu JSON đã parse
 * @returns {{ isValid: boolean, errors: string[] }} Kết quả validation và danh sách lỗi
 */
export function validateImportData(data) {
  const errors = [];

  // 1. Kiểm tra đối tượng rỗng hoặc không phải object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Dữ liệu import phải là một đối tượng JSON hợp lệ.'],
    };
  }

  // 2. Kiểm tra sự tồn tại và định dạng mảng của các collection bắt buộc
  for (const collectionName of REQUIRED_COLLECTIONS) {
    if (!(collectionName in data)) {
      errors.push(`Thiếu collection bắt buộc: "${collectionName}".`);
    } else if (!Array.isArray(data[collectionName])) {
      errors.push(`Collection "${collectionName}" phải là một mảng (Array).`);
    }
  }

  // 3. Kiểm tra định dạng cơ bản của từng bản ghi trong collection nếu có
  if (errors.length === 0) {
    REQUIRED_COLLECTIONS.forEach((collectionName) => {
      const items = data[collectionName];
      items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push(
            `Phần tử thứ ${index + 1} trong collection "${collectionName}" không phải đối tượng hợp lệ.`
          );
        }
      });
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}