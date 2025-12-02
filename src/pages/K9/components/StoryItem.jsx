import React from 'react';
import styles from '../K9.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Avatar } from 'antd';

const StoryItem = ({
					   item,
					   expandedItem,
					   showDetailId,
					   currentPlayingId,
					   isPlaying,
					   isLoading,
					   onItemClick,
					   onShowDetail,
					   onPlayStory,
					   onStopStory,
					   isBookmarked = false,
					   onToggleBookmark,
				   }) => {
	const getCategoryLabel = (category) => {
		switch (category) {
			case 'business':
				return 'Kinh doanh';
			case 'innovation':
				return 'Đổi mới';
			case 'leadership':
				return 'Lãnh đạo';
			case 'success':
				return 'Thành công';
			default:
				return category;
		}
	};

	const getTimeAgo = (createdAt) => {
		if (!createdAt) return '-';

		const date = new Date(createdAt);
		if (isNaN(date.getTime())) return '-';

		const now = new Date();
		const diffMs = now - date;
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays > 0) {
			return `${diffDays} ngày trước`;
		} else if (diffHours > 0) {
			return `${diffHours} giờ trước`;
		} else {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return diffMinutes > 0 ? `${diffMinutes} phút trước` : 'Vừa xong';
		}
	};

	return (
		<div
			className={`${styles.storyItem} ${isBookmarked ? styles.hasBookmark : ''}`}
			onClick={() => onItemClick(item)}
		>
			{/* Avatar on the left */}
			{item.avatarUrl && (
				<div className={styles.avatarWrapper}>
					<Avatar src={item.avatarUrl} size={40} />
				</div>
			)}
			<div className={styles.storyContent}>
				<div className={styles.storyTitle}>{item.title}</div>
				{/* Always expanded by default */}
				<div className={styles.storyExpandedContent}>
					<div className={styles.storySummary}>{item.summary}</div>
					{item.detail && (
						<button
							className={styles.detailBtn}
							onClick={(e) => onShowDetail(item, e)}
						>
							{showDetailId === item.id ? '\u1ea8n chi ti\u1ebft' : 'Xem chi ti\u1ebft'}
						</button>
					)}
					{showDetailId === item.id && item.detail && (
						<div className={styles.newsDetail}>
							<div
								className={styles.markdownContent}
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(marked.parse(item.detail || '')),
								}}
							/>
						</div>
					)}
				</div>
				<div className={styles.storyMeta}>
					<span className={styles.categoryTag}>
						<span className={styles.categoryEmoji}>{item.emoji}</span>
						{getCategoryLabel(item.category)}
					</span>
					<span className={styles.storyTime}>
						{getTimeAgo(item.createdAt)}
					</span>
					{/* Move important icon to the end, same level as category and time */}
					{item.impact === 'important' && <span className={styles.impactIcon} style={{marginLeft: 6}}></span>}
				</div>
			</div>
			<div className={styles.storyActions}>
				<button
					className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
					title={isBookmarked ? 'B\u1ecf bookmark' : 'Th\u00eam bookmark'}
					onClick={(e) => {
						e.stopPropagation();
						onToggleBookmark(item);
					}}
				>
					{isBookmarked ? '\ud83d\udd16' : '\ud83d\udcd6'}
				</button>
				{item.audioUrl && (
					<button
						className={`${styles.playBtn} ${currentPlayingId === item.id ? styles.playing : ''}`}
						onClick={(e) => onPlayStory(item, e)}
						disabled={isLoading && currentPlayingId === item.id}
						title={isLoading && currentPlayingId === item.id ? 'Loading...' :
							isPlaying && currentPlayingId === item.id ? 'T\u1ea1m d\u1eebng' : 'Ph\u00e1t audio'}
					>
						{isLoading && currentPlayingId === item.id ? '\u23f3' :
							isPlaying && currentPlayingId === item.id ? '\u23f8\ufe0f' : '\u25b6\ufe0f'}
					</button>
				)}
				{currentPlayingId === item.id && (
					<button
						className={styles.actionBtn}
						onClick={(e) => onStopStory(e)}
						title="D\u1eebng ho\u00e0n to\u00e0n"
					>
						\u23f9\ufe0f
					</button>
				)}
			</div>
		</div>
	);
};

export default StoryItem;
