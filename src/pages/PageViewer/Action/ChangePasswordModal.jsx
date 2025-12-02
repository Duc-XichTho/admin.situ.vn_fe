import { Modal, Input, Button } from 'antd';

export default function ChangePasswordModal({
												visible,
												onCancel,
												onOk,
												currentPassword,
												oldPassword,
												newPassword,
												confirmPassword,
												onChangeOldPassword,
												onChangeNewPassword,
												onChangeConfirmPassword,
												isPasswordConfirmed,
												onConfirmOldPassword
											}) {
	return (
		<Modal
			title="Thay đổi mật khẩu truy cập trang"
			open={visible}
			onOk={onOk}
			onCancel={onCancel}
			okText="Lưu"
			cancelText="Hủy"
		>
			{/*{!isPasswordConfirmed ? (*/}
			{/*	<div>*/}
			{/*		<label style={{ fontWeight: 'bold' }}>Mật khẩu cũ</label>*/}
			{/*		<Input.Password*/}
			{/*			placeholder="Nhập mật khẩu cũ"*/}
			{/*			value={oldPassword}*/}
			{/*			onChange={onChangeOldPassword}*/}
			{/*			style={{ marginBottom: 10 }}*/}
			{/*		/>*/}
			{/*		<Button*/}
			{/*			type="primary"*/}
			{/*			onClick={onConfirmOldPassword}*/}
			{/*			style={{ marginTop: 10 }}*/}
			{/*			block*/}
			{/*		>*/}
			{/*			Xác nhận mật khẩu cũ*/}
			{/*		</Button>*/}
			{/*	</div>*/}
			{/*) : (*/}
				<div>
					<label style={{ fontWeight: 'bold' }}>Mật khẩu mới</label>
					<Input
						placeholder="Nhập mật khẩu mới"
						value={newPassword || currentPassword}
						onChange={onChangeNewPassword}
						style={{ marginBottom: 10 }}
					/>

					{/*<label style={{ fontWeight: 'bold' }}>Xác nhận mật khẩu mới</label>*/}
					{/*<Input.Password*/}
					{/*	placeholder="Nhập lại mật khẩu mới"*/}
					{/*	value={confirmPassword}*/}
					{/*	onChange={onChangeConfirmPassword}*/}
					{/*/>*/}
				</div>
		</Modal>
	);
}
