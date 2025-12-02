import css from './TipTapGroup.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { TiptapToolbar } from './TiptapToolbar';
import { useEditor } from './useEditor';
import { Button, message } from 'antd';
import { EditIcon, SaveIcon } from './ListIcon.jsx';
import { useParams } from 'react-router-dom';
import { MuteIcon } from '../../../../icon/IconSvg.jsx';
import { getCurrentUserLogin } from '../../../../apis/userService.jsx';
import { updateNoteChart } from '../../../../apis/noteService.jsx';

export default function TipTapGroup({ dataTiptap }) {
	const { editor } = useEditor();
	const [currentUser, setCurrentUser] = useState(null);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [isEditMode, setEditMode] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const [isDownload, setIsDownload] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
	const { page } = useParams();
	const [fileNotePad, setFileNotePad] = useState(null);

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

	const fetchCurrentUser = async () => {
		const { data } = await getCurrentUserLogin();
		if (data) {
			setCurrentUser(data);
		}
	};

	useEffect(() => {
		fetchCurrentUser();
	}, []);

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
				chartTitle: 'Group', // Ensure correct chartTitle
				content: content,
			};
			await updateNoteChart(data.id, data);
			setShowButton(false);
			setEditMode(false);
			message.success('Saved');
		} catch (error) {
			message.error('Error saving');
		}
	};

	const toggleEditMode = () => {
		setEditMode(!isEditMode);
		setShowButton(true);
	};

	if (!editor) {
		return null;
	}

	return (
		<div className={css.main}>
			<div className={css.pageInfo}>
				<div className={css.info}>
					<div className={css.infoRight}>
						<div className={css.controlContainer}>
							{!showButton ? (
								<>
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
								<Button
									onClick={handleSave}
									icon={<SaveIcon />}
								>
									Lưu
								</Button>
							)}
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