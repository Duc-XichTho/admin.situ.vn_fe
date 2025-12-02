import { FullscreenOutlined } from '@ant-design/icons';
import { Button, Modal, Spin, Image } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const ExcalidrawViewer = ({ jsonString, readOnly = true, height = '500px', imageUrl = null }) => {
  const [excalidrawData, setExcalidrawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useExportFunctions, setUseExportFunctions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const fullscreenSvgRef = useRef(null);
  const exportFunctionsRef = useRef({ exportToCanvas: null, exportToSvg: null });

  useEffect(() => {
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        setExcalidrawData(parsed);
        setError(null);
      } catch (error) {
        console.error('Failed to parse Excalidraw JSON:', error);
        setError('Không thể parse JSON diagram');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [jsonString]);

  // Load export functions dynamically
  useEffect(() => {
    const loadExportFunctions = async () => {
      try {
        const excalidrawModule = await import('@excalidraw/excalidraw');
        console.log('Excalidraw module keys:', Object.keys(excalidrawModule));

        // Kiểm tra xem các hàm export có tồn tại không
        const hasExportFunctions = excalidrawModule.exportToCanvas || excalidrawModule.exportToSvg;

        if (hasExportFunctions) {
          exportFunctionsRef.current = {
            exportToCanvas: excalidrawModule.exportToCanvas,
            exportToSvg: excalidrawModule.exportToSvg,
            exportToBlob: excalidrawModule.exportToBlob
          };
          console.log('Export functions loaded:', {
            hasExportToCanvas: !!exportFunctionsRef.current.exportToCanvas,
            hasExportToSvg: !!exportFunctionsRef.current.exportToSvg
          });
          setUseExportFunctions(true);
        } else {
          console.warn('Export functions not found in @excalidraw/excalidraw, using component instead');
          setUseExportFunctions(false);
        }
      } catch (e) {
        console.warn('Could not load export functions, using Excalidraw component instead:', e);
        setUseExportFunctions(false);
      }
    };
    loadExportFunctions();
  }, []);

  useEffect(() => {
    if (excalidrawData && containerRef.current && !loading && !error && useExportFunctions) {
      const renderDiagram = async () => {
        try {
          const elements = excalidrawData.elements || [];
          const appState = excalidrawData.appState || {
            viewBackgroundColor: '#ffffff'
          };

          // Kiểm tra xem có elements không
          if (!elements || elements.length === 0) {
            return;
          }

          const { exportToCanvas, exportToSvg } = exportFunctionsRef.current;

          // Thử sử dụng exportToSvg trước (nhẹ hơn)
          let element;
          try {
            if (exportToSvg) {
              let svgResult = exportToSvg({
                elements,
                appState,
                files: excalidrawData.files || {}
              });

              // Xử lý nếu là Promise
              if (svgResult instanceof Promise) {
                svgResult = await svgResult;
              }

              // Kiểm tra xem có phải là Node hợp lệ không
              if (svgResult && (svgResult instanceof Node || svgResult instanceof SVGElement || svgResult instanceof HTMLElement)) {
                element = svgResult;

                if (element.setAttribute) {
                  // Không set width/height 100% ngay, để element giữ kích thước gốc
                  // Scale sẽ được tính toán sau
                  element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                  if (element.style) {
                    element.style.width = 'auto';
                    element.style.height = 'auto';
                    element.style.maxWidth = 'none';
                    element.style.maxHeight = 'none';
                  }
                }
              } else {
                throw new Error('exportToSvg did not return a valid Node');
              }
            }
          } catch (svgError) {
            console.warn('exportToSvg failed, trying exportToCanvas:', svgError);
            // Fallback to Canvas
            try {
              if (exportToCanvas) {
                let canvasResult = exportToCanvas({
                  elements,
                  appState,
                  files: excalidrawData.files || {}
                });

                // Xử lý nếu là Promise
                if (canvasResult instanceof Promise) {
                  canvasResult = await canvasResult;
                }

                // Kiểm tra xem có phải là Node hợp lệ không
                if (canvasResult && (canvasResult instanceof Node || canvasResult instanceof HTMLCanvasElement || canvasResult instanceof HTMLElement)) {
                  element = canvasResult;

                  if (element.style) {
                    // Không set width/height 100% ngay, để element giữ kích thước gốc
                    // Scale sẽ được tính toán sau
                    element.style.width = 'auto';
                    element.style.height = 'auto';
                    element.style.maxWidth = 'none';
                    element.style.maxHeight = 'none';
                    element.style.display = 'block';
                  }
                } else {
                  throw new Error('exportToCanvas did not return a valid Node');
                }
              }
            } catch (canvasError) {
              console.error('exportToCanvas also failed:', canvasError);
              throw new Error('Both exportToSvg and exportToCanvas failed');
            }
          }

          if (!element || !(element instanceof Node)) {
            throw new Error('No valid element returned from export functions');
          }

          // Clear container trước
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(element);
            svgRef.current = element;
            
            // Tính toán scale dựa trên kích thước thực tế
            const calculateScale = () => {
              if (containerRef.current && element) {
                const container = containerRef.current;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                if (containerWidth === 0 || containerHeight === 0) {
                  // Retry if container not ready
                  setTimeout(calculateScale, 100);
                  return;
                }
                
                // Lấy kích thước thực tế của SVG
                let svgWidth, svgHeight;
                if (element instanceof SVGElement) {
                  // Reset transform để lấy kích thước gốc
                  const originalTransform = element.style.transform;
                  element.style.transform = 'none';
                  const bbox = element.getBBox();
                  svgWidth = bbox.width || parseFloat(element.getAttribute('width') || '0');
                  svgHeight = bbox.height || parseFloat(element.getAttribute('height') || '0');
                  element.style.transform = originalTransform;
                } else if (element instanceof HTMLCanvasElement) {
                  svgWidth = element.width;
                  svgHeight = element.height;
                } else {
                  svgWidth = element.offsetWidth || containerWidth;
                  svgHeight = element.offsetHeight || containerHeight;
                }
                
                if (svgWidth > 0 && svgHeight > 0) {
                  // Tính scale để fill container với tỉ lệ 4:3
                  const scaleX = containerWidth / svgWidth;
                  const scaleY = containerHeight / svgHeight;
                  // Sử dụng scale để fill container, không cần nhân thêm
                  const scale = Math.max(scaleX, scaleY);
                  
                  if (element.style) {
                    element.style.width = 'auto';
                    element.style.height = 'auto';
                    element.style.transform = `scale(${scale})`;
                    element.style.transformOrigin = 'center center';
                    element.style.display = 'block';
                  }
                }
              }
            };
            
            // Calculate scale after a short delay to ensure DOM is ready
            setTimeout(calculateScale, 200);
          }
        } catch (err) {
          console.error('Failed to export Excalidraw:', err);
          setError('Không thể render diagram');
        }
      };

      renderDiagram();
    }

    // Cleanup
    return () => {
      if (svgRef.current && containerRef.current && containerRef.current.contains(svgRef.current)) {
        try {
          containerRef.current.removeChild(svgRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        svgRef.current = null;
      }
    };
  }, [excalidrawData, loading, error, useExportFunctions]);

  // Render diagram cho fullscreen modal
  useEffect(() => {
    if (isFullscreen && excalidrawData && fullscreenContainerRef.current && !loading && !error && useExportFunctions) {
      const renderFullscreenDiagram = async () => {
        try {
          const elements = excalidrawData.elements || [];
          const appState = excalidrawData.appState || {
            viewBackgroundColor: '#ffffff'
          };

          if (!elements || elements.length === 0) {
            return;
          }

          const { exportToCanvas, exportToSvg } = exportFunctionsRef.current;

          let element;
          try {
            if (exportToSvg) {
              let svgResult = exportToSvg({
                elements,
                appState,
                files: excalidrawData.files || {}
              });

              if (svgResult instanceof Promise) {
                svgResult = await svgResult;
              }

              if (svgResult && (svgResult instanceof Node || svgResult instanceof SVGElement || svgResult instanceof HTMLElement)) {
                element = svgResult.cloneNode(true);

                if (element.setAttribute) {
                  element.setAttribute('width', '100%');
                  element.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                }
              }
            }
          } catch (svgError) {
            if (exportToCanvas) {
              let canvasResult = exportToCanvas({
                elements,
                appState,
                files: excalidrawData.files || {}
              });

              if (canvasResult instanceof Promise) {
                canvasResult = await canvasResult;
              }

              if (canvasResult && (canvasResult instanceof Node || canvasResult instanceof HTMLCanvasElement)) {
                element = canvasResult.cloneNode(true);

                if (element.style) {
                  element.style.width = '100%';
                  element.style.maxWidth = '100%';
                  element.style.display = 'block';
                }
              }
            }
          }

          if (element && fullscreenContainerRef.current) {
            fullscreenContainerRef.current.innerHTML = '';
            fullscreenContainerRef.current.appendChild(element);
            fullscreenSvgRef.current = element;
            
            // Tính toán scale cho fullscreen
            setTimeout(() => {
              if (fullscreenContainerRef.current && element) {
                const container = fullscreenContainerRef.current;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                let svgWidth, svgHeight;
                if (element instanceof SVGElement) {
                  const bbox = element.getBBox();
                  svgWidth = bbox.width || parseFloat(element.getAttribute('width') || '0');
                  svgHeight = bbox.height || parseFloat(element.getAttribute('height') || '0');
                } else if (element instanceof HTMLCanvasElement) {
                  svgWidth = element.width;
                  svgHeight = element.height;
                } else {
                  svgWidth = element.offsetWidth || containerWidth;
                  svgHeight = element.offsetHeight || containerHeight;
                }
                
                if (svgWidth > 0 && svgHeight > 0) {
                  const scaleX = containerWidth / svgWidth;
                  const scaleY = containerHeight / svgHeight;
                  // Sử dụng scale nhỏ hơn để tránh bị cắt
                  const scale = Math.max(scaleX, scaleY) * 1.1;
                  
                  if (element.style) {
                    element.style.transform = `scale(${scale})`;
                    element.style.transformOrigin = 'center center';
                    // Đảm bảo element không bị overflow
                    element.style.maxWidth = '100%';
                    element.style.maxHeight = '100%';
                  }
                }
              }
            }, 100);
          }
        } catch (err) {
          console.error('Failed to render fullscreen diagram:', err);
        }
      };

      renderFullscreenDiagram();
    }

    return () => {
      if (fullscreenSvgRef.current && fullscreenContainerRef.current && fullscreenContainerRef.current.contains(fullscreenSvgRef.current)) {
        try {
          fullscreenContainerRef.current.removeChild(fullscreenSvgRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        fullscreenSvgRef.current = null;
      }
    };
  }, [isFullscreen, excalidrawData, loading, error, useExportFunctions]);

  if (loading) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff1f0',
        borderRadius: '8px',
        border: '1px solid #ffccc7',
        color: '#ff4d4f'
      }}>
        {error}
      </div>
    );
  }

  // Nếu có imageUrl, hiển thị ảnh thay vì render từ JSON
  if (imageUrl) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '300px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0,
            padding: '8px'
          }}
        >
          <Image
            src={imageUrl}
            alt="Excalidraw Diagram"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            preview={{
              mask: 'Xem phóng to'
            }}
          />
        </div>
      
      </div>
    );
  }

  if (!excalidrawData) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px dashed #d9d9d9',
        color: '#999'
      }}>
        Không có dữ liệu diagram
      </div>
    );
  }

  if (!useExportFunctions) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px dashed #d9d9d9',
        color: '#999'
      }}>
        Đang tải diagram...
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '300px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0
          }}
        />
        </div>
    </>
  );
};

export default ExcalidrawViewer;

