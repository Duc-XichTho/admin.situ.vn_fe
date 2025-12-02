# AI Pipeline Guide

## Tổng quan

AI Pipeline là tính năng cho phép tạo ra các workflow AI phức tạp, nơi nhiều AI model có thể làm việc tuần tự để xử lý một câu hỏi. Output của AI trước sẽ là input của AI tiếp theo, tạo ra một chuỗi xử lý thông minh.

## Cách hoạt động

### 1. Pipeline đơn lẻ vs Pipeline nhiều bước

- **Pipeline đơn lẻ**: Chỉ sử dụng 1 AI model duy nhất (giống như advisor cũ)
- **Pipeline nhiều bước**: Nhiều AI model chạy tuần tự

### 2. Luồng xử lý

```
User Input → AI Step 1 → Output 1 → AI Step 2 → Output 2 → ... → Final Result
```

## Cách tạo AI Pipeline

### Bước 1: Truy cập cài đặt
1. Vào tab K9 → AI Chat
2. Click vào nút "Cài đặt Pipeline" trong sidebar (chỉ admin)

### Bước 2: Tạo Pipeline mới
1. Click "Thêm Pipeline"
2. Điền thông tin cơ bản:
   - **Tên Pipeline**: Tên hiển thị
   - **Mô tả**: Mô tả chức năng
   - **Loại Pipeline**: Chọn "Pipeline (Nhiều AI)" để tạo pipeline nhiều bước

### Bước 3: Cấu hình các bước AI
1. Click "Thêm bước AI" để thêm từng bước
2. Với mỗi bước, cấu hình:
   - **Tên bước**: Tên hiển thị của bước
   - **Model AI**: Chọn model AI (Claude, GPT, Gemini...)
   - **Mô tả bước**: Mô tả chức năng của bước này
   - **Bật Websearch**: Có sử dụng websearch không
   - **System Message**: Prompt hệ thống cho AI này

### Bước 4: Sắp xếp thứ tự
- Sử dụng nút ↑↓ để di chuyển các bước lên/xuống
- Thứ tự này sẽ quyết định thứ tự xử lý

## Ví dụ Pipeline thực tế

### Pipeline "Phân tích đầu tư toàn diện"

**Bước 1: Thu thập thông tin**
- Model: Claude Haiku
- System Message: "Bạn là chuyên gia thu thập thông tin. Hãy tìm kiếm và tổng hợp tất cả thông tin liên quan đến [cổ phiếu/ngành] được đề cập."
- Websearch: Bật

**Bước 2: Phân tích kỹ thuật**
- Model: GPT-4
- System Message: "Bạn là chuyên gia phân tích kỹ thuật. Dựa trên thông tin đã thu thập, hãy phân tích các chỉ báo kỹ thuật, xu hướng giá, và mức hỗ trợ/kháng cự."

**Bước 3: Phân tích cơ bản**
- Model: Claude Sonnet
- System Message: "Bạn là chuyên gia phân tích cơ bản. Hãy đánh giá tình hình tài chính, triển vọng kinh doanh, và định giá của công ty."

**Bước 4: Tổng hợp khuyến nghị**
- Model: Gemini Pro
- System Message: "Bạn là chuyên gia tư vấn đầu tư. Dựa trên tất cả phân tích trước đó, hãy đưa ra khuyến nghị đầu tư cụ thể với mức độ rủi ro và tiềm năng lợi nhuận."

## Cách sử dụng

### 1. Chọn Pipeline
- Trong AI Chat, chọn pipeline từ danh sách advisor buttons
- Pipeline sẽ có badge "Pipeline" màu xanh

### 2. Gửi câu hỏi
- Nhập câu hỏi như bình thường
- Hệ thống sẽ tự động chạy qua tất cả các bước

### 3. Xem kết quả
- Kết quả cuối cùng sẽ được hiển thị
- Chi tiết từng bước sẽ được hiển thị bên dưới
- Có thể xem output của từng AI trong pipeline

## Tính năng đặc biệt

### 1. Embedding Search
- Chỉ hoạt động ở bước đầu tiên của pipeline
- Thông tin embedding sẽ được truyền qua các bước tiếp theo

### 2. Websearch
- Mỗi bước có thể bật/tắt websearch độc lập
- Hữu ích cho bước thu thập thông tin

### 3. Model linh hoạt
- Mỗi bước có thể sử dụng model AI khác nhau
- Tận dụng ưu điểm của từng model

## Lưu ý quan trọng

### 1. Thời gian xử lý
- Pipeline nhiều bước sẽ mất nhiều thời gian hơn
- Mỗi bước cần chờ bước trước hoàn thành

### 2. Chi phí
- Pipeline sử dụng nhiều model = chi phí cao hơn
- Cần cân nhắc hiệu quả vs chi phí

### 3. Chất lượng output
- Output của bước trước ảnh hưởng đến bước sau
- Cần thiết kế pipeline cẩn thận

### 4. Xử lý lỗi
- Nếu một bước lỗi, toàn bộ pipeline sẽ dừng
- Cần có fallback strategy

## Best Practices

### 1. Thiết kế Pipeline
- Bắt đầu với bước thu thập thông tin
- Tiếp theo là phân tích chi tiết
- Kết thúc với tổng hợp và khuyến nghị

### 2. System Message
- Viết rõ ràng vai trò của từng AI
- Chỉ định input/output format
- Thêm context cần thiết

### 3. Model Selection
- Haiku: Thu thập thông tin, phân tích đơn giản
- Sonnet/GPT-4: Phân tích phức tạp, suy luận
- Gemini: Tổng hợp, khuyến nghị

### 4. Testing
- Test từng bước riêng lẻ trước
- Kiểm tra output quality
- Tối ưu hóa system message

## Troubleshooting

### Pipeline không hoạt động
- Kiểm tra cấu hình từng bước
- Đảm bảo có ít nhất 1 bước
- Kiểm tra system message

### Output chất lượng thấp
- Cải thiện system message
- Thay đổi thứ tự các bước
- Sử dụng model mạnh hơn

### Pipeline chậm
- Giảm số lượng bước
- Sử dụng model nhanh hơn
- Tối ưu hóa prompt

## Ví dụ Use Cases

### 1. Phân tích báo cáo tài chính
1. Trích xuất dữ liệu từ báo cáo
2. Phân tích tỷ số tài chính
3. So sánh với ngành
4. Đưa ra khuyến nghị

### 2. Nghiên cứu thị trường
1. Thu thập thông tin thị trường
2. Phân tích xu hướng
3. Đánh giá cơ hội
4. Chiến lược thâm nhập

### 3. Tư vấn đầu tư
1. Phân tích hồ sơ nhà đầu tư
2. Đánh giá rủi ro
3. Đề xuất danh mục
4. Kế hoạch thực hiện 