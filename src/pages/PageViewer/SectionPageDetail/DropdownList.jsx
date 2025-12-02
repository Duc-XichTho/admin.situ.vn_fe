import React from 'react';

function DropdownList({
						  show,
						  onClose,
						  searchText,
						  setSearchText,
						  filteredList,
						  handleViewDetail,
						  minWidth = 320,
						  css
					  }) {
	if (!show) return null;
	return (
		<div
			className={css?.customScrollbar}
			style={{
				position: 'absolute',
				top: '100%',
				left: 0,
				background: '#fff',
				border: '1px solid #ddd',
				boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
				zIndex: 100,
				minWidth,
				maxHeight: 320,
				overflowY: 'auto',
				padding: 8
			}}
		>
			<input
				type="text"
				placeholder="Tìm kiếm bài viết..."
				value={searchText}
				onChange={e => setSearchText(e.target.value)}
				style={{
					width: '100%',
					marginBottom: 8,
					padding: '6px 10px',
					borderRadius: 6,
					border: '1px solid #ccc',
					fontSize: 14
				}}
				autoFocus
			/>
			{filteredList.length > 0 ? (
				filteredList.map(item => (
					<div
						key={item.id}
						style={{
							padding: '8px 12px',
							cursor: 'pointer',
							borderBottom: '1px solid #f0f0f0',
							fontSize: 15,
							display: 'flex',
							alignItems: 'center',
							gap: 8
						}}
						onClick={() => {
							onClose();
							setSearchText('');
							handleViewDetail(item.id);
						}}
					>
						<span>{item.name || 'Tiêu đề'}</span>
						{item.hide && (
							<span style={{ color: '#b71c1c', fontSize: 14, fontWeight: 500 }}>
                Đã ẩn
              </span>
						)}
					</div>
				))
			) : (
				<div style={{ padding: '8px 12px', color: '#aaa' }}>Không có kết quả</div>
			)}
		</div>
	);
}

export default DropdownList;