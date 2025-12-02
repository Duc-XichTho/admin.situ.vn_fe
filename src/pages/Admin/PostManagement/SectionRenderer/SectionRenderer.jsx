import React from 'react';

import TableRenderer from './TableRenderer/TableRenderer';
import TipTapRenderer from './TipTapRenderer/TipTapRenderer.jsx';

const SectionRenderer = ({ sectionPageData, fieldConfigs, itemData, setItemData }) => {
	if (!sectionPageData?.show) {
		return <p style={{ padding: 16 }}>Lỗi...</p>;
	}

	const renderContent = () => {
		switch (sectionPageData.type) {
			case 'ListTipTap':
				return <TipTapRenderer dataTiptap={itemData} />;
			case 'TipTapRenderer':
				return <TipTapRenderer dataTiptap={itemData} />;
			case 'Table':
			case 'Form':
			case 'File':
			case 'Album':
				return <TableRenderer sectionPageData={sectionPageData}
									  fieldConfigs={fieldConfigs}
									  itemData={itemData}
									  setItemData={setItemData} />;
			default:
				return <p style={{ padding: 16 }}>Đang tải dữ liệu...</p>;
		}
	};

	return (
		<>
			<div style={{height : '73vh'}}>
				{renderContent()}
			</div>
		</>
	);
};

export default SectionRenderer; 