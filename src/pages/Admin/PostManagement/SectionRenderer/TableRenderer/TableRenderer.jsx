import React, { useContext, useEffect, useState } from 'react';
import { MyContext } from '../../../../../MyContext.jsx';
import css from './TableRenderer.module.css'
import { createTimestamp, formatDateToDDMMYYYY2, getEmailPrefix } from '../../../../../generalFunction/format.js';
import ListFile from '../../../../PageViewer/SectionPageDetail/TableCustom/PreviewFile/ListFile.jsx';
import { updateContentPage } from '../../../../../apis/contentPageService.jsx';
import EditTableCustom from '../../../../PageViewer/SectionPageDetail/TableCustom/EditTableCustom.jsx';
import { Button } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';

const TableRenderer = ({ sectionPageData , itemData , fieldConfigs , setItemData}) => {
  const { currentUser, setCheckEditorPage } = useContext(MyContext);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [existingData, setExistingData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  const validTypes = ['Table', 'Form', 'File', 'Album'];

  if (!validTypes.includes(sectionPageData?.type)) {
    return <p style={{ padding: 16 }}>Loại không hợp lệ</p>;
  }
  const handleEdit = (item) => {
    setExistingData(item);
    setIsModalOpenEdit(true);
  };

  const handleSaveEdit = async (formData) => {
    const simplifiedData = { ...formData };
    const newData = {
      id: existingData.id,
      updated_at: createTimestamp(),
      user_update: currentUser.email,
      info: simplifiedData,
      icon: simplifiedData.icon,
    };
    const data = await updateContentPage(newData);
    setItemData(data );
  };

  const handleOpenPreviewModal = (files) => {
    setPreviewFiles(files);
    setIsPreviewModalOpen(true);
  };


  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
  };

  const handleCloseModalEdit = () => {
    setIsModalOpenEdit(false);
  };

  const handleHideContent = async (item) => {
    const updatedItem = {
      ...item,
      hide: item.hide === true ? false : true,
    };

    setItemData(updatedItem)

    if (updatedItem.hide !== item.hide) {
      await updateContentPage(updatedItem);
    }
  };

  const handleConfirm = async (item) => {
    if (!item?.info?.xac_nhan) {
      const updatedItem = {
        ...item,
        info: {
          ...item.info,
          xac_nhan: true,
          user_confirm: currentUser.email,
        },
      };

      setItemData(updatedItem)
      await updateContentPage(updatedItem);
    }
  };

  return (
      <>

        <div style={{display : 'flex' , justifyContent : 'end' , marginBottom : 10}}>
          <Button icon={<DeleteOutlined />} danger >
            Xóa
          </Button>
        </div>

        <div  className={css.card}>
          {fieldConfigs.some(field => field.key === 'anh_minh_hoa' && field.show) && (
              <div
                  style={{
                    backgroundImage: `url(${(itemData?.info?.anh_minh_hoa?.[0]?.fileUrl)?.replace(/ /g, '%20')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    width: '100%',
                    height: '250px',
                    borderRadius: '8px', // nếu muốn bo góc
                    padding: '10px',
                    transition: 'background-image 0.3s ease-in-out',
                  }}
              />
          )}

          <div className={css.content}>
            <h3 className={css.title}>{itemData?.name || 'Tiêu đề'}</h3>

            {/* Mô tả */}
            {fieldConfigs.some(field => field.key === 'mo_ta' && field.show) && (
                <p className={css.desc}>
                  <strong>Mô tả:</strong> {itemData?.info?.mo_ta}
                </p>
            )}

            {/* Note */}
            {fieldConfigs.some(field => field.key === 'note' && field.show) && (
                <p className={css.note}>
                  <strong>Note:</strong> {itemData?.info?.note}
                </p>
            )}

            {/* Số tiền */}
            {fieldConfigs.some(field => field.key === 'gia_tri' && field.show) && (
                <p className={css.amount}>
                  <strong>Số tiền:</strong> {itemData?.info?.gia_tri?.toLocaleString()}
                </p>
            )}

            {/*Phân loại */}
            {fieldConfigs.some(field => field.key === 'phan_loai' && field.show) && (
                <p className={css.amount}>
                  <strong>Phân loại:</strong> {itemData?.info?.phan_loai}
                </p>
            )}

            {fieldConfigs.some(field => field.key === 'nguoi_gui' && field.show) && (
                <p className={css.amount}>
                  <strong>Người gửi:</strong> {itemData?.info?.nguoi_gui}
                </p>
            )}

            {/* Đính kèm */}
            {fieldConfigs.some(field => field.key === 'dinh_kem' && field.show) && (
                <div className={css.attach}>
                  <strong>Đính kèm</strong>
                  {(() => {
                    const dinhKem = itemData?.info?.dinh_kem;
                    console.log(dinhKem);
                    let files = [];
                    let downloadable = true;
                    if (Array.isArray(dinhKem) && dinhKem.length > 0) {
                      if (dinhKem[0].files) {
                        files = dinhKem[0].files;
                        downloadable = dinhKem[0].downloadable !== false; // default true
                      } else {
                        files = dinhKem;
                        downloadable = true;
                      }
                    }
                    return files.length > 0 ? (
                        <div style={{ margin: 0, paddingLeft: 16 }}>
                          {files.map((file, idx) => (
                              <div
                                  key={idx}
                                  className={css.card}
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
															<span
                                                                className={css.fileNameEllipsis}
                                                                style={{ flex: 1 }}
                                                                onClick={() => {
                                                                  setCurrentFile(file);
                                                                  setPreviewFiles([file]);
                                                                  setIsPreviewModalOpen(true);
                                                                }}
                                                            >
                                  {file.fileName}
                                </span>
                                <span
                                    style={{ marginLeft: 10, cursor: 'pointer', fontSize: 18 }}
                                    onClick={() => setCurrentFile(file)}
                                    title={downloadable ? 'Tải về' : 'Xem trước'}
                                >
																  {downloadable ? <DownloadOutlined /> : <EyeOutlined />}
																</span>
                              </div>
                          ))}
                        </div>
                    ) : (
                        <span> Không có file đính kèm</span>
                    );
                  })()}
                </div>
            )}


            {fieldConfigs.some(field => field.key === 'time' && field.show) && (
                <span className={css.update}>
										Update {formatDateToDDMMYYYY2(itemData?.updated_at || itemData?.created_at)} {getEmailPrefix(itemData?.user_update)}
									</span>
            )}
            <div className={css.footer}>
              <div>
											<span className={css.create}>Create {formatDateToDDMMYYYY2(itemData.created_at)}
											</span>

                {fieldConfigs.some(field => field.key === 'xac_nhan' && field.show) && (
                    <span
                        onClick={() => handleConfirm(itemData)}
                        style={{
                          color: itemData?.info?.xac_nhan ? 'rgba(32, 135, 86, 1)' : 'rgba(224, 110, 34, 1)', // Thêm màu cho "Đã xác nhận" và "Chưa xác nhận"
                          cursor: 'pointer', // Để người dùng biết có thể click vào
                        }}
                    >
										  {itemData?.info?.xac_nhan ? (
                                              <>
                                                Đã xác nhận ({getEmailPrefix(itemData?.info?.user_confirm)})
                                              </>
                                          ) : (
                                              'Chưa xác nhận'
                                          )}
										</span>
                )}

                  {(currentUser?.isAdmin) &&
                      <>
												<span className={css.action}
                                                      onClick={() => handleEdit(itemData)}>Edit</span>
                      <span className={css.action}
                            onClick={() => handleHideContent(itemData)}>{itemData?.hide ? 'Bỏ ẩn' : 'Ẩn'}</span>
                    </>
                }

              </div>

            </div>

          </div>
        </div>

        {isPreviewModalOpen && <ListFile isPreviewModalOpen={isPreviewModalOpen}
                                         previewFiles={previewFiles}
                                         handleClosePreviewModal={handleClosePreviewModal}
        />}

        {isModalOpenEdit && <EditTableCustom isOpen={isModalOpenEdit}
                                             fieldConfigs={fieldConfigs}
                                             onClose={handleCloseModalEdit}
                                             onSave={handleSaveEdit}
                                             existingData={existingData} // Truyền dữ liệu cũ vào để chỉnh sửa
        />}
      </>
  );
};

export default TableRenderer; 