import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import PreviewFile from './PreviewFile';

const PreviewFileModal = ({
							  open,
							  onClose,
							  fileUrl,
							  fileName,
							  title,
						  }) => {

	// Helper function to download file
	const downloadFile = async (url, fileName) => {
		try {
			// Check if URL is valid
			if (!url || !fileName) {
				console.error('URL hoặc tên file không hợp lệ');
				return;
			}

			// For same-origin files, use direct download
			if (url.startsWith(window.location.origin) || url.startsWith('/')) {
				const link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				return;
			}

			// For external URLs, fetch and download
			try {
				const response = await fetch(url, {
					method: 'GET',
					mode: 'cors',
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const blob = await response.blob();
				const downloadUrl = window.URL.createObjectURL(blob);

				const link = document.createElement('a');
				link.href = downloadUrl;
				link.download = fileName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				// Clean up the object URL
				window.URL.revokeObjectURL(downloadUrl);

			} catch (fetchError) {
				console.warn('Fetch failed, trying direct download:', fetchError);

				// Fallback to direct download
				const link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}

		} catch (error) {
			console.error('Download error:', error);
		}
	};
	return (
		<Modal
			title={title || `Preview: ${fileName || 'File'}`}
			open={open}
			onCancel={onClose}
			footer={[
				<Button
					key="download"
					type="primary"
					icon={<DownloadOutlined />}
					onClick={() => downloadFile(fileUrl, fileName)}
					disabled={!fileUrl || !fileName}
				>
					Tải về
				</Button>,
				<Button
					key="close"
					onClick={onClose}
				>
					Đóng
				</Button>
			]}
			width="60vw"
			height='80vh'
			destroyOnClose={true}
		>
			{fileUrl && (
				<PreviewFile
					fileUrl={fileUrl}
					fileName={fileName}
					height="65vh"
					showHeader={false}
					showDownload={true}
				/>
			)}
		</Modal>
	);
};

PreviewFileModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	fileUrl: PropTypes.string,
	fileName: PropTypes.string,
	title: PropTypes.string,
};

export default PreviewFileModal;
