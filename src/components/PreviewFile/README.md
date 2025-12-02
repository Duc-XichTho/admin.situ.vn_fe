# PreviewFile Components

Bộ component để preview và hiển thị file với nhiều định dạng khác nhau.

## Components

### 1. **PreviewFile** - Component preview file chính
### 2. **FileList** - Component hiển thị danh sách file với nút preview
### 3. **PreviewFileModal** - Modal để preview file riêng lẻ

## Tính năng chung

- **Preview PDF**: Sử dụng iframe với các tùy chọn ẩn toolbar
- **Preview Image**: Hiển thị hình ảnh với responsive design
- **Preview Text files**: Hiển thị nội dung text bằng iframe
- **Preview Office documents**: Sử dụng DocViewer (react-doc-viewer) cho .doc, .docx, .xls, .xlsx, .ppt, .pptx
- **Download file**: Tải xuống file với xử lý encoding
- **Mở tab mới**: Xem file trong tab mới
- **Error handling**: Fallback UI khi DocViewer không thể load file
- **Responsive design**: Tự động điều chỉnh trên mobile

## Sử dụng

### FileList Component (Khuyến nghị)
```jsx
import { FileList } from '../../components/PreviewFile';

<FileList
  fileUrls={[
    'https://example.com/document.pdf',
    'https://example.com/spreadsheet.xlsx',
    'https://example.com/image.jpg'
  ]}
  title="File đính kèm"
  showCount={true}
/>
```

### PreviewFile Component
```jsx
import PreviewFile from '../../components/PreviewFile';

// Sử dụng cơ bản
<PreviewFile
  fileUrl="https://example.com/document.pdf"
  fileName="document.pdf"
/>

// Sử dụng với các tùy chọn
<PreviewFile
  fileUrl="https://example.com/image.jpg"
  fileName="my-image.jpg"
  height="500px"
  showHeader={true}
  showDownload={true}
  className="custom-preview"
/>
```

### PreviewFileModal Component
```jsx
import { PreviewFileModal } from '../../components/PreviewFile';

<PreviewFileModal
  open={modalVisible}
  onClose={() => setModalVisible(false)}
  fileUrl="https://example.com/document.pdf"
  fileName="document.pdf"
  title="Preview Document"
/>
```

## Props

### FileList Props
| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `fileUrls` | `string[]` | `[]` | Array URL của các file |
| `title` | `string` | `"File đính kèm"` | Tiêu đề của danh sách file |
| `showCount` | `boolean` | `true` | Hiển thị số lượng file trong tiêu đề |

### PreviewFile Props
| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `fileUrl` | `string` | **Required** | URL của file cần preview |
| `fileName` | `string` | `undefined` | Tên file (nếu không có sẽ lấy từ URL) |
| `showHeader` | `boolean` | `true` | Hiển thị header với tên file và buttons |
| `showDownload` | `boolean` | `true` | Hiển thị nút download |
| `height` | `string` | `'400px'` | Chiều cao của component |
| `className` | `string` | `''` | CSS class tùy chỉnh |

### PreviewFileModal Props
| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `open` | `boolean` | **Required** | Trạng thái hiển thị modal |
| `onClose` | `function` | **Required** | Callback khi đóng modal |
| `fileUrl` | `string` | `undefined` | URL của file cần preview |
| `fileName` | `string` | `undefined` | Tên file |
| `title` | `string` | `undefined` | Tiêu đề modal (mặc định: "Preview: {fileName}") |

## Định dạng file hỗ trợ

### Preview trực tiếp
- **PDF**: `.pdf` - Iframe preview
- **Image**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg` - Responsive image
- **Text**: `.txt`, `.csv` - Iframe preview
- **Office docs**: `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` - DocViewer preview

### Download only
- **Archive**: `.zip`, `.rar`
- **Các định dạng khác**: Hiển thị thông báo download

## Ví dụ

### FileList - Hiển thị danh sách file (Khuyến nghị)
```jsx
<FileList
  fileUrls={[
    'https://example.com/report.pdf',
    'https://example.com/spreadsheet.xlsx',
    'https://example.com/photo.jpg',
    'https://example.com/document.docx'
  ]}
  title="File đính kèm"
  showCount={true}
/>
```

### Preview PDF trực tiếp
```jsx
<PreviewFile
  fileUrl="https://example.com/report.pdf"
  fileName="Report 2024.pdf"
  height="600px"
/>
```

### Preview Image
```jsx
<PreviewFile
  fileUrl="https://example.com/photo.jpg"
  fileName="photo.jpg"
  showHeader={false}
  height="400px"
/>
```

### Modal Preview
```jsx
<PreviewFileModal
  open={modalVisible}
  onClose={() => setModalVisible(false)}
  fileUrl="https://example.com/document.pdf"
  fileName="Important Document.pdf"
/>
```

### Preview trong Modal/Drawer cũ (deprecated)
```jsx
<Modal title="File Preview" open={visible} width={900}>
  <PreviewFile
    fileUrl={selectedFileUrl}
    fileName={selectedFileName}
    height="70vh"
  />
</Modal>
```

## Styling

Component sử dụng CSS Modules. Có thể customize bằng cách:

1. **Override CSS classes**:
```css
.customPreview :global(.previewBody) {
  border: 2px solid #1890ff;
}
```

2. **Sử dụng className prop**:
```jsx
<PreviewFile className="my-custom-preview" />
```

## Lưu ý

- Component tự động phát hiện loại file từ extension
- PDF có thể không hiển thị nếu browser chặn iframe
- Office documents sử dụng DocViewer (react-doc-viewer) để preview
- DocViewer có thể không hoạt động với một số file do CORS hoặc định dạng không tương thích
- Khi DocViewer lỗi, sẽ hiển thị fallback UI với nút download và thử lại
- Xử lý encoding tự động cho tên file tiếng Việt
- Responsive design cho mobile devices

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support (một số PDF có thể cần plugin)
- Safari: Full support
- Mobile browsers: Limited iframe support 