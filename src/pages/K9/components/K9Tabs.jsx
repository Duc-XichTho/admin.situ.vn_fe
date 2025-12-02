import React, { useState, useEffect } from 'react';
import styles from '../K9.module.css';

const K9Tabs = ({ activeTab, onTabChange, tabOptions, newsItems, caseTrainingItems, longFormItems, selectedProgram }) => {

	// State to store question counts for each tab
	const [questionCounts, setQuestionCounts] = useState({
		stream: 0,
		caseTraining: 0,
		longForm: 0
	});

	// State to manage dropdown visibility and mobile detection
	const [showDropdown, setShowDropdown] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Calculate question counts for each tab
	const getQuestionCount = (tabKey) => {
		let items = [];
		switch (tabKey) {
			case 'stream':
				items = newsItems || [];
				break;
			case 'caseTraining':
				items = caseTrainingItems || [];
				break;
			case 'longForm':
				items = longFormItems || [];
				break;
			default:
				return 0;
		}
		// Filter items by selectedProgram if not 'all'
		if (selectedProgram && selectedProgram !== 'all') {
			items = items.filter(item => {
				if ( !Array.isArray(item?.tag4)) {
					return false;
				}
				return item?.tag4.includes(selectedProgram);
			});
		}

		// // Count items with questions - check for both questionContent and nested structure
		// const count = items.filter(item => {
		// 	// Check for direct questionContent
		// 	if (item.questionContent != null && item.questionContent != undefined) {
		// 		// Check if it has actual question data
		// 		const hasQuiz = item.questionContent.questionQuiz && item.questionContent.questionQuiz.length > 0;
		// 		const hasEssay = item.questionContent.questionEssay && item.questionContent.questionEssay.length > 0;
		// 		return hasQuiz || hasEssay;
		// 	}
		// 	// Check for nested questionContent structure (as used in AddCaseModal)
		// 	if (item.questionContent && item.questionContent.questionContent) {
		// 		const nestedContent = item.questionContent.questionContent;
		// 		const hasQuiz = nestedContent.questionQuiz && nestedContent.questionQuiz.length > 0;
		// 		const hasEssay = nestedContent.questionEssay && nestedContent.questionEssay.length > 0;
		// 		return hasQuiz || hasEssay;
		// 	}
		// 	return false;
		// }).length;
		
		return items.length;
	};

	// Check if mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Recalculate question counts when selectedProgram or items change
	useEffect(() => {
		const newCounts = {
			stream: getQuestionCount('stream'),
			caseTraining: getQuestionCount('caseTraining'),
			longForm: getQuestionCount('longForm')
		};
		setQuestionCounts(newCounts);
	}, [selectedProgram, newsItems, caseTrainingItems, longFormItems]);

	return (
		<div className={styles.tabsWrapper}>
			<div className={styles.tabs}>
				{/* Desktop: Show all tabs */}
				{!isMobile && tabOptions.map(tab => {
					const questionCount = questionCounts[tab.key] || 0;					
					return (
						<button
							key={tab.key}
							className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
							onClick={() => onTabChange(tab.key)}
							title={tab.label}
						>
							<span>{tab.label}</span>
							{/* Show question count badge for specific tabs */}
							{(tab.key === 'stream' || tab.key === 'caseTraining' || tab.key === 'longForm') && questionCount > 0 && (
								<span className={styles.questionCountBadge}>
									{questionCount}
								</span>
							)}
						</button>
					);
				})}

				{/* Mobile: Show only first 3 tabs + dropdown */}
				{isMobile && (
					<>
						{tabOptions.slice(0, 3).map(tab => {
							const questionCount = questionCounts[tab.key] || 0;					
							return (
								<button
									key={tab.key}
									className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
									onClick={() => onTabChange(tab.key)}
									title={tab.label}
								>
									<span>{tab.label}</span>
									{/* Show question count badge for specific tabs */}
									{(tab.key === 'stream' || tab.key === 'caseTraining' || tab.key === 'longForm') && questionCount > 0 && (
										<span className={styles.questionCountBadge}>
											{questionCount}
										</span>
									)}
								</button>
							);
						})}
						
						{/* Show "..." if there are more than 3 tabs */}
						{tabOptions.length > 3 && (
							<div className={styles.moreTabsDropdown}>
								<button 
									className={styles.moreTabsBtn}
									onClick={() => setShowDropdown(!showDropdown)}
								>
									<span>...</span>
								</button>
							{showDropdown && (
								<div className={styles.dropdownContent}>
									{tabOptions.slice(3).map(tab => {
										const questionCount = questionCounts[tab.key] || 0;
										return (
											<button
												key={tab.key}
												className={`${styles.dropdownItem} ${activeTab === tab.key ? styles.active : ''}`}
												onClick={() => {
													onTabChange(tab.key);
													setShowDropdown(false);
												}}
												title={tab.label}
											>
												<span>{tab.label}</span>
												{(tab.key === 'stream' || tab.key === 'caseTraining' || tab.key === 'longForm') && questionCount > 0 && (
													<span className={styles.questionCountBadge}>
														{questionCount}
													</span>
												)}
											</button>
										);
									})}
								</div>
							)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default K9Tabs;
