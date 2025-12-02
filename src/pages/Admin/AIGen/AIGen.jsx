import {useContext, useEffect, useRef, useState} from 'react';
import {Button, Card, Dropdown, Input, List, message, Modal, Popconfirm, Select, Spin,} from 'antd';
import {ChevronDown, ChevronRight, PlusCircle, Send, Trash2, Settings} from 'lucide-react';
import {getAllAiGenConfigList} from '../../../apis/aiGen/aiGenConfigListService.jsx';
import {aiGen, aiGen2, improveText} from '../../../apis/aiGen/botService.jsx';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import AIGenForm from './AIGenForm.jsx';
import AiGenHistoryViewer from './components/AiGenHistoryViewer.jsx';
import AiGenHistoryViewerModal from './components/AiGenHistoryViewerModal.jsx';
import css from './AIForm.module.css';
import {
	createAiGenHistory,
	deleteAiGenHistory,
	getAllAiGenHistory,
	updateAiGenHistory
} from '../../../apis/aiGen/aiGenHistoryService.jsx';
import {uploadFiles} from '../../../apis/aiGen/uploadImageWikiNoteService.jsx';
import {MODEL_AI_LIST} from "./AI_CONST.js";
import {MyContext} from "../../../MyContext.jsx";
import {createNewQuestion} from "../../../apis/questionService.jsx";
import {createNewAnswer} from "../../../apis/answerService.jsx";

let resultDefault = 'Kết quả AI trả lời';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

// Tiện ích chuyển base64 sang Uint8Array
function base64ToUint8Array(base64) {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}
// Tiện ích làm sạch base64
function cleanBase64(str) {
	return str.replace(/^"+|"+$/g, '');
}
// Tiện ích lấy extension từ mime
function getExtensionFromMimeType(mimeType) {
	const map = {
		'audio/mpeg': 'mp3',
		'audio/mp3': 'mp3',
		'audio/wav': 'wav',
		'audio/x-wav': 'wav',
		'audio/wave': 'wav',
		'audio/x-pn-wav': 'wav',
	};
	return map[mimeType] || '';
}
function ensureFileNameWithExtension(fileName, mimeType) {
	if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
	const ext = getExtensionFromMimeType(mimeType);
	return ext ? `${fileName}.${ext}` : fileName;
}

