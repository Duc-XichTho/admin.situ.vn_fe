import { Checkbox, Modal, Tag, Input, Button } from 'antd';
import React, { useState } from 'react';

export default function SettingTableCustom({
											   isModalOpen,
											   handleCloseModal,
											   fieldConfigs,
											   handleToggleRequired,
											   handleToggleShow,
											   setFieldConfigs
										   }) {
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
	const [currentFieldKey, setCurrentFieldKey] = useState(null);
	const [newOptionValue, setNewOptionValue] = useState('');

	const handleAddOptionClick = (key) => {
		setCurrentFieldKey(key);
		setIsOptionModalOpen(true);
		setNewOptionValue('');
	};

	const handleSaveOption = () => {
		if (!newOptionValue.trim()) return;

		const updatedConfigs = fieldConfigs.map((field) => {
			if (field.key === currentFieldKey) {
				return {
					...field,
					options: [...(field.options || []), newOptionValue]
				};
			}
			return field;
		});
		setFieldConfigs(updatedConfigs);
		setIsOptionModalOpen(false);
	};

	return (
		<>
			<Modal
				title="Cài đặt hiển thị"
				open={isModalOpen}
				onCancel={handleCloseModal}
				footer={null}
				width={600}
			>
				{fieldConfigs.map((field) => (
					<div
						key={field.key}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 0',
							borderBottom: '1px solid #eee',
						}}
					>
						<div>
							<div style={{ fontWeight: 600 }}>{field.label}</div>
							{field.options && (
								<div style={{ marginTop: 4 }}>
									{field.options.map((opt) => (
										<Tag color="blue" key={opt} style={{ marginRight: 4 }}>
											{opt}
										</Tag>
									))}
									<span
										style={{ color: '#1677ff', cursor: 'pointer' }}
										onClick={() => handleAddOptionClick(field.key)}
									>
										+ Thêm
									</span>
								</div>
							)}
						</div>
						<div style={{ display : 'flex' , alignItems : 'center' , gap : '10px' , textAlign: 'right' }}>
							{['nguoi_gui', 'mo_ta', ].includes(field.key) && (
								<>
									<span>Bắt buộc</span>
									<Checkbox
										checked={field.required}
										onChange={(e) => handleToggleRequired(field.key, e.target.checked)}
										style={{ marginLeft: 8 }}
										disabled={!field.show}
									/>
								</>
							)}
							<span>{field.key !== 'tieu_de' ? 'Áp dụng' : 'Cài mặc định'}</span>
							<Checkbox
								checked={field.show}
								onChange={(e) => handleToggleShow(field.key, e.target.checked)}
								style={{ marginLeft: 8 }}
								disabled={field.key === 'tieu_de'}
							/>
						</div>
					</div>
				))}
			</Modal>

			<Modal
				title="Thêm tùy chọn mới"
				open={isOptionModalOpen}
				onCancel={() => setIsOptionModalOpen(false)}
				onOk={handleSaveOption}
				okText="Lưu"
				cancelText="Hủy"
			>
				<Input
					value={newOptionValue}
					onChange={(e) => setNewOptionValue(e.target.value)}
					placeholder="Nhập giá trị mới"
				/>
			</Modal>
		</>
	);
}
