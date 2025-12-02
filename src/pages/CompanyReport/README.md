# Company Report Component

## Mô tả
Component quản lý báo cáo doanh nghiệp, cho phép tạo và cấu hình các báo cáo với 3 bảng dữ liệu:
- Bảng Định giá (Valuation Table)
- Bảng tỷ số tài chính (Financial Ratio Table) 
- Bảng so sánh cùng ngành (Industry Comparison Table)

## Tính năng
- ✅ Hiển thị danh sách báo cáo doanh nghiệp
- ✅ Thêm báo cáo mới
- ✅ Cài đặt cấu hình cho từng bảng
- ✅ Preview báo cáo
- ✅ Xóa báo cáo
- ✅ Lưu trữ dữ liệu trong localStorage
- ✅ Responsive design

## Cấu trúc dữ liệu
Component sử dụng 3 nguồn dữ liệu chính:
- `BCTC.js` - Dữ liệu báo cáo tài chính
- `CompanyInfo.js` - Thông tin công ty
- `CompanyEvent.js` - Sự kiện công ty

## Cách sử dụng
1. Truy cập URL: `/company-report`
2. Click "Thêm báo cáo mới" để tạo báo cáo
3. Cấu hình các bảng dữ liệu trong modal
4. Click "Preview" để xem trước báo cáo
5. Click "Cài đặt" để chỉnh sửa cấu hình

## Props
Component không nhận props, tự quản lý state nội bộ.

## Dependencies
- React Router DOM
- Ant Design
- DataDemo files (BCTC.js, CompanyInfo.js, CompanyEvent.js)
- CompanyReportPreview component

## Files liên quan
- `CompanyReport.jsx` - Component chính
- `CompanyReport.module.css` - Styles
- `index.js` - Export
- `CompanyReportPreview.jsx` - Component preview (trong K9Management/components/) 