export default function AIGen() {
	const { currentUser } = useContext(MyContext);
	const [prompt, setPrompt] = useState('');
	const [result, setResult] = useState(resultDefault);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedId, setSelectedId] = useState(null);
	const [formModalOpen, setFormModalOpen] = useState(false);
	const [checkedItems, setCheckedItems] = useState([]);
	const [aiGenHistory, setAiGenHistory] = useState([]);
	const [loadingAiGenHistory, setLoadingAiGenHistory] = useState(false);
	const [selectedAiGenHistoryId, setSelectedAiGenHistoryId] = useState(null);
	const [modelToken1, setModelToken1] = useState('');
	const [modelToken2, setModelToken2] = useState('');
	const [modelToken3, setModelToken3] = useState('');
	const [totalToken, setTotalToken] = useState(0);
	const [templateModalOpen, setTemplateModalOpen] = useState(false);
	const [queueLength, setQueueLength] = useState(0);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(result);
	const [originalContent, setOriginalContent] = useState('');
	const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);

	// State cho flow selection
	const [aiConfigList, setAiConfigList] = useState([]);
	const [selectedFlowId, setSelectedFlowId] = useState(null);
	const [loadingFlowList, setLoadingFlowList] = useState(false);

	// State cho các cấu hình bổ sung
	const [expectedLength, setExpectedLength] = useState(100);
	const [tone, setTone] = useState('neutral');
	const [writingStyle, setWritingStyle] = useState('');
	const [imageCount, setImageCount] = useState(1);

	// State cho image result từ AI4
	const [imageResult, setImageResult] = useState(null);
	const [imageUrls, setImageUrls] = useState([]);

	// State cho slide layout - lưu trữ mô tả ảnh từ AI3
	const [imageDescriptions, setImageDescriptions] = useState([]); // Mô tả tiếng Anh cho AI4
	const [imageDescriptionsVi, setImageDescriptionsVi] = useState([]); // Mô tả tiếng Việt cho hiển thị

	// State cho kết quả AI3 trong slide layout
	const [ai3Result, setAi3Result] = useState('');

	// State cho audio result từ AI5
	const [audioResult, setAudioResult] = useState(null);
	const [audioUrl, setAudioUrl] = useState('');

	// Improve feature state
	const [showImproveBtn, setShowImproveBtn] = useState(false);
	const [improveBtnPos, setImproveBtnPos] = useState({ top: 0, left: 0 });
	const [selectedText, setSelectedText] = useState('');
	const [selectedTextRange, setSelectedTextRange] = useState(null);
	const [improveModalOpen, setImproveModalOpen] = useState(false);
	const [improveInput, setImproveInput] = useState('');
	const [improveLoading, setImproveLoading] = useState(false);
	const [improvePreview, setImprovePreview] = useState(null);

	// Add state for improve all functionality
	const [improveAllModalOpen, setImproveAllModalOpen] = useState(false);
	const [improveAllInput, setImproveAllInput] = useState('');
	const [improveAllLoading, setImproveAllLoading] = useState(false);

	// Add state for batch processing functionality
	const [batchModalOpen, setBatchModalOpen] = useState(false);
	const [batchConfig, setBatchConfig] = useState({
		selectedFlowId: null,
		expectedLength: 100,
		writingStyle: '',
		imageCount: 1
	});
	const [batchQuestions, setBatchQuestions] = useState([]);
	const [batchLoading, setBatchLoading] = useState(false);

	// Add state for batch approval functionality
	const [batchApprovalModalOpen, setBatchApprovalModalOpen] = useState(false);
	const [selectedHistoryItems, setSelectedHistoryItems] = useState([]);
	const [batchApprovalLoading, setBatchApprovalLoading] = useState(false);

	// Add state for view-only modal
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedViewHistory, setSelectedViewHistory] = useState(null);

	// Add state for prompt template settings
	const [promptTemplateModalOpen, setPromptTemplateModalOpen] = useState(false);
	const [englishPromptTemplate, setEnglishPromptTemplate] = useState(`Create \${imageCount} precise technical illustration descriptions for educational purposes. Each description must be extremely specific and clear to ensure accurate AI image generation. Focus on educational clarity over artistic beauty.

Required specifications for each description:
Use English
Impeccable Spelling and Grammar: All output must be in perfect English. There should be absolutely no spelling or grammatical errors. This is the highest priority.
Focus on Education: The primary goal is educational clarity, not artistic flair. Avoid any decorative, ambiguous, or purely artistic elements that could distract from the learning objective.
High Detail and Specificity: Each description must be extremely detailed, providing specific guidance on all visual elements. Descriptions should be a minimum of 150 characters to ensure sufficient detail for the image AI.
Clear Illustration Style: Specify a simple, clear illustration style in the designated format section
Handling Text: Text should only be included if it is essential for the educational purpose. If text is necessary, you must specify the exact wording in quotes (e.g., "Text label: 'Mitochondria'"), its precise placement (e.g., "placed directly below the organelle"), and suggest a simple, bold, legible font.
Visual Hierarchy: When necessary for understanding complex concepts, mention the use of color-coding, arrows, or visual hierarchy to guide the viewer's eye.
Negative Constraint: Under no circumstances should you create or describe a map of Vietnam.

Format:
1. [Technical illustration description 1] - Style: [specific illustration type]
2. [Technical illustration description 2] - Style: [specific illustration type]
...
\${imageCount}. [Technical illustration description \${imageCount}] - Style: [specific illustration type]

Example elements to include:
- "Simple flat design illustration showing..."
- "Clean vector diagram depicting..."
- "Minimalist technical illustration with clear labels..."
- "Text labels should read: '[specific text]' in bold, readable font"
- "Use contrasting colors: [specific colors] for clarity"`);

	const [vietnamesePromptTemplate, setVietnamesePromptTemplate] = useState(`Tạo \${imageCount} mô tả giáo dục ngắn gọn bằng tiếng Việt. Mỗi mô tả cần giải thích rõ ràng khái niệm chính mà hình ảnh muốn truyền tải, giúp người học hiểu được kiến thức từ hình ảnh đó.

Yêu cầu cho mỗi mô tả:
- 2-3 câu ngắn, dễ hiểu
- Giải thích khái niệm chính trong hình ảnh
- Kết nối với câu hỏi/chủ đề chính
- Sử dụng ngôn ngữ đơn giản, phù hợp với mục đích học tập

Format:
1. [Giải thích khái niệm chính của ảnh 1 và ý nghĩa giáo dục]
2. [Giải thích khái niệm chính của ảnh 2 và ý nghĩa giáo dục]
...
\${imageCount}. [Giải thích khái niệm chính của ảnh \${imageCount} và ý nghĩa giáo dục]

Lưu ý: Tập trung vào việc giải thích "tại sao" hình ảnh này quan trọng cho việc hiểu chủ đề, không chỉ mô tả "cái gì" có trong ảnh.`);

	const markedContentRef = useRef(null);

	useEffect(() => {
		loadAiGenHistory();
		loadAiConfigList();
	}, [currentUser]);

	useEffect(() => {
		setEditedContent(result);
	}, [result]);

	const loadAiGenHistory = async () => {
		try {
			setLoadingAiGenHistory(true);
			const history = await getAllAiGenHistory();
			const filteredHistory = history.filter(item => item.userCreated === currentUser?.email);
			setAiGenHistory(filteredHistory);
		} catch (error) {
			console.error('Error loading AI Gen history:', error);
		} finally {
			setLoadingAiGenHistory(false);
		}
	};

	const loadAiConfigList = async () => {
		try {
			setLoadingFlowList(true);
			const data = await getAllAiGenConfigList();
			setAiConfigList(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Error loading AI config list:', error);
			setAiConfigList([]);
		} finally {
			setLoadingFlowList(false);
		}
	};

	// When user selects a history item, fill prompt/result
	const handleSelectAiGenHistory = (item) => {
		// Reset editing state when selecting different history
		setIsEditing(false);
		setEditedContent('');
		setOriginalContent('');

		if (!item) {
			setPrompt('');
			setResult('');
			setSelectedAiGenHistoryId(null);
			setSelectedQueueItem(null);
			setSelectedFlowId(null);
			setExpectedLength(100);
			setWritingStyle('');
			setImageResult(null);
			setImageUrls([]);
			setImageDescriptions([]); // Reset image descriptions (English)
			setImageDescriptionsVi([]); // Reset image descriptions (Vietnamese)
			setAudioResult(null);
			setAudioUrl('');
			return;
		}

		setPrompt(item.prompt);
		setResult(item.anwser);
		setSelectedAiGenHistoryId(item.id);
		setSelectedQueueItem(null);

		// Restore image if available
		if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
			setImageUrls(item.imageUrls);
			// For backward compatibility, also set imageResult if it's a single image
			if (item.imageUrls.length === 1 && typeof item.imageUrls[0] === 'string') {
				setImageResult({ image_url: item.imageUrls[0] });
			} else {
				setImageResult(null);
			}
		} else {
			setImageUrls([]);
			setImageResult(null);
		}

		// Restore audio if available
		if (item.audioUrl) {
			setAudioUrl(item.audioUrl);
			// We don't have the full audioResult object, so we clear it to prevent showing stale metadata
			setAudioResult(null);
		} else {
			setAudioUrl('');
			setAudioResult(null);
		}

		// Restore settings from history
		setSelectedFlowId(item.AIGenConfigId);
		setExpectedLength(item.settings?.expectedLength || 100);
		setWritingStyle(item.settings?.writingStyle || '');
		setImageCount(item.settings?.imageCount || 1);

		// Restore image descriptions if available
		if (item.settings?.imageDescriptions && Array.isArray(item.settings.imageDescriptions)) {
			setImageDescriptions(item.settings.imageDescriptions);
		} else {
			setImageDescriptions([]);
		}

		// Restore Vietnamese image descriptions if available
		if (item.settings?.imageDescriptionsVi && Array.isArray(item.settings.imageDescriptionsVi)) {
			setImageDescriptionsVi(item.settings.imageDescriptionsVi);
		} else {
			setImageDescriptionsVi([]);
		}

		// Restore AI3 result if available
		if (item.settings?.ai3Result) {
			setAi3Result(item.settings.ai3Result);
		} else {
			setAi3Result('');
		}

		// Clear old token info
		setModelToken1('');
		setModelToken2('');
		setModelToken3('');
		setTotalToken(0);
	};

	// Add new function to process queue
	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const { prompt, config } = analyzeQueue[0];

		// Log the queue item being processed
		console.log('=== PROCESSING QUEUE ITEM ===');
		console.log('Queue Item:', {
			prompt,
			configId: config?.id,
			configName: config?.name,
			timestamp: analyzeQueue[0].timestamp
		});
		console.log('============================');

		try {
			setIsLoading(true);
			setSelectedQueueItem(analyzeQueue[0]);
			setSelectedAiGenHistoryId(null);

			let finalResult = '';
			let aiResults = [];
			let imageUrlToSave = null;
			let audioUrlToSave = null;
			let lastTextOutput = prompt;

			// Local variable to store descriptions for this specific queue item
			let localImageDescriptions = []; // English descriptions for AI4
			let localImageDescriptionsVi = []; // Vietnamese descriptions for display and storage

			// Process each AI in the flow sequentially
			if (config && config.aiConfigs) {
				const activeAIs = config.aiConfigs.filter(ai => ai.isUse);

				for (let i = 0; i < activeAIs.length; i++) {
					const ai = activeAIs[i];

					// BỎ QUA AI5 (Voice AI) KHÔNG CHẠY Ở ĐÂY
					if (ai.name.startsWith('AI5')) {
						continue;
					}

					try {
						// --- START: NEW LOGIC for determining AI input ---
						let currentInput;

						// If it's a media AI, its input is the last text output.
						if (ai.name.startsWith('AI4') || ai.name.startsWith('AI5')) {
							currentInput = lastTextOutput;
						} else {
							// Special logic for AI3 when AI1 has sendDirectToOutput = true
							if (ai.name.startsWith('AI3') && i > 0) {
								const ai1Config = activeAIs.find(a => a.name.startsWith('AI1'));
								const ai2Config = activeAIs.find(a => a.name.startsWith('AI2'));

								// Check if AI1 has sendDirectToOutput = true
								if (ai1Config && ai1Config.sendDirectToOutput) {
									console.log('🔄 AI1 has sendDirectToOutput = true, combining outputs for AI3');
									const ai1Result = aiResults.find(r => r.aiName.startsWith('AI1'));
									const ai2Result = aiResults.find(r => r.aiName.startsWith('AI2'));

									// Combine AI1 and AI2 outputs if both exist
									if (ai1Result && ai2Result) {
										currentInput = `Kết quả từ AI1:\n${ai1Result.result}\n\nKết quả từ AI2:\n${ai2Result.result}`;
										console.log('📝 Combining AI1 and AI2 outputs for AI3');
									} else if (ai1Result) {
										// Only AI1 result available
										currentInput = ai1Result.result;
										console.log('📝 Using only AI1 output for AI3');
									} else if (ai2Result) {
										// Only AI2 result available
										currentInput = ai2Result.result;
										console.log('📝 Using only AI2 output for AI3');
									} else {
										// Fallback to previous logic
										currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
										console.log('📝 Fallback: using previous AI result for AI3');
									}
								} else {
									// Normal flow: use previous AI result
									currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
									console.log('📝 Normal flow: using previous AI result for AI3');
								}
							} else if (ai.name.startsWith('AI2') && i > 0) {
								// Special logic for AI2 when AI1 has sendDirectToOutput = true
								const ai1Config = activeAIs.find(a => a.name.startsWith('AI1'));

								if (ai1Config && ai1Config.sendDirectToOutput) {
									// AI2 receives original prompt instead of AI1's output
									currentInput = prompt;
									console.log('🔄 AI1 has sendDirectToOutput = true, AI2 receives original prompt');
								} else {
									// Normal flow: use previous AI result
									currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
								}
							} else {
								// Normal flow for other AIs
								currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
							}
						}

						let aiPrompt = currentInput;

						// For subsequent AIs, check if we should combine with user prompt
						if (ai.useUserPrompt && i > 0) {
							const connector = getConnectorPhrase(ai.name, ai.systemMessage);
							// Avoid duplicating the prompt if the input is already the original prompt
							if (currentInput !== prompt) {
								aiPrompt = `${currentInput}\n\n${connector}\n\n${prompt}`;
							}
						}
						// --- END: NEW LOGIC ---

						// For the final text AI (AI1, AI2, AI3), add length and writing style requirements
						if (i === activeAIs.length - 1 && /^AI[123]/.test(ai.name)) {
							const additionalRequirements = `\n\nYêu cầu về độ dài: ${config.additionalSettings?.expectedLength || 100} từ.\nYêu cầu về phong cách viết: ${config.additionalSettings?.writingStyle || 'Trang trọng'}.`;
							aiPrompt += additionalRequirements;
						}

						console.log(`Processing AI ${i + 1}: ${ai.name}`, {
							prompt: aiPrompt,
							systemMessage: ai.systemMessage,
							model: ai.model,
							useUserPrompt: ai.useUserPrompt
						});

						let type = 'text';
						if (ai.name.startsWith('AI4')) type = 'img';
						if (ai.name.startsWith('AI5')) type = 'mp3';

						// Skip initial aiGen call for AI4 since we'll call it in the loop
						let aiResult = null;
						if (!ai.name.startsWith('AI4')) {
							const response = await aiGen(
								aiPrompt,
								ai.systemMessage,
								ai.model,
								type
							);
							aiResult = response.result || response.answer || response.content || response;
						}

						// Handle different result types
						if (ai.name.startsWith('AI3') && config?.layout === 'slide') {
							// Special handling for AI3 in slide layout - create both English and Vietnamese image descriptions
							try {
								console.log('AI3 in slide layout - creating both English and Vietnamese image descriptions');

								// First, create English descriptions for AI4
								const englishPrompt = `${aiPrompt}\n\n` + replaceTemplateVariables(englishPromptTemplate, {
									imageCount: imageCount
								});
								console.log('englishPrompt', englishPrompt);

								const englishResponse = await aiGen(
									englishPrompt,
									ai.systemMessage,
									ai.model,
									'text'
								);
								const englishResult = englishResponse.result || englishResponse.answer || englishResponse.content || englishResponse;

								// Parse English descriptions
								const englishDescriptions = [];
								const englishLines = englishResult.split('\n');
								for (let i = 0; i < imageCount; i++) {
									const line = englishLines.find(l => l.trim().startsWith(`${i + 1}.`));
									if (line) {
										const description = line.replace(/^\d+\.\s*/, '').trim();
										englishDescriptions.push(description);
									} else {
										// Fallback: use the entire result if parsing fails
										englishDescriptions.push(englishResult);
									}
								}

								// Then, create Vietnamese descriptions for display
								const vietnamesePrompt = `${aiPrompt}\n\n` + replaceTemplateVariables(vietnamesePromptTemplate, {
									imageCount: imageCount
								});
								console.log('vietnamesePrompt', vietnamesePrompt);
								const vietnameseResponse = await aiGen(
									vietnamesePrompt,
									ai.systemMessage,
									ai.model,
									'text'
								);
								const vietnameseResult = vietnameseResponse.result || vietnameseResponse.answer || vietnameseResponse.content || vietnameseResponse;

								// Parse Vietnamese descriptions
								const vietnameseDescriptions = [];
								const vietnameseLines = vietnameseResult.split('\n');
								for (let i = 0; i < imageCount; i++) {
									const line = vietnameseLines.find(l => l.trim().startsWith(`${i + 1}.`));
									if (line) {
										const description = line.replace(/^\d+\.\s*/, '').trim();
										vietnameseDescriptions.push(description);
									} else {
										// Fallback: use the entire result if parsing fails
										vietnameseDescriptions.push(vietnameseResult);
									}
								}

								// Store descriptions locally for this queue item and update global state
								localImageDescriptions = englishDescriptions; // English for AI4
								localImageDescriptionsVi = vietnameseDescriptions; // Vietnamese for display
								setImageDescriptions(englishDescriptions);
								setImageDescriptionsVi(vietnameseDescriptions);

								// Use Vietnamese result as the main content to display
								setAi3Result(vietnameseResult);

								aiResults.push({
									aiName: ai.name,
									model: ai.model,
									result: vietnameseResult, // Use Vietnamese as main result
									prompt: vietnamesePrompt,
									descriptions: englishDescriptions, // English for AI4
									descriptionsVi: vietnameseDescriptions // Vietnamese for display
								});

								finalResult = vietnameseResult; // Use Vietnamese as final result
								lastTextOutput = vietnameseResult;

								console.log('AI3 slide descriptions created:');
								console.log('English (for AI4):', englishDescriptions);
								console.log('Vietnamese (for display):', vietnameseDescriptions);

							} catch (error) {
								console.error('Error creating slide descriptions:', error);
								const errorMessage = `Lỗi khi tạo mô tả ảnh cho slide: ${error.message || 'Unknown error'}`;
								aiResults.push({
									aiName: ai.name,
									model: ai.model,
									result: errorMessage,
									error: true
								});
								finalResult = errorMessage;
								break;
							}
						} else if (ai.name.startsWith('AI4')) {
							// Handle multiple image generation for AI4
							const imageUrls = [];
							const imageResults = [];

							// Check if we're in slide layout and have descriptions from AI3
							const isSlideLayout = config?.layout === 'slide';
							// Use local descriptions instead of global state to avoid stale data
							const descriptions = isSlideLayout ? localImageDescriptions : null;

							if (isSlideLayout && descriptions && descriptions.length > 0) {
								// Slide layout: use descriptions from AI3
								console.log('AI4 in slide layout - using descriptions from AI3');

								for (let j = 0; j < descriptions.length; j++) {
									try {
										console.log(`Generating image ${j + 1}/${descriptions.length} for AI4 using description: ${descriptions[j]}`);

										const imageResponse = await aiGen2(
											descriptions[j], // Use description as prompt
											ai.systemMessage,
											ai.model,
											'img'
										);
										console.log(imageResponse);
										const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;

										if (imageResult.image_url) {
											imageUrls.push(imageResult.image_url);
											imageResults.push(imageResult);
										}
									} catch (error) {
										console.error(`Error generating image ${j + 1}:`, error);
									}
								}
							} else {
								// Normal layout: generate multiple images based on imageCount
								for (let j = 0; j < imageCount; j++) {
									try {
										console.log(`Generating image ${j + 1}/${imageCount} for AI4`);

										const imageResponse = await aiGen2(
											aiPrompt,
											ai.systemMessage,
											ai.model,
											'img'
										);
										console.log(imageResponse);
										const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;

										if (imageResult.image_url) {
											imageUrls.push(imageResult.image_url);
											imageResults.push(imageResult);
										}
									} catch (error) {
										console.error(`Error generating image ${j + 1}:`, error);
									}
								}
							}

							// Store all image URLs
							setImageUrls(imageUrls);
							setImageResult(imageResults.length > 0 ? imageResults[0] : null); // Keep first result for metadata
							imageUrlToSave = imageUrls; // Save array of URLs

							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: imageUrls,
								prompt: isSlideLayout ? 'Generated from AI3 descriptions' : aiPrompt,
								type: 'images',
								descriptions: descriptions
							});
						} else if (ai.name.startsWith('AI5') && aiResult && aiResult.audio_data) {
							// Xử lý upload audio base64 lên cloud
							const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
							const base64 = cleanBase64(aiResult.audio_data);
							const bytes = base64ToUint8Array(base64);
							const blob = new Blob([bytes], { type: contentType });
							const finalFileName = ensureFileNameWithExtension(Date.now().toString(), contentType);
							const fileObj = new File([blob], finalFileName, { type: contentType });
							let url = '';
							try {
								const res = await uploadFiles([fileObj]);
								// Giả sử res.files[0].fileUrl là url file
								url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';
								setAudioUrl(url);
								audioUrlToSave = url;
							} catch (e) {
								console.error('Upload audio failed', e);
							}
							setAudioResult(aiResult);
							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: url,
								prompt: aiPrompt,
								type: 'audio'
							});
						} else {
							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: aiResult,
								prompt: aiPrompt
							});
						}

						// Only update finalResult and lastTextOutput for text AIs
						if (ai.name.startsWith('AI1') || ai.name.startsWith('AI2') || ai.name.startsWith('AI3')) {
							finalResult = aiResult;
							lastTextOutput = aiResult;
						}

						console.log(`AI ${i + 1} completed:`, { aiResult });

					} catch (error) {
						console.error(`Error processing AI ${i + 1} (${ai.name}):`, error);
						const errorMessage = `Lỗi khi xử lý AI ${i + 1} (${ai.name}): ${error.message || 'Unknown error'}`;
						aiResults.push({
							aiName: ai.name,
							model: ai.model,
							result: errorMessage,
							error: true
						});
						finalResult = errorMessage;
						break; // Stop processing if one AI fails
					}
				}
			} else {
				// Fallback: no config or no active AIs
				finalResult = 'Không có cấu hình AI nào được chọn hoặc không có AI nào được kích hoạt.';
			}

			setResult(finalResult);

			// Prepare data for saving to history
			let imageDescriptionsToSave = null;
			let imageDescriptionsViToSave = null;
			let ai3ResultToSave = null;

			// Extract imageDescriptions and ai3Result from aiResults
			const ai3Result = aiResults.find(result => result.aiName.startsWith('AI3'));
			if (ai3Result && ai3Result.descriptions && config?.layout === 'slide') {
				imageDescriptionsToSave = ai3Result.descriptions; // English descriptions
			}
			if (ai3Result && ai3Result.descriptionsVi && config?.layout === 'slide') {
				imageDescriptionsViToSave = ai3Result.descriptionsVi; // Vietnamese descriptions
			}
			if (ai3Result && ai3Result.result && config?.layout === 'slide') {
				ai3ResultToSave = ai3Result.result;
			}

			// Debug log for slide layout data
			console.log('=== SAVING SLIDE LAYOUT DATA ===');
			console.log('Layout:', config?.layout);
			console.log('AI3 Result found:', !!ai3Result);
			console.log('Image descriptions to save (English):', imageDescriptionsToSave);
			console.log('Image descriptions to save (Vietnamese):', imageDescriptionsViToSave);
			console.log('AI3 result to save:', ai3ResultToSave);
			console.log('All AI Results:', aiResults);
			console.log('================================');

			// Post to aiGenHistory table
			const historyData = {
				AIGenConfigId: config?.id,
				prompt,
				userCreated: currentUser?.email,
				create_at: new Date().toISOString(),
				settings: {
					expectedLength,
					tone,
					writingStyle,
					imageCount,
					layout: config?.layout || 'article',
					imageDescriptions: imageDescriptionsToSave, // English descriptions for AI4
					imageDescriptionsVi: imageDescriptionsViToSave, // Vietnamese descriptions for display
					ai3Result: ai3ResultToSave
				},
				anwser: finalResult || 'Chưa có kết quả',
				audioUrl: audioUrlToSave,
				imageUrls: imageUrlToSave,
			};

			// Debug log để kiểm tra dữ liệu audioUrl khi lưu
			console.log('Saving to database:', {
				audioUrlToSave,
				audioUrlType: typeof audioUrlToSave,
				hasAudioUrl: !!audioUrlToSave,
				historyData
			});

			const newHistory = await createAiGenHistory(historyData);

			// Update selectedAiGenHistoryId to the newly created record
			if (newHistory && newHistory.id) {
				setSelectedAiGenHistoryId(newHistory.id);
			}

			await loadAiGenHistory();

		} catch (error) {
			let errorMessage = 'Có lỗi xảy ra khi phân tích dữ liệu!';
			const errorData = error?.response?.data?.error;
			if (
				(typeof errorData === 'string' && errorData.includes('Error code: 529')) ||
				(typeof errorData === 'string' && errorData.includes('overloaded'))
			) {
				errorMessage = 'Hệ thống AI đang quá tải, vui lòng thử lại sau!';
			} else {
				console.log(error);
				errorMessage = 'Xảy ra lỗi trong quá trình phân tích: ' + errorData;
			}
			setResult(errorMessage);
		} finally {
			setIsLoading(false);
			analyzeQueue.shift();
			setQueueLength(analyzeQueue.length);
			isProcessingQueue = false;
			setSelectedQueueItem(null);
			processQueue();
		}
	};

	// Helper function to replace variables in template
	const replaceTemplateVariables = (template, variables) => {
		let result = template;
		Object.keys(variables).forEach(key => {
			const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
			result = result.replace(regex, variables[key]);
		});
		return result;
	};

	// Helper function to get appropriate connector phrases
	const getConnectorPhrase = (aiName, systemMessage) => {
		// Default connector
		let connector = "Dựa trên kết quả phân tích trên, ";

		// Customize connector based on AI type or system message
		if (aiName === 'AI1') {
			connector = "Dựa trên phân tích ban đầu, ";
		} else if (aiName === 'AI2') {
			connector = "Từ kết quả phân tích chi tiết, ";
		} else if (aiName === 'AI3') {
			connector = "Dựa trên toàn bộ quá trình phân tích, ";
		} else if (aiName === 'AI4') {
			connector = "Dựa trên nội dung đã phân tích, ";
		} else if (aiName === 'AI5') {
			connector = "Từ kết quả phân tích cuối cùng, ";
		}

		// If system message contains specific instructions, adjust connector
		if (systemMessage && systemMessage.toLowerCase().includes('tổng hợp')) {
			connector = "Tổng hợp từ các phân tích trên, ";
		} else if (systemMessage && systemMessage.toLowerCase().includes('cải thiện')) {
			connector = "Cải thiện dựa trên kết quả trên, ";
		} else if (systemMessage && systemMessage.toLowerCase().includes('hoàn thiện')) {
			connector = "Hoàn thiện dựa trên phân tích trên, ";
		}

		return connector;
	};

	// Helper function to replace text at specific position
	const replaceTextAtPosition = (originalText, rangeInfo, newText) => {
		if (!rangeInfo) return originalText;

		try {
			// Chuẩn hóa text để so sánh
			const normalizeText = (text) => {
				return text
					.replace(/\r\n/g, '\n')
					.replace(/\r/g, '\n')
					.replace(/\s+/g, ' ')
					.trim();
			};

			const normalizedOriginal = normalizeText(originalText);
			const normalizedSelected = normalizeText(rangeInfo.text);

			// Tìm vị trí của selected text trong original text
			const startIndex = normalizedOriginal.indexOf(normalizedSelected);

			if (startIndex === -1) {
				// Fallback: tìm kiếm theo từng dòng
				const lines = originalText.split('\n');
				const selectedLines = rangeInfo.text.split('\n');

				for (let i = 0; i < lines.length; i++) {
					if (lines[i].includes(selectedLines[0])) {
						// Tìm thấy dòng đầu tiên, thay thế từng dòng
						let newLines = [...lines];
						for (let j = 0; j < selectedLines.length && i + j < lines.length; j++) {
							if (j < newText.split('\n').length) {
								newLines[i + j] = newText.split('\n')[j];
							}
						}
						return newLines.join('\n');
					}
				}

				// Nếu vẫn không tìm thấy, thử thay thế trực tiếp
				return originalText.replace(rangeInfo.text, newText);
			}

			// Thay thế tại vị trí tìm được
			const beforeSelected = originalText.substring(0, startIndex);
			const afterSelected = originalText.substring(startIndex + rangeInfo.text.length);
			return beforeSelected + newText + afterSelected;

		} catch (error) {
			console.error('Error replacing text at position:', error);
			// Fallback: thay thế bằng string replace
			return originalText.replace(rangeInfo.text, newText);
		}
	};

	// Helper function to generate preview with context
	const generatePreview = (originalText, rangeInfo, newText) => {
		if (!rangeInfo) return null;

		const lines = originalText.split('\n');
		const selectedLines = rangeInfo.text.split('\n');

		// Tìm vị trí của selected text trong original text
		let startLineIndex = -1;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes(selectedLines[0])) {
				startLineIndex = i;
				break;
			}
		}

		if (startLineIndex === -1) return null;

		// Tạo context (2 dòng trước và sau)
		const contextStart = Math.max(0, startLineIndex - 2);
		const contextEnd = Math.min(lines.length, startLineIndex + selectedLines.length + 2);
		const context = lines.slice(contextStart, contextEnd);

		// Tạo preview với highlight
		const previewLines = [];
		for (let i = contextStart; i < contextEnd; i++) {
			if (i >= startLineIndex && i < startLineIndex + selectedLines.length) {
				// Dòng được chọn - hiển thị nội dung mới
				const lineIndex = i - startLineIndex;
				if (lineIndex < newText.split('\n').length) {
					previewLines.push(`→ ${newText.split('\n')[lineIndex]}`);
				}
			} else {
				// Dòng context
				previewLines.push(`  ${lines[i]}`);
			}
		}

		return {
			context: context.join('\n'),
			preview: previewLines.join('\n'),
			startLine: startLineIndex + 1,
			endLine: startLineIndex + selectedLines.length
		};
	};

	// Helper function to log current state and selections
	const logCurrentState = (config = null) => {
		const selectedFlow = getSelectedFlowConfig();
		const flowConfig = config || selectedFlow;
		if (flowConfig) {
			const activeAIs = flowConfig.aiConfigs?.filter(ai => ai.isUse) || [];
		} else {
			console.log('No flow configuration selected');
		}
	};

	// Helper function to create/recreate audio
	const createAudioForItem = async (historyItem, isRecreate = false) => {
		setIsLoading(true);
		try {
			// Find the flow config
			let flowConfig = null;
			if (historyItem && historyItem.AIGenConfigId) {
				flowConfig = aiConfigList.find(config => config.id == historyItem.AIGenConfigId);
			} else {
				flowConfig = getSelectedFlowConfig();
			}

			if (!flowConfig) {
				message.error('Không tìm thấy cấu hình AI!');
				return;
			}

			const ai5 = flowConfig.aiConfigs.find(ai => ai.name.startsWith('AI5') && ai.isUse);
			if (!ai5) {
				message.error('AI5 không được kích hoạt!');
				return;
			}

			// Show confirmation dialog for recreate
			if (isRecreate) {
				const confirmed = await new Promise((resolve) => {
					Modal.confirm({
						title: 'Xác nhận tạo lại audio',
						content: 'Bạn có chắc chắn muốn tạo lại audio? Audio hiện tại sẽ được thay thế.',
						okText: 'Tạo lại',
						cancelText: 'Hủy',
						onOk: () => resolve(true),
						onCancel: () => resolve(false),
					});
				});

				if (!confirmed) {
					return;
				}
			}

			const aiPrompt = historyItem?.anwser || result;
			const response = await aiGen2(aiPrompt, ai5.systemMessage, ai5.model, 'audio');
			const aiResult = response.result || response.answer || response.content || response;

			if (aiResult && aiResult.audio_base64) {
				const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
				const base64 = cleanBase64(aiResult.audio_base64);
				const bytes = base64ToUint8Array(base64);
				const blob = new Blob([bytes], { type: contentType });
				const finalFileName = ensureFileNameWithExtension(Date.now().toString(), contentType);
				const fileObj = new File([blob], finalFileName, { type: contentType });

				try {
					const res = await uploadFiles([fileObj]);
					const url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';
					setAudioUrl(url);

					// Update history if we have an ID
					let idToUpdate = historyItem?.id || selectedAiGenHistoryId;
					if (!idToUpdate) {
						// Find the latest matching record
						const last = aiGenHistory
							.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
							.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];
						idToUpdate = last?.id;
					}

					if (idToUpdate) {
						await updateAiGenHistory({
							id: idToUpdate,
							audioUrl: url,
						});
						await loadAiGenHistory(); // Reload to get updated data
					}

					message.success(isRecreate ? 'Đã tạo lại audio thành công!' : 'Đã tạo audio thành công!');
				} catch (e) {
					console.error('Upload audio failed', e);
					message.error('Upload audio thất bại!');
				}
			} else {
				message.error('Không tạo được audio!');
			}
		} catch (err) {
			console.error('Error creating audio:', err);
			message.error('Có lỗi khi tạo audio!');
		} finally {
			setIsLoading(false);
		}
	};

	const handleTemplateSelect = async (question, decs) => {
		setPrompt(question);
	};

	const handleFlowSelect = (flowId) => {
		setSelectedFlowId(flowId);
		// Log state when flow selection changes
		setTimeout(() => logCurrentState(), 100);
	};

	const getSelectedFlowConfig = () => {
		if (!selectedFlowId) return null;
		return aiConfigList.find(config => config.id == selectedFlowId);
	};

	// Helper function to check if AI4 is enabled in selected flow
	const isAI4Enabled = () => {
		const flowConfig = getSelectedFlowConfig();
		return flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI4') && ai.isUse) || false;
	};

	// Modify analyze function to use queue
	async function analyze(config = null) {
		if (!prompt.trim()) {
			return;
		}

		// Reset image/audio result for new analysis
		setImageResult(null);
		setImageUrls([]);
		setImageDescriptions([]); // Reset image descriptions (English)
		setImageDescriptionsVi([]); // Reset image descriptions (Vietnamese)
		setAi3Result(''); // Reset AI3 result
		setAudioResult(null);
		setAudioUrl('');

		// Log current state before processing
		logCurrentState(config);

		// Sử dụng config từ selected flow nếu không có config được truyền vào
		const flowConfig = config || getSelectedFlowConfig();

		// Thêm các cấu hình bổ sung vào config
		const enhancedConfig = flowConfig ? {
			...flowConfig,
			additionalSettings: {
				expectedLength,
				tone,
				writingStyle,
			},
		} : {
			additionalSettings: {
				expectedLength,
				tone,
				writingStyle,
			},
		};

		const queueItem = {
			prompt,
			config: enhancedConfig,
			timestamp: new Date().toISOString(),
		};
		analyzeQueue.push(queueItem);
		setQueueLength(analyzeQueue.length);
		setSelectedQueueItem(queueItem);
		setSelectedAiGenHistoryId(null);
		processQueue();
	}

	const handleAnalyze = (config) => {
		setSelectedAiGenHistoryId(null);
		setSelectedQueueItem(null);
		analyze(config);
	};

	const handleContextMenu = (e, item) => {
		e.preventDefault();
	};

	const handleDeleteAiGenHistory = async (id) => {
		try {
			await deleteAiGenHistory(id);
			await loadAiGenHistory();
			if (selectedAiGenHistoryId === id) {
				handleSelectAiGenHistory(null);
			}
		} catch (error) {
			console.error('Error deleting AI Gen history:', error);
		}
	};

	const handleTemplateClick = () => {
		setTemplateModalOpen(true);
	};

	// Batch processing functions
	const addQuestion = () => {
		const newQuestion = {
			id: Date.now(),
			question: '',
			status: 'pending', // pending, processing, completed, error
			// Use general config as default for new questions
			config: {
				selectedFlowId: batchConfig.selectedFlowId,
				expectedLength: batchConfig.expectedLength,
				writingStyle: batchConfig.writingStyle,
				imageCount: batchConfig.imageCount
			}
		};
		setBatchQuestions([...batchQuestions, newQuestion]);
	};

	const removeQuestion = (id) => {
		setBatchQuestions(batchQuestions.filter(q => q.id !== id));
	};

	const updateQuestion = (id, field, value) => {
		setBatchQuestions(batchQuestions.map(q =>
			q.id === id ? { ...q, [field]: value } : q
		));
	};

	const updateQuestionConfig = (id, configField, value) => {
		setBatchQuestions(batchQuestions.map(q =>
			q.id === id ? {
				...q,
				config: {
					...q.config,
					[configField]: value
				}
			} : q
		));
	};

	const runBatchProcessing = async () => {
		if (batchQuestions.length === 0) {
			message.warning('Vui lòng thêm ít nhất một câu hỏi!');
			return;
		}

		const validQuestions = batchQuestions.filter(q => q.question.trim());
		if (validQuestions.length === 0) {
			message.warning('Vui lòng nhập nội dung cho ít nhất một câu hỏi!');
			return;
		}

		setBatchLoading(true);
		try {
			// Add each question to the queue with its individual config
			for (const question of validQuestions) {
				// Use question's individual config, fallback to general config
				const questionConfig = question.config || batchConfig;

				const flowConfig = aiConfigList.find(config => config.id == questionConfig.selectedFlowId);
				if (!flowConfig) {
					message.error(`Câu hỏi "${question.question.substring(0, 50)}..." không có luồng AI được chọn!`);
					continue;
				}

				const enhancedConfig = {
					...flowConfig,
					additionalSettings: {
						expectedLength: questionConfig.expectedLength,
						tone: 'neutral',
						writingStyle: questionConfig.writingStyle,
					},
				};

				const queueItem = {
					prompt: question.question,
					config: enhancedConfig,
					timestamp: new Date().toISOString(),
					batchId: Date.now(), // Add batch identifier
				};

				analyzeQueue.push(queueItem);
			}

			setQueueLength(analyzeQueue.length);
			setBatchModalOpen(false);
			setBatchQuestions([]);
			message.success(`Đã thêm ${validQuestions.length} câu hỏi vào hàng đợi!`);

			// Start processing if not already processing
			if (!isProcessingQueue) {
				processQueue();
			}
		} catch (error) {
			console.error('Error adding batch questions to queue:', error);
			message.error('Có lỗi xảy ra khi thêm câu hỏi vào hàng đợi!');
		} finally {
			setBatchLoading(false);
		}
	};

	// Handler for mouseup in text area
	const handleTextMouseUp = (e) => {
		const selection = window.getSelection();
		const text = selection.toString();

		// Check if selection is within any content container (support both main and AI3 content)
		let isValidSelection = false;
		if (text && selection.anchorNode) {
			// Check if selection is within any element that has the improve functionality
			const contentContainers = document.querySelectorAll('[data-improve-enabled="true"]');
			for (let container of contentContainers) {
				if (container.contains(selection.anchorNode)) {
					isValidSelection = true;
					break;
				}
			}

			// Fallback to original logic for backward compatibility
			if (!isValidSelection && markedContentRef.current && markedContentRef.current.contains(selection.anchorNode)) {
				isValidSelection = true;
			}
		}

		if (isValidSelection && text) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();

			// Lưu thông tin vị trí chính xác
			const rangeInfo = {
				startContainer: range.startContainer,
				startOffset: range.startOffset,
				endContainer: range.endContainer,
				endOffset: range.endOffset,
				text: text,
				contentType: e.contentType || 'main' // Get contentType from enhanced event
			};

			setImproveBtnPos({
				top: window.scrollY + rect.bottom + 8,
				left: window.scrollX + rect.left + rect.width / 2 - 30,
			});
			setSelectedText(text);
			setSelectedTextRange(rangeInfo);
			setShowImproveBtn(true);
		} else {
			setShowImproveBtn(false);
			setSelectedTextRange(null);
		}
	};

	// Edit handlers
	const handleEditStart = () => {
		const currentContent = selectedAiGenHistoryId ?
			aiGenHistory.find(h => h.id == selectedAiGenHistoryId)?.anwser || '' :
			result;
		setOriginalContent(currentContent);
		setEditedContent(currentContent);
		setIsEditing(true);
	};

	const handleEditSave = async () => {
		try {
			setIsLoading(true);

			// Update the history record in database
			if (selectedAiGenHistoryId) {
				await updateAiGenHistory({
					id: selectedAiGenHistoryId,
					anwser: editedContent,
				});
				await loadAiGenHistory(); // Reload to get updated data
				message.success('Đã cập nhật nội dung thành công!');
			} else {
				// Update current result state
				setResult(editedContent);
			}

			setIsEditing(false);
		} catch (error) {
			console.error('Error updating content:', error);
			message.error('Có lỗi khi cập nhật nội dung!');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditCancel = () => {
		setEditedContent(originalContent);
		setIsEditing(false);
	};

	// Đóng Improve khi click ngoài
	useEffect(() => {
		const handleClick = (e) => {
			// Check if click is within any improve-enabled container
			const contentContainers = document.querySelectorAll('[data-improve-enabled="true"]');
			let isWithinContent = false;

			for (let container of contentContainers) {
				if (container.contains(e.target)) {
					isWithinContent = true;
					break;
				}
			}

			// Fallback to original logic
			if (!isWithinContent && markedContentRef.current?.contains(e.target)) {
				isWithinContent = true;
			}

			if (!isWithinContent) {
				setShowImproveBtn(false);
			}
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}, []);

	// Function to handle duyet (approve) - create question and answer from AI Gen history
	const handleDuyet = async (item) => {
		if (!item) return;

		// Kiểm tra xem đã duyệt chưa

		try {
			// Get flow config from aiGenHistory
			const flowConfig = aiConfigList.find(config => config.id == item.AIGenConfigId);

			// Determine layout
			let isSlideLayout = flowConfig?.layout === 'slide';
			if (!isSlideLayout && item.settings?.layout === 'slide') {
				isSlideLayout = true;
			}

			// Get data from history
			const result = item.anwser || '';
			const imageUrls = item.imageUrls || [];
			const imageDescriptions = item.settings?.imageDescriptions || []; // English descriptions (for reference)
			const imageDescriptionsVi = item.settings?.imageDescriptionsVi || []; // Vietnamese descriptions (for display)
			const audioUrl = item.audioUrl || '';

			// Generate HTML content
			let htmlContent = '';

			// Audio section
			// if (audioUrl) {
			// 	const audioId = `audio_${item.id || Date.now()}`;
			// 	const playButtonId = `play_btn_${item.id || Date.now()}`;
			// 	htmlContent += `
			// 		<div style="margin-bottom: 10px;">
			// 			<div style="text-align: center;">
			// 				<audio id="${audioId}" src="${audioUrl}" style="display: none;">
			// 					Your browser does not support the audio element.
			// 				</audio>
			// 				<button
			// 					id="${playButtonId}"
			// 					onclick="
			// 						const audio = document.getElementById('${audioId}');
			// 						const btn = document.getElementById('${playButtonId}');
			// 						if (audio.paused) {
			// 							audio.play();
			// 							btn.innerHTML = '⏸️';
			// 							btn.style.backgroundColor = '#1677ff';
			// 						} else {
			// 							audio.pause();
			// 							btn.innerHTML = '▶️';
			// 							btn.style.backgroundColor = '#52c41a';
			// 						}
			// 						audio.onended = function() {
			// 							btn.innerHTML = '▶️';
			// 							btn.style.backgroundColor = '#52c41a';
			// 						};
			// 					"
			// 					style="
			// 						width: 40px;
			// 						height: 40px;
			// 						border: none;
			// 						border-radius: 50%;
			// 						background-color: #d7d7d7;
			// 						color: white;
			// 						font-size: 16px;
			// 						cursor: pointer;
			// 						display: flex;
			// 						align-items: center;
			// 						justify-content: center;
			// 						transition: all 0.3s ease;
			// 						box-shadow: 0 2px 8px rgba(0,0,0,0.15);
			// 					"
			// 					onmouseover="this.style.transform='scale(1.1)'"
			// 					onmouseout="this.style.transform='scale(1)'"
			// 				>
			// 					▶️
			// 				</button>
			// 			</div>
			// 		</div>
			// 	`;
			// }

			// Text content section
			if (result) {
				const htmlText = DOMPurify.sanitize(marked(result));
				htmlContent += `
					<div style="margin-bottom: 20px;">
						<div style="line-height: 1.6; font-size: 14px;">
							${htmlText}
						</div>
					</div>
				`;
			}

			// Images section
			if (imageUrls && imageUrls.length > 0) {
				htmlContent += `
					<div>
						<h4 style="margin-bottom: 16px; color: #333;">
							🖼️ ${imageUrls.length} ảnh
						</h4>
						<div>
				`;

				imageUrls.forEach((imageUrl, index) => {
					htmlContent += `
						<div style="text-align: center; margin-bottom: ${isSlideLayout ? '24px' : '12px'}; padding: ${isSlideLayout ? '16px' : '0'}; border: ${isSlideLayout ? '1px solid #e9ecef' : 'none'}; border-radius: ${isSlideLayout ? '8px' : '0'}; background-color: ${isSlideLayout ? '#ffffff' : 'transparent'};">
							<img src="${imageUrl}" alt="AI Generated Image ${index + 1}" style="width: 500px; height: 500px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; margin: auto" onclick="window.open('${imageUrl}', '_blank')" />
							<div style="margin-top: 8px; font-size: 12px; color: #666;">
								${!isSlideLayout ? `Ảnh ${index + 1}` : ''}
					`;

					// Add Vietnamese description for slide layout
					if (isSlideLayout && imageDescriptionsVi && imageDescriptionsVi[index]) {
						htmlContent += `
							<div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
								${imageDescriptionsVi[index]}
							</div>
						`;
					}
					// Fallback to English description
					else if (isSlideLayout && (!imageDescriptionsVi || !imageDescriptionsVi[index]) && imageDescriptions && imageDescriptions[index]) {
						htmlContent += `
							<div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
								<strong>Mô tả:</strong> ${imageDescriptions[index]}
							</div>
						`;
					}

					htmlContent += `
							</div>
						</div>
					`;
				});

				htmlContent += `
						</div>
					</div>
				`;
			}


			const question = await createNewQuestion({
				question: item.promt || item.prompt || '',
				ai_gen_id: item.id, // Gắn ID của AI Gen history
			});

			if (question) {
				await createNewAnswer({
					question_id: question.id,
					title: question.question,
					content: item.anwser || '',
					html: htmlContent,
					ai_gen_id: item.id, // Gắn ID của AI Gen history,
					audioUrl: audioUrl
				});

				// Cập nhật trạng thái is_create = true trong AI Gen history
				await updateAiGenHistory({
					id: item.id,
					is_create: true,
				});

				// Reload history để cập nhật UI
				await loadAiGenHistory();

				message.success('Duyệt thành công! Đã tạo câu hỏi và câu trả lời.');
			}
		} catch (error) {
			console.error('Lỗi khi duyệt:', error);
			message.error('Đã xảy ra lỗi khi duyệt!');
		}
	};

	// Batch approval functions
	const handleBatchApprovalSelect = (itemId, checked) => {
		if (checked) {
			setSelectedHistoryItems(prev => [...prev, itemId]);
		} else {
			setSelectedHistoryItems(prev => prev.filter(id => id !== itemId));
		}
	};

	const handleSelectAllHistory = (checked) => {
		if (checked) {
			// Select all items (including already approved ones)
			const allItems = aiGenHistory.map(item => item.id);
			setSelectedHistoryItems(allItems);
		} else {
			setSelectedHistoryItems([]);
		}
	};

	const handleSelectAllUnapproved = () => {
		// Select all items that haven't been approved yet
		const unapprovedItems = aiGenHistory
			.filter(item => item.is_create !== true)
			.map(item => item.id);
		if (unapprovedItems.length === 0) {
			message.warning('Không có câu hỏi chưa duyệt!');
			return;
		}
		setSelectedHistoryItems(unapprovedItems);
	};

	const handleBatchApproval = async () => {
		if (selectedHistoryItems.length === 0) {
			message.warning('Vui lòng chọn ít nhất một câu hỏi để duyệt!');
			return;
		}

		// Warn users if they select too many items
		if (selectedHistoryItems.length > 100) {
			const confirmed = await new Promise((resolve) => {
				Modal.confirm({
					title: 'Cảnh báo - Số lượng lớn',
					content: `Bạn đã chọn ${selectedHistoryItems.length} câu hỏi. Việc xử lý có thể mất nhiều thời gian và có thể gây quá tải server. Bạn có muốn tiếp tục không?`,
					okText: 'Tiếp tục',
					cancelText: 'Hủy',
					onOk: () => resolve(true),
					onCancel: () => resolve(false),
				});
			});

			if (!confirmed) {
				return;
			}
		}

		setBatchApprovalLoading(true);
		try {
			let successCount = 0;
			let errorCount = 0;
			const totalItems = selectedHistoryItems.length;
			
			// Process in batches of 10 to prevent server overload
			const batchSize = 10;
			const batches = [];
			for (let i = 0; i < selectedHistoryItems.length; i += batchSize) {
				batches.push(selectedHistoryItems.slice(i, i + batchSize));
			}

			message.info(`Bắt đầu xử lý ${totalItems} câu hỏi trong ${batches.length} batch...`);

			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				const batch = batches[batchIndex];
				
				// Show progress
				const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
				message.info(`Đang xử lý batch ${batchIndex + 1}/${batches.length} (${progress}%)`);

				// Process batch items sequentially (not parallel) to avoid overwhelming the server
				for (const itemId of batch) {
					try {
						const item = aiGenHistory.find(h => h.id === itemId);
						if (!item) continue;

						// Get flow config from aiGenHistory
						const flowConfig = aiConfigList.find(config => config.id == item.AIGenConfigId);

						// Determine layout
						let isSlideLayout = flowConfig?.layout === 'slide';
						if (!isSlideLayout && item.settings?.layout === 'slide') {
							isSlideLayout = true;
						}

						// Get data from history
						const result = item.anwser || '';
						const imageUrls = item.imageUrls || [];
						const imageDescriptions = item.settings?.imageDescriptions || [];
						const imageDescriptionsVi = item.settings?.imageDescriptionsVi || [];
						const audioUrl = item.audioUrl || '';

						// Generate HTML content
						let htmlContent = '';

						// Text content section
						if (result) {
							const htmlText = DOMPurify.sanitize(marked(result));
							htmlContent += `
								<div style="margin-bottom: 20px;">
									<div style="line-height: 1.6; font-size: 14px;">
										${htmlText}
									</div>
								</div>
							`;
						}

						// Images section
						if (imageUrls && imageUrls.length > 0) {
							htmlContent += `
								<div>
									<h4 style="margin-bottom: 16px; color: #333;">
										🖼️ ${imageUrls.length} ảnh
									</h4>
									<div>
							`;

							imageUrls.forEach((imageUrl, index) => {
								htmlContent += `
									<div style="text-align: center; margin-bottom: ${isSlideLayout ? '24px' : '12px'}; padding: ${isSlideLayout ? '16px' : '0'}; border: ${isSlideLayout ? '1px solid #e9ecef' : 'none'}; border-radius: ${isSlideLayout ? '8px' : '0'}; background-color: ${isSlideLayout ? '#ffffff' : 'transparent'};">
										<img src="${imageUrl}" alt="AI Generated Image ${index + 1}" style="width: 500px; height: 500px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; margin: auto" onclick="window.open('${imageUrl}', '_blank')" />
										<div style="margin-top: 8px; font-size: 12px; color: #666;">
											${!isSlideLayout ? `Ảnh ${index + 1}` : ''}
								`;

								// Add Vietnamese description for slide layout
								if (isSlideLayout && imageDescriptionsVi && imageDescriptionsVi[index]) {
									htmlContent += `
										<div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
											${imageDescriptionsVi[index]}
										</div>
									`;
								}
								// Fallback to English description
								else if (isSlideLayout && (!imageDescriptionsVi || !imageDescriptionsVi[index]) && imageDescriptions && imageDescriptions[index]) {
									htmlContent += `
										<div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
											<strong>Mô tả:</strong> ${imageDescriptions[index]}
										</div>
									`;
								}

								htmlContent += `
										</div>
									</div>
								`;
							});

							htmlContent += `
									</div>
								</div>
							`;
						}

						const question = await createNewQuestion({
							question: item.promt || item.prompt || '',
							ai_gen_id: item.id,
						});

						if (question) {
							await createNewAnswer({
								question_id: question.id,
								title: question.question,
								content: item.anwser || '',
								html: htmlContent,
								ai_gen_id: item.id,
								audioUrl: audioUrl
							});

							// Update status in AI Gen history
							await updateAiGenHistory({
								id: item.id,
								is_create: true,
							});

							successCount++;
						}

						// Add small delay between items to prevent server overload
						await new Promise(resolve => setTimeout(resolve, 100));

					} catch (error) {
						console.error(`Error processing item ${itemId}:`, error);
						errorCount++;
					}
				}

				// Add delay between batches
				if (batchIndex < batches.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 500));
				}
			}

			// Reload history to update UI
			await loadAiGenHistory();

			// Show final results
			if (successCount > 0) {
				message.success(`Đã duyệt thành công ${successCount}/${totalItems} câu hỏi!`);
			}
			if (errorCount > 0) {
				message.error(`Có ${errorCount} câu hỏi gặp lỗi khi duyệt!`);
			}

			// Close modal and reset selection
			setBatchApprovalModalOpen(false);
			setSelectedHistoryItems([]);

		} catch (error) {
			console.error('Error in batch approval:', error);
			message.error('Đã xảy ra lỗi khi duyệt hàng loạt!');
		} finally {
			setBatchApprovalLoading(false);
		}
	};

	return (
		<div className={css.aiLayout}>
			{/* Sidebar */}
			<div className={css.aiSidebar}>
				<div className={css.aiSection}
					 style={{
						 height: isHistoryCollapsed ? '80%' : 'calc(50% - 24px)',
					 }}>
					<div className={css.aiSectionTitle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<h3>Câu hỏi</h3>
							{/*<div*/}
							{/*	className={css.aiSectionTemplate}*/}
							{/*	onClick={handleTemplateClick}*/}
							{/*	style={{ cursor: 'pointer' }}*/}
							{/*>*/}
							{/*	<span>Template</span>*/}
							{/*</div>*/}
							<Button
								type="text"
								size="small"
								onClick={() => {
									setBatchModalOpen(true);
									// Initialize batch config with current settings
									setBatchConfig({
										selectedFlowId: selectedFlowId,
										expectedLength: expectedLength,
										writingStyle: writingStyle,
										imageCount: imageCount
									});
								}}
								style={{ fontSize: 12, padding: '2px 8px' }}
							>
								Hỏi hàng loạt
							</Button>
							<Button
								type="text"
								size="small"
								onClick={() => setFormModalOpen(true)}
								style={{ fontSize: 12, padding: '2px 8px' }}
							>
								Cấu hình AI
							</Button>
							<Button
								type="text"
								size="small"
								icon={<Settings size={16} />}
								onClick={() => setPromptTemplateModalOpen(true)}
								title="Cài đặt template prompt"
								style={{ fontSize: 12, padding: '2px 8px' }}
							/>
							<Button
								type="text"
								icon={<PlusCircle size={16} />}
								onClick={() => {
									setPrompt('');
									setResult(resultDefault);
									setSelectedAiGenHistoryId(null);
									setSelectedQueueItem(null);
									setSelectedFlowId(null);
									setImageResult(null);
									setImageUrls([]);
									setImageDescriptions([]); // Reset image descriptions (English)
									setImageDescriptionsVi([]); // Reset image descriptions (Vietnamese)
									setAudioResult(null);
									setAudioUrl('');
								}}
								className={css.newQuestionButton}
							/>
						</div>
					</div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: 12,
						width: '97%',
						height: isHistoryCollapsed ? '95%' : '90%',
					}}>
						<div style={{
							height: 'calc(100% - 30px)',
							margin: '12px 0',
							padding: '12px',
							backgroundColor: '#f8f9fa',
							border: '1px solid #e9ecef',
							borderRadius: '6px',
							width: '100%',
							display: 'flex',
							flexDirection: 'column',
							overflowY: 'auto'
						}}>
							{/* Content Area */}
							<div style={{ flex: 1, display: 'flex' }}>
								<textarea
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									style={{
										fontSize: 16,
										color: '#222',
										lineHeight: 1.5,
										wordBreak: 'break-word',
										flex: 1,
										border: 'none',
										backgroundColor: 'transparent',
										resize: 'none',
										outline: 'none',
										fontFamily: 'inherit',
									}}
									placeholder="Nhập câu hỏi của bạn"
								/>
							</div>

							{/* Config Area */}
							<div style={{
								marginTop: 12,
								padding: '12px',
								borderRadius: '4px',
								border: '1px solid #d9d9d9',
							}}>
								<div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
									Cấu hình:
								</div>
								<div style={{
									display: 'flex',
									gap: 12,
									flexWrap: 'wrap',
									justifyContent: isHistoryCollapsed ? 'space-between' : 'flex-start',
								}}>
									{/* Chọn luồng */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Luồng AI:</label>
										<Dropdown
											menu={{
												items: aiConfigList.map(config => ({
													key: config.id,
													label: config.name,
													onClick: () => handleFlowSelect(config.id),
												})),
											}}
											trigger={['click']}
											placement="bottomLeft"
										>
											<Button
												size="small"
												style={{
													backgroundColor: selectedFlowId ? '#e6f7ff' : undefined,
													borderColor: selectedFlowId ? '#1890ff' : undefined,
													minWidth: 120,
												}}
											>
												{loadingFlowList ? 'Đang tải...' :
													selectedFlowId ?
														aiConfigList.find(c => c.id === selectedFlowId)?.name || 'Chọn luồng' :
														'Chọn luồng'
												}
											</Button>
										</Dropdown>
									</div>

									{/* Độ dài dự kiến */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Độ dài (chữ):</label>
										<Input
											size="small"
											type="number"
											value={expectedLength}
											onChange={(e) => setExpectedLength(parseInt(e.target.value) || 100)}
											style={{ width: 80 }}
											min={100}
											max={2000}
										/>
									</div>

									{/* Tone giọng */}
									{/* <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Tone giọng:</label>
										<Select
											size="small"
											value={tone}
											onChange={setTone}
											options={toneOptions}
											style={{ width: 120 }}
										/>
									</div> */}

									{/* Kiểu viết */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Kiểu viết:</label>
										<Input
											size="small"
											value={writingStyle}
											onChange={e => setWritingStyle(e.target.value)}
											placeholder="Ví dụ: Trang trọng, Thân mật, Học thuật, ..."
											style={{ width: 300 }}
										/>
									</div>

									{/* Số lượng ảnh - chỉ hiển thị khi AI4 được bật */}
									{isAI4Enabled() && (
										<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											<label style={{ fontSize: 12, color: '#666' }}>Số ảnh:</label>
											<Select
												size="small"
												value={imageCount}
												onChange={setImageCount}
												options={Array.from({ length: 10 }, (_, i) => ({
													value: i + 1,
													label: `${i + 1} ảnh`
												}))}
												style={{ width: 100 }}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Button Area */}
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginTop: 8,
							}}>
								<Button
									type="text"
									size="small"
									onClick={() => {
										setPrompt('');
										setResult(resultDefault);
										setSelectedAiGenHistoryId(null);
										setSelectedQueueItem(null);
										setSelectedFlowId(null);
										setExpectedLength('');
										setWritingStyle('');
										setImageResult(null);
										setAudioResult(null);
										setAudioUrl('');
									}}
								>
									Đặt lại
								</Button>
								<div style={{ display: 'flex', gap: 8 }}>
									<Button
										type="primary"
										size="small"
										onClick={() => handleAnalyze(null)}
										loading={isLoading}
										icon={<Send size={16} />}
										disabled={!prompt.trim()}
									>
										{result && result !== resultDefault ? 'Gửi lại' : 'Gửi'}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
				{queueLength > 0 && (
					<div className={css.aiSectionHistoryChat}
					>
						<div className={css.historyHeader}>
							<div className={css.historyTitle}>
								<h3>Đang xử lý ({queueLength} yêu cầu)</h3>
							</div>
						</div>
						<List
							className={css.aiList}
							dataSource={analyzeQueue}
							renderItem={item => (
								<Card
									className={css.aiCard + (selectedQueueItem === item ? ' ' + css.selectedCard : '')}
									size="small"
									bodyStyle={{
										padding: 12,
										minHeight: 40,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
									onClick={() => {
										setSelectedQueueItem(item);
										setSelectedAiGenHistoryId(null);
										setSelectedFlowId(null);
									}}
									style={{
										cursor: 'pointer',
										borderColor: selectedQueueItem === item ? '#1677ff' : undefined,
									}}
								>
									<div style={{
										fontSize: 14,
										color: '#222',
										marginBottom: 4,
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}>{item.prompt}</div>

									<div className={css.aiDate}>
										{new Date(item.timestamp).toLocaleString('vi-VN', {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
											hour12: false,
										})}
									</div>
								</Card>
							)}
						/>
					</div>
				)}

				<div className={css.aiSectionHistoryChat}
					 style={{
						 height: isHistoryCollapsed ? '10%' : 'calc(50% - 24px)',
					 }}>
					<div className={css.historyHeader}>
						<div className={css.historyTitle}
							 style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
							 onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}>
							{isHistoryCollapsed ? <ChevronRight size={16} style={{ marginRight: 8 }} /> :
								<ChevronDown size={16} style={{ marginRight: 8 }} />}
							<h3>Lịch sử câu hỏi</h3>
						</div>
						<Button
							type="text"
							size="small"
							onClick={() => {
								setBatchApprovalModalOpen(true);
								setSelectedHistoryItems([]);
							}}
							style={{ fontSize: 12, padding: '2px 8px' }}
							title="Duyệt hàng loạt"
						>
							⚙️ Cài đặt
						</Button>
					</div>
					{!isHistoryCollapsed && (
						<List
							className={css.aiList}
							loading={loadingAiGenHistory}
							dataSource={aiGenHistory}
							renderItem={item => (
								<Dropdown
									menu={{
										items: [
											// Chỉ hiển thị option Duyệt khi chưa duyệt
											...(item.is_create !== true ? [
												{
													key: 'duyet',
													label: (
														<div
															style={{ display: 'flex', alignItems: 'center', gap: 8 }}
															onClick={(e) => {
																e.stopPropagation();
																handleDuyet(item);
															}}
														>
															<span>Xuất bản</span>
														</div>
													),
												},
												{
													type: 'divider',
												}
											] : [
												{
													key: 'duyet',
													label: (
														<div
															// style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999' }}
															onClick={(e) => {
																e.stopPropagation();
																handleDuyet(item);
															}}
														>
															<span>✅</span>
															<span>Tạo lại</span>
														</div>
													),
													// disabled: true,
												},
												{
													type: 'divider',
												}
											]),
											{
												key: 'view',
												label: (
													<div
														style={{ display: 'flex', alignItems: 'center', gap: 8 }}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedViewHistory(item);
															setViewModalOpen(true);
														}}
													>
														<span>👁️</span>
														<span>Xem view</span>
													</div>
												),
											},
											{
												type: 'divider',
											},
											{
												key: 'delete',
												danger: true,
												label: (
													<Popconfirm
														title="Xóa lịch sử"
														description="Bạn có chắc chắn muốn xóa lịch sử này?"
														onConfirm={() => handleDeleteAiGenHistory(item.id)}
														okText="Có"
														cancelText="Không"
													>
														<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
															<Trash2 size={16} />
															<span>Xóa</span>
														</div>
													</Popconfirm>
												),
											},
										],
									}}
									trigger={['contextMenu']}
								>
									<Card
										className={css.aiCard + (selectedAiGenHistoryId === item.id ? ' ' + css.selectedCard : '')}
										size="small"
										bodyStyle={{
											padding: 12,
											minHeight: 40,
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'space-between',
										}}
										onClick={() => handleSelectAiGenHistory(item)}
										style={{
											cursor: 'pointer',
											borderColor: selectedAiGenHistoryId === item.id ? '#1677ff' : undefined,
										}}
									>
										<div style={{
											fontSize: 14,
											color: '#222',
											marginBottom: 4,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
										}}>{item.prompt}</div>

										<div className={css.aiDate}>
											{new Date(item.create_at).toLocaleString('vi-VN', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
												second: '2-digit',
												hour12: false,
											})}

										</div>
									</Card>
								</Dropdown>
							)}
						/>
					)}
				</div>
			</div>
			{/* Main */}
			<div className={css.aiMain}>
				<div className={css.allMainContainer}>
					{selectedQueueItem && isLoading ? (
						<Spin spinning={true} tip="Đang xử lý...">
							<div style={{ textAlign: 'center', padding: '20px' }}>
							</div>
						</Spin>
					) : (
						<>
							<div className={css.headerAnswer}>
								<h3>
									{/*AI Output*/}
								</h3>
								<div className={css.buttonHeader}>
									<div style={{
										width: '100%',
										display: 'flex',
										justifyContent: 'flex-end',
										alignItems: 'center',
										gap: 12,
									}}>
										{result && result !== resultDefault && (
											<Button
												type="text"
												onClick={() => {
													setImproveAllInput('');
													setImproveAllModalOpen(true);
												}}
												disabled={!result || result === resultDefault}
											>
												Cải thiện toàn bộ
											</Button>
										)}
									</div>
								</div>
							</div>

							<div className={css.aiMainBottom}
								 style={{
									 justifyContent: 'center',
									 display: 'flex',
									 minHeight: 400,
									 height: '100%',
								 }}
							>
								{/* Use AiGenHistoryViewer component */}
								<AiGenHistoryViewer
									aiGenHistory={selectedAiGenHistoryId ? aiGenHistory.find(h => h.id == selectedAiGenHistoryId) : {
										anwser: result !== resultDefault ? result : '',
										imageUrls: imageUrls,
										audioUrl: audioUrl,
										settings: {
											ai3Result: ai3Result,
											imageDescriptions: imageDescriptions, // English descriptions
											imageDescriptionsVi: imageDescriptionsVi, // Vietnamese descriptions
											layout: getSelectedFlowConfig()?.layout || 'article'
										},
										AIGenConfigId: selectedFlowId
									}}
									aiConfigList={aiConfigList}
									isEditing={isEditing}
									editedContent={editedContent}
									onEditChange={setEditedContent}
									onEditStart={handleEditStart}
									onEditSave={handleEditSave}
									onEditCancel={handleEditCancel}
									onTextMouseUp={handleTextMouseUp}
									showImproveBtn={showImproveBtn}
									improveBtnPos={improveBtnPos}
									onImproveClick={(e) => {
										e.stopPropagation();
										setImproveInput(selectedText);
										setImproveModalOpen(true);
										setShowImproveBtn(false);
									}}
									onAudioCreate={async (historyItem) => {
										await createAudioForItem(historyItem, false);
									}}
									onAudioRecreate={async (historyItem) => {
										await createAudioForItem(historyItem, true);
									}}
									isLoading={isLoading}
									currentUser={currentUser}
								/>
							</div>
						</>
					)}
				</div>
			</div>

			<AIGenForm
				isOpen={formModalOpen}
				onClose={() => setFormModalOpen(false)}
				onAnalyze={handleAnalyze}
				onConfigListChange={loadAiConfigList}
			/>

			{/*{*/}
			{/*	templateModalOpen && <TemplateModalGen*/}
			{/*		isOpen={templateModalOpen}*/}
			{/*		onClose={() => setTemplateModalOpen(false)}*/}
			{/*		onSelectTemplate={handleTemplateSelect}*/}
			{/*		currentUser={currentUser}*/}
			{/*	/>*/}
			{/*}*/}
			<Modal
				open={improveModalOpen}
				onCancel={() => {
					setImproveModalOpen(false);
					setImprovePreview(null);
				}}
				title="Improve Selected Text"
				footer={null}
				style={{ top: 120 }}
				destroyOnClose
				width={800}
			>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Đoạn văn đã chọn:</div>
					<Input.TextArea
						value={selectedText}
						readOnly
						autoSize={{ minRows: 3 }}
						style={{
							backgroundColor: '#f5f5f5',
							borderColor: '#d9d9d9',
							color: '#666'
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Yêu cầu cải thiện:</div>
					<Input.TextArea
						value={improveInput}
						onChange={e => {
							setImproveInput(e.target.value);
							// Generate preview when input changes
							if (e.target.value.trim() && selectedTextRange) {
								const preview = generatePreview(result, selectedTextRange, e.target.value);
								setImprovePreview(preview);
							} else {
								setImprovePreview(null);
							}
						}}
						autoSize={{ minRows: 3 }}
						placeholder="Nhập yêu cầu cải thiện đoạn văn đã chọn..."
					/>
				</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button
						onClick={() => {
							setImproveModalOpen(false);
							setImprovePreview(null);
						}}
					>
						Hủy
					</Button>
					<Button
						type="primary"
						loading={improveLoading}
						disabled={!improveInput.trim() || !selectedTextRange}
						onClick={async () => {
							if (!selectedTextRange) {
								alert('Không thể xác định vị trí đoạn văn đã chọn!');
								return;
							}

							setImproveLoading(true);
							try {
								const model = MODEL_AI_LIST[0].value;
								const response = await improveText(result, selectedText, improveInput, model);
								const improvedText = response.result || response.improved_text || response.content || response;

								// Use the complete improved content instead of replacing at position
								if (improvedText && improvedText !== result) {
									// Tìm ID của bản ghi lịch sử để cập nhật
									let historyIdToUpdate = selectedAiGenHistoryId;

									// Nếu không có selectedAiGenHistoryId, tìm bản ghi mới nhất phù hợp
									if (!historyIdToUpdate) {
										const matchingHistory = aiGenHistory
											.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
											.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];

										if (matchingHistory) {
											historyIdToUpdate = matchingHistory.id;
											setSelectedAiGenHistoryId(matchingHistory.id);
										}
									}

									// Cập nhật database nếu có ID
									if (historyIdToUpdate) {
										await updateAiGenHistory({
											id: historyIdToUpdate,
											anwser: improvedText,
										});
										// Reload history để cập nhật dữ liệu mới
										await loadAiGenHistory();
									}

									setResult(improvedText);
									setImproveModalOpen(false);
									setImprovePreview(null);
									setSelectedTextRange(null);
									message.success('Đã cải thiện văn bản.')
								} else {
									alert('Không có thay đổi nào được thực hiện!');
								}
							} catch (error) {
								console.error('Error improving text:', error);
								alert('Có lỗi xảy ra khi cải thiện văn bản: ' + error.message);
							} finally {
								setImproveLoading(false);
							}
						}}
					>
						Cải thiện
					</Button>
				</div>
			</Modal>
			{/* Improve All Modal */}
			<Modal
				open={improveAllModalOpen}
				onCancel={() => {
					setImproveAllModalOpen(false);
					setImproveAllInput('');
				}}
				title="Cải thiện toàn bộ nội dung"
				footer={null}
				destroyOnClose
				width={800}
				height={'90vh'}
				centered={true}
			>
				<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Nội dung hiện tại:</div>
				<div style={{
					marginBottom: 16,
					height: '45vh',
					overflow: 'auto',
				}}>
					<Input.TextArea
						value={result}
						readOnly
						autoSize={{ minRows: 6 }}
						style={{
							backgroundColor: '#f5f5f5',
							borderColor: '#d9d9d9',
							color: '#666',
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Yêu cầu cải thiện:</div>
					<Input.TextArea
						value={improveAllInput}
						onChange={e => setImproveAllInput(e.target.value)}
						autoSize={{ minRows: 4 }}
						placeholder="Nhập yêu cầu cải thiện toàn bộ nội dung (ví dụ: Viết lại ngắn gọn hơn, Thêm ví dụ cụ thể, Cải thiện cấu trúc văn bản...)"
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold', color: '#666' }}>
						💡 Gợi ý:
					</div>
					<div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
						• "Viết lại ngắn gọn và dễ hiểu hơn"<br />
						• "Thêm ví dụ cụ thể và minh họa"<br />
						• "Cải thiện cấu trúc và bố cục văn bản"<br />
						• "Sử dụng ngôn ngữ chuyên nghiệp hơn"<br />
						• "Thêm các điểm quan trọng còn thiếu"
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button
						onClick={() => {
							setImproveAllModalOpen(false);
							setImproveAllInput('');
						}}
					>
						Hủy
					</Button>
					<Button
						type="primary"
						loading={improveAllLoading}
						disabled={!improveAllInput.trim() || !result || result === resultDefault}
						onClick={async () => {
							setImproveAllLoading(true);
							try {
								const model = MODEL_AI_LIST[0].value;
								const response = await improveText(result, result, improveAllInput, model);
								console.log(response)
								const improvedText = response.result || response.improved_text || response.content || response;

								if (improvedText && improvedText !== result) {
									// Tìm ID của bản ghi lịch sử để cập nhật
									let historyIdToUpdate = selectedAiGenHistoryId;

									// Nếu không có selectedAiGenHistoryId, tìm bản ghi mới nhất phù hợp
									if (!historyIdToUpdate) {
										const matchingHistory = aiGenHistory
											.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
											.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];

										if (matchingHistory) {
											historyIdToUpdate = matchingHistory.id;
											setSelectedAiGenHistoryId(matchingHistory.id);
										}
									}

									// Cập nhật database nếu có ID
									if (historyIdToUpdate) {
										await updateAiGenHistory({
											id: historyIdToUpdate,
											anwser: improvedText,
										});
										// Reload history để cập nhật dữ liệu mới
										await loadAiGenHistory();
									}

									setResult(improvedText);
									setImproveAllModalOpen(false);
									setImproveAllInput('');
									message.success('Đã cải thiện toàn bộ nội dung thành công!');
								} else {
									message.warning('Không có thay đổi nào được thực hiện!');
								}
							} catch (error) {
								console.error('Error improving all text:', error);
								message.error('Có lỗi xảy ra khi cải thiện nội dung: ' + error.message);
							} finally {
								setImproveAllLoading(false);
							}
						}}
					>
						Cải thiện toàn bộ
					</Button>
				</div>
			</Modal>
			{/* Batch Processing Modal */}
			<Modal
				open={batchModalOpen}
				onCancel={() => {
					setBatchModalOpen(false);
					setBatchQuestions([]);
				}}
				title="Hỏi hàng loạt"
				footer={null}
				style={{ top: 20 }}
				destroyOnClose
				width={1200}
			>
				<div style={{ display: 'flex', gap: 24, height: '65vh' , overflow: 'auto'}}>
					{/* Left: Configuration */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
							Cấu hình chung (mặc định cho câu hỏi mới)
						</div>

						{/* Flow Selection */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Luồng AI:
							</label>
							<Dropdown
								menu={{
									items: aiConfigList.map(config => ({
										key: config.id,
										label: config.name,
										onClick: () => setBatchConfig(prev => ({ ...prev, selectedFlowId: config.id })),
									})),
								}}
								trigger={['click']}
								placement="bottomLeft"
							>
								<Button
									size="large"
									style={{
										backgroundColor: batchConfig.selectedFlowId ? '#e6f7ff' : undefined,
										borderColor: batchConfig.selectedFlowId ? '#1890ff' : undefined,
										width: '100%',
										textAlign: 'left',
									}}
								>
									{loadingFlowList ? 'Đang tải...' :
										batchConfig.selectedFlowId ?
											aiConfigList.find(c => c.id === batchConfig.selectedFlowId)?.name || 'Chọn luồng' :
											'Chọn luồng'
									}
								</Button>
							</Dropdown>
						</div>

						{/* Expected Length */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Độ dài (chữ):
							</label>
							<Input
								size="large"
								type="number"
								value={batchConfig.expectedLength}
								onChange={(e) => setBatchConfig(prev => ({
									...prev,
									expectedLength: parseInt(e.target.value) || 100
								}))}
								min={100}
								max={2000}
							/>
						</div>

						{/* Writing Style */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Kiểu viết:
							</label>
							<Input
								size="large"
								value={batchConfig.writingStyle}
								onChange={e => setBatchConfig(prev => ({
									...prev,
									writingStyle: e.target.value
								}))}
								placeholder="Ví dụ: Trang trọng, Thân mật, Học thuật, ..."
							/>
						</div>

						{/* Image Count - only show if AI4 is enabled */}
						{(() => {
							const flowConfig = aiConfigList.find(config => config.id == batchConfig.selectedFlowId);
							const hasAI4 = flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI4') && ai.isUse);
							if (hasAI4) {
								return (
									<div>
										<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
											Số lượng ảnh:
										</label>
										<Select
											size="large"
											value={batchConfig.imageCount}
											onChange={value => setBatchConfig(prev => ({
												...prev,
												imageCount: value
											}))}
											options={Array.from({ length: 10 }, (_, i) => ({
												value: i + 1,
												label: `${i + 1} ảnh`
											}))}
											style={{ width: '100%' }}
										/>
									</div>
								);
							}
							return null;
						})()}

						{/* Action Buttons */}
						<div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
							<Button
								type="primary"
								size="large"
								loading={batchLoading}
								onClick={runBatchProcessing}
								disabled={!batchConfig.selectedFlowId || batchQuestions.length === 0}
								style={{ flex: 1 }}
							>
								Chạy hàng loạt ({batchQuestions.filter(q => q.question.trim()).length} câu hỏi)
							</Button>
						</div>
					</div>

					{/* Right: Questions Table */}
					<div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div style={{ fontWeight: 'bold', fontSize: 16 }}>
								Danh sách câu hỏi ({batchQuestions.length})
							</div>
							<Button
								type="primary"
								icon={<PlusCircle size={16} />}
								onClick={addQuestion}
							>
								Thêm câu hỏi
							</Button>
						</div>

						{/* Questions List */}
						<div style={{
							flex: 1,
							border: '1px solid #d9d9d9',
							borderRadius: 6,
							overflow: 'auto',
							maxHeight: '500px'
						}}>
							{batchQuestions.length === 0 ? (
								<div style={{
									textAlign: 'center',
									padding: 40,
									color: '#999',
									fontStyle: 'italic'
								}}>
									Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
								</div>
							) : (
								<div style={{ padding: 16 }}>
									{batchQuestions.map((question, index) => (
										<div
											key={question.id}
											style={{
												border: '1px solid #e8e8e8',
												borderRadius: 6,
												padding: 12,
												marginBottom: 12,
												backgroundColor: '#fafafa'
											}}
										>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
												<div style={{ flex: 1 }}>
													<div style={{ marginBottom: 8, fontWeight: 'bold', color: '#666' }}>
														Câu hỏi {index + 1}:
													</div>
													<Input.TextArea
														value={question.question}
														onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
														placeholder="Nhập câu hỏi của bạn..."
														autoSize={{ minRows: 3, maxRows: 6 }}
														style={{ marginBottom: 8 }}
													/>
													<div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
														{question.question.length} ký tự
													</div>

													{/* Individual Question Configuration */}
													<div style={{
														borderRadius: 4,
														padding: 8,
														marginBottom: 8
													}}>
														<div style={{ fontWeight: 'bold', fontSize: 12, color: '#666', marginBottom: 8 }}>
															Cấu hình riêng:
														</div>

														<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
															{/* Flow Selection for this question */}
															<div style={{ minWidth: 120 }}>
																<label style={{ fontSize: 10, color: '#999', display: 'block', marginBottom: 2 }}>
																	Luồng AI:
																</label>
																<Dropdown
																	menu={{
																		items: aiConfigList.map(config => ({
																			key: config.id,
																			label: config.name,
																			onClick: () => updateQuestionConfig(question.id, 'selectedFlowId', config.id),
																		})),
																	}}
																	trigger={['click']}
																	placement="bottomLeft"
																>
																	<Button
																		size="small"
																		style={{
																			backgroundColor: question.config?.selectedFlowId ? '#e6f7ff' : undefined,
																			borderColor: question.config?.selectedFlowId ? '#1890ff' : undefined,
																			fontSize: 11,
																			padding: '2px 6px',
																			height: 'auto'
																		}}
																	>
																		{question.config?.selectedFlowId ?
																			aiConfigList.find(c => c.id === question.config.selectedFlowId)?.name || 'Chọn luồng' :
																			'Chọn luồng'
																		}
																	</Button>
																</Dropdown>
															</div>

															{/* Expected Length for this question */}
															<div style={{ minWidth: 80 }}>
																<label style={{ fontSize: 10, color: '#999', display: 'block', marginBottom: 2 }}>
																	Độ dài:
																</label>
																<Input
																	size="small"
																	type="number"
																	value={question.config?.expectedLength || batchConfig.expectedLength}
																	onChange={(e) => updateQuestionConfig(question.id, 'expectedLength', parseInt(e.target.value) || 100)}
																	style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
																	min={100}
																	max={2000}
																/>
															</div>

															{/* Writing Style for this question */}
															<div style={{ minWidth: 120 }}>
																<label style={{ fontSize: 10, color: '#999', display: 'block', marginBottom: 2 }}>
																	Kiểu viết:
																</label>
																<Input
																	size="small"
																	value={question.config?.writingStyle || batchConfig.writingStyle}
																	onChange={(e) => updateQuestionConfig(question.id, 'writingStyle', e.target.value)}
																	placeholder="Kiểu viết"
																	style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
																/>
															</div>

															{/* Image Count for this question - only show if AI4 is enabled */}
															{(() => {
																const questionFlowConfig = aiConfigList.find(config => config.id == (question.config?.selectedFlowId || batchConfig.selectedFlowId));
																const hasAI4 = questionFlowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI4') && ai.isUse);
																if (hasAI4) {
																	return (
																		<div style={{ minWidth: 80 }}>
																			<label style={{ fontSize: 10, color: '#999', display: 'block', marginBottom: 2 }}>
																				Số ảnh:
																			</label>
																			<Select
																				size="small"
																				value={question.config?.imageCount || batchConfig.imageCount}
																				onChange={value => updateQuestionConfig(question.id, 'imageCount', value)}
																				options={Array.from({ length: 5 }, (_, i) => ({
																					value: i + 1,
																					label: `${i + 1}`
																				}))}
																				style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
																			/>
																		</div>
																	);
																}
																return null;
															})()}
														</div>
													</div>
												</div>
												<Button
													type="text"
													danger
													icon={<Trash2 size={16} />}
													onClick={() => removeQuestion(question.id)}
													style={{ flexShrink: 0 }}
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Summary */}
						{batchQuestions.length > 0 && (
							<div style={{
								padding: 12,
								backgroundColor: '#f0f8ff',
								borderRadius: 6,
								border: '1px solid #91d5ff'
							}}>
								<div style={{ fontWeight: 'bold', marginBottom: 4 }}>
									Tóm tắt:
								</div>
								<div style={{ fontSize: 14, color: '#666' }}>
									• Tổng câu hỏi: {batchQuestions.length}<br/>
									• Câu hỏi hợp lệ: {batchQuestions.filter(q => q.question.trim()).length}<br/>
									• Câu hỏi trống: {batchQuestions.filter(q => !q.question.trim()).length}<br/>
									• Câu hỏi có cấu hình riêng: {batchQuestions.filter(q => q.config && (q.config.selectedFlowId !== batchConfig.selectedFlowId || q.config.expectedLength !== batchConfig.expectedLength || q.config.writingStyle !== batchConfig.writingStyle)).length}
								</div>
							</div>
						)}
					</div>
				</div>
			</Modal>

			{/* View-only Modal */}
			<AiGenHistoryViewerModal
				isOpen={viewModalOpen}
				onClose={() => {
					setViewModalOpen(false);
					setSelectedViewHistory(null);
				}}
				aiGenHistory={selectedViewHistory}
			/>

            {/* Batch Approval Modal */}
            <Modal
                open={batchApprovalModalOpen}
                onCancel={() => {
                    setBatchApprovalModalOpen(false);
                    setSelectedHistoryItems([]);
                }}
                title="Duyệt hàng loạt"
                footer={[
                    <Button key="cancel" onClick={() => {
                        setBatchApprovalModalOpen(false);
                        setSelectedHistoryItems([]);
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="approve"
                        type="primary"
                        loading={batchApprovalLoading}
                        disabled={selectedHistoryItems.length === 0}
                        onClick={handleBatchApproval}
                    >
                        Duyệt {selectedHistoryItems.length > 0 ? `(${selectedHistoryItems.length})` : ''}
                    </Button>
                ]}
                destroyOnClose
                width={1000}
                style={{ top: 20 }}
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 'bold' }}>
                            Chọn câu hỏi để duyệt ({selectedHistoryItems.length} đã chọn)
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Button
                                size="small"
                                onClick={() => handleSelectAllHistory(true)}
                                disabled={aiGenHistory.length === 0}
                            >
                                Chọn tất cả
                            </Button>
                            <Button
                                size="small"
                                onClick={handleSelectAllUnapproved}
                            >
                                Chọn chưa duyệt
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleSelectAllHistory(false)}
                            >
                                Bỏ chọn tất cả
                            </Button>
                        </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                        💡 Bạn có thể chọn bất kỳ câu hỏi nào để duyệt hoặc tạo lại.
                    </div>
                </div>

                <div style={{
                    maxHeight: '60vh',
                    overflow: 'auto',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    padding: 12
                }}>
                    {aiGenHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                            Chưa có lịch sử câu hỏi nào.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {aiGenHistory.map((item, index) => {
                                const isApproved = item.is_create === true;
                                const isSelected = selectedHistoryItems.includes(item.id);

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            border: '1px solid #e8e8e8',
                                            borderRadius: 6,
                                            padding: 12,
                                            backgroundColor: isApproved ? '#f6ffed' : '#ffffff',
                                            opacity: isApproved ? 0.7 : 1,
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            {/* Checkbox */}
                                            <div style={{ marginTop: 2 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => handleBatchApprovalSelect(item.id, e.target.checked)}
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: 14,
                                                    color: '#222',
                                                    marginBottom: 4,
                                                    lineHeight: 1.4,
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {item.prompt}
                                                </div>

                                                <div style={{
                                                    fontSize: 12,
                                                    color: '#666',
                                                    marginBottom: 8
                                                }}>
                                                    {new Date(item.create_at).toLocaleString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false,
                                                    })}
                                                </div>

                                                {/* Status and info */}
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {isApproved && (
                                                        <span style={{
                                                            backgroundColor: '#52c41a',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: 11
                                                        }}>
															✅ Đã duyệt
														</span>
                                                    )}
                                                    {item.imageUrls && item.imageUrls.length > 0 && (
                                                        <span style={{
                                                            backgroundColor: '#1890ff',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: 11
                                                        }}>
															🖼️ {item.imageUrls.length} ảnh
														</span>
                                                    )}
                                                    {item.audioUrl && (
                                                        <span style={{
                                                            backgroundColor: '#722ed1',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: 11
                                                        }}>
															🎵 Có audio
														</span>
                                                    )}
                                                    {aiConfigList.find(c => c.id === item.AIGenConfigId)?.name && (
                                                        <span style={{
                                                            backgroundColor: '#faad14',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: 11
                                                        }}>
															{aiConfigList.find(c => c.id === item.AIGenConfigId)?.name}
														</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Preview button */}
                                            <div>
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    onClick={() => {
                                                        setSelectedViewHistory(item);
                                                        setViewModalOpen(true);
                                                    }}
                                                    style={{ fontSize: 11 }}
                                                >
                                                    👁️ Xem
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>


            </Modal>
			{/* Prompt Template Settings Modal */}
			<Modal
				open={promptTemplateModalOpen}
				onCancel={() => setPromptTemplateModalOpen(false)}
				title="Cài đặt Template Prompt"
				footer={[
					<Button key="cancel" onClick={() => setPromptTemplateModalOpen(false)}>
						Hủy
					</Button>,
					<Button
						key="save"
						type="primary"
						onClick={() => {
							setPromptTemplateModalOpen(false);
							message.success('Đã lưu cài đặt template thành công!');
						}}
					>
						Lưu
					</Button>,
				]}
				width={1000}
				style={{ top: 20 }}
				destroyOnClose={false}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '70vh' }}>
					{/* English Template */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 16, color: '#1677ff' }}>
							🇺🇸 Template Prompt Tiếng Anh (cho AI4 - Tạo ảnh)
						</div>
						<div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
							Template này sẽ được sử dụng để tạo mô tả ảnh bằng tiếng Anh cho AI4.
							Các biến có thể sử dụng: <code>${'${aiPrompt}'}</code>, <code>${'${imageCount}'}</code>
						</div>
						<Input.TextArea
							value={englishPromptTemplate}
							onChange={(e) => setEnglishPromptTemplate(e.target.value)}
							style={{
								flex: 1,
								fontFamily: 'monospace',
								fontSize: 13,
								lineHeight: 1.4,
								minHeight: '300px'
							}}
							placeholder="Nhập template prompt tiếng Anh..."
						/>
					</div>

					{/* Vietnamese Template */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 16, color: '#52c41a' }}>
							🇻🇳 Template Prompt Tiếng Việt (cho hiển thị)
						</div>
						<div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
							Template này sẽ được sử dụng để tạo mô tả ảnh bằng tiếng Việt cho hiển thị.
							Các biến có thể sử dụng: <code>${'${aiPrompt}'}</code>, <code>${'${imageCount}'}</code>
						</div>
						<Input.TextArea
							value={vietnamesePromptTemplate}
							onChange={(e) => setVietnamesePromptTemplate(e.target.value)}
							style={{
								flex: 1,
								fontFamily: 'monospace',
								fontSize: 13,
								lineHeight: 1.4,
								minHeight: '300px'
							}}
							placeholder="Nhập template prompt tiếng Việt..."
						/>
					</div>

					{/* Preview Section */}
					<div style={{
						padding: 12,
						backgroundColor: '#f8f9fa',
						borderRadius: 6,
						border: '1px solid #e9ecef'
					}}>
						<div style={{ fontWeight: 'bold', marginBottom: 8, color: '#666' }}>
							💡 Hướng dẫn sử dụng:
						</div>
						<div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
							• Sử dụng <code>${'${aiPrompt}'}</code> để chèn nội dung câu hỏi gốc<br/>
							• Sử dụng <code>${'${imageCount}'}</code> để chèn số lượng ảnh cần tạo<br/>
							• Template sẽ được áp dụng tự động khi chạy AI3 trong chế độ slide layout<br/>
							• Có thể chỉnh sửa template bất kỳ lúc nào mà không cần restart ứng dụng
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
}
