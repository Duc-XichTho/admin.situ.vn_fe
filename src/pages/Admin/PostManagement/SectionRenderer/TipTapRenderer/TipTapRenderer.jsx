import css from './TipTapRenderer.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { TiptapToolbar } from './TiptapToolbar';
import { useEditor } from './useEditor';
import { Button, message } from 'antd';
import { EditIcon, SaveIcon } from './ListIcon.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUserLogin } from '../../../../../apis/userService.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import { deleteContentPage, updateContentPage } from '../../../../../apis/contentPageService.jsx';
import { MuteIcon } from '../../../../../icon/IconSvg.jsx';
import { DeleteOutlined } from '@ant-design/icons';


export default function TipTapRenderer({ dataTiptap }) {
	const { editor } = useEditor();
	const { currentUser, loadData, setLoadData } = useContext(MyContext);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [isEditMode, setEditMode] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const [isDownload, setIsDownload] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
	const { itemId } = useParams();
	const [fileNotePad, setFileNotePad] = useState(null);
	const navigate = useNavigate();
	const fetchData = async () => {
		setFileNotePad(dataTiptap);
	};


	useEffect(() => {
		fetchData();
	}, [dataTiptap]);

	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditMode);
		}
	}, [isEditMode, editor]);


	useEffect(() => {
		if (fileNotePad?.content) {
			editor.commands.setContent(fileNotePad.content);
		}
	}, [fileNotePad?.content]);

	const handleSave = async () => {
		try {
			const content = editor.getHTML();
			const data = {
				...fileNotePad,
				content: content,
			};
			await updateContentPage(data);
			// await fetchData();
			setShowButton(false);
			setEditMode(false);
			message.success('Đã lưu');
		} catch (error) {
			console.log(error);
			message.error('Có lỗi khi lưu');
		}
	};

	const toggleEditMode = () => {
		setEditMode(!isEditMode);
		setShowButton(true);
	};

	const handleShare = async () => {
		try {
			const url = `${import.meta.env.VITE_DOMAIN_URL}/share/document/${fileNotePad.id}`;
			await navigator.clipboard.writeText(url);
			message.success('Đã sao chép vào bộ nhớ tạm');
		} catch (error) {
			console.error('Failed to copy text: ', error);
		}
	};

	const toggleShare = async () => {
		try {
			const data = {
				...fileNotePad,
				info: {
					...fileNotePad.info,
					hide: !fileNotePad.info.hide,
				},
			};
			// await updateFileNotePad(data);
			// await fetchData();
			message.success('Đã thay đổi trạng thái');
		} catch (error) {
			console.log(error);
			message.error('Có lỗi khi thay đổi trạng thái');
		}
	};

	if (!editor) {
		return null;
	}

	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef(null);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	const removeHtmlTags = (htmlString) => {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		return doc.body.textContent || '';
	};

	const handleDownload = async (text) => {
		// try {
		// 	setIsDownload(true);
		// 	const dataVoice = await requestSpeech(removeHtmlTags(text));
		// 	const filename = `${fileNotePad.name}_Audio`;
		// 	const response = await fetch(dataVoice.audioUrl);
		// 	const blob = await response.blob();
		// 	const link = document.createElement('a');
		// 	link.href = URL.createObjectURL(blob);
		// 	link.download = filename;
		// 	document.body.appendChild(link);
		// 	link.click();
		// 	document.body.removeChild(link);
		// 	URL.revokeObjectURL(link.href);
		// 	setIsDownload(false);
		// 	message.success('Download thành công!');
		// } catch (error) {
		// 	console.error('Lỗi khi tải file:', error);
		// }
	};


	const handleSpeaks = async (text) => {
		// if (isPlaying) {
		// 	audioRef.current.pause();
		// 	setIsPlaying(false);
		// 	return;
		// }
		//
		// try {
		// 	setIsLoading(true);
		// 	const response = await requestSpeech(removeHtmlTags(text));
		// 	if (response.message === 'SUCCESS') {
		// 		const newAudio = new Audio(response.audioUrl);
		// 		audioRef.current = newAudio;
		// 		newAudio.play();
		// 		setIsPlaying(true);
		// 		setIsLoading(false);
		// 		newAudio.onloadedmetadata = () => {
		// 			setDuration(newAudio.duration); // Set duration
		// 		};
		//
		// 		newAudio.ontimeupdate = () => {
		// 			setCurrentTime(newAudio.currentTime); // Set current time
		// 			setProgress((newAudio.currentTime / newAudio.duration) * 100);
		// 		};
		//
		// 		// Khi âm thanh kết thúc, tự động dừng lại
		// 		newAudio.onended = () => {
		// 			setIsPlaying(false);
		// 			setIsLoading(false);
		// 			setProgress(0);
		// 		};
		// 	}
		// } catch (error) {
		// 	toast.error('Không thể phát âm thanh. Vui lòng thử lại!');
		// 	setIsLoading(false); // Dừng loading khi có lỗi
		//
		// }
	};

	const handleSeek = (event) => {
		const newTime = (event.target.value / 100) * audioRef.current.duration;
		audioRef.current.currentTime = newTime;
	};

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, []);

	const formatTime = (timeInSeconds) => {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};

	const handleDelete = async () => {
		await deleteContentPage(itemId);
		setLoadData(!loadData);
		navigate('/admin/section-page/posts')
	};

	return (
		<div className={css.main}>
			<div className={css.pageInfo}>
				<div className={css.info}>
					<div className={css.infoRight}>
						<div className={css.controlContainer}>
							<Button onClick={handleDelete} icon={<DeleteOutlined />} danger>
								Xóa
							</Button>
							{!showButton ? (
								<>
									{isLoading ? (
										<div className={css.loadingCircle}></div>
									) : (
										isPlaying ? (
											<div className={css.buttonWrap}
												 onClick={() => handleSpeaks(fileNotePad.content)}>
												<MuteIcon width={20} height={20} />
											</div>) : (
											<>
												{/*<div className={css.buttonWrap}*/}
												{/*	 onClick={() => handleDownload(fileNotePad.content)}*/}
												{/*	 style={{*/}
												{/*		 display: 'flex',*/}
												{/*		 alignItems: 'center',*/}
												{/*		 justifyContent: 'center',*/}
												{/*	 }}*/}
												{/*>*/}
												{/*	{isDownload ? (*/}
												{/*		<div className={css.loadingCircle}></div>*/}
												{/*	) : (*/}
												{/*		<FaDownload size={16} style={{*/}
												{/*			color: '#52c41a',*/}
												{/*			cursor: 'pointer',*/}
												{/*		}} />*/}
												{/*	)*/}
												{/*	}*/}
												{/*</div>*/}
												{/*<div className={css.buttonWrap}*/}
												{/*	 onClick={() => handleSpeaks(fileNotePad.content)}>*/}
												{/*	<SpeakerIcon width={20} height={20} />*/}
												{/*</div>*/}

											</>

										)
									)}
									{isPlaying && (
										<>
											<div className={css.buttonWrap}>
												<input
													type='range'
													min='0'
													max='100'
													value={progress}
													onChange={handleSeek}
													step='1'
												/>
											</div>
											<div className={css.timeDisplay}>
												<span>{formatTime(currentTime)} / {formatTime(duration)}</span>
											</div>
										</>


									)}
									{(currentUser?.isAdmin) &&
										<Button
											onClick={toggleEditMode}
											icon={<EditIcon />}
										>
											Cập nhật
										</Button>
									}

								</>

							) : (
								<>
									<Button
										onClick={handleSave}
										icon={<SaveIcon />}
									>
										Lưu
									</Button>
								</>
							)}
							{/*{!fileNotePad?.info.hide && (*/}
							{/*	<Button*/}
							{/*		onClick={handleShare}*/}
							{/*		icon={<ShareIcon />}*/}
							{/*	>*/}
							{/*		Chia sẻ*/}
							{/*	</Button>*/}
							{/*)}*/}
							{/*{showButton ? (*/}
							{/*  <Button*/}
							{/*    onClick={handleSave}*/}
							{/*    icon={<SaveIcon />}*/}
							{/*  >*/}
							{/*    Lưu*/}
							{/*  </Button>*/}
							{/*) : (*/}
							{/*  <Button*/}
							{/*    onClick={toggleEditMode}*/}
							{/*    icon={<EditIcon />}*/}
							{/*  >*/}
							{/*    Cập nhật*/}
							{/*  </Button>*/}
							{/*)}*/}

							{/*{currentUser?.isAdmin && (*/}
							{/*	<Switch*/}
							{/*		className={css.customSwitch}*/}
							{/*		checked={!fileNotePad?.info?.hide}*/}
							{/*		checkedChildren='Shared'*/}
							{/*		unCheckedChildren='Unshared'*/}
							{/*		onChange={toggleShare}*/}
							{/*	/>*/}
							{/*)}*/}
						</div>

					</div>
				</div>

			</div>
			<div className={css.content}>
				<div className={css.tiptap}>
					{isEditMode && (
						<TiptapToolbar
							editor={editor}
							headingMenuOpen={headingMenuOpen}
							setHeadingMenuOpen={setHeadingMenuOpen}
							tableMenuOpen={tableMenuOpen}
							setTableMenuOpen={setTableMenuOpen}
							fontMenuOpen={fontMenuOpen}
							setFontMenuOpen={setFontMenuOpen}
							colorPickerMenuOpen={colorPickerMenuOpen}
							setColorPickerMenuOpen={setColorPickerMenuOpen}
							fontSizeMenuOpen={fontSizeMenuOpen}
							setFontSizeMenuOpen={setFontSizeMenuOpen}
							lineHeightMenuOpen={lineHeightMenuOpen}
							setLineHeightMenuOpen={setLineHeightMenuOpen}
						/>
					)}

					<div className={isEditMode ? css.editorContent : css.editorContentFull}>
						<EditorContent
							className={css.editorContentWrap}
							editor={editor}
						/>
					</div>
				</div>
			</div>
		</div>

	);
}
