import React from 'react';
import { Settings, Plus, Search } from 'lucide-react';
import styles from './CaseUser.module.css';

const Toolbar = ({
	currentUser,
	searchTerm,
	onSearchChange,
	onOpenSettings,
	onOpenAdd
}) => {
	return (
		<div className={styles.toolbar}>
			<div className={styles.searchContainer}>
				<Search size={16} className={styles.searchIcon} />
				<input
					type="text"
					placeholder="Tìm kiếm case..."
					value={searchTerm}
					onChange={onSearchChange}
					className={styles.searchInput}
				/>
			</div>
			<div className={styles.toolbarActions}>
				{currentUser?.isAdmin && 
					<button
						className={styles.toolbarBtn}
						onClick={onOpenSettings}
						title="Cài đặt"
					>
						<Settings size={18} />
					</button>
				}
				<button
					className={styles.toolbarBtn}
					onClick={onOpenAdd}
					title="Thêm case mới"
				>
					<Plus size={18} />
				</button>
			</div>
		</div>
	);
};

export default Toolbar;
