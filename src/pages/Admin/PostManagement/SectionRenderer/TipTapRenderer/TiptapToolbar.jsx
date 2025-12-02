import { useRef, useEffect } from 'react';
import css from './Tiptap.module.css';
import {
  BoldIcon, HighlightIcon, ItalicIcon, StrikeIcon, UnderlineIcon,
  BlockquoteIcon, BulletListIcon, OrderedListIcon, ImageIcon,
  InsertTableIcon, ColumnInsertLeftIcon, ColumnInsertRightIcon,
  DeleteColumnIcon, RowInsertTopIcon, RowInsertBottomIcon,
  DeleteRowIcon, DeleteTableIcon, CellMergeIcon, SplitCellIcon,
  SetColorIcon, EraserIcon, FontFillIcon, AlignLeftIcon, AlignCenterIcon,
  AlignRightIcon, FontSizeIcon, HeadingIcon, LineHeightIcon
} from "./ListIcon";

export function TiptapToolbar({
  editor,
  headingMenuOpen,
  setHeadingMenuOpen,
  tableMenuOpen,
  setTableMenuOpen,
  fontMenuOpen,
  setFontMenuOpen,
  colorPickerMenuOpen,
  setColorPickerMenuOpen,
  fontSizeMenuOpen,
  setFontSizeMenuOpen,
  lineHeightMenuOpen,
  setLineHeightMenuOpen
}) {
  const fontMenuRef = useRef(null);
  const fontSizeMenuRef = useRef(null);
  const headingMenuRef = useRef(null);
  const tableMenuRef = useRef(null);
  const colorPickerRef = useRef(null);
  const lineHeightMenuRef = useRef(null);

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target)) {
        setTableMenuOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerMenuOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target)) {
        setFontMenuOpen(false);
      }
      if (headingMenuRef.current && !headingMenuRef.current.contains(event.target)) {
        setHeadingMenuOpen(false);
      }
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target)) {
        setFontSizeMenuOpen(false);
      }
      if (lineHeightMenuRef.current && !lineHeightMenuRef.current.contains(event.target)) {
        setLineHeightMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fontSizes = ["10px", "12px", "14px", "18px", "20px", "22px", "24px", "28px", "32px", "36px", "48px", "72px"];
  const lineHeights = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

  if (!editor) {
    return null;
  }

  return (
    <div className={css.controlGroup}>
      <div className={css.buttonGroup}>
        <div className={css.lineHeightMenuContainer} ref={lineHeightMenuRef}>
          <button
            onClick={() => setLineHeightMenuOpen(!lineHeightMenuOpen)}
            className={lineHeightMenuOpen ? css.isActive : ''}
          >
            <LineHeightIcon />
          </button>
          {lineHeightMenuOpen && (
            <div className={css.lineHeightDropdownMenu}>
              <button
                onClick={() => {
                  editor.chain().focus().setLineHeight('normal').run();
                  setLineHeightMenuOpen(false);
                }}
              >
                <span>Mặc định</span>
              </button>
              {lineHeights.map((height) => (
                <button
                  key={height}
                  onClick={() => {
                    editor.chain().focus().setLineHeight(height).run();
                    setLineHeightMenuOpen(false);
                  }}
                  className={editor.isActive('lineHeight', { lineHeight: height }) ? css.isActive : ''}
                >
                  <span>{height}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={css.fontMenuContainer} ref={fontMenuRef}>
          <button
            onClick={() => setFontMenuOpen(!fontMenuOpen)}
            className={fontMenuOpen ? css.isActive : ''}
          >
            <FontFillIcon />
          </button>
          {fontMenuOpen && (
            <div className={css.fontDropdownMenu}>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('Comic Sans MS').run();
                  setFontMenuOpen(false);
                }}
                className={
                  editor.isActive('textStyle', { fontFamily: 'Comic Sans MS' })
                    ? css.isActive
                    : ''
                }
                data-test-id="comic-sans"
              >
                <span style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('serif').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'serif' }) ? css.isActive : ''}
                data-test-id="serif"
              >
                <span style={{ fontFamily: 'serif' }}>Serif</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('monospace').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'monospace' }) ? css.isActive : ''}
                data-test-id="monospace"
              >
                <span style={{ fontFamily: 'monospace' }}>Monospace</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily('cursive').run();
                  setFontMenuOpen(false);
                }}
                className={editor.isActive('textStyle', { fontFamily: 'cursive' }) ? css.isActive : ''}
                data-test-id="cursive"
              >
                <span style={{ fontFamily: 'cursive' }}>Cursive</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().unsetFontFamily().run();
                  setFontMenuOpen(false);
                }}
                data-test-id="unsetFontFamily"
              >
                <EraserIcon /> <span>Bỏ font</span>
              </button>
            </div>
          )}
        </div>
        <div className={css.fontSizeMenuContainer} ref={fontSizeMenuRef}>
          <button
            onClick={() => setFontSizeMenuOpen(!fontSizeMenuOpen)}
            className={fontSizeMenuOpen ? css.isActive : ''}
          >
            <FontSizeIcon />
          </button>

          {fontSizeMenuOpen && (
            <div className={css.fontSizeDropdownMenu}>
              <button onClick={() => editor.chain().focus().unsetFontSize().run()}>
                <span>Mặc định</span>
              </button>
              {fontSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setFontSizeMenuOpen(false);
                  }}
                >
                  <span style={{ fontSize: size }}>{size}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={css.headingMenuContainer} ref={headingMenuRef}>
          <button
            onClick={() => setHeadingMenuOpen(!headingMenuOpen)}
            className={headingMenuOpen ? css.isActive : ''}
          >
            <HeadingIcon />
          </button>
          {headingMenuOpen && (
            <div className={css.headingDropdownMenu}>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '32px' }}>H1</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '24px' }}>H2</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '18.72px' }}>H3</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '16px' }}>H4</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                className={editor.isActive('heading', { level: 5 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '13.28px' }}>H5</span>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                className={editor.isActive('heading', { level: 6 }) ? css.isActive : ''}
              >
                <span style={{ fontSize: '10.72px' }}>H6</span>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? css.isActive : ''}
        >
          <BoldIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? css.isActive : ''}
        >
          <HighlightIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? css.isActive : ''}
        >
          <ItalicIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? css.isActive : ''}
        >
          <StrikeIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? css.isActive : ''}
        >
          <UnderlineIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? css.isActive : ''}
        >
          <BlockquoteIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? css.isActive : ''}
        >
          <BulletListIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? css.isActive : ''}
        >
          <OrderedListIcon />
        </button>
        <button onClick={addImage}><ImageIcon /></button>
        <div className={css.tableMenuContainer} ref={tableMenuRef}>
          <button
            onClick={() => setTableMenuOpen(!tableMenuOpen)}
            className={tableMenuOpen ? css.isActive : ''}
          >
            <InsertTableIcon />
          </button>
          {tableMenuOpen && (
            <div className={css.tableDropdownMenu}>
              <button onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setTableMenuOpen(false);
              }}>
                <InsertTableIcon /> <span>Thêm bảng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addColumnBefore().run();
                setTableMenuOpen(false);
              }}>
                <ColumnInsertRightIcon /> <span>Thêm cột bên trái</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                setTableMenuOpen(false);
              }}>
                <ColumnInsertLeftIcon /> <span>Thêm cột bên phải</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteColumn().run();
                setTableMenuOpen(false);
              }}>
                <DeleteColumnIcon /> <span>Xóa cột</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addRowBefore().run();
                setTableMenuOpen(false);
              }}>
                <RowInsertTopIcon /> <span>Thêm dòng bên trên</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().addRowAfter().run();
                setTableMenuOpen(false);
              }}>
                <RowInsertBottomIcon /> <span>Thêm dòng bên dưới</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteRow().run();
                setTableMenuOpen(false);
              }}>
                <DeleteRowIcon /> <span>Xóa dòng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().deleteTable().run();
                setTableMenuOpen(false);
              }}>
                <DeleteTableIcon /> <span>Xóa bảng</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().mergeCells().run();
                setTableMenuOpen(false);
              }}>
                <CellMergeIcon /> <span>Hợp nhất ô</span>
              </button>
              <button onClick={() => {
                editor.chain().focus().splitCell().run();
                setTableMenuOpen(false);
              }}>
                <SplitCellIcon /> <span>Tách ô</span>
              </button>
            </div>
          )}
        </div>
        <div className={css.colorPickerContainer} ref={colorPickerRef}>
          <button
            onClick={() => setColorPickerMenuOpen(!colorPickerMenuOpen)}
            className={colorPickerMenuOpen ? css.isActive : ''}
          >
            <SetColorIcon />
          </button>
          {colorPickerMenuOpen && (
            <div className={css.colorPickerDropdown}>
              <input
                type="color"
                className={css.colorPicker}
                onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                value={editor.getAttributes('textStyle').color}
                data-testid="setColor"
              />
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorPickerMenuOpen(false);
                }}
                data-testid="unsetColor"
              >
                Unset
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? css.isActive : ''}
        >
          <AlignLeftIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? css.isActive : ''}
        >
          <AlignCenterIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? css.isActive : ''}
        >
          <AlignRightIcon />
        </button>
      </div>
    </div>
  );
}