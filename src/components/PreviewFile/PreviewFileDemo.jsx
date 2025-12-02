import React, { useState } from 'react';
import { Card, Input, Button, Space, Select, Switch, Slider, Row, Col, Typography } from 'antd';
import PreviewFile from './PreviewFile';

const { Title, Text } = Typography;
const { Option } = Select;

const PreviewFileDemo = () => {
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [showDownload, setShowDownload] = useState(true);
  const [height, setHeight] = useState(400);

  // Sample files for testing
  const sampleFiles = [
    {
      name: 'Sample PDF',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'sample.pdf'
    },
    {
      name: 'Sample Image',
      url: 'https://picsum.photos/800/600',
      fileName: 'sample-image.jpg'
    },
    {
      name: 'Sample Text',
      url: 'https://www.w3.org/TR/PNG/iso_8859-1.txt',
      fileName: 'sample.txt'
    },
    {
      name: 'Sample DOCX',
      url: 'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_DOCX_10kB.docx',
      fileName: 'sample.docx'
    },
    {
      name: 'Sample XLSX',
      url: 'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/10/file_example_XLSX_10.xlsx',
      fileName: 'sample.xlsx'
    },
    {
      name: 'Sample PPTX',
      url: 'https://file-examples.com/storage/fe68c4f7de1c85b7c8db7b7/2017/08/file_example_PPT_250kB.ppt',
      fileName: 'sample.ppt'
    }
  ];

  const handleSampleSelect = (value) => {
    const sample = sampleFiles.find(file => file.url === value);
    if (sample) {
      setFileUrl(sample.url);
      setFileName(sample.fileName);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>PreviewFile Component Demo</Title>
      
      <Row gutter={[24, 24]}>
        {/* Controls */}
        <Col xs={24} lg={8}>
          <Card title="Cấu hình" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Sample Files:</Text>
                <Select
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder="Chọn file mẫu"
                  onChange={handleSampleSelect}
                  allowClear
                >
                  {sampleFiles.map(file => (
                    <Option key={file.url} value={file.url}>
                      {file.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>File URL:</Text>
                <Input
                  style={{ marginTop: '8px' }}
                  placeholder="Nhập URL file"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>

              <div>
                <Text strong>File Name:</Text>
                <Input
                  style={{ marginTop: '8px' }}
                  placeholder="Nhập tên file (tùy chọn)"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>

              <div>
                <Text strong>Height: {height}px</Text>
                <Slider
                  style={{ marginTop: '8px' }}
                  min={200}
                  max={800}
                  value={height}
                  onChange={setHeight}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Show Header:</Text>
                <Switch checked={showHeader} onChange={setShowHeader} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Show Download:</Text>
                <Switch checked={showDownload} onChange={setShowDownload} />
              </div>

              <Button type="primary" onClick={() => {
                setFileUrl('');
                setFileName('');
                setShowHeader(true);
                setShowDownload(true);
                setHeight(400);
              }}>
                Reset
              </Button>
            </Space>
          </Card>

          {/* Code Example */}
          <Card title="Code Example">
            <pre style={{ 
              backgroundColor: '#f6f8fa', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`<PreviewFile
  fileUrl="${fileUrl || 'https://example.com/file.pdf'}"
  fileName="${fileName || 'example.pdf'}"
  height="${height}px"
  showHeader={${showHeader}}
  showDownload={${showDownload}}
/>`}
            </pre>
          </Card>
        </Col>

        {/* Preview */}
        <Col xs={24} lg={16}>
          <Card title="Preview" style={{ height: 'fit-content' }}>
            {fileUrl ? (
              <PreviewFile
                fileUrl={fileUrl}
                fileName={fileName}
                height={`${height}px`}
                showHeader={showHeader}
                showDownload={showDownload}
              />
            ) : (
              <div style={{ 
                height: `${height}px`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                border: '2px dashed #d9d9d9',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                  <Text type="secondary">Nhập URL file để xem preview</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Usage Guide */}
      <Card title="Hướng dẫn sử dụng" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={4}>Định dạng hỗ trợ:</Title>
            <ul>
              <li><strong>PDF:</strong> .pdf - Preview với iframe</li>
              <li><strong>Image:</strong> .jpg, .png, .gif, .svg, .webp - Hiển thị ảnh</li>
              <li><strong>Text:</strong> .txt, .csv - Preview nội dung</li>
              <li><strong>Office:</strong> .doc, .docx, .xls, .xlsx, .ppt, .pptx - DocViewer preview</li>
              <li><strong>Archive:</strong> .zip, .rar - Download only</li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>Tính năng:</Title>
            <ul>
              <li>✅ Preview PDF với iframe</li>
              <li>✅ Hiển thị hình ảnh responsive</li>
              <li>✅ Preview text files</li>
              <li>✅ Preview Office docs với DocViewer</li>
              <li>✅ Download file với encoding support</li>
              <li>✅ Mở file trong tab mới</li>
              <li>✅ Error handling & fallback UI</li>
              <li>✅ Mobile responsive</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PreviewFileDemo; 