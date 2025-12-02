import { useEditor as useTiptapEditor } from '@tiptap/react'
import Bold from '@tiptap/extension-bold'
import Highlight from '@tiptap/extension-highlight'
import Italic from '@tiptap/extension-italic'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Dropcursor from '@tiptap/extension-dropcursor'
import Heading from '@tiptap/extension-heading'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import FontFamily from '@tiptap/extension-font-family'
import Placeholder from '@tiptap/extension-placeholder'
import History from '@tiptap/extension-history'
import { Color } from '@tiptap/extension-color'
import { ResizableImage } from './ResizableImage'
import { FontSize } from './FontSize'
import { LineHeight } from './LineHeight'
import { uploadFiles } from '../../../../apis/uploadImageWikiNoteService.jsx';

export function useEditor() {

  const editor = useTiptapEditor({
    extensions: [
      Bold,
      FontSize,
      Highlight,
      Italic,
      Strike,
      Underline,
      Document,
      Paragraph,
      FontFamily,
      Text,
      TextStyle,
      Color,
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      History,
      HorizontalRule,
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Dropcursor,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Nhập nội dung...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote', 'table', 'tableCell', 'bulletList', 'orderedList'],
      }),
      LineHeight
    ],
    editorProps: {
      handlePaste: function (view, event, slice) {
        const items = event.clipboardData?.items;

        if (!items || !items.length) return false;

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;
            
            const timestamp = Date.now();
            const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
            const newFileName = `image-${timestamp}${fileExtension}`;
            const newFile = new File([file], newFileName, { type: file.type });
            const formData = new FormData();
            formData.append('file', newFile);

            uploadFiles(formData)
              .then(url => {
                if (url) {
                  editor.chain().focus().setImage({ src: url.files[0]?.fileUrl }).run();
                }
              })
              .catch(error => {
                console.error('Error uploading image:', error);
              });
            return true;
          }
        }
        return false;
      },
    },
    content: '',
  })

  return { editor }
}