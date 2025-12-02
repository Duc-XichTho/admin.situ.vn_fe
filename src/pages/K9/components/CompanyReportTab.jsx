import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AutoComplete, Button, Card, Divider, Empty, message, Modal, Select, Table, Tag, Typography, Tabs } from 'antd';
import { FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './CompanyReportTab.module.css';
import cssMarkdown from '../K9.module.css';
import { ScanBarcode } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

import { MyContext } from '../../../MyContext.jsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {
	createOrUpdateSettingByTypeExternal,
	getAllCompanyReportsExternal,
	getSettingByTypeExternal,
	createAISummary,
	getAllFinRatioNganhangsByMaCKExternal,
	getAllFinRatioNganhangsByMaCK2External,
	getAllFinRatioChungkhoansByMaCKExternal,
	getAllFinRatioChungkhoansByMaCK2External,
	getAllFinRatioBaohiemsByMaCKExternal,
	getAllFinRatioBaohiemsByMaCK2External,
	getAllFinRatioPhitaichinhByMaCKExternal,
	getAllFinRatioPhitaichinhByMaCK2External,
	getAllCompanyInfosExternal,
	getAISummaries,
} from '../../../apis/serviceApi/k9Service.jsx';
import { LIST_FIN_RATIO } from '../../../constain/LIST_FIN_RATIO.js';
import { aiGen } from '../../../apis/aiGen/botService.jsx';

const { Title, Text, Paragraph } = Typography;

