import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    Carousel,
    Image,
    Tag,
    message,
    Input,
    Upload,
    Space,
    Divider,
    Card,
    Popconfirm
} from 'antd';
import { uploadFiles } from '../../../apis/uploadImageWikiNoteService';
import {
    PictureOutlined,
    FileTextOutlined,
    EditOutlined,
    SaveOutlined,
    UploadOutlined,
    EyeOutlined,
    CodeOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import ExcalidrawViewer from './ExcalidrawViewer';

const DiagramPreviewModal = ({
    visible,
    onClose,
    diagramData,
    onSave
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(null);
    const [editedNote, setEditedNote] = useState([]); // Array of notes for each image
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'edit'
    const [htmlViewModes, setHtmlViewModes] = useState({}); // Track view mode for each HTML code

    useEffect(() => {
        if (diagramData) {
            setEditedData(diagramData);
            setIsEditing(false);
            setActiveTab('preview');

            // Initialize notes array
            if (diagramData.note && Array.isArray(diagramData.note)) {
                setEditedNote([...diagramData.note]);
            } else if (diagramData.data) {
                // Initialize with empty strings for each data item
                setEditedNote(new Array(diagramData.data.length).fill(''));
            } else {
                setEditedNote([]);
            }

            // Initialize view modes for HTML codes
            if (diagramData.type === 'html' && diagramData.data) {
                const initialModes = {};
                diagramData.data.forEach((_, index) => {
                    initialModes[index] = 'preview'; // Default to preview mode
                });
                setHtmlViewModes(initialModes);
            }

        }
    }, [diagramData]);

    const handleSave = async () => {
        if (onSave && editedData) {
            try {
                // Show loading message
                message.loading('Đang lưu và upload ảnh...', 0);

                // Check if there are any empty image URLs that need to be handled
                const hasEmptyImages = editedData.data.some(item => {
                    if (typeof item === 'string') return !item || item === '';
                    if (typeof item === 'object') return !item.preview;
                    return true;
                });

                if (hasEmptyImages) {
                    message.destroy();
                    message.warning('Vui lòng upload ảnh cho tất cả diagram trước khi lưu!');
                    return;
                }

                // Upload new images that haven't been uploaded yet
                const newData = [...editedData.data];
                for (let i = 0; i < newData.length; i++) {
                    const item = newData[i];

                    // If it's an object with file (new upload), upload it
                    if (typeof item === 'object' && item.file && !item.uploaded) {
                        const response = await uploadFiles([item.file]);
                        const uploadedUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url;

                        if (uploadedUrl) {
                            newData[i] = uploadedUrl; // Replace with uploaded URL
                        } else {
                            throw new Error(`Không thể upload ảnh ${i + 1}`);
                        }
                    }
                    // If it's already a string URL, keep it as is
                    else if (typeof item === 'string') {
                        newData[i] = item;
                    }
                }

                // Save with uploaded URLs
                onSave({
                    ...editedData,
                    data: newData,
                    note: editedNote
                });

                message.destroy();
                setIsEditing(false);
                setActiveTab('preview');
                message.success('Đã lưu thay đổi và upload ảnh thành công!');

            } catch (error) {
                console.error('Error saving and uploading:', error);
                message.destroy();
                message.error('Lưu thất bại! Vui lòng thử lại.');
            }
        }
    };

    const handleCancel = () => {
        setEditedData(diagramData);
        setIsEditing(false);
        setActiveTab('preview');

        // Reset notes array
        if (diagramData?.note && Array.isArray(diagramData.note)) {
            setEditedNote([...diagramData.note]);
        } else if (diagramData?.data) {
            setEditedNote(new Array(diagramData.data.length).fill(''));
        } else {
            setEditedNote([]);
        }
    };

    const handleHtmlCodeChange = (index, newCode) => {
        if (editedData && editedData.data) {
            const newData = [...editedData.data];
            newData[index] = newCode;
            setEditedData({
                ...editedData,
                data: newData
            });
        }
    };


    const handleImageUpload = (file, index) => {
        // Convert file to base64 URL for preview only
        const reader = new FileReader();
        reader.onload = (e) => {
            if (editedData && editedData.data) {
                const newData = [...editedData.data];
                // Store file object for later upload, but show base64 for preview
                newData[index] = {
                    file: file, // Store original file
                    preview: e.target.result, // Base64 for preview
                    uploaded: false // Flag to track if uploaded
                };
                setEditedData({
                    ...editedData,
                    data: newData
                });
            }
        };
        reader.readAsDataURL(file);
        return false; // Prevent default upload
    };

    const handleDeleteItem = (index) => {
        if (editedData && editedData.data) {
            const newData = editedData.data.filter((_, i) => i !== index);
            setEditedData({
                ...editedData,
                data: newData
            });

            // Update notes array
            const newNotes = editedNote.filter((_, i) => i !== index);
            setEditedNote(newNotes);


            message.success('Đã xóa item!');
        }
    };


    const handleNoteChange = (index, note) => {
        const newNotes = [...editedNote];
        newNotes[index] = note;
        setEditedNote(newNotes);
    };

    const handleAddNewItem = () => {
        if (editedData && editedData.data) {
            const newData = [...editedData.data];
            const newNotes = [...editedNote];

            if (editedData.type === 'kroki') {
                // Add empty string for new image
                newData.push('');
                newNotes.push('');
            } else if (editedData.type === 'html') {
                // Add empty HTML template
                newData.push('<div>Nhập HTML code mới...</div>');
                newNotes.push('');
            } else if (editedData.type === 'excalidraw-react') {
                // Add empty Excalidraw JSON
                newData.push(JSON.stringify({
                    type: 'excalidraw',
                    version: 2,
                    source: 'https://excalidraw.com',
                    elements: [],
                    appState: {
                        gridSize: null,
                        viewBackgroundColor: '#ffffff'
                    },
                    files: {}
                }));
                newNotes.push('');
            }

            setEditedData({
                ...editedData,
                data: newData
            });
            setEditedNote(newNotes);

            message.success('Đã thêm item mới!');
        }
    };

    const toggleHtmlViewMode = (index) => {
        setHtmlViewModes(prev => ({
            ...prev,
            [index]: prev[index] === 'preview' ? 'code' : 'preview'
        }));
    };

    if (!diagramData) return null;

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editedData?.type === 'kroki' ? (
                            <>
                                <PictureOutlined style={{ color: '#1890ff' }} />
                                <span>Xem trước Diagram (Kroki)   :                      {editedData?.title}
                                </span>
                            </>
                        ) : editedData?.type === 'excalidraw-react' ? (
                            <>
                                <PictureOutlined style={{ color: '#722ed1' }} />
                                <span>Xem trước Excalidraw React   :                      {editedData?.title}
                                </span>
                            </>
                        ) : (
                            <>
                                <FileTextOutlined style={{ color: '#52c41a' }} />
                                <span>Xem trước HTML Code    :                     {editedData?.title}
                                </span>
                            </>
                        )}
                    </div>
                    <Space>
                        {editedData?.type !== 'excalidraw-react' && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} size="small">
                                            Lưu
                                        </Button>
                                        <Button onClick={handleCancel} size="small">
                                            Hủy
                                        </Button>
                                        <Divider type="vertical" />
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="primary"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                                setIsEditing(true);
                                                setActiveTab('edit');
                                            }}
                                            size="small"
                                        >
                                            Sửa
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </Space>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={editedData?.type === 'kroki' ? 900 : editedData?.type === 'excalidraw-react' ? 1200 : 1400}
            bodyStyle={{
                padding: '0',
                maxHeight: '80vh'
            }}
            destroyOnClose={true}
        >
            <div style={{
                padding: '16px',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>


                {/* Content based on type */}
                {(editedData?.type === 'kroki' ? (
                    <div>
                        {editedData?.data && editedData?.data?.length > 0 ? (
                            <div>
                                {isEditing && (
                                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddNewItem}
                                            size="large"
                                            style={{ width: '100%' }}
                                        >
                                            Thêm Diagram mới
                                        </Button>
                                    </div>
                                )}
                                {editedData.data.map((item, index) => {
                                    // Handle different data structures
                                    let imageUrl = '';
                                    if (typeof item === 'string') {
                                        imageUrl = item; // Already uploaded URL
                                    } else if (typeof item === 'object') {
                                        if (item.url) {
                                            imageUrl = item.url; // Object with URL
                                        } else if (item.preview) {
                                            imageUrl = item.preview; // New upload with preview
                                        }
                                    }
                                    const currentNote = editedNote[index] || '';

                                    return (
                                        <Card
                                            key={index}
                                            size="small"
                                            title={`Diagram ${index + 1} / ${editedData.data.length}`}
                                            style={{ marginBottom: '16px' }}
                                            extra={
                                                <Space>
                                                    {isEditing && (
                                                        <>
                                                            <Upload
                                                                accept="image/*"
                                                                showUploadList={false}
                                                                beforeUpload={(file) => handleImageUpload(file, index)}
                                                            >
                                                                <Button size="small" icon={<UploadOutlined />}>
                                                                    {imageUrl ? "Thay ảnh" : "Upload ảnh"}
                                                                </Button>
                                                            </Upload>
                                                            <Popconfirm
                                                                title="Xác nhận xóa"
                                                                description="Bạn có chắc chắn muốn xóa item này không?"
                                                                onConfirm={() => handleDeleteItem(index)}
                                                                okText="Xóa"
                                                                cancelText="Hủy"
                                                                okButtonProps={{ danger: true }}
                                                            >
                                                                <Button
                                                                    size="small"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </Popconfirm>
                                                        </>
                                                    )}
                                                </Space>
                                            }
                                        >
                                            {activeTab === 'preview' || !isEditing ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`Diagram ${index + 1}`}
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '400px',
                                                                objectFit: 'contain'
                                                            }}
                                                            preview={{
                                                                mask: 'Xem phóng to'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            height: '200px',
                                                            border: '2px dashed #d9d9d9',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#999',
                                                            backgroundColor: '#fafafa'
                                                        }}>
                                                            <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                                                            <div>Chưa có ảnh</div>
                                                            <div style={{ fontSize: '12px' }}>Vào chế độ edit để upload ảnh</div>
                                                        </div>
                                                    )}
                                                    {currentNote && (
                                                        <div style={{
                                                            marginTop: '8px',
                                                            padding: '8px',
                                                            backgroundColor: '#e6f7ff',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#1890ff',
                                                            border: '1px solid #91d5ff'
                                                        }}>
                                                            <strong>Ghi chú:</strong> {currentNote}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        {imageUrl ? (
                                                            <Image
                                                                src={imageUrl}
                                                                alt={`Diagram ${index + 1}`}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: '300px',
                                                                    objectFit: 'contain'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                height: '200px',
                                                                border: '2px dashed #d9d9d9',
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#999',
                                                                backgroundColor: '#fafafa',
                                                                marginBottom: '16px'
                                                            }}>
                                                                <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                                                                <div>Chưa có ảnh</div>
                                                                <div style={{ fontSize: '12px' }}>Upload ảnh bên dưới</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ marginTop: '12px' }}>
                                                        <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '12px' }}>
                                                            Ghi chú:
                                                        </div>
                                                        <Input.TextArea
                                                            value={currentNote}
                                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                                            placeholder="Nhập ghi chú cho ảnh..."
                                                            size="small"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#999'
                            }}>
                                {isEditing ? (
                                    <div>
                                        <div style={{ marginBottom: '16px' }}>
                                            Chưa có diagram nào
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddNewItem}
                                            size="large"
                                        >
                                            Thêm Diagram đầu tiên
                                        </Button>
                                    </div>
                                ) : (
                                    'Không có diagram nào'
                                )}
                            </div>
                        )}
                    </div>
                ) : editedData?.type === 'excalidraw-react' ? (
                    /* Excalidraw React Mode - Chỉ xem, không edit */
                    <div>
                        {editedData?.data && editedData?.data?.length > 0 ? (
                            <div>
                                {editedData.data.map((jsonString, index) => {
                                    const currentNote = editedNote[index] || '';
                                    // Kiểm tra xem có URL ảnh không
                                    const imageUrl = editedData?.imageUrls && Array.isArray(editedData.imageUrls) 
                                        ? editedData.imageUrls[index] 
                                        : null;
                                    
                                    return (
                                        <Card
                                            key={index}
                                            size="small"
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>Excalidraw Diagram {index + 1} / {editedData.data.length}</span>
                                                    <Tag color="purple">Excalidraw React</Tag>
                                                    {imageUrl && <Tag color="green">Ảnh</Tag>}
                                                </div>
                                            }
                                            style={{ marginBottom: '16px' }}
                                        >
                                            <div>
                                                {imageUrl ? (
                                                    // Hiển thị ảnh nếu có URL
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`Excalidraw Diagram ${index + 1}`}
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '500px',
                                                                objectFit: 'contain'
                                                            }}
                                                            preview={{
                                                                mask: 'Xem phóng to'
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    // Chỉ render ExcalidrawViewer nếu không có URL ảnh
                                                    <ExcalidrawViewer
                                                        jsonString={jsonString}
                                                        readOnly={true}
                                                        height="500px"
                                                    />
                                                )}
                                                {currentNote && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '12px',
                                                        backgroundColor: '#f6f8fa',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        color: '#24292e',
                                                        border: '1px solid #e1e4e8'
                                                    }}>
                                                        <strong>Ghi chú:</strong> {currentNote}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#999'
                            }}>
                                Không có Excalidraw diagram nào
                            </div>
                        )}
                    </div>
                ) : (
                    /* HTML Code Mode */
                    <div>
                        {editedData?.data && editedData?.data?.length > 0 ? (
                            <div>
                                {isEditing && (
                                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddNewItem}
                                            size="large"
                                            style={{ width: '100%' }}
                                        >
                                            Thêm HTML Code mới
                                        </Button>
                                    </div>
                                )}
                                {editedData?.data?.map((htmlCode, index) => (
                                    <Card
                                        key={index}
                                        size="small"
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>HTML Code {index + 1} / {editedData.data.length}</span>
                                                <Tag color="blue">HTML</Tag>
                                            </div>
                                        }
                                        style={{ marginBottom: '16px' }}
                                        extra={
                                            <Space>
                                                {!isEditing && (
                                                    <Button
                                                        size="small"
                                                        type={(htmlViewModes[index] || 'preview') === 'preview' ? 'primary' : 'default'}
                                                        icon={<EyeOutlined />}
                                                        onClick={() => toggleHtmlViewMode(index)}
                                                    >
                                                        {(htmlViewModes[index] || 'preview') === 'preview' ? 'Xem' : 'Code'}
                                                    </Button>
                                                )}
                                                {isEditing && (
                                                    <Popconfirm
                                                        title="Xác nhận xóa"
                                                        description="Bạn có chắc chắn muốn xóa HTML code này không?"
                                                        onConfirm={() => handleDeleteItem(index)}
                                                        okText="Xóa"
                                                        cancelText="Hủy"
                                                        okButtonProps={{ danger: true }}
                                                    >
                                                        <Button
                                                            size="small"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(htmlCode);
                                                        message.success('Đã copy HTML code!');
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            </Space>
                                        }
                                    >
                                        {isEditing ? (
                                            <div>
                                                {/* Edit Mode - Split View */}
                                                <div style={{ display: 'flex', gap: '16px', height: '400px' }}>
                                                    {/* Left: HTML Editor */}
                                                    <div style={{ width: '30%' }}>
                                                        <div style={{
                                                            backgroundColor: '#fafafa',
                                                            padding: '8px 12px',
                                                            borderBottom: '1px solid #d9d9d9',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            HTML Editor:
                                                        </div>
                                                        <Input.TextArea
                                                            value={htmlCode}
                                                            onChange={(e) => handleHtmlCodeChange(index, e.target.value)}
                                                            placeholder="Nhập HTML code..."
                                                            style={{
                                                                height: '360px',
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                lineHeight: '1.4'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Right: Live Preview */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            backgroundColor: '#fafafa',
                                                            padding: '8px 12px',
                                                            borderBottom: '1px solid #d9d9d9',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            Live Preview:
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: '360px',
                                                                padding: '16px',
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #d9d9d9',
                                                                overflow: 'auto'
                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: htmlCode }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {(htmlViewModes[index] || 'preview') === 'preview' ? (
                                                    /* HTML Preview */
                                                    <div style={{
                                                        border: '1px solid #d9d9d9',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            backgroundColor: '#fafafa',
                                                            padding: '8px 12px',
                                                            borderBottom: '1px solid #d9d9d9',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            Preview:
                                                        </div>
                                                        <div
                                                            style={{
                                                                padding: '16px',
                                                                backgroundColor: '#fff',

                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: htmlCode }}
                                                        />
                                                    </div>
                                                ) : (
                                                    /* HTML Source Code */
                                                    <div style={{
                                                        border: '1px solid #d9d9d9',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            backgroundColor: '#fafafa',
                                                            padding: '8px 12px',
                                                            borderBottom: '1px solid #d9d9d9',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            Source Code:
                                                        </div>
                                                        <pre style={{
                                                            margin: 0,
                                                            padding: '12px',
                                                            backgroundColor: '#f8f8f8',
                                                            fontSize: '12px',
                                                            lineHeight: '1.4',
                                                            maxHeight: '400px',
                                                            overflow: 'auto',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {htmlCode}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#999'
                            }}>
                                {isEditing ? (
                                    <div>
                                        <div style={{ marginBottom: '16px' }}>
                                            Chưa có HTML code nào
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddNewItem}
                                            size="large"
                                        >
                                            Thêm HTML Code đầu tiên
                                        </Button>
                                    </div>
                                ) : (
                                    'Không có HTML code nào'
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default DiagramPreviewModal;
