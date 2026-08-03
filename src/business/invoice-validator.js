import { 
  calculateSubtotal, 
  calculateDiscount, 
  determineInvoiceStatus 
} from './invoice-calculator.js';

/**
 * Kiểm tra tính hợp lệ toàn diện của một đối tượng Hóa đơn (Invoice)
 * @param {Object} invoice - Đối tượng hóa đơn cần kiểm tra
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateInvoice(invoice) {
  const errors = [];

  if (!invoice || typeof invoice !== 'object') {
    return {
      isValid: false,
      errors: ['Dữ liệu hóa đơn không hợp lệ hoặc bị trống.']
    };
  }

  // 1. Kiểm tra các thông tin định danh bắt buộc
  if (!invoice.roomId && invoice.roomId !== 0) {
    errors.push('Phòng không được để trống.');
  }

  if (!invoice.month) {
    errors.push('Tháng hóa đơn không được để trống.');
  } else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(invoice.month))) {
    errors.push('Tháng hóa đơn phải có định dạng YYYY-MM.');
  }

  // 2. Kiểm tra danh sách khoản mục (items)
  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('Hóa đơn phải chứa ít nhất một khoản mục chi tiết.');
  } else {
    invoice.items.forEach((item, index) => {
      if (!item.name || String(item.name).trim() === '') {
        errors.push(`Khoản mục thứ ${index + 1} thiếu tên chi tiết.`);
      }

      const amount = Number(item.amount);
      if (isNaN(amount)) {
        errors.push(`Số tiền của khoản mục "${item.name || index + 1}" phải là số.`);
      } else if (amount < 0) {
        errors.push(`Số tiền của khoản mục "${item.name || index + 1}" không được là số âm.`);
      }
    });
  }

  // 3. Kiểm tra số tiền giảm giá
  let subtotal = 0;
  try {
    subtotal = calculateSubtotal(invoice.items || []);
  } catch (err) {
    // Lỗi đã được ghi nhận trong phần kiểm tra items
  }

  const discount = Number(invoice.discount ?? 0);
  if (isNaN(discount)) {
    errors.push('Số tiền giảm giá phải là số.');
  } else if (discount < 0) {
    errors.push('Số tiền giảm giá không được là số âm.');
  } else if (discount > subtotal) {
    errors.push('Số tiền giảm giá không được lớn hơn tổng tạm tính.');
  }

  // 4. Kiểm tra số tiền đã thanh toán
  const paidAmount = Number(invoice.paidAmount ?? 0);
  if (isNaN(paidAmount)) {
    errors.push('Số tiền đã thanh toán phải là số.');
  } else if (paidAmount < 0) {
    errors.push('Số tiền đã thanh toán không được là số âm.');
  }

  // 5. Kiểm tra tổng tiền hóa đơn (nếu được khai báo sẵn)
  const expectedTotal = subtotal - (isNaN(discount) ? 0 : discount);
  if (invoice.total !== undefined && invoice.total !== null) {
    const total = Number(invoice.total);
    if (isNaN(total)) {
      errors.push('Tổng tiền hóa đơn phải là số.');
    } else if (total < 0) {
      errors.push('Tổng tiền hóa đơn không được nhỏ hơn 0.');
    } else if (Math.abs(total - expectedTotal) > 0.01) {
      errors.push(`Tổng tiền hóa đơn (${total}) không khớp với phép tính tạm tính trừ giảm giá (${expectedTotal}).`);
    }
  }

  // 6. Kiểm tra hạn thanh toán
  if (!invoice.dueDate) {
    errors.push('Hạn thanh toán không được để trống.');
  } else if (isNaN(new Date(invoice.dueDate).getTime())) {
    errors.push('Hạn thanh toán không phải là ngày hợp lệ.');
  }

  // 7. Kiểm tra sự nhất quán của trạng thái (Status) nếu có
  if (invoice.status) {
    try {
      const computedStatus = determineInvoiceStatus(
        expectedTotal,
        paidAmount,
        invoice.dueDate,
        invoice.currentDate || new Date()
      );

      if (invoice.status !== computedStatus) {
        errors.push(
          `Trạng thái hóa đơn "${invoice.status}" không hợp lệ. Trạng thái đúng phải là "${computedStatus}".`
        );
      }
    } catch (err) {
      // Lỗi tính toán trạng thái
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}