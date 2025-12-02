# 🔧 **TODO: Khắc phục vòng lặp vô tận khi chuyển tab**

## ✅ **Đã hoàn thành:**

### 1. **Loại bỏ duplicate event listeners**
- ✅ Xóa `visibilitychange` event listener trùng lặp trong useEffect đầu tiên
- ✅ Chỉ giữ lại event listeners trong useEffect chính

### 2. **Thêm flags để tránh vòng lặp**
- ✅ `window.aiChatRestoring` - ngăn `handleTabReturn` chạy nhiều lần
- ✅ `window.aiChatRefreshing` - ngăn `refreshState` chạy nhiều lần  
- ✅ `window.aiChatReturning` - ngăn `handleReturnFromOtherTab` chạy nhiều lần
- ✅ `window.aiChatFirstLoad` - ngăn event listeners chạy lần đầu mount

### 3. **Sửa logic event handlers**
- ✅ `handleVisibilityChange` - chỉ gọi `handleTabReturn` khi có session và không phải lần đầu load
- ✅ `handleFocus` - chỉ gọi `handleTabReturn` khi có session và không phải lần đầu load
- ✅ `handleTabClick` - chỉ gọi `handleTabReturn` khi có session và không phải lần đầu load

### 4. **Sửa dependencies trong useEffect**
- ✅ Thay đổi `[currentSessionId, sessionTypingStates, sessionPendingMessages]` thành `[currentSessionId]`
- ✅ Tránh useEffect chạy lại mỗi khi state thay đổi

### 5. **Thêm timeout để reset flags**
- ✅ `aiChatRestoring` reset sau 1 giây
- ✅ `aiChatRefreshing` reset sau 1 giây
- ✅ `aiChatReturning` reset sau 500ms
- ✅ `aiChatFirstLoad` reset sau 2 giây

## 🎯 **Mục tiêu:**
- ✅ Khắc phục vòng lặp vô tận khi chuyển tab
- ✅ Đảm bảo loading state và pending messages được restore đúng cách
- ✅ Tránh gọi các hàm restore quá nhiều lần

## 🧪 **Cần test:**
- [ ] Chuyển tab sang tab khác rồi quay lại
- [ ] Kiểm tra loading state có được restore đúng không
- [ ] Kiểm tra pending messages có được hiển thị đúng không
- [ ] Kiểm tra không còn vòng lặp vô tận
- [ ] Kiểm tra console logs có quá nhiều không

## 📝 **Ghi chú:**
- Các flags được lưu trong `window` object để tránh re-render
- Timeout được sử dụng để reset flags thay vì state để tránh re-render
- Event listeners chỉ hoạt động sau khi component đã mount hoàn toàn (2 giây)
