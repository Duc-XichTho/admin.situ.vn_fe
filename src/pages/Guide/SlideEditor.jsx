import { Box, TextField, Typography } from '@mui/material';
import { EditorContent } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import tiptapCss from '../PageViewer/SectionPageDetail/TipTap/Tiptap.module.css';
import { TiptapToolbar } from '../PageViewer/SectionPageDetail/TipTap/TiptapToolbar';
import { useEditor } from '../PageViewer/SectionPageDetail/TipTap/useEditor';

const SlideEditor = ({ slide, onContentChange, isEditable = true }) => {
    const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
    const [tableMenuOpen, setTableMenuOpen] = useState(false);
    const [fontMenuOpen, setFontMenuOpen] = useState(false);
    const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
    const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
    const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
    
    const { editor } = useEditor();
    
    // Set editor editable mode
    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
        }
    }, [editor, isEditable]);
    
    // Load slide content when slide changes
    useEffect(() => {
        if (editor && slide) {
            const content = slide.content || '';
            editor.commands.setContent(content);
        }
    }, [slide?.order, editor]);
    
    // Save content when editor changes
    useEffect(() => {
        if (!editor || !isEditable) return;
        
        const handleUpdate = () => {
            const content = editor.getHTML();
            if (onContentChange) {
                onContentChange(content, undefined);
            }
        };
        
        editor.on('update', handleUpdate);
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, isEditable, onContentChange]);
    
    const handleTitleChange = (newTitle) => {
        if (onContentChange) {
            onContentChange(undefined, newTitle);
        }
    };
    
    return (
        <Box sx={{ 
            height: '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: isEditable ? '#ffffff' : '#fafafa',
        }}>
            {isEditable && (
                <Box sx={{ flexShrink: 0 }}>
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
                </Box>
            )}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: isEditable ? '16px' : '20px',
                }}
            >
                {isEditable ? (
                    <TextField
                        value={slide?.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Nhập tiêu đề cho slide"
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                        }}
                        sx={{
                            marginBottom: '20px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            backgroundColor: '#fffbe6',
                            padding: '12px',
                            borderRadius: '4px',
                            '& .MuiInputBase-input': {
                                cursor: 'text',
                            }
                        }}
                    />
                ) : (
                    slide?.title && (
                        <Typography
                            variant="h4"
                            component="h2"
                            sx={{
                                marginBottom: '24px',
                                fontWeight: 'bold',
                                color: '#1976d2',
                                paddingBottom: '12px',
                                borderBottom: '2px solid #e0e0e0',
                            }}
                        >
                            {slide.title}
                        </Typography>
                    )
                )}
                <EditorContent
                    className={tiptapCss.editorContentWrap}
                    editor={editor}
                />
            </Box>
        </Box>
    );
};

export default SlideEditor;
