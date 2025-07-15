# PluginPalooza Backend

## Cài đặt

1. Cài đặt dependencies:
```bash
cd backend
npm install
```

2. Tạo file `.env` dựa trên `.env.example` và điền thông tin kết nối MySQL, JWT, Stripe, Paypal.

3. Khởi động server:
```bash
npm run dev
```

## Các route chính

- `POST /api/auth/register` — Đăng ký người dùng
- `POST /api/auth/login` — Đăng nhập, trả về JWT
- `GET /api/plugins` — Lấy danh sách plugin
- `GET /api/plugins/:id` — Lấy chi tiết plugin
- `GET /api/plugins/:id/download` — Tải plugin (nếu đã mua)
- `POST /api/admin/plugins` — Thêm plugin (admin)
- `PUT /api/admin/plugins/:id` — Sửa plugin (admin)
- `DELETE /api/admin/plugins/:id` — Xóa plugin (admin)

## Ghi chú
- Các bảng MySQL dùng prefix `cm_new_` (ví dụ: `cm_new_users`, `cm_new_plugins`, ...)
- Cần tạo các bảng phù hợp trong database trước khi chạy backend. 