const CompanyReportTab = ({ aiSummaries: parentAiSummaries }) => {
	const { currentUser } = useContext(MyContext);
	const [searchTerm, setSearchTerm] = useState('');
	const [filteredReports, setFilteredReports] = useState([]);
	const [companyReportData, setCompanyReportsData] = useState([]);
	const [companyInfo, setCompanyInfo] = useState([]);
	const [finRatioDataByMaCK, setFinRatioDataByMaCK] = useState([]);
	const [finRatioDataPeers, setFinRatioDataPeers] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [hasFoundData, setHasFoundData] = useState(false);
	const [loading, setLoading] = useState(false);
	const [matchedAISummary, setMatchedAISummary] = useState(null);
	const [valuationRows, setValuationRows] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCreatingSummary, setIsCreatingSummary] = useState(false);
	const [currentCompanySummary, setCurrentCompanySummary] = useState(null);
	const [aiSummaries, setAiSummaries] = useState([]);
	const [selectedQuarter, setSelectedQuarter] = useState(null);
	const [sidebarLoading, setSidebarLoading] = useState(false);
	const [searchTimeout, setSearchTimeout] = useState(null);

	// Thêm AbortController để có thể hủy API calls
	const [abortController, setAbortController] = useState(null);

	// Cleanup function để hủy API calls khi component unmount hoặc chuyển tab
	useEffect(() => {
		return () => {
			if (abortController) {
				abortController.abort();
			}
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [abortController, searchTimeout]);

	// Thêm state để quản lý việc load từng loại dữ liệu
	const [dataLoadingStatus, setDataLoadingStatus] = useState({
		companyReports: false,
		companyInfos: false,
		finRatios: false,
		finRatioNH: false,
		finRatioCK: false,
		finRatioBH: false,
		aiSummaries: false,
	});

	// Thêm state để track dữ liệu đã được load
	const [loadedDataTypes, setLoadedDataTypes] = useState(new Set());

	// Thêm state để quản lý việc tìm kiếm real-time
	const [searchResults, setSearchResults] = useState({
		valuationData: [],
		financialRatioData: [],
		companyInfoData: null,
		hasAnyData: false,
	});

	// Thêm state cho AutoComplete
	const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

	// State chọn kiểu dữ liệu (quý/năm)
	const [dataType, setDataType] = useState('quarter'); // 'quarter' | 'year'

	// Hàm kiểm tra xem mã CK và nguồn có AI Summary không
	const hasAISummaryForCodeAndSource = (maCK, nguon) => {
		if (!Array.isArray(aiSummaries) || !maCK || !nguon) return false;

		return aiSummaries.some((item) => {
			try {
				const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
				const itemData = info?.itemData;
				if (!itemData) return false;
				const itemMaCK = itemData['Mã CK'] || '';
				const itemNguon = itemData['Nguồn'] || '';
				return itemMaCK.toLowerCase() === maCK.toLowerCase() &&
					itemNguon.toLowerCase() === nguon.toLowerCase();
			} catch {
				return false;
			}
		});
	};

	// Hàm mở modal với AI Summary tương ứng với mã CK và nguồn
	const openAISummaryModalForSource = (maCK, nguon) => {
		if (!Array.isArray(aiSummaries) || !maCK || !nguon) return;

		const matchedList = aiSummaries.filter((item) => {
			try {
				const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
				const itemData = info?.itemData;
				if (!itemData) return false;
				const itemMaCK = itemData['Mã CK'] || '';
				const itemNguon = itemData['Nguồn'] || '';
				return itemMaCK.toLowerCase() === maCK.toLowerCase() &&
					itemNguon.toLowerCase() === nguon.toLowerCase();
			} catch {
				return false;
			}
		});

		if (matchedList.length > 0) {
			// Sắp xếp mới nhất
			matchedList.sort((a, b) => {
				const infoA = typeof a.info === 'string' ? JSON.parse(a.info) : a.info;
				const infoB = typeof b.info === 'string' ? JSON.parse(b.info) : b.info;
				const dateA = new Date(infoA?.itemData?.['Ngày công bố'] || infoA?.itemData?.['Ngày khuyến nghị'] || 0);
				const dateB = new Date(infoB?.itemData?.['Ngày công bố'] || infoB?.itemData?.['Ngày khuyến nghị'] || 0);
				return dateB - dateA;
			});
			setMatchedAISummary(matchedList[0]);
			setIsModalOpen(true);
		}
	};

	// Load từng loại dữ liệu riêng biệt
	const loadCompanyReports = async () => {
		if (loadedDataTypes.has('companyReports')) return;

		setDataLoadingStatus(prev => ({ ...prev, companyReports: true }));
		try {
			const list = await getAllCompanyReportsExternal(abortController?.signal);
			const data = list.map((item) => item.data);
			setCompanyReportsData(data);
			setLoadedDataTypes(prev => new Set([...prev, 'companyReports']));
		} catch (error) {
			if (error.name === 'AbortError') {
				return;
			}
			console.error('Error loading company reports:', error);
		} finally {
			setDataLoadingStatus(prev => ({ ...prev, companyReports: false }));
		}
	};

	const loadCompanyInfos = async () => {
		if (loadedDataTypes.has('companyInfos')) return;

		setDataLoadingStatus(prev => ({ ...prev, companyInfos: true }));
		try {
			const list = await getAllCompanyInfosExternal(abortController?.signal);
			const data = list.map((item) => item.data);
			setCompanyInfo(data);
			setLoadedDataTypes(prev => new Set([...prev, 'companyInfos']));
		} catch (error) {
			if (error.name === 'AbortError') {
				return;
			}
			console.error('Error loading company infos:', error);
		} finally {
			setDataLoadingStatus(prev => ({ ...prev, companyInfos: false }));
		}
	};

	// Hàm lấy dữ liệu tỷ số tài chính theo mã CK - chỉ gọi đến khi tìm thấy
	const loadFinRatioByMaCK = async (maCK) => {
		if (!maCK) return [];
		try {
			let result = [];
			if (dataType === 'year') {
				console.log(1);
				// Dữ liệu năm: gọi các hàm ByMaCK2
				try {
					const dataNH = await getAllFinRatioNganhangsByMaCK2External(maCK);
					if (dataNH && dataNH.length > 0) {
						result = dataNH.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataCK = await getAllFinRatioChungkhoansByMaCK2External(maCK);
					if (dataCK && dataCK.length > 0) {
						result = dataCK.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataBH = await getAllFinRatioBaohiemsByMaCK2External(maCK);
					if (dataBH && dataBH.length > 0) {
						result = dataBH.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataPTC = await getAllFinRatioPhitaichinhByMaCK2External(maCK);
					if (dataPTC && dataPTC.length > 0) {
						result = dataPTC.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				return [];
			} else {
				console.log(2);
				// Dữ liệu quý: gọi các hàm ByMaCK
				try {
					const dataNH = await getAllFinRatioNganhangsByMaCKExternal(maCK);
					if (dataNH && dataNH.length > 0) {
						result = dataNH.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataCK = await getAllFinRatioChungkhoansByMaCKExternal(maCK);
					if (dataCK && dataCK.length > 0) {
						result = dataCK.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataBH = await getAllFinRatioBaohiemsByMaCKExternal(maCK);
					if (dataBH && dataBH.length > 0) {
						result = dataBH.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				try {
					const dataPTC = await getAllFinRatioPhitaichinhByMaCKExternal(maCK);
					if (dataPTC && dataPTC.length > 0) {
						result = dataPTC.map(item => item.data || item);
						return result;
					}
				} catch (error) {
				}
				console.log(12);
				return [];
			}
		} catch (error) {
			console.log(error);
			return [];
		}
	};

	// Load tất cả dữ liệu theo thứ tự ưu tiên
	const loadAllData = async () => {
		setLoading(true);
		try {
			// Load theo thứ tự ưu tiên: AI Summary -> Company Info -> Company Reports -> FinRatios
			await loadAiSummaries();
			await loadCompanyInfos();
			await loadCompanyReports();
			await loadFinRatioByMaCK(searchTerm);
		} catch (error) {
			console.error('Error loading all data:', error);
		} finally {
			setLoading(false);
		}
	};

	// Function cũ để tương thích
	async function getData() {
		await loadAllData();
	}

	// Load AI Summaries directly from API
	const loadAiSummaries = async () => {
		if (loadedDataTypes.has('aiSummaries')) return;

		setDataLoadingStatus(prev => ({ ...prev, aiSummaries: true }));
		try {
			const data = await getAISummaries(abortController?.signal);
			setAiSummaries(data || []);
			setLoadedDataTypes(prev => new Set([...prev, 'aiSummaries']));
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('AI Summaries API call was aborted');
				return;
			}
			console.error('Error loading AI summaries:', error);
			setAiSummaries([]);
		} finally {
			setDataLoadingStatus(prev => ({ ...prev, aiSummaries: false }));
		}
	};

	useEffect(() => {
		getData();
		loadAiSummaries();
	}, []);

	// Refresh search when aiSummaries changes
	useEffect(() => {
		if (hasSearched && searchTerm.trim()) {
			// Re-run the search logic to find new CompanySummary
			const searchLower = searchTerm.toLowerCase();
			let companySummary = null;

			if (Array.isArray(aiSummaries)) {
				const companySummaryList = aiSummaries.filter((item) => {
					try {
						const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
						return info?.sheetName === 'CompanySummary' && info?.searchTerm?.toLowerCase() === searchLower;
					} catch {
						return false;
					}
				});

				if (companySummaryList.length > 0) {
					companySummaryList.sort((a, b) => {
						const dateA = new Date(a.created_at || 0);
						const dateB = new Date(b.created_at || 0);
						return dateB - dateA;
					});
					companySummary = companySummaryList[0];
				}
			}
			setCurrentCompanySummary(companySummary);
		}
	}, [aiSummaries, hasSearched, searchTerm]);

	// Function tìm kiếm real-time với dữ liệu có sẵn
	const performSearch = (term, reportsData, infosData, ratiosData, ratiosNHData, ratiosCKData, ratiosBHData, summariesData) => {
		if (!term.trim()) {
			setFilteredReports([]);
			setMatchedAISummary(null);
			setValuationRows([]);
			setHasSearched(false);
			setHasFoundData(false);
			setCurrentCompanySummary(null);
			setSearchResults({
				valuationData: [],
				financialRatioData: [],
				companyInfoData: null,
				hasAnyData: false,
			});
			return;
		}

		const searchLower = term.toLowerCase();
		let hasAnyData = false;
		let valuationData = [];
		let financialRatioData = [];
		let companyInfoData = null;

		// Tìm trong dữ liệu báo cáo định giá (nếu có)
		if (reportsData && reportsData.length > 0) {
			const filtered = reportsData.filter((item) => {
				try {
					const maCK = item['Mã CK'] || '';
					return maCK.toLowerCase().includes(searchLower);
				} catch {
					return false;
				}
			});

			if (filtered.length > 0) {
				valuationData = [...filtered].sort((a, b) => {
					const dateA = new Date(a['Ngày công bố'] || a['Ngày khuyến nghị'] || 0);
					const dateB = new Date(b['Ngày công bố'] || b['Ngày khuyến nghị'] || 0);
					return dateB - dateA;
				}).slice(0, 10);
				hasAnyData = true;
			}
		}

		// Tìm trong dữ liệu tỷ số tài chính (nếu có)
		if (ratiosData || ratiosNHData || ratiosCKData || ratiosBHData) {
			const allFinRatioData = filterFinRatioData([
				...(ratiosData || []),
				...(ratiosNHData || []),
				...(ratiosCKData || []),
				...(ratiosBHData || []),
			]);

			const finRatioFiltered = allFinRatioData.filter((item) => {
				try {
					const maCK = item['Mã CK'] || '';
					return maCK.toLowerCase() === searchLower;
				} catch {
					return false;
				}
			});

			if (finRatioFiltered.length > 0) {
				financialRatioData = getFinRatioForSearchTerm(term);
				hasAnyData = true;
			}
		}

		// Tìm thông tin công ty (nếu có)
		if (infosData && infosData.length > 0) {
			companyInfoData = infosData.find(item =>
				(item['Mã CK'] || '').toLowerCase() === searchLower,
			);
		}

		// Cập nhật search results
		setSearchResults({
			valuationData,
			financialRatioData,
			companyInfoData,
			hasAnyData,
		});

		// Cập nhật các state cũ để tương thích
		setValuationRows(valuationData);
		setFilteredReports(valuationData);
		setHasFoundData(hasAnyData);

		// Tìm AI Summary phù hợp (nếu có)
		let matched = null;
		if (Array.isArray(summariesData)) {
			const matchedList = summariesData.filter((item) => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const itemData = info?.itemData;
					if (!itemData) return false;
					const maCK = itemData['Mã CK'] || '';
					return maCK.toLowerCase() === searchLower;
				} catch {
					return false;
				}
			});

			if (matchedList.length > 0) {
				matchedList.sort((a, b) => {
					const infoA = typeof a.info === 'string' ? JSON.parse(a.info) : a.info;
					const infoB = typeof b.info === 'string' ? JSON.parse(b.info) : b.info;
					const dateA = new Date(infoA?.itemData?.['Ngày công bố'] || infoA?.itemData?.['Ngày khuyến nghị'] || 0);
					const dateB = new Date(infoB?.itemData?.['Ngày công bố'] || infoB?.itemData?.['Ngày khuyến nghị'] || 0);
					return dateB - dateA;
				});
				matched = matchedList[0];
			}
		}
		setMatchedAISummary(matched);

		// Tìm CompanySummary cho mã CK này
		let companySummary = null;
		if (Array.isArray(summariesData)) {
			const companySummaryList = summariesData.filter((item) => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const isMatch = info?.sheetName === 'CompanySummary' && info?.searchTerm?.toLowerCase() === searchLower;
					return isMatch;
				} catch (error) {
					console.error('Error parsing item info:', error);
					return false;
				}
			});

			if (companySummaryList.length > 0) {
				companySummaryList.sort((a, b) => {
					const dateA = new Date(a.created_at || 0);
					const dateB = new Date(b.created_at || 0);
					return dateB - dateA;
				});
				companySummary = companySummaryList[0];
			}
		}
		setCurrentCompanySummary(companySummary);
		setHasSearched(true);
	};


	// Function cũ để tương thích
	const filterReports = (term) => {
		performSearch(term, companyReportData, companyInfo, finRatioDataByMaCK, [], [], [], aiSummaries);
	};

	const [inputValue, setInputValue] = useState('');

	// Function để load dữ liệu theo thứ tự ưu tiên
	const loadDataInPriorityOrder = async (term) => {

		// Hủy bỏ controller cũ nếu có
		if (abortController) {
			abortController.abort();
		}

		// Tạo controller mới
		const newController = new AbortController();
		setAbortController(newController);

		try {
			// 1. AI Summaries (ưu tiên cao nhất)
			if (!loadedDataTypes.has('aiSummaries') && !dataLoadingStatus.aiSummaries) {
				await loadAiSummaries();
				if (newController.signal.aborted) {
					return;
				}
			}

			// 2. Company Info (ưu tiên thứ 2)
			if (!loadedDataTypes.has('companyInfos') && !dataLoadingStatus.companyInfos) {
				await loadCompanyInfos();
				if (newController.signal.aborted) {
					return;
				}
			}

			// 3. Company Reports (ưu tiên thứ 3)
			if (!loadedDataTypes.has('companyReports') && !dataLoadingStatus.companyReports) {
				await loadCompanyReports();
				if (newController.signal.aborted) {
					return;
				}
			}

			if (!loadedDataTypes.has('finRatioNH') && !dataLoadingStatus.finRatioNH) {
				await loadFinRatioByMaCK(term);
				if (newController.signal.aborted) {
					return;
				}
			}
			if (!loadedDataTypes.has('finRatioCK') && !dataLoadingStatus.finRatioCK) {
				await loadFinRatioByMaCK(term);
				if (newController.signal.aborted) {
					return;
				}
			}
			if (!loadedDataTypes.has('finRatioBH') && !dataLoadingStatus.finRatioBH) {
				await loadFinRatioByMaCK(term);
				if (newController.signal.aborted) {
					return;
				}
			}

			// Tìm kiếm lại một lần cuối với tất cả dữ liệu đã load
			if (term.trim()) {
				performSearch(term, companyReportData, companyInfo, finRatioDataByMaCK, [], [], [], aiSummaries);
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('Data loading was aborted');
				return;
			}
			console.error('Error in sequential data loading:', error);
		}
	};

	// Handle Tạo tổng quan button click
	const handleTaoTongQuan = async () => {
		try {
			if (!searchTerm.trim()) {
				alert('Vui lòng tìm kiếm một mã chứng khoán trước khi tạo tổng quan');
				return;
			}

			// Kiểm tra xem có dữ liệu để phân tích không
			const hasValuationData = valuationRows.length > 0;
			const hasFinancialRatioData = searchTermFinRatioData.length > 0;
			const hasIndustryComparisonData = selectedFinRatioData.length > 0;

			if (!hasValuationData && !hasFinancialRatioData && !hasIndustryComparisonData) {
				alert('Không có dữ liệu để tạo tổng quan. Vui lòng tìm kiếm một mã chứng khoán có dữ liệu định giá, tỷ số tài chính hoặc so sánh cùng ngành.');
				return;
			}

			setIsCreatingSummary(true);

			// Tìm thông tin công ty cho mã chứng khoán này
			const companyInfoData = companyInfo.find(item =>
				(item['Mã CK'] || '').toLowerCase() === searchTerm.toLowerCase(),
			);

			// Chuẩn bị dữ liệu để gửi cho AI
			const analysisData = {
				searchTerm: searchTerm,
				companyInfo: companyInfoData || null,
				valuationData: valuationRows,
				financialRatioData: searchTermFinRatioData,
				industryComparisonData: selectedFinRatioData,
			};

			// Convert data to JSON string for prompt
			const prompt = JSON.stringify(analysisData, null, 2);
			const systemMessage = `
Bạn sẽ nhận toàn bộ dữ liệu phân tích của một mã chứng khoán dưới dạng JSON bao gồm:
- Thông tin công ty (companyInfo): thông tin cơ bản về doanh nghiệp
- Dữ liệu định giá (valuationData): các báo cáo định giá từ các nguồn khác nhau
- Dữ liệu tỷ số tài chính (financialRatioData): các chỉ số tài chính qua các kỳ
- Dữ liệu so sánh cùng ngành (industryComparisonData): so sánh với các công ty cùng ngành

Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_SHORT]
(Viết đoạn tóm tắt ngắn, 7–10 câu, nêu mục tiêu hoặc nội dung chính của báo cáo phân tích, bao gồm thông tin cơ bản về công ty.)

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết hơn, 15–20 câu, phân tích bối cảnh, cách tiếp cận và các kết luận chính, trả về dạng markdown. Sử dụng thông tin công ty để làm rõ bối cảnh phân tích.)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_SHORT] và [SUMMARY_DETAILED].
`;
			const model = 'google/gemini-2.5-flash';
			const response = await aiGen(prompt, systemMessage, model, 'text');

			// Parse the result to extract summary1 and summary2
			if (response && response.result) {
				const resultText = response.result;

				// Extract SUMMARY_SHORT section
				const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);
				const summary1 = shortMatch ? shortMatch[1].trim() : '';

				// Extract SUMMARY_DETAILED section
				const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);
				const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

				// Save to aiSummary table
				if (summary1 || summary2) {
					const aiSummaryData = {
						summary1: summary1 || null,
						summary2: summary2 || null,
						info: {
							title: 'Phân tích tổng quan ' + searchTerm,
							sheetName: 'CompanySummary',
							searchTerm: searchTerm,
							companyInfo: companyInfoData ? true : false,
							valuationDataCount: valuationRows.length,
							finalRatioDataCount: searchTermFinRatioData.length,
							industryComparisonCount: selectedFinRatioData.length,
							dataType: 'CompanySummary',
						},
					};

					try {
						const savedSummary = await createAISummary(aiSummaryData);
						// Cập nhật currentCompanySummary với tổng quan mới tạo
						setCurrentCompanySummary(savedSummary);

						// Refresh aiSummaries để cập nhật UI
						try {
							await loadAiSummaries();
						} catch (refreshError) {
							console.error('Error refreshing AI summaries:', refreshError);
						}

						message.success('Tạo tổng quan hoàn thành và đã lưu vào cơ sở dữ liệu!');
					} catch (saveError) {
						console.error('Lỗi khi lưu vào aiSummary table:', saveError);
					}
				} else {
					console.warn('Không thể trích xuất summary từ kết quả AI');
					alert('Tạo tổng quan hoàn thành nhưng không thể trích xuất nội dung tóm tắt');
				}
			} else {
				console.warn('Response không có result field');
				alert('Tạo tổng quan hoàn thành nhưng không nhận được kết quả hợp lệ');
			}
		} catch (error) {
			console.error('Lỗi khi tạo tổng quan:', error);
			alert('Có lỗi xảy ra khi tạo tổng quan');
		} finally {
			setIsCreatingSummary(false);
		}
	};

	// Loại bỏ useEffect tự động tìm kiếm
	// useEffect(() => {
	// 	filterReports(searchTerm);
	// }, [searchTerm, companyReportData, finRatio, aiSummaries]);

	// Định nghĩa các cột cho bảng định giá
	const valuationColumns = [
		{
			title: 'Nguồn',
			dataIndex: 'Nguồn',
			key: 'nguon',
			width: 120,
			render: (value, record) => {
				// Lấy mã CK và nguồn từ record để kiểm tra AI Summary
				const maCK = record['Mã CK'];
				const nguon = value;
				const hasAISummary = hasAISummaryForCodeAndSource(maCK, nguon);

				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span>{value}</span>
						{hasAISummary && (
							<ScanBarcode
								style={{ color: '#262626', cursor: 'pointer' }}
								size={16}
								onClick={() => openAISummaryModalForSource(maCK, nguon)}
							/>
						)}
					</div>
				);
			},
		},
		{
			title: 'Định giá',
			dataIndex: 'Giá mục tiêu (đồng)',
			key: 'giaMucTieu',
			width: 140,
			render: (value) => value ? value.toLocaleString('vi-VN') + ' VNĐ' : 'N/A',
		},
		{
			title: 'Ngày',
			dataIndex: 'Ngày công bố',
			key: 'ngayCongBo',
			width: 120,
			render: (value, record) => value || record['Ngày khuyến nghị'] || 'N/A',
		},
		{
			title: 'Báo cáo chi tiết',
			key: 'baoCaoChiTiet',
			width: 150,
			render: (_, record) => {
				const url = record['URLReport'] || record['URL'] || record['Link'] || '';

				if (url) {
					return (
						<Button
							size='small'
							icon={<FileTextOutlined />}
							onClick={() => window.open(url, '_blank')}
							style={{ fontSize: '12px' }}
						>
							Xem báo cáo
						</Button>
					);
				}

				return <span style={{ color: '#999' }}>Không có</span>;
			},
		},
	];

	// Hàm chuyển serial Excel sang Date JS
	function excelSerialToDate(serial) {
		const utc_days = Math.floor(serial - 25569);
		const utc_value = utc_days * 86400;
		return new Date(utc_value * 1000);
	}

	// Tạo cột động cho bảng tỷ số tài chính
	const createFinRatioColumns = (data) => {
		const columns = [
			{
				title: 'Chỉ số',
				dataIndex: 'metric',
				key: 'metric',
				width: 200,
				fixed: 'left',
			},
		];
		if (!data || data.length === 0) return columns;
		// Loại trùng cột theo quý
		const seenQuarters = new Set();
		data.forEach((item, i) => {
			let title = 'Quý ?';
			if (item && item['Ngày']) {
				let date;
				if (typeof item['Ngày'] === 'number') {
					date = excelSerialToDate(item['Ngày']);
				} else {
					date = new Date(item['Ngày']);
				}
				if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const quarter = Math.ceil(month / 3);
					title = `Q${quarter}/${year}`;
				}
			}
			// Nếu đã có cột cho quý này thì bỏ qua
			if (seenQuarters.has(title)) return;
			seenQuarters.add(title);
			columns.push({
				title,
				dataIndex: `col${i}`,
				key: `col${i}`,
				width: 150,
			});
		});
		return columns;
	};

	// Lấy 5 phần tử đầu tiên của finRatio
	const finRatioData = finRatioDataByMaCK.slice(0, 5);

	// Thay thế logic chọn mã thủ công và lấy selectedFinRatioData cho "Bảng so sánh cùng ngành"

	// Hàm lấy danh sách mã cùng ngành cấp 4 (tối đa 5 mã, gồm cả mã đang tìm)
	const getIndustryPeers = (maCK, companyReportData) => {
		const company = companyReportData.find(item => (item['Mã CK'] || '').toLowerCase() === maCK.toLowerCase());
		if (!company) return [];
		const nganhCap4 = company['Ngành cấp 4'];
		if (!nganhCap4) return [];
		const peers = companyReportData
			.filter(item => item['Ngành cấp 4'] === nganhCap4 && (item['Mã CK'] || '').toLowerCase() !== maCK.toLowerCase())
			.map(item => item['Mã CK']);
		return [maCK, ...peers.slice(0, 4)];
	};

	// Hàm lấy dữ liệu finRatio cho mỗi mã từ cùng kỳ với mã được tìm kiếm
	const getFinRatioForCodes = (codes, allFinRatioData, searchTermData, selectedQuarter) => {
		// Nếu có chọn quý cụ thể, lấy dữ liệu từ quý đó
		if (selectedQuarter) {
			return codes.map(code => {
				const codeData = allFinRatioData.filter(item => (item['Mã CK'] || '').toLowerCase() === code.toLowerCase());
				if (codeData.length > 0) {
					// Tìm dữ liệu từ quý được chọn
					const quarterData = codeData.find(item => {
						let date;
						if (typeof item['Ngày'] === 'number') {
							date = excelSerialToDate(item['Ngày']);
						} else {
							date = new Date(item['Ngày']);
						}
						if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const quarter = Math.ceil(month / 3);
							return `Q${quarter}/${year}` === selectedQuarter;
						}
						return false;
					});
					if (quarterData) {
						return quarterData;
					}
				}
				return null;
			}).filter(Boolean);
		}

		// Nếu không chọn quý, lấy kỳ mới nhất của mã được tìm kiếm làm chuẩn
		const referenceDate = searchTermData && searchTermData.length > 0 ? searchTermData[0]['Ngày'] : null;

		return codes.map(code => {
			const codeData = allFinRatioData.filter(item => (item['Mã CK'] || '').toLowerCase() === code.toLowerCase());
			if (codeData.length > 0) {
				if (referenceDate) {
					// Tìm dữ liệu từ cùng kỳ với mã được tìm kiếm
					const samePeriodData = codeData.find(item => item['Ngày'] === referenceDate);
					if (samePeriodData) {
						return samePeriodData;
					}
				}
				// Nếu không tìm thấy cùng kỳ, lấy dữ liệu mới nhất
				const sorted = codeData.sort((a, b) => {
					const dateA = new Date(a['Ngày'] || 0);
					const dateB = new Date(b['Ngày'] || 0);
					return dateB - dateA;
				});
				return sorted[0];
			}
			return null;
		}).filter(Boolean);
	};

	// Hàm kiểm tra xem item có chỉ chứa các thuộc tính cơ bản không
	const hasOnlyBasicProperties = (item) => {
		const keys = Object.keys(item);
		const basicKeys = ['Kiểu thời gian', 'Mã CK', 'Ngày'];
		const hasOnlyBasic = keys.every(key => basicKeys.includes(key));
		return hasOnlyBasic && keys.length === basicKeys.length;
	};

	// Hàm lọc bỏ dữ liệu chỉ có các thuộc tính cơ bản
	const filterFinRatioData = (data) => {
		return data.filter(item => !hasOnlyBasicProperties(item));
	};

	// Tạo allFinRatioData dùng chung và lọc bỏ dữ liệu không cần thiết
	const allFinRatioData = filterFinRatioData([
		...finRatioDataByMaCK,
		...finRatioDataPeers,
	]);

	// Lọc dữ liệu finRatio cho mã được tìm kiếm (4 quý gần nhất) - tìm trong tất cả các danh sách
	const getFinRatioForSearchTerm = (searchTerm) => {
		if (!searchTerm.trim()) return [];

		const searchLower = searchTerm.toLowerCase();

		// Tìm trong tất cả các danh sách finRatio và lọc bỏ dữ liệu chỉ có thuộc tính cơ bản
		const allFinRatioData = filterFinRatioData([
			...finRatioDataByMaCK,
			...finRatioDataPeers,
		]);
		const filtered = allFinRatioData.filter((item) => {
			try {
				const maCK = item['Mã CK'] || '';
				return maCK.toLowerCase() === searchLower;
			} catch {
				return false;
			}
		});

		// Sắp xếp theo ngày mới nhất
		const sorted = [...filtered].sort((a, b) => {
			const dateA = new Date(a['Ngày'] || 0);
			const dateB = new Date(b['Ngày'] || 0);
			return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
		});

		// Loại bỏ trùng lặp theo quý/năm, chỉ giữ lại bản ghi mới nhất cho mỗi quý
		const uniqueByQuarter = [];
		const seenQuarters = new Set();

		for (const item of sorted) {
			let date;
			if (typeof item['Ngày'] === 'number') {
				date = excelSerialToDate(item['Ngày']);
			} else {
				date = new Date(item['Ngày']);
			}

			if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const quarter = Math.ceil(month / 3);
				const quarterKey = `Q${quarter}/${year}`;

				if (!seenQuarters.has(quarterKey)) {
					seenQuarters.add(quarterKey);
					uniqueByQuarter.push(item);
				}
			}
		}

		// Lấy 4 quý gần nhất (đã loại bỏ trùng lặp)
		return uniqueByQuarter.slice(0, 4);
	};

	// Lấy 4 quý gần nhất từ dữ liệu tài chính
	const getLast4Quarters = (data) => {
		if (!data || data.length === 0) return [];
		// Sắp xếp giảm dần theo ngày
		const sorted = [...data].sort((a, b) => new Date(b['Ngày']) - new Date(a['Ngày']));
		return sorted.slice(0, 4);
	};

