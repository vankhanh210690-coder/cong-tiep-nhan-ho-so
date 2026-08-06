# DuHoc24 — Website mẫu "Cổng Tiếp Nhận Hồ Sơ Du Học"

Repo mẫu dùng cho khoá lập trình 6 tuần. Bản này (Tuần 1) chỉ dựng UI —
toàn bộ dữ liệu là **mock data viết cứng** trong [`lib/mock-data.ts`](lib/mock-data.ts),
chưa nối API hay database thật.

## Bắt đầu

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Các route

| Route | Mô tả |
|---|---|
| `/` | Landing page: hero, form báo giá, chatbot QnA (UI tĩnh), 3 điểm nổi bật, footer |
| `/portal` | Cổng hồ sơ học viên: upload giấy tờ, thông tin trích xuất, đối chiếu điểm chuẩn |
| `/admin` | Chuyển hướng đến `/admin/requests` |
| `/admin/requests` | Danh sách yêu cầu báo giá |
| `/admin/schools` | Danh sách trường tham chiếu (điểm chuẩn) |
| `/admin/profiles` | Hồ sơ học viên và trạng thái giấy tờ |
| `/admin/conversations` | Lịch sử hội thoại chatbot |

Trang `/login` chưa được dựng ở bước này — học viên sẽ tự dựng ở Tuần 6.

## Công nghệ

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com) (style `base-nova`, nền tảng [Base UI](https://base-ui.com))
- Khối giao diện nền: [`@tailark-oss/dusk-landing-2`](https://tailark.com), đã chuyển sang light theme và tuỳ biến theo nội dung dịch vụ du học

## Biến môi trường

Chưa cần thiết để chạy `npm run dev` ở bản này. Xem [`.env.example`](.env.example)
cho danh sách biến sẽ dùng khi nối Supabase (Tuần 3) và đăng nhập magic link (Tuần 6).

## Deploy

Repo có cấu trúc chuẩn Next.js App Router, deploy trực tiếp lên [Vercel](https://vercel.com/new)
mà không cần cấu hình thêm.
