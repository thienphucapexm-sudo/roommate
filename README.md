# RoomMate — Quản lý nhà trọ và hóa đơn điện nước

> Bài tập thực hành xây dựng ứng dụng quản lý nhà trọ, kết hợp kiểm thử tự động và quy trình CI/CD.

| Thông tin | Giá trị |
| --- | --- |
| Thành viên | [Thiện Phúc] |
| Repository | [https://github.com/thienphucapexm-sudo/roommate] |
| GitHub Pages | [https://thienphucapexm-sudo.github.io/roommate/#/dashboard] |

## 1. Giới thiệu

RoomMate là ứng dụng web hỗ trợ quản lý nhà trọ. Ứng dụng tập trung vào các nghiệp vụ cơ bản như quản lý phòng, người thuê, hợp đồng, chỉ số điện nước, dịch vụ, hóa đơn, thanh toán và báo cáo.

## 2. Bài toán

Việc quản lý nhà trọ bằng sổ sách hoặc bảng tính dễ dẫn đến thiếu sót trong theo dõi tình trạng phòng, hợp đồng, chỉ số tiêu thụ và công nợ. RoomMate hướng tới việc tập trung các dữ liệu này trong một giao diện web thống nhất, hỗ trợ người quản lý tra cứu và thao tác thuận tiện hơn.

## 3. Chức năng

- Dashboard tổng quan số phòng, tỷ lệ lấp đầy, doanh thu, công nợ và cảnh báo.
- Quản lý phòng: thêm, sửa, xóa, tìm kiếm, lọc và sắp xếp.
- Quản lý người thuê và lịch sử thuê phòng.
- Quản lý hợp đồng thuê.
- Ghi chỉ số điện nước theo tháng.
- Quản lý cấu hình dịch vụ.
- Xem danh sách hóa đơn, thanh toán và công nợ.
- Báo cáo dữ liệu vận hành.
- Sao lưu, nhập và khôi phục dữ liệu mẫu.
- Lưu trữ dữ liệu phía trình duyệt bằng LocalStorage.

## 4. Công nghệ

- JavaScript ES Modules.
- [Vite](https://vite.dev/) để chạy môi trường phát triển và build.
- [Chart.js](https://www.chartjs.org/) cho biểu đồ Dashboard.
- [Vitest](https://vitest.dev/) và JSDOM cho unit test.
- [Playwright](https://playwright.dev/) cho kiểm thử end-to-end.
- GitHub Actions và GitHub Pages cho CI/CD và triển khai.
- Bootstrap 5 và Bootstrap Icons qua CDN.

## 5. Cấu trúc thư mục

```text
roommate/
├── .github/workflows/       # Workflow deploy GitHub Pages
├── public/                  # Tài nguyên tĩnh
├── src/
│   ├── assets/              # Hình ảnh, tài nguyên giao diện
│   ├── business/            # Quy tắc nghiệp vụ và validation
│   ├── components/          # Thành phần giao diện tái sử dụng
│   ├── constants/           # Hằng số dùng chung
│   ├── data/                # Dữ liệu mẫu
│   ├── pages/               # Các trang của ứng dụng
│   ├── services/            # Xử lý dữ liệu và LocalStorage
│   ├── styles/              # CSS theo từng khu vực
│   └── utils/               # Hàm tiện ích
├── tests/
│   └── unit/utils/          # Unit test cho utility
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js
└── playwright.config.js
```

## 6. Cách cài đặt

Yêu cầu: Node.js 20 hoặc phiên bản LTS tương thích và npm.

```bash
git clone [NHẬP_URL_REPOSITORY]
cd roommate
npm ci
```

Nếu không có file `package-lock.json`, dùng:

```bash
npm install
```

## 7. Chạy môi trường development

```bash
npm run dev
```

Sau đó truy cập địa chỉ Vite hiển thị trong terminal, mặc định là `http://localhost:3000`.

## 8. Chạy Vitest

Chạy unit test một lần:

```bash
npm run test:run
```

Chạy Vitest ở chế độ theo dõi:

```bash
npm test
```

Chạy kèm báo cáo coverage:

```bash
npm run test:coverage
```

Hiện dự án có unit test cho các utility: `id-utils`, `date-utils`, `currency-utils`, `number-utils` và `validation-utils`.

## 9. Chạy Playwright

Chạy end-to-end test:

```bash
npm run test:e2e
```

Mở giao diện Playwright UI:

```bash
npm run test:e2e:ui
```

Playwright được cấu hình để tự chạy Vite dev server tại cổng `3000` trước khi kiểm thử.

> Lưu ý: Chưa có file test E2E trong `tests/e2e` tại thời điểm viết README này.

## 10. Build

Tạo bản build production trong thư mục `dist`:

```bash
npm run build
```

Xem thử bản build local:

```bash
npm run preview
```

## 11. Deploy

Dự án có workflow `.github/workflows/deploy-pages.yml`. Workflow chạy khi push lên nhánh `main` hoặc được kích hoạt thủ công.

Quy trình deploy:

1. Trong GitHub repository, vào **Settings → Pages**.
2. Ở **Build and deployment → Source**, chọn **GitHub Actions**.
3. Push thay đổi lên `main`.
4. Theo dõi workflow **Deploy RoomMate to GitHub Pages** trong tab **Actions**.
5. Khi workflow thành công, truy cập link GitHub Pages: [NHẬP_LINK_GITHUB_PAGES].

## 12. Dữ liệu mẫu

Dữ liệu mẫu được khai báo tại `src/data/seed-data.js`. Trong ứng dụng, vào **Cài đặt & Sao lưu** để khôi phục dữ liệu mẫu khi cần.

## 13. Hình ảnh giao diện

Chưa có ảnh giao diện được đưa vào repository.

> Thêm ảnh sau khi chụp theo cấu trúc gợi ý `docs/images/`, rồi cập nhật phần này:
>
> ```md
> ![Dashboard](docs/images/dashboard.png)
> ![Quản lý phòng](docs/images/rooms.png)
> ```

## 14. Thành viên và phân công

| Thành viên | Vai trò / phần việc |
| --- | --- |
| [NHẬP] | [NHẬP] |
| [NHẬP] | [NHẬP] |

## 15. Quy trình Git

- Làm việc trên nhánh riêng theo chức năng hoặc bugfix.
- Đặt commit ngắn gọn, mô tả rõ thay đổi.
- Push nhánh lên remote và tạo Pull Request khi áp dụng quy trình nhóm.
- Chỉ merge vào `main` sau khi đã kiểm tra chức năng liên quan.
- `main` là nhánh dùng để triển khai GitHub Pages.

## 16. CI/CD

Workflow GitHub Actions hiện tại thực hiện các bước:

1. Checkout mã nguồn.
2. Cài Node.js 20 và dependencies bằng `npm ci`.
3. Build ứng dụng bằng `npm run build`.
4. Upload thư mục `dist` làm GitHub Pages artifact.
5. Deploy artifact lên GitHub Pages.

Workflow hiện tại tập trung vào deploy; chưa có bước chạy Vitest hoặc Playwright trong CI.

## 17. Sử dụng AI

AI được sử dụng để hỗ trợ phân tích lỗi, gợi ý cấu trúc mã nguồn, tạo unit test, hỗ trợ viết tài liệu và rà soát quy trình triển khai. Mọi thay đổi cần được kiểm tra lại bằng build hoặc test trước khi sử dụng.

## 18. Chức năng đã hoàn thành

- Cấu trúc ứng dụng SPA theo Hash Router.
- Các trang quản lý chính và Dashboard.
- Biểu đồ Dashboard với Chart.js.
- Lưu trữ LocalStorage, dữ liệu mẫu và thao tác sao lưu cơ bản.
- Unit test cho các utility.
- Workflow build và deploy GitHub Pages.

## 19. Hạn chế

- Dữ liệu chỉ lưu trên trình duyệt, chưa có backend hoặc cơ sở dữ liệu tập trung.
- Chưa có file Playwright E2E test.
- CI hiện chưa tự chạy unit test và E2E test trước khi deploy.
- Chưa có ảnh giao diện trong repository.

## 20. Hướng phát triển

- Tích hợp backend, xác thực và cơ sở dữ liệu.
- Bổ sung phân quyền quản trị/người dùng.
- Viết bộ Playwright E2E cho các luồng quan trọng.
- Thêm bước lint, Vitest và Playwright vào CI trước khi deploy.
- Mở rộng báo cáo, xuất dữ liệu và gửi nhắc nợ.
- Bổ sung ảnh demo và tài liệu sử dụng chi tiết.