// Tạo dữ liệu transpose cho bảng tỷ số tài chính theo format mới
	const createFinRatioTransposeData = (data) => {
		if (!data || data.length === 0) return [];
		const firstItem = data[0];
		// Lấy tất cả các key trừ Mã CK, Ngày, Kiểu thời gian, ...
		const allKeys = Object.keys(firstItem).filter(key =>
			key !== 'Mã CK' &&
			key !== 'Ngày' &&
			key !== 'Kiểu thời gian' &&
			key !== 'Loại báo cáo (Q)' &&
			key !== 'Trạng thái kiểm toán (Q)',
		);
		// Loại trùng tên chỉ số (normalize)
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		const uniqueKeys = [];
		const seen = new Set();
		for (const key of allKeys) {
			const norm = normalize(key);
			if (!seen.has(norm)) {
				seen.add(norm);
				uniqueKeys.push(key);
			}
		}
		const formatNumber = (value) => {
			if (typeof value !== 'number' || value === 0) return value === 0 ? '0' : (value || 'N/A');
			const absValue = Math.abs(value);
			if (absValue >= 1000000000) {
				const billions = value / 1000000000;
				const decimalPlaces = billions < 10 ? 2 : 1;
				const formattedBillions = billions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedBillions).toLocaleString('vi-VN') + ' tỷ';
			} else if (absValue >= 1000000) {
				const millions = value / 1000000;
				const decimalPlaces = millions < 10 ? 2 : 1;
				const formattedMillions = millions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedMillions).toLocaleString('vi-VN') + ' triệu';
			} else if (absValue < 10) {
				return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
			} else {
				return Math.round(value).toLocaleString('vi-VN');
			}
		};
		return uniqueKeys.map(key => {
			const cleanMetric = key.replace(/ \(Q\)| \(Y\)| \(VND\)/g, '');
			const row = { metric: cleanMetric };
			data.forEach((item, index) => {
				const colKey = `col${index}`;
				const value = item[key];
				row[colKey] = formatNumber(value);
			});
			return row;
		});
	};

