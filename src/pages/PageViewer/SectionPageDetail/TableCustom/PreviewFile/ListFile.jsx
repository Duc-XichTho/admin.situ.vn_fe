import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import PreviewComponent from './PreviewFile.jsx'; // Sử dụng biểu tượng mắt từ antd

const ListFile = ({ isPreviewModalOpen, previewFiles, handleClosePreviewModal }) => {
	const [currentFile, setCurrentFile] = useState(null);

	const handlePreviewFile = (file) => {
		setCurrentFile(file);
	};

	return (
		<>
			<Modal
				width={900}
				title='Danh sách các file'
				visible={isPreviewModalOpen}
				onCancel={handleClosePreviewModal}
				footer={[
					<Button key='close' onClick={handleClosePreviewModal}>
						Đóng
					</Button>,
				]}
			>
				<div style={{ height: '60vh', overflow: 'auto' }}>
					{previewFiles?.map((file, index) => (
						<div key={index} style={{
							display: 'flex',
							justifyContent: 'space-between',
							padding: '8px 0',
							borderBottom: '1px solid #f0f0f0',
						}}>
							<span>{file.fileName}</span>
							<Button
								icon={<EyeOutlined />}
								onClick={() => handlePreviewFile(file)}
								type='link'
							>
								Xem
							</Button>
						</div>
					))}
				</div>
			</Modal>
			{currentFile && (<PreviewComponent data={currentFile} onClose={() => setCurrentFile(null)} />)}
		</>
	);
};

export default ListFile;
