import React from 'react';
import { Button, Tooltip } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';

const ShareButton = ({ onShare, item = null, size = 'small', style = {} }) => {
	const handleClick = (e) => {
		e.stopPropagation();
		onShare(item);
	};

	return (
		<Tooltip title={item ? `Chia sẻ "${item.title}"` : 'Chia sẻ trạng thái hiện tại'}>
			<Button
				type="text"
				icon={<ShareAltOutlined style={{ fontSize: '16px' }} />}
				size={size}
				onClick={handleClick}
				style={{ fontSize: '13px', color: '#9F9F9F'}}
			>
				Chia sẻ
			</Button>
		</Tooltip>
	);
};

export default ShareButton;
