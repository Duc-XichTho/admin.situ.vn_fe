import React from 'react';
import { Table, Card, Space, Tag } from 'antd';
import { BCTC } from '../../../DataDemo/BCTC.js';
import { CompanyInfo } from '../../../DataDemo/CompanyInfo.js';
import { CompanyEvent } from '../../../DataDemo/CompanyEvent.js';

const CompanyReportPreview = ({ record, settings }) => {
	// Lấy dữ liệu theo nguồn
	const getDataSource = (dataSource) => {
		switch (dataSource) {
			case 'BCTC':
				return BCTC;
			case 'CompanyInfo':
				return CompanyInfo;
			case 'CompanyEvent':
				return CompanyEvent;
			default:
				return [];
		}
	};

	// Lọc dữ liệu theo cấu hình
	const filterData = (data, compareColumn, recordCode) => {
		return data.filter(item => item[compareColumn] === recordCode);
	};

	// Tạo cột cho bảng
	const createColumns = (dataSource) => {
		const data = getDataSource(dataSource);
		if (data.length === 0) return [];

		const columns = Object.keys(data[0]).filter(key => key !== 'id').map(column => ({
			title: column,
			dataIndex: column,
			key: column,
			width: 150,
			render: (value) => {
				if (value === null || value === undefined || value === '') {
					return '-';
				}

				let displayValue = value;

				// Format số tiền
				if (typeof value === 'number' || (typeof value === 'string' && (value.includes('E+') || column.includes('Vốn') || column.includes('đồng')))) {
					if (typeof value === 'string' && value.includes('E+')) {
						displayValue = Number(value).toLocaleString('vi-VN');
					} else {
						displayValue = typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
					}
				}

				// Giới hạn hiển thị 50 ký tự
				if (typeof displayValue === 'string' && displayValue.length > 50) {
					return (
						<span title={displayValue}>
              {displayValue.substring(0, 50)}...
            </span>
					);
				}

				return displayValue;
			},
		}));

		return columns;
	};

	if (!record || !settings) {
		return <div>Không có dữ liệu để hiển thị</div>;
	}

	const recordCode = record['Mã CK'];

	return (
		<div style={{ padding: '20px', height: '60vh', overflowY: 'auto' }}>
			<h2 style={{ marginBottom: '20px', color: '#1890ff' }}>
				Preview: Báo cáo {record['Tên tiếng Việt']} ({recordCode})
			</h2>

			<Space direction="vertical" size="large" style={{ width: '100%' }}>
				{/* Bảng Định giá */}
				{settings.valuationTable && (
					<Card title="📊 Bảng Định giá" size="small">
						<Table
							dataSource={filterData(
								getDataSource(settings.valuationTable.dataSource),
								settings.valuationTable.compareColumn,
								recordCode,
							).slice(0, settings.valuationTable.rowCount)}
							columns={createColumns(settings.valuationTable.dataSource)}
							pagination={false}
							size="small"
							scroll={{ x: 800 }}
							rowKey="id"
						/>
					</Card>
				)}

				{/* Bảng tỷ số tài chính */}
				{settings.financialRatioTable && (
					<Card title="💰 Bảng tỷ số tài chính" size="small">
						<Table
							dataSource={filterData(
								getDataSource(settings.financialRatioTable.dataSource),
								settings.financialRatioTable.compareColumn,
								recordCode,
							).slice(0, settings.financialRatioTable.rowCount)}
							columns={createColumns(settings.financialRatioTable.dataSource)}
							pagination={false}
							size="small"
							scroll={{ x: 800 }}
							rowKey="id"
						/>
					</Card>
				)}
			</Space>
		</div>
	);
};

export default CompanyReportPreview;
