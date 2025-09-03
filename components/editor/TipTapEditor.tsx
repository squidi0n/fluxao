'use client';

import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Type,
  Minus,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const fontSizes = [
  { label: 'Klein', value: '12px' },
  { label: 'Normal', value: '16px' },
  { label: 'Groß', value: '18px' },
  { label: 'Sehr groß', value: '24px' },
  { label: 'Riesig', value: '32px' },
];

export default function TipTapEditor({
  content = '',
  onChange,
  placeholder = 'Schreibe deinen Artikel hier...',
  className,
}: TipTapEditorProps) {
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [editorZoom, setEditorZoom] = useState(100);

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none dark:prose-invert focus:outline-none min-h-[400px] p-4 dark:text-white',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Bild-URL eingeben:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Link-URL eingeben:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setFontSize = useCallback(
    (size: string) => {
      if (!editor) return;

      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
      setCurrentFontSize(size);
      setShowFontSizeDropdown(false);
    },
    [editor],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        editor.chain().focus().setImage({ src: data.url }).run();
      } catch (error) {
        // console.error('Image upload failed:', error);
        alert('Bildupload fehlgeschlagen');
      }
    },
    [editor],
  );

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadImage(file);
      }
    };
    input.click();
  }, [uploadImage]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-white dark:bg-gray-900 editor-container',
        className,
      )}
    >
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1">
        {/* Font Size */}
        <div className="relative pr-2 border-r">
          <button
            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            className="px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
            title="Schriftgröße"
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">{currentFontSize}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={cn(
                    'block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm',
                    currentFontSize === size.value && 'bg-gray-100 dark:bg-gray-700',
                  )}
                >
                  <span style={{ fontSize: size.value }}>{size.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Style */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('heading', { level: 1 }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Überschrift 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('heading', { level: 2 }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Überschrift 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('heading', { level: 3 }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Überschrift 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('paragraph') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Paragraph"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Format */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Fett"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Kursiv"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('underline') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Unterstrichen"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('strike') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Durchgestrichen"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('highlight') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Hervorheben"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('code') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Align */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive({ textAlign: 'left' }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Linksbündig"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive({ textAlign: 'center' }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Zentriert"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive({ textAlign: 'right' }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Rechtsbündig"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive({ textAlign: 'justify' }) && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Blocksatz"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Aufzählungsliste"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Nummerierte Liste"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('blockquote') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Zitat"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Horizontale Linie"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={handleImageUpload}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Bild hochladen"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={setLink}
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('link') && 'bg-gray-200 dark:bg-gray-700',
            )}
            title="Link einfügen"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rückgängig"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Wiederholen"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditorZoom(Math.max(50, editorZoom - 10))}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Verkleinern"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-2 text-sm font-medium">{editorZoom}%</span>
          <button
            onClick={() => setEditorZoom(Math.min(200, editorZoom + 10))}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Vergrößern"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditorZoom(100)}
            className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Zurücksetzen"
          >
            100%
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        className="overflow-y-auto resize-y"
        style={{
          minHeight: '400px',
          height: '500px',
        }}
      >
        <div style={{ zoom: `${editorZoom}%` }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-gray-50 dark:bg-gray-800 p-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{editor.storage.characterCount?.characters() || 0} Zeichen</span>
        <span>{editor.storage.characterCount?.words() || 0} Wörter</span>
      </div>
    </div>
  );
}
