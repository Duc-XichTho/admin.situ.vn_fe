import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import './PreviewComponent.css';

const PreviewComponent = ({ data, onClose, allowDownload }) => {
	if (!data) return null;

	const fileExtension = data.fileExtension?.replace('.', '').toLowerCase();
	const imgTypes = ["jpg", "png", "svg", "jpeg", "gif"];
	const isImage = imgTypes.includes(fileExtension);
	const docTypes = ["doc", "docx", 'xls', 'xlsx', "txt", "csv"];
	const isDoc = docTypes.includes(fileExtension);
	const isPDF = fileExtension === "pdf";

	const isEncoded = (str) => /%[0-9A-F]{2}|\\x[0-9A-F]{2}|Ã|Â|Â|¼|½|¾|¿/.test(str);

	const fixEncoding = (str) => {
		if (!isEncoded(str)) return str;
		try {
			const bytes = new Uint8Array([...str].map(char => char.charCodeAt(0)));
			return new TextDecoder('utf-8').decode(bytes);
		} catch {
			return str;
		}
	};

	const handleDownload = async (url, fileName) => {
		try {
			const response = await fetch(url, {
				mode: 'cors',
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error('Error downloading file:', error);
		}
	};

	const fileUrl = data.fileUrl || data.url;
	const fileName = data.fileName || data.name;

	return (
		<div className="preview-modal">
			<div className="preview-modal-content">
				<span className="preview-close" onClick={onClose}>&times;</span>
				<div style={{ display: "flex", alignItems: "center", gap: '10px' }}>
					<h2>Preview {fileName}</h2>
				</div>
				<div className="preview-body" onContextMenu={e => e.preventDefault()}>
					{isImage && <img src={fileUrl} alt={fileName} className="preview-image" />}
					{isPDF && (
						<iframe
							src={`${fileUrl}${!allowDownload ? '#toolbar=0' : ''}`}
							className="preview-pdf"
							title={fileName}
						></iframe>
					)}
					{isDoc && (
						<div className="preview-doc">
							<DocViewer
								documents={[{ uri: fileUrl, fileType: fileExtension }]}
								pluginRenderers={DocViewerRenderers}
							/>
						</div>
					)}
					{!isImage && !isPDF && !isDoc && (
						<div className="preview-default">
							<p>Định dạng tệp tin không hỗ trợ việc xem trước.</p>
						</div>
					)}
					{allowDownload && (
						<div style={{ marginTop: 16, textAlign: 'center' }}>
							<Button type="primary" onClick={() => handleDownload(fileUrl, fixEncoding(fileName))}>
								Tải về
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

PreviewComponent.propTypes = {
	data: PropTypes.object.isRequired,
	onClose: PropTypes.func.isRequired,
	allowDownload: PropTypes.bool,
};

export default PreviewComponent;