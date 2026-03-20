import React from 'react';
import PropTypes from 'prop-types';
import { Button, Space } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import css from './PreviewFile.module.css';

const PreviewFile = ({
                       fileUrl,
                       fileName,
                       showHeader = true,
                       showDownload = true,
                       height = '400px',
                       className = ''
                     }) => {
  const [docViewerError, setDocViewerError] = React.useState(false);

  // Reset DocViewer error when fileUrl changes
  React.useEffect(() => {
    setDocViewerError(false);
  }, [fileUrl]);

  if (!fileUrl) {
    return (
        <div className={`${css.previewDefault} ${className}`}>
          <p>Không có file để preview</p>
        </div>
    );
  }

  // Lấy extension từ URL hoặc filename
  const getFileExtension = (url, name) => {
    const urlExt = url.split('.').pop()?.toLowerCase();
    const nameExt = name?.split('.').pop()?.toLowerCase();
    return urlExt || nameExt || '';
  };

  const fileExtension = getFileExtension(fileUrl, fileName);
  const displayName = fileName || fileUrl.split('/').pop() || 'Unknown File';

  // Phân loại file types
  const imgTypes = ["jpg", "png", "svg", "jpeg", "gif", "bmp", "webp"];
  const docTypes = ["doc", "docx", 'xls', 'xlsx'];
  const isImage = imgTypes.includes(fileExtension);
  const isDoc = docTypes.includes(fileExtension);
  const isPDF = fileExtension === "pdf";
  const isText = ["txt"].includes(fileExtension);

  // Xử lý encoding (từ code cũ)
  const isEncoded = (str) => {
    return /%[0-9A-F]{2}|\\x[0-9A-F]{2}|Ã|Â|Â|¼|½|¾|¿/.test(str);
  };

  const fixEncoding = (str) => {
    if (!isEncoded(str)) return str;
    try {
      const bytes = new Uint8Array([...str].map(char => char.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return decoded;
    } catch {
      return str;
    }
  };

  // Xử lý download
  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fixEncoding(displayName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: mở file trong tab mới
      window.open(fileUrl, '_blank');
    }
  };

  const getViewerUrl = (url, ext) => {
    const officeExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];
    if (officeExts.includes(ext)) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleOpenNewTab = () => {
    const viewerUrl = getViewerUrl(fileUrl, fileExtension);
    window.open(viewerUrl, '_blank');
  };

  return (
      <div className={`${css.previewBody} ${className}`} style={{ height }}>
        {showHeader && (
            <div className={css.header}>
          <span className={css.fileName} title={fixEncoding(displayName)}>
            {fixEncoding(displayName)}
          </span>
              <div className={css.headerRight}>
                <Space>
                  {showDownload && (
                      <Button
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={handleDownload}
                          style={{ backgroundColor: '#124CB2', borderColor: '#124CB2' }}
                      >
                        Tải về
                      </Button>
                  )}
                  <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={handleOpenNewTab}
                  >
                    Mở tab mới
                  </Button>
                </Space>
              </div>
            </div>
        )}

        <div className={css.content}>
          {/* Preview Image */}
          {isImage && (
              <div className={css.previewImageContainer}>
                <img
                    src={fileUrl}
                    alt={fixEncoding(displayName)}
                    className={css.previewImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                />
                <div className={css.previewError} style={{ display: 'none' }}>
                  <p>Không thể tải hình ảnh</p>
                  <Button size="small" onClick={handleOpenNewTab}>
                    Mở trong tab mới
                  </Button>
                </div>
              </div>
          )}

          {/* Preview PDF */}
          {isPDF && (
              <div className={css.previewPdfContainer}>
                <iframe
                    src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className={css.previewPdf}
                    title={fixEncoding(displayName)}
                    onError={() => {
                      console.log('PDF iframe error');
                    }}
                />
              </div>
          )}

          {/* Preview Text Files */}
          {isText && (
              <div className={css.previewTextContainer}>
                <iframe
                    src={fileUrl}
                    className={css.previewText}
                    title={fixEncoding(displayName)}
                />
              </div>
          )}

          {/* Preview Documents (Office files) */}
          {isDoc && (
              <div className={css.previewDocContainer}>
                {!docViewerError ? (
                    <DocViewer
                        documents={[{
                          uri: fileUrl,
                          fileType: fileExtension,
                          fileName: fixEncoding(displayName)
                        }]}
                        pluginRenderers={DocViewerRenderers}
                        style={{ height: '100%' }}
                        config={{
                          header: {
                            disableHeader: !showHeader,
                            disableFileName: false,
                            retainURLParams: false
                          },
                          csvDelimiter: ",",
                          pdfZoom: {
                            defaultZoom: 1.1,
                            zoomJump: 0.2
                          }
                        }}
                        theme={{
                          primary: "#5296d8",
                          secondary: "#ffffff",
                          tertiary: "#5296d8",
                          textPrimary: "#ffffff",
                          textSecondary: "#5296d8",
                          textTertiary: "#00000099",
                          disableThemeScrollbar: false
                        }}
                        onError={(error) => {
                          console.error('DocViewer error:', error);
                          setDocViewerError(true);
                        }}
                    />
                ) : (
                    <div className={css.previewDefault}>
                      <div className={css.docIcon}>📄</div>
                      <p>Không thể preview file document này</p>
                      <p className={css.fileInfo}>
                        File: {fixEncoding(displayName)} ({fileExtension.toUpperCase()})
                      </p>
                      <Space>
                        <Button type="primary" onClick={handleDownload} style={{ backgroundColor: '#124CB2', borderColor: '#124CB2' }}>
                          Tải về để xem
                        </Button>
                        <Button onClick={handleOpenNewTab}>
                          Mở trong tab mới
                        </Button>
                        <Button onClick={() => setDocViewerError(false)}>
                          Thử lại
                        </Button>
                      </Space>
                    </div>
                )}
              </div>
          )}

          {/* Default Preview (không hỗ trợ) */}
          {!isImage && !isPDF && !isText && !isDoc && (
              <div className={css.previewDefault}>
                {/* <div className={css.defaultIcon}>📎</div> */}
                <p>Preview không khả dụng cho loại file này</p>
                <p className={css.fileInfo}>
                  File: {fixEncoding(displayName)} ({fileExtension.toUpperCase()})
                </p>
              
              </div>
          )}
        </div>
      </div>
  );
};

PreviewFile.propTypes = {
  fileUrl: PropTypes.string.isRequired,
  fileName: PropTypes.string,
  showHeader: PropTypes.bool,
  showDownload: PropTypes.bool,
  height: PropTypes.string,
  className: PropTypes.string,
};

export default PreviewFile; 
