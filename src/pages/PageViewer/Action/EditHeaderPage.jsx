import { Input, Modal } from 'antd';

export default function EditHeaderPage({ isModalOpen, handleOk, closeModal, inputValue, setInputValue }) {
	return (
		<Modal
			title='Chỉnh sửa Header'
			open={isModalOpen}
			onOk={handleOk}
			onCancel={closeModal}
			okText='Lưu'
			cancelText='Hủy'
		>
			<Input
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				placeholder='Nhập tiêu đề mới'
			/>
		</Modal>
	);
}