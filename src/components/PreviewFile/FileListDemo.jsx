import React from 'react';
import { Card, Space, Typography, Row, Col } from 'antd';
import FileList from './FileList';

const { Title, Text } = Typography;

const FileListDemo = () => {
  // Sample file URLs for different types
  const sampleFiles = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_DOCX_10kB.docx',
    'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_XLSX_10.xlsx',
    'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/08/file_example_PPT_250kB.ppt',
    'https://picsum.photos/800/600.jpg',
    'https://www.w3.org/TR/PNG/iso_8859-1.txt',
  ];

  const mixedFiles = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://picsum.photos/400/300.jpg',
    'https://www.w3.org/TR/PNG/iso_8859-1.txt',
  ];

  const officeFiles = [
    'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_DOCX_10kB.docx',
    'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_XLSX_10.xlsx',
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>FileList Component Demo</Title>
      <Text type="secondary">
        Component hiển thị danh sách file với các nút action (Preview, Download, Open)
      </Text>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        {/* Tất cả file types */}
        <Col xs={24} lg={12}>
          <Card title="Mixed File Types" style={{ height: 'fit-content' }}>
            <FileList
              fileUrls={sampleFiles}
              title="File đính kèm"
              showCount={true}
            />
          </Card>
        </Col>

        {/* Một vài file */}
        <Col xs={24} lg={12}>
          <Card title="Few Files" style={{ height: 'fit-content' }}>
            <FileList
              fileUrls={mixedFiles}
              title="Documents"
              showCount={true}
            />
          </Card>
        </Col>

        {/* Office files only */}
        <Col xs={24} lg={12}>
          <Card title="Office Documents" style={{ height: 'fit-content' }}>
            <FileList
              fileUrls={officeFiles}
              title="Office Files"
              showCount={false}
            />
          </Card>
        </Col>

        {/* Empty state */}
        <Col xs={24} lg={12}>
          <Card title="Empty State" style={{ height: 'fit-content' }}>
            <FileList
              fileUrls={[]}
              title="No Files"
              showCount={true}
            />
          </Card>
        </Col>
      </Row>

      {/* Usage Guide */}
      <Card title="Hướng dẫn sử dụng" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={4}>Props:</Title>
            <ul>
              <li><strong>fileUrls:</strong> Array of file URLs</li>
              <li><strong>title:</strong> Title for the file list (default: "File đính kèm")</li>
              <li><strong>showCount:</strong> Show file count in title (default: true)</li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>Features:</Title>
            <ul>
              <li>✅ File type detection by extension</li>
              <li>✅ Appropriate icons for each file type</li>
              <li>✅ Preview button for supported formats</li>
              <li>✅ Download functionality</li>
              <li>✅ Open in new tab</li>
              <li>✅ Responsive design</li>
            </ul>
          </Col>
        </Row>

        <Title level={4} style={{ marginTop: '24px' }}>Code Example:</Title>
        <pre style={{ 
          backgroundColor: '#f6f8fa', 
          padding: '16px', 
          borderRadius: '6px',
          overflow: 'auto'
        }}>
{`import { FileList } from '../../components/PreviewFile';

<FileList
  fileUrls={[
    'https://example.com/document.pdf',
    'https://example.com/spreadsheet.xlsx',
    'https://example.com/image.jpg'
  ]}
  title="File đính kèm"
  showCount={true}
/>`}
        </pre>
      </Card>
    </div>
  );
};

export default FileListDemo; 