// Đặt hàm createTransposeData ở đầu phần logic, trước mọi sử dụng
	const createTransposeData = (data) => {
		if (!data || data.length === 0) return [];
		// Lấy tất cả các key từ object đầu tiên, loại trừ Mã CK và Ngày
		const firstItem = data[0];
		const allKeys = Object.keys(firstItem).filter(key =>
			key !== 'Mã CK' &&
			key !== 'Ngày' &&
			key !== 'Kiểu thời gian' &&
			key !== 'Loại báo cáo (Q)' &&
			key !== 'Trạng thái kiểm toán (Q)',
		);

		// Lọc chỉ lấy những chỉ số có trong LIST_FIN_RATIO
		const filteredKeys = allKeys.filter(key =>
			LIST_FIN_RATIO.some(ratio => key.includes(ratio)),
		);

		// Loại bỏ các chỉ số trùng lặp sau khi chuẩn hóa
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		const uniqueKeys = [];
		const seenNormalized = new Set();

		for (const key of filteredKeys) {
			const normalizedKey = normalize(key);
			if (!seenNormalized.has(normalizedKey)) {
				seenNormalized.add(normalizedKey);
				uniqueKeys.push(key);
			}
		}

		// Hàm format số với đơn vị triệu/tỷ
		const formatNumber = (value) => {
			if (typeof value !== 'number' || value === 0) return value === 0 ? '0' : (value || 'N/A');

			const absValue = Math.abs(value);
			if (absValue >= 1000000000) {
				const billions = value / 1000000000;
				const decimalPlaces = billions < 10 ? 2 : 1;
				const formattedBillions = billions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedBillions).toLocaleString('vi-VN') + ' tỷ';
			} else if (absValue >= 1000000) {
				const millions = value / 1000000;
				const decimalPlaces = millions < 10 ? 2 : 1;
				const formattedMillions = millions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedMillions).toLocaleString('vi-VN') + ' triệu';
			} else if (absValue < 10) {
				return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
			} else {
				return Math.round(value).toLocaleString('vi-VN');
			}
		};

		return uniqueKeys.map(key => {
			// Loại bỏ "(Q)" và "(VND)" khỏi tên chỉ số
			const cleanMetric = key.replace(/ \(Q\)| \(VND\)/g, '');
			const row = { metric: cleanMetric };
			data.forEach((item, index) => {
				const colKey = `col${index}`;
				const value = item[key];
				row[colKey] = formatNumber(value);
			});
			return row;
		});
	};

	// Đảm bảo hàm createTransposeColumns được khai báo phía trên mọi nơi sử dụng nó
	const createTransposeColumns = (data) => {
		const columns = [
			{
				title: 'Chỉ số',
				dataIndex: 'metric',
				key: 'metric',
				width: 200,
				fixed: 'left',
			},
		];
		data.forEach((item, index) => {
			const maCK = item['Mã CK'] || `Công ty ${index + 1}`;
			// Lấy ngày
			let dateLabel = '';
			if (item['Ngày']) {
				let date;
				if (typeof item['Ngày'] === 'number') {
					date = excelSerialToDate(item['Ngày']);
				} else {
					date = new Date(item['Ngày']);
				}
				if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const quarter = Math.ceil(month / 3);
					dateLabel = `Q${quarter}/${year}`;
				} else {
					dateLabel = item['Ngày'];
				}
			}
			columns.push({
				title: `${maCK}${dateLabel ? ` (${dateLabel})` : ''}`,
				dataIndex: `col${index}`,
				key: `col${index}`,
				width: 150,
			});
		});
		return columns;
	};

	// Dữ liệu finRatio cho mã được tìm kiếm - chỉ tính toán khi hasSearched = true
	const searchTermFinRatioData = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return getLast4Quarters(finRatioDataByMaCK);
	}, [hasSearched, searchTerm, finRatioDataByMaCK]);

	console.log(searchTermFinRatioData);

	const searchTermFinRatioTransposeData = useMemo(() => {
		const result = createFinRatioTransposeData(searchTermFinRatioData);
		return result;
	}, [searchTermFinRatioData]);

	const searchTermFinRatioColumns = useMemo(() => {
		const columns = createFinRatioColumns(searchTermFinRatioData);
		return columns;
	}, [searchTermFinRatioData]);

	// Lấy dữ liệu so sánh cùng ngành tự động dựa trên mã tìm kiếm - chỉ tính toán khi hasSearched = true
	const peerCodes = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return getIndustryPeers(searchTerm, companyInfo);
	}, [hasSearched, searchTerm, companyInfo]);

	const selectedFinRatioData = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return finRatioDataPeers;
	}, [hasSearched, searchTerm, finRatioDataPeers]);

	const transposeData = useMemo(() => {
		const result = createTransposeData(selectedFinRatioData);
		return result;
	}, [selectedFinRatioData]);

	const transposeColumns = useMemo(() => {
		const columns = createTransposeColumns(selectedFinRatioData);
		return columns;
	}, [selectedFinRatioData]);

	// Hàm format ngày thành chuỗi kỳ
	const formatPeriod = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);

		// Kiểm tra ngày hợp lệ (không phải Invalid Date và không phải năm 1970)
		if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
			return '';
		}

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const quarter = Math.ceil(month / 3);
		return `Q${quarter}/${year}`;
	};

	// Hàm lấy thông tin kỳ cho bảng tỷ số tài chính
	const getFinancialRatioPeriodInfo = (data) => {
		if (!data || data.length === 0) return '';
		const periods = data.map(item => formatPeriod(item['Ngày'])).filter(period => period !== '');
		return periods.length > 0 ? ` (${periods.join(', ')})` : '';
	};

	// Hàm lấy danh sách 5 quý gần nhất tính từ thời điểm hiện tại
	const getAvailableQuarters = () => {
		const result = [];
		const now = new Date();
		let year = now.getFullYear();
		let month = now.getMonth() + 1;
		let quarter = Math.ceil(month / 3);
		for (let i = 0; i < 5; i++) {
			result.push(`Q${quarter}/${year}`);
			quarter--;
			if (quarter === 0) {
				year--;
				quarter = 4;
			}
		}
		return result;
	};

	// Hàm lấy thông tin kỳ cho bảng so sánh cùng ngành
	const getIndustryComparisonPeriodInfo = (searchTermData, selectedData) => {
		if (selectedQuarter) return ` (${selectedQuarter})`;
		if (!searchTermData || searchTermData.length === 0) return '';
		const referencePeriod = formatPeriod(searchTermData[0]['Ngày']);
		return referencePeriod && referencePeriod !== '' ? ` (${referencePeriod})` : '';
	};

	// Hiển thị thông tin chi tiết của CompanySummary
	const [showDetailSummary, setShowDetailSummary] = useState(false);
	const renderCompanySummary = () => {
		if (!currentCompanySummary) return null;
		const info = typeof currentCompanySummary.info === 'string' ? JSON.parse(currentCompanySummary.info) : currentCompanySummary.info;
		return (
			<Card className={styles.aiSummaryCard} style={{ marginBottom: '24px' }}>
				<Title level={4} style={{ marginBottom: 8, color: '#1890ff' }}>
					Tổng quan phân tích - {info?.searchTerm || 'N/A'}
				</Title>
				{/*<div style={{ fontSize: 14, color: '#666'}}>*/}
				{/*	<b>Dữ liệu phân tích:</b> {info?.valuationDataCount || 0} báo cáo định giá, {info?.finalRatioDataCount || 0} kỳ tỷ số tài chính, {info?.industryComparisonCount || 0} công ty cùng ngành*/}
				{/*	<br/>*/}
				{/*	{info?.companyInfo && (*/}
				{/*		<span style={{color: '#52c41a', fontSize: 12 }}>*/}
				{/*			Có thông tin công ty*/}
				{/*		</span>*/}
				{/*	)}*/}
				{/*	{currentCompanySummary?.created_at && (*/}
				{/*		<span style={{ marginLeft: 12, fontSize: 12 }}>*/}
				{/*			Tạo lúc: {new Date(currentCompanySummary.created_at).toLocaleString('vi-VN')}*/}
				{/*		</span>*/}
				{/*	)}*/}
				{/*</div>*/}
				{currentCompanySummary.summary1 && (
					<div style={{ fontSize: 14, fontStyle: 'italic', color: '#666', marginBottom: 12 }}>
						<b>Tóm tắt:</b> {currentCompanySummary.summary1}
					</div>
				)}
				{currentCompanySummary.summary2 && !showDetailSummary && (
					<Button type='link' onClick={() => setShowDetailSummary(true)} style={{ padding: 0 }}>
						Xem thêm
					</Button>
				)}
				{currentCompanySummary.summary2 && showDetailSummary && (
					<>
						<Divider />
						<div
							className={cssMarkdown.markdownContent}
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(marked.parse(currentCompanySummary.summary2 || '')),
							}}
						/>
						<Button type='link' onClick={() => setShowDetailSummary(false)} style={{ padding: 0 }}>
							Thu gọn
						</Button>
					</>
				)}
			</Card>
		);
	};

	// Hiển thị thông tin chi tiết của matchedAISummary
	const renderAISummary = () => {
		if (!matchedAISummary) return null;
		const info = typeof matchedAISummary.info === 'string' ? JSON.parse(matchedAISummary.info) : matchedAISummary.info;
		const itemData = info?.itemData || {};
		return (
			<Card className={styles.aiSummaryCard}>
				<div style={{ fontSize: 15 }}>
					<b>Mã CK:</b> {itemData['Mã CK'] || 'N/A'}<br />
					<b>Khuyến nghị:</b> {itemData['Khuyến nghị'] || 'N/A'}<br />
					<b>Giá mục
						tiêu:</b> {itemData['Giá mục tiêu (đồng)'] ? itemData['Giá mục tiêu (đồng)'].toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}<br />
					<b>Ngày công bố:</b> {itemData['Ngày công bố'] || itemData['Ngày khuyến nghị'] || 'N/A'}<br />
					<b>Nguồn:</b> {itemData['Nguồn'] || 'N/A'}
				</div>
				<Divider />
				<Title level={4}
					   style={{ marginBottom: 8 }}>{info?.title || itemData['Tên báo cáo'] || 'AI Summary'}</Title>
				{matchedAISummary.summary2 &&
					<div
						className={cssMarkdown.markdownContent}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(marked.parse(matchedAISummary.summary2 || '')),
						}}
					/>
				}
				{
					info?.summary2 && !matchedAISummary.summary2 &&
					<div
						className={cssMarkdown.markdownContent}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(marked.parse(info.summary2 || '')),
						}}
					/>
				}
			</Card>
		);
	};

	// Hàm tạo danh sách gợi ý từ companyInfo (mã + tên)
	const getAutoCompleteOptions = (input) => {
		if (!input || !companyInfo || companyInfo.length === 0) return [];
		const searchLower = input.toLowerCase();
		// Lọc theo mã hoặc tên công ty
		return companyInfo
			.filter(item => {
				const code = (item['Mã CK'] || '').toLowerCase();
				const name = (item['Tên tiếng Việt'] || item['Tên tiếng Anh'] || '').toLowerCase();
				return code.includes(searchLower) || name.includes(searchLower);
			})
			.slice(0, 10) // chỉ lấy 10 gợi ý đầu
			.map(item => ({
				value: item['Mã CK'],
				label: `${item['Mã CK']} - ${item['Tên tiếng Việt'] || item['Tên tiếng Anh'] || ''}`,
			}));
	};

	// Debounce cho tìm kiếm

	// Khi người dùng nhập vào AutoComplete
	const handleAutoCompleteSearch = (value) => {
		setInputValue(value);

		// Clear timeout cũ
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set timeout mới
		const newTimeout = setTimeout(() => {
			setAutoCompleteOptions(getAutoCompleteOptions(value));
		}, 300); // Debounce 300ms

		setSearchTimeout(newTimeout);
	};

	// Khi người dùng chọn 1 mã từ AutoComplete hoặc sidebar
	const handleAutoCompleteSelect = async (value) => {
		// setSidebarLoading(true);
		// setInputValue(value);
		setSearchTerm(value);
		setSelectedQuarter('Q1/2025');
		setHasSearched(true);

		try {
			// LẤY DỮ LIỆU TÀI CHÍNH VÀ SET STATE
			const finRatioData = await loadFinRatioByMaCK(value);
			console.log(finRatioData);
			setFinRatioDataByMaCK(finRatioData);

			performSearch(value, companyReportData, companyInfo, finRatioData, [], [], [], aiSummaries);
			loadDataInPriorityOrder(value);
		} catch (error) {
			console.error('Error loading fin ratio data:', error);
		}
	};

	// Khi tìm kiếm mã CK, chỉ lấy dữ liệu theo mã đó
	const loadPeerFinRatios = async (peerCodes, selectedQuarter, searchTermData) => {
		if (!peerCodes || peerCodes.length === 0) {
			setFinRatioDataPeers([]);
			return;
		}
		try {
			const allPeerData = await Promise.all(peerCodes.map(async (code) => {
				const dataArrRaw = await loadFinRatioByMaCK(code);
				const dataArr = dataArrRaw.map(item => item.data || item);
				if (selectedQuarter && dataArr.length > 0) {
					const found = dataArr.find(item => {
						let date;
						if (typeof item['Ngày'] === 'number') {
							date = excelSerialToDate(item['Ngày']);
						} else {
							date = new Date(item['Ngày']);
						}
						if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const quarter = Math.ceil(month / 3);
							return `Q${quarter}/${year}` === selectedQuarter;
						}
						return false;
					});
					return found || null;
				}
				return dataArr[0] || null;
			}));

			setFinRatioDataPeers(allPeerData.filter(Boolean));
		} catch (error) {
			setFinRatioDataPeers([]);
		}
	};

	// Sử dụng useEffect để load dữ liệu peer khi peerCodes, selectedQuarter hoặc dataType thay đổi
	useEffect(() => {
		if (hasSearched && peerCodes.length > 0) {
			loadPeerFinRatios(peerCodes, selectedQuarter, finRatioDataByMaCK);
		}
		// eslint-disable-next-line
	}, [hasSearched, peerCodes, selectedQuarter, dataType]);

	// State cho modal nhóm chỉ số
	const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
	const [groupConfig, setGroupConfig] = useState([]); // [{name: 'NIM (%)', group: 'Nhóm 1'}, ...]
	const [groupLoading, setGroupLoading] = useState(false);

	// Khi mở modal, load cấu hình nhóm hiện tại (nếu có)
	const openGroupModal = async () => {
		setIsGroupModalOpen(true);
		setGroupLoading(true);
		try {
			const settings = await getSettingByTypeExternal('SETTING_FIN_RATIO_GROUPS');
			if (settings?.setting) {
				setGroupConfig(settings.setting);
			} else {
				setGroupConfig(LIST_FIN_RATIO.map(name => ({ name, group: '' })));
			}
		} catch (e) {
			setGroupConfig(LIST_FIN_RATIO.map(name => ({ name, group: '' })));
		} finally {
			setGroupLoading(false);
		}
	};

	// Khi đổi tên nhóm
	const handleGroupChange = (idx, value) => {
		setGroupConfig(prev => prev.map((item, i) => i === idx ? { ...item, group: value } : item));
	};

	// Lưu cấu hình nhóm
	const saveGroupConfig = async () => {
		setGroupLoading(true);
		try {
			await createOrUpdateSettingByTypeExternal({
				type: 'SETTING_FIN_RATIO_GROUPS',
				setting: groupConfig,
			});
			message.success('Đã lưu cấu hình nhóm chỉ số thành công');
			setIsGroupModalOpen(false);
		} catch (error) {
			message.error('Lỗi khi lưu cấu hình nhóm chỉ số');
			console.error('Error saving fin ratio group config:', error);
		} finally {
			setGroupLoading(false);
		}
	};

	// Hàm format số cho ag-Grid
	const formatNumber = (value) => {
		if (typeof value === 'string' && value.trim() !== '' && !isNaN(value)) value = parseFloat(value);
		if (typeof value !== 'number' || value === 0) return value === 0 ? '0' : (value || 'N/A');
		const absValue = Math.abs(value);
		if (absValue >= 1000000000) {
			const billions = value / 1000000000;
			const decimalPlaces = billions < 10 ? 2 : 1;
			const formattedBillions = billions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
			return parseFloat(formattedBillions).toLocaleString('vi-VN') + ' tỷ';
		} else if (absValue >= 1000000) {
			const millions = value / 1000000;
			const decimalPlaces = millions < 10 ? 2 : 1;
			const formattedMillions = millions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
			return parseFloat(formattedMillions).toLocaleString('vi-VN') + ' triệu';
		} else if (absValue < 10) {
			return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
		} else {
			return Math.round(value).toLocaleString('vi-VN');
		}
	};

	// Lấy các key hợp lệ từ dữ liệu thực tế (có (Q) hoặc (Y) và khớp LIST_FIN_RATIO)
	const getValidMetrics = (data, dataType) => {
		if (!data || data.length === 0) return [];
		const suffix = dataType === 'year' ? '(Y)' : '(Q)';
		const keys = Object.keys(data[0]).filter(
			key => key.endsWith(suffix) && key !== 'Ngày' && key !== 'Mã CK',
		);
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		const valid = keys.filter(key =>
			LIST_FIN_RATIO.some(ratio => normalize(key) === normalize(ratio)),
		);
		return valid;
	};

	// Sửa buildTreeData: chỉ group các chỉ số có trong valid metrics
	function buildTreeData(finRatioData, groupConfig, labels) {
		const validMetrics = getValidMetrics(finRatioData, dataType);
		const groupMap = {};
		(groupConfig && groupConfig.length ? groupConfig : LIST_FIN_RATIO.map(name => ({
			name,
			group: '',
		}))).forEach(({ name, group }) => {
			// Tìm key thực tế trong validMetrics
			const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
			const matchedKey = validMetrics.find(key => normalize(key) === normalize(name));
			if (!matchedKey) return;
			const groupName = group?.trim() || 'Khác';
			if (!groupMap[groupName]) groupMap[groupName] = [];
			groupMap[groupName].push(matchedKey);
		});
		const rows = [];
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		Object.entries(groupMap).forEach(([groupName, metrics]) => {
			// Dòng con (chỉ số)
			const children = [];
			metrics.forEach(metric => {
				const row = { group: groupName, metric };
				labels.forEach(label => {
					// Tìm item đầu tiên trong data có nhãn này
					const item = finRatioData.find(item => {
						let date;
						if (typeof item['Ngày'] === 'number') {
							date = excelSerialToDate(item['Ngày']);
						} else {
							date = new Date(item['Ngày']);
						}
						let l = dataType === 'year' ? `${date.getFullYear()}` : 'Quý ?';
						if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
							if (dataType === 'year') {
								l = `${date.getFullYear()}`;
							} else {
								const year = date.getFullYear();
								const month = date.getMonth() + 1;
								const quarter = Math.ceil(month / 3);
								l = `Q${quarter}/${year}`;
							}
						}
						return l === label;
					});
					let value = item ? item[metric] : undefined;
					if (value === undefined && item) {
						const foundKey = Object.keys(item).find(k => normalize(k) === normalize(metric));
						value = foundKey ? item[foundKey] : undefined;
					}
					row[label] = value;
				});
				children.push(row);
			});
			// Dòng cha (group): tổng các thành phần
			const groupRow = { group: groupName };
			labels.forEach(label => {
				let sum = 0;
				let hasNumber = false;
				children.forEach(child => {
					let v = child[label];
					if (typeof v === 'string' && v.trim() !== '' && !isNaN(v)) v = parseFloat(v);
					if (typeof v === 'number' && !isNaN(v)) {
						sum += v;
						hasNumber = true;
					}
				});
				groupRow[label] = hasNumber ? sum : '';
			});
			rows.push(groupRow);
			children.forEach(child => rows.push(child));
		});
		return rows;
	}

	// Tạo colDefs cho ag-Grid
	function getAgGridColDefs(labels) {
		return [
			{ field: 'metric', headerName: 'Chỉ số', hide: true },
			...labels.map(q => ({
				field: q,
				headerName: q,
				width: 200,
				valueFormatter: params => formatNumber(params.value),
			})),
		];
	}

	// Lấy nhãn các quý hoặc năm từ dữ liệu, loại trùng
	const getQuarterOrYearLabels = (data) => {
		const seen = new Set();
		const labels = [];
		data.forEach(item => {
			let date;
			if (typeof item['Ngày'] === 'number') {
				date = excelSerialToDate(item['Ngày']);
			} else {
				date = new Date(item['Ngày']);
			}
			let label = 'Quý ?';
			if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
				if (dataType === 'year') {
					label = `${date.getFullYear()}`;
				} else {
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const quarter = Math.ceil(month / 3);
					label = `Q${quarter}/${year}`;
				}
			}
			if (!seen.has(label)) {
				seen.add(label);
				labels.push(label);
			}
		});
		return labels;
	};

	// Hàm lấy nhãn các mã CK cho bảng so sánh cùng ngành
	const getPeerLabels = (data) => {
		return data.map(item => item['Mã CK'] || '');
	};

	// buildTreeData cho bảng so sánh: cột là các mã CK, mỗi dòng con là chỉ số, mỗi cell là giá trị của mã đó (tìm key gần đúng nếu cần)
	function buildPeerTreeData(peerData, groupConfig, peerLabels) {
		const validMetrics = getValidMetrics(peerData, dataType);
		const groupMap = {};
		(groupConfig && groupConfig.length ? groupConfig : LIST_FIN_RATIO.map(name => ({
			name,
			group: '',
		}))).forEach(({ name, group }) => {
			const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
			const matchedKey = validMetrics.find(key => normalize(key) === normalize(name));
			if (!matchedKey) return;
			const groupName = group?.trim() || 'Khác';
			if (!groupMap[groupName]) groupMap[groupName] = [];
			groupMap[groupName].push(matchedKey);
		});
		const rows = [];
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		Object.entries(groupMap).forEach(([groupName, metrics]) => {
			// Dòng con (chỉ số)
			const children = [];
			metrics.forEach(metric => {
				const row = { group: groupName, metric };
				peerLabels.forEach((maCK, idx) => {
					const item = peerData[idx];
					let value = item ? item[metric] : undefined;
					if (value === undefined && item) {
						// Fallback: tìm key gần đúng
						const foundKey = Object.keys(item).find(k => normalize(k) === normalize(metric));
						value = foundKey ? item[foundKey] : undefined;
					}
					row[maCK] = value;
				});
				children.push(row);
			});
			// Dòng cha (group): tổng các thành phần
			const groupRow = { group: groupName };
			peerLabels.forEach((maCK, idx) => {
				let sum = 0;
				let hasNumber = false;
				children.forEach(child => {
					let v = child[maCK];
					if (typeof v === 'string' && v.trim() !== '' && !isNaN(v)) v = parseFloat(v);
					if (typeof v === 'number' && !isNaN(v)) {
						sum += v;
						hasNumber = true;
					}
				});
				groupRow[maCK] = hasNumber ? sum : '';
			});
			rows.push(groupRow);
			children.forEach(child => rows.push(child));
		});
		return rows;
	}

	// getAgGridColDefs cho bảng so sánh: cột là các mã CK
	function getPeerAgGridColDefs(peerLabels) {
		return [
			{ field: 'metric', headerName: 'Chỉ số', hide: true },
			...peerLabels.map(maCK => ({
				field: maCK,
				headerName: maCK,
				width: 200,
				valueFormatter: params => formatNumber(params.value),
			})),
		];
	}

	// Khi mount component hoặc khi search, luôn load groupConfig từ setting
	useEffect(() => {
		const loadGroupConfig = async () => {
			try {
				const settings = await getSettingByTypeExternal('SETTING_FIN_RATIO_GROUPS');
				if (settings?.setting) {
					setGroupConfig(settings.setting);
				} else {
					setGroupConfig(LIST_FIN_RATIO.map(name => ({ name, group: '' })));
				}
			} catch (e) {
				setGroupConfig(LIST_FIN_RATIO.map(name => ({ name, group: '' })));
			}
		};
		loadGroupConfig();
	}, [searchTerm]);

	// Sửa handleSearch để luôn map .data khi setFinRatioDataByMaCK
	const handleSearch = async () => {
		const term = inputValue.trim();
		if (!term) return;

		setSidebarLoading(true);
		setSearchTerm(term);
		setSelectedQuarter('Q1/2025');
		setHasSearched(true);

		try {
			// Lấy dữ liệu tỷ số tài chính cho mã CK nhập vào
			const finRatioDataRaw = await loadFinRatioByMaCK(term);
			const finRatioData = finRatioDataRaw.map(item => item.data || item);
			setFinRatioDataByMaCK(finRatioData);

			// Tìm kiếm với dữ liệu hiện có
			performSearch(term, companyReportData, companyInfo, finRatioData, [], [], [], aiSummaries);

			// Load dữ liệu theo thứ tự ưu tiên
			loadDataInPriorityOrder(term);
		} finally {
			setSidebarLoading(false);
		}
	};

	// Khi đổi dataType hoặc searchTerm, gọi lại API lấy dữ liệu đúng
	useEffect(() => {
		if (hasSearched && searchTerm) {
			(async () => {
				const finRatioDataRaw = await loadFinRatioByMaCK(searchTerm);
				const finRatioData = finRatioDataRaw.map(item => item.data || item);
				setFinRatioDataByMaCK(finRatioData);
			})();
		}
		// eslint-disable-next-line
	}, [dataType, searchTerm]);

	return (
		<div className={styles.container}>
			{/* Sidebar */}
			<div className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<AutoComplete
						className={styles.sidebarSearch}
						// options={autoCompleteOptions}
						value={inputValue}
						onSearch={handleAutoCompleteSearch}
						// onSelect={handleAutoCompleteSelect}
						placeholder='Tìm kiếm mã CK...'
						// filterOption={false}
						allowClear
						size="small"
					/>
				</div>

				<div className={styles.sidebarContent}>
					{sidebarLoading ? (
						<div className={styles.sidebarLoading}>
							<div className={styles.loadingSpinner}></div>
							<div className={styles.loadingText}>Đang tải dữ liệu...</div>
						</div>
					) : !companyInfo || companyInfo.length === 0 ? (
						<div className={styles.skeletonLoading}>
							{Array.from({ length: 8 }).map((_, index) => (
								<div key={index} className={styles.skeletonItem}>
									<div className={styles.skeletonCode}></div>
									<div className={styles.skeletonName}></div>
								</div>
							))}
						</div>
					) : companyInfo && companyInfo.length > 0 ? (
						<div className={styles.companyList}>
							{companyInfo
								.filter(company => {
									if (!inputValue.trim()) return true;
									const searchLower = inputValue.toLowerCase();
									const code = (company['Mã CK'] || '').toLowerCase();
									const name = (company['Tên tiếng Việt'] || company['Tên tiếng Anh'] || '').toLowerCase();
									return code.includes(searchLower) || name.includes(searchLower);
								})
								.map((company, index) => {
									const isSelected = searchTerm === company['Mã CK'];
									return (
										<div
											key={`${company['Mã CK']}-${index}`}
											className={`${styles.companyItem} ${isSelected ? styles.selected : ''} ${sidebarLoading ? styles.disabled : ''}`}
											onClick={() => !sidebarLoading && handleAutoCompleteSelect(company['Mã CK'])}
										>
											<div className={styles.companyCode}>{company['Mã CK']}</div>
											<div className={styles.companyName}>{company['Tên tiếng Việt'] || company['Tên tiếng Anh'] || 'N/A'}</div>
										</div>
									);
								})}
						</div>
					) : (
						<div className={styles.emptySidebar}>
							<div className={styles.emptyText}>Chưa có dữ liệu công ty</div>
						</div>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className={styles.mainContent}>
				{/* Header với nút tạo tổng quan (chỉ Tab 1) */}
				{currentUser.isAdmin && !currentCompanySummary && hasSearched && (
					<div className={styles.mainHeader}>
						<Button
							type='default'
							onClick={handleTaoTongQuan}
							disabled={!hasSearched || !hasFoundData || isCreatingSummary}
							loading={isCreatingSummary}
							className={styles.createSummaryBtn}
						>
							Tạo tổng quan
						</Button>
					</div>
				)}

				<div className={styles.resultsSection}>
					{hasSearched && Object.values(dataLoadingStatus).some(status => status) && (
						<div style={{
							marginBottom: '16px',
							padding: '12px',
							backgroundColor: '#f6f8fa',
							borderRadius: '6px',
							border: '1px solid #e1e4e8',
						}}>
							<div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
								Đang tải dữ liệu ...
							</div>
						</div>
					)}

					{hasSearched && searchTerm.trim() ? (
						<Tabs
							defaultActiveKey='1'
							items={[
								{
									key: '1',
									label: 'Dữ liệu doanh nghiệp',
									children: (
										<>
											{currentCompanySummary && renderCompanySummary()}
											{searchResults.valuationData.length > 0 && (
												<>
													<Title level={5} style={{ margin: '24px 0 12px 0' }}>
														📊 Bảng Định giá ({searchResults.valuationData.length} báo cáo)
														{!loadedDataTypes.has('companyReports') && (
															<Tag color='processing' style={{ marginLeft: '8px' }}>Đang tải thêm...</Tag>
														)}
													</Title>
													<Table
														columns={valuationColumns}
														dataSource={searchResults.valuationData}
														rowKey={(record, idx) => record['Nguồn'] + record['Giá mục tiêu (đồng)'] + record['Ngày công bố'] + idx}
														scroll={{ x: 500 }}
														pagination={false}
														className={styles.companyReportTable}
														size='small'
													/>
												</>
											)}
											{searchTermFinRatioData.length > 0 && (
												<>
													<div className={styles.financialRatioHeader} style={{
														display: 'flex',
														alignItems: 'center',
														gap: 12,
														margin: '24px 0 12px 0',
													}}>
														<Title level={5} className={styles.financialRatioTitle}
															   style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
															💰 Bảng tỷ số tài chính cho {searchTerm}
														</Title>
														<div className={styles.financialRatioControls}
															 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
															<Select
																value={dataType}
																onChange={(value) => {
																	setDataType(value);
																	setSelectedQuarter(null);
																}}
																style={{ width: 120 }}
																size='small'
															>
																<Select.Option value='quarter'>Dữ liệu quý</Select.Option>
																<Select.Option value='year'>Dữ liệu năm</Select.Option>
															</Select>
														</div>
													</div>
													<div className='ag-theme-quartz' style={{
														height: 300,
														width: '100%',
														marginBottom: 24,
														overflowY: 'auto',
														paddingBottom: 24,
													}}>
														<AgGridReact
															rowData={buildTreeData(searchTermFinRatioData, groupConfig, getQuarterOrYearLabels(searchTermFinRatioData))}
															columnDefs={getAgGridColDefs(getQuarterOrYearLabels(searchTermFinRatioData))}
															treeData={true}
															getDataPath={data => data.metric ? [data.group, data.metric] : [data.group]}
															autoGroupColumnDef={{
																headerName: 'Nhóm/Chỉ số',
																cellRendererParams: { suppressCount: true },
																minWidth: 400,
															}}
															defaultColDef={{
																resizable: true,
																filter: true,
																sortable: true,
															}}
															domLayout='autoHeight'
															groupDefaultExpanded={1}
														/>
													</div>
												</>
											)}

											{(searchTermFinRatioData.length === 0 && searchResults.valuationData.length === 0) && (
												<div style={{
													padding: '20px',
													textAlign: 'center',
													color: '#666',
													backgroundColor: '#f9f9f9',
													borderRadius: '6px',
													marginTop: '16px',
												}}>
													<div style={{ fontSize: '16px', marginBottom: '8px' }}>
														🔍 Đang tìm kiếm dữ liệu cho "{searchTerm}"...
													</div>
													<div style={{ fontSize: '14px' }}>
														Hệ thống đang tải các nguồn dữ liệu khác nhau. Kết quả sẽ hiển thị ngay khi tìm thấy.
													</div>
												</div>
											)}
										</>
									),
								},
								{
									key: '2',
									label: 'So sánh ngành',
									children: (
										<>
											{(peerCodes.length > 0) && selectedFinRatioData.length > 0 && (
												<>
													<div className={styles.industryComparisonHeader} style={{
														display: 'flex',
														alignItems: 'center',
														gap: 10,
														margin: '24px 0 12px 0',
													}}>
														<Title level={5} className={styles.industryComparisonTitle}
															   style={{ margin: 0 }}>
															🏭 Bảng so sánh cùng ngành ({selectedFinRatioData.length} mã)
															{getIndustryComparisonPeriodInfo(searchTermFinRatioData, selectedFinRatioData)}
														</Title>
														<div className={styles.industryComparisonControls}
															 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
															<Select
																value={dataType}
																onChange={(value) => {
																	setDataType(value);
																	setSelectedQuarter(null);
																}}
																style={{ width: 120, fontSize: '12px' }}
																size='small'
															>
																<Select.Option value='quarter'>Dữ liệu quý</Select.Option>
																<Select.Option value='year'>Dữ liệu năm</Select.Option>
															</Select>
															<Select
																value={selectedQuarter}
																onChange={setSelectedQuarter}
																style={{ width: 120, fontSize: '12px' }}
																placeholder='Tự động'
																allowClear
																size='small'
															>
																{getAvailableQuarters().map(quarter => (
																	<Select.Option key={quarter} value={quarter}>
																		{quarter}
																	</Select.Option>
																))}
															</Select>
														</div>
													</div>
													<div className='ag-theme-quartz'
														 style={{ height: 300, width: '100%', marginBottom: 24, overflowY: 'auto' }}>
														<AgGridReact
															rowData={buildPeerTreeData(selectedFinRatioData, groupConfig, getPeerLabels(selectedFinRatioData))}
															columnDefs={getPeerAgGridColDefs(getPeerLabels(selectedFinRatioData))}
															treeData={true}
															getDataPath={data => data.metric ? [data.group, data.metric] : [data.group]}
															autoGroupColumnDef={{
																headerName: 'Nhóm/Chỉ số',
																cellRendererParams: { suppressCount: true },
																minWidth: 400,
															}}
															defaultColDef={{
																resizable: true,
																filter: true,
																sortable: true,
															}}
															domLayout='autoHeight'
															groupDefaultExpanded={1}
														/>
													</div>
													{selectedFinRatioData.length === 0 && selectedQuarter && (
														<div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
															Không có mã nào có dữ liệu cho quý {selectedQuarter}
														</div>
													)}
												</>
											)}
										</>
									),
								},
							]}
						/>
					) : (
						<>
							<div className={styles.emptyText}>Hãy nhập mã doanh nghiệp bạn muốn nghiên cứu hôm nay</div>
							<div className={styles.backgroundImage}>
							</div>
						</>
					)}

					{hasSearched && searchTerm.trim() && (searchTermFinRatioData.length === 0 && searchResults.valuationData.length === 0) && !Object.values(dataLoadingStatus).some(status => status) && (
						<div className={styles.emptyContainer}>
							<Empty
								description={<span>Không tìm thấy dữ liệu cho mã chứng khoán "{searchTerm}"</span>}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Modal hiển thị AI Summary */}
			<Modal
				title='Tổng quan'
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width={800}
				style={{ top: 20 }}
			>
				{matchedAISummary && renderAISummary()}
			</Modal>

			{/* Đã xoá hoàn toàn phần Modal chọn mã CK và các biến/hàm liên quan, không để lại comment JSX gây lỗi cú pháp. */}

			{/* Modal cài đặt nhóm chỉ số */}
			<Modal
				title='Cài đặt nhóm chỉ số tài chính'
				open={isGroupModalOpen}
				onCancel={() => setIsGroupModalOpen(false)}
				onOk={saveGroupConfig}
				confirmLoading={groupLoading}
				okText='Lưu cấu hình'
				cancelText='Hủy'
				width={600}
			>
				{groupLoading ? (
					<div>Đang tải...</div>
				) : (
					<div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 8 }}>
						{groupConfig.map((item, idx) => (
							<div key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
								<span style={{ width: 220 }}>{item.name}</span>
								<input
									style={{ flex: 1, padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
									value={item.group || ''}
									placeholder='Nhóm chỉ số (ví dụ: Sinh lời, An toàn, ... )'
									onChange={e => handleGroupChange(idx, e.target.value)}
								/>
							</div>
						))}
						<div style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
							* Bạn có thể nhập tên nhóm cho từng chỉ số. Các chỉ số cùng nhóm sẽ được gom lại khi hiển
							thị.
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};

export default CompanyReportTab;
