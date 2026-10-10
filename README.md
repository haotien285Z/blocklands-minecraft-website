# Blocklands — website Minecraft

Website landing page tĩnh bằng HTML, CSS và JavaScript. Không cần framework hoặc lệnh build.

## Chạy thử
Mở `index.html` bằng trình duyệt.

## Triển khai
Dự án được kết nối với Cloudflare Pages. Thư mục gốc: `/`, thư mục đầu ra: `.`. Mỗi commit mới lên nhánh `main` có thể kích hoạt triển khai tự động.

## Cấu hình chatbot Gemini
Chatbot dùng Google Gemini thông qua Cloudflare Pages Function tại `/api/chat`. API key được đọc ở phía máy chủ từ biến bí mật `GEMINI_API_KEY`; không dán API key vào `chat.html` hoặc commit API key lên GitHub.

1. Mở Cloudflare Dashboard → **Workers & Pages** → dự án **blocklands-minecraft-website**.
2. Vào **Settings** → **Variables and Secrets** (hoặc phần **Environment variables** của Pages Functions).
3. Thêm biến dạng **Secret** với tên chính xác `GEMINI_API_KEY`, rồi dán API key lấy từ Google AI Studio vào ô Value.
4. Lưu thay đổi và redeploy dự án.
5. Mở `/chat.html` và gửi một câu hỏi thử.

Không cần Workers AI binding `AI` cho chatbot Gemini. Có thể xóa binding Workers AI cũ khỏi Settings → Bindings sau khi chuyển đổi. Đừng xóa các binding khác nếu chúng được tính năng khác sử dụng.

## Lưu ý
- API key Gemini có thể chịu hạn mức hoặc chi phí tùy cấu hình tài khoản Google.
- Đây là landing page minh họa, không phải máy chủ Minecraft đang hoạt động và không liên kết với Mojang/Microsoft.
