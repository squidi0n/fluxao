'use client';

import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';
import { useCallback } from 'react';

interface TipTapEditorProps {
  content?: any;
  onChange?: (json: any) => void;
  onImageUpload?: () => void;
}

export default function TipTapEditor({ content, onChange, onImageUpload }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 pl-4 italic text-gray-700',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Bild URL eingeben:');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-200 dark:bg-gray-700' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Fett"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Kursiv"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Durchgestrichen"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Überschrift 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Überschrift 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Aufzählungsliste"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Nummerierte Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Zitat"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={onImageUpload || addImage} title="Bild einfügen (URL oder Upload)">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Trennlinie"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1 ml-auto" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Rückgängig"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Wiederholen"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Bild hochladen
            </h3>
            <button
              onClick={() => setShowImageUpload(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ImageUpload onImageUploaded={handleImageUploaded} />
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-lg dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  );
}
