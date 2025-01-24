'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Editor, Node } from '@tiptap/core';
import { EditorView } from 'prosemirror-view';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import parse from 'html-react-parser';

// Browser-safe HTML minification
const minifyHtml = (html: string): string => {
  return html
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/>\s+</g, '><') // Remove spaces between tags
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .trim();
};

// Custom node for BE Variables
const BeVariable = Node.create({
  name: 'beVariable',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  parseHTML() {
    return [
      {
        tag: 'span.be-variable',
      },
    ]
  },

  renderHTML() {
    return ['span', { class: 'be-variable' }, '{BE Variable}']
  },
});

// Custom extension for alternating list styles
const CustomOrderedList = Extension.create({
  name: 'customOrderedList',

  addGlobalAttributes() {
    return [
      {
        types: ['orderedList'],
        attributes: {
          level: {
            default: 1,
            parseHTML: element => parseInt(element.getAttribute('data-level') || '1'),
            renderHTML: attributes => {
              const level = attributes.level || 1;
              let listStyleType = 'decimal';
              let marginLeft = '0';
              
              // Alternate between number, letter, and roman numerals based on level
              if (level === 1) {
                listStyleType = 'decimal';
              } else if (level === 2) {
                listStyleType = 'lower-alpha';
                marginLeft = '1.5em';
              } else {
                listStyleType = 'lower-roman';
                marginLeft = '3em';
              }
              
              return {
                'data-level': level,
                style: `list-style-type: ${listStyleType} !important; margin-left: ${marginLeft} !important;`
              };
            }
          }
        }
      }
    ];
  }
});

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ 
      rows: 2, 
      cols: 2, 
      withHeaderRow: true,
      HTMLAttributes: {
        class: 'document-table',
        style: 'min-width: 50px; width: 100%; border-collapse: collapse;'
      }
    }).run();

    // Add colgroup for equal column widths
    editor.chain()
      .focus()
      .insertContentAt(editor.state.selection.from, {
        type: 'colgroup',
        content: [
          {
            type: 'col',
            attrs: {
              style: 'width: 50%'
            }
          },
          {
            type: 'col',
            attrs: {
              style: 'width: 50%'
            }
          }
        ]
      })
      .run();

    // Set the header cells with proper structure
    editor.chain()
      .focus()
      .selectCell(0, 0)
      .insertContent({
        type: 'paragraph',
        attrs: { class: 'text-xs font-400' },
        content: [{ 
          type: 'text',
          marks: [{ type: 'bold' }],
          text: 'Header 1'
        }]
      })
      .selectCell(0, 1)
      .insertContent({
        type: 'paragraph',
        attrs: { class: 'text-xs font-400' },
        content: [{ 
          type: 'text',
          marks: [{ type: 'bold' }],
          text: 'Header 2'
        }]
      })
      .run();
  };

  const startOrderedListAt = () => {
    const number = prompt('Start numbering at:', '5');
    if (number !== null) {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', {
        start: parseInt(number)
      }).run();
    }
  };

  const handleIndent = (editor: Editor) => {
    const currentLevel = editor.getAttributes('orderedList').level || 1;
    if (currentLevel < 3) {
      const newLevel = currentLevel + 1;
      editor.chain()
        .focus()
        .sinkListItem('listItem')
        .run();
      
      // Update the level after indentation
      setTimeout(() => {
        editor.chain()
          .focus()
          .updateAttributes('orderedList', {
            level: newLevel
          })
          .run();
      }, 10);
    }
  };

  const handleOutdent = (editor: Editor) => {
    const currentLevel = editor.getAttributes('orderedList').level || 1;
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      editor.chain()
        .focus()
        .liftListItem('listItem')
        .run();
      
      // Update the level after outdentation
      setTimeout(() => {
        editor.chain()
          .focus()
          .updateAttributes('orderedList', {
            level: newLevel
          })
          .run();
      }, 10);
    } else {
      editor.chain()
        .focus()
        .liftListItem('listItem')
        .run();
    }
  };

  return (
    <div className="editor-toolbar">
      {/* Text Style */}
      <div className="toolbar-group">
        <select 
          onChange={(e) => {
            const level = parseInt(e.target.value);
            level ? editor.chain().focus().toggleHeading({ level }).run() 
                 : editor.chain().focus().setParagraph().run();
          }}
          className="toolbar-select"
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' : '0'
          }
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </div>

      {/* Text Formatting */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold (⌘B)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 0 0 0-5H8Z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic (⌘I)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-button ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline (⌘U)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2ZM4 20h16v2H4v-2Z"/>
          </svg>
        </button>
      </div>

      {/* Lists and Indentation */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.5v1H3v-1Zm2 3v3h1v1H3v-1Zm2-5h3.5v1H3v-1ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"/>
          </svg>
        </button>
        <button
          onClick={startOrderedListAt}
          className="toolbar-button"
          title="Start List at Number..."
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M2 5h2v2H2V5zm4 0h16v2H6V5zM2 11h2v2H2v-2zm4 0h16v2H6v-2zM2 17h2v2H2v-2zm4 0h16v2H6v-2z"/>
          </svg>
        </button>
        <div className="toolbar-divider" />
        <button
          onClick={() => handleOutdent(editor)}
          className="toolbar-button"
          title="Decrease Indent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path  d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zM7 8v8l-4-4 4-4z"/>
          </svg>
        </button>
        <button
          onClick={() => handleIndent(editor)}
          className="toolbar-button"
          title="Increase Indent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zM3 8v8l4-4-4-4z"/>
          </svg>
        </button>
        </div>

      {/* Alignment */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          title="Align Left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 4h18v2H3V4Zm0 15h14v2H3v-2Zm0-5h18v2H3v-2Zm0-5h14v2H3V9Z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          title="Align Center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 4h18v2H3V4Zm2 15h14v2H5v-2Zm-2-5h18v2H3v-2Zm2-5h14v2H5V9Z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          title="Align Right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 4h18v2H3V4Zm4 15h14v2H7v-2Zm-4-5h18v2H3v-2Zm4-5h14v2H7V9Z"/>
          </svg>
        </button>
      </div>

      {/* Table Controls */}
      <div className="toolbar-group">
        <button
          onClick={addTable}
          className="toolbar-button"
          title="Insert Table"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M4 8h16V5H4v3zm10 11v-9h-4v9h4zm2 0h4v-9h-4v9zm-8 0v-9H4v9h4zM3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
          </svg>
        </button>
        
        {editor.isActive('table') && (
          <>
            <button
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="toolbar-button"
              title="Add Column Before"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M10 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6zM9 5H5v14h4V5zm9 2a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4V7h4zm0 2h-2v6h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="toolbar-button"
              title="Add Column After"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6zm-1 2h-4v14h4V5zM6 7a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H2V7h4zm0 2H4v6h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="toolbar-button"
              title="Delete Column"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6zm-1 2H7v14h4V5zm8.3 3.3a1 1 0 0 1 0 1.4L17.4 12l1.9 1.9a1 1 0 0 1-1.4 1.4L16 13.4l-1.9 1.9a1 1 0 0 1-1.4-1.4l1.9-1.9-1.9-1.9a1 1 0 0 1 1.4-1.4l1.9 1.9 1.9-1.9a1 1 0 0 1 1.4 0z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="toolbar-button"
              title="Add Row Before"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16zm-1 2H5v4h14v-4zM12 2a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8V2h4zm0 2H10v6h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="toolbar-button"
              title="Add Row After"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h16zm-1 2H5v2h14v-2zM12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8V2h4zm0 2H10v8h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="toolbar-button"
              title="Delete Row"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h16zm-1 2H5v4h14V7zm-3.3 10.3a1 1 0 0 1 0 1.4L13.4 21l1.9 1.9a1 1 0 0 1-1.4 1.4L12 22.4l-1.9 1.9a1 1 0 0 1-1.4-1.4l1.9-1.9-1.9-1.9a1 1 0 0 1 1.4-1.4l1.9 1.9 1.9-1.9a1 1 0 0 1 1.4 0z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().mergeCells().run()}
              className="toolbar-button"
              title="Merge Cells"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2 5h20v14H2V5zm2 2v10h16V7H4zm2 2h12v6H6V9z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().splitCell().run()}
              className="toolbar-button"
              title="Split Cells"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2 5h20v14H2V5zm2 2v10h7V7H4zm9 0v10h7V7h-7z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="toolbar-button text-red-600 hover:bg-red-50"
              title="Delete Table"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M4 8h16V5H4v3zm10 11v-9h-4v9h4zm2 0h4v-9h-4v9zm-8 0v-9H4v9h4zM3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm16.7 14.7a1 1 0 0 1-1.4 1.4L16 16.8l-2.3 2.3a1 1 0 0 1-1.4-1.4l2.3-2.3-2.3-2.3a1 1 0 0 1 1.4-1.4l2.3 2.3 2.3-2.3a1 1 0 0 1 1.4 1.4L17.4 15l2.3 2.3z"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Update the styles first
const styles = `
  /* Base editor styles */
  .editor-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
  }

  /* Top menu styles */
  .top-menu {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 16px 0;
    margin-bottom: 16px;
  }

  .top-menu-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .top-menu-buttons input[type="file"] {
    display: none;
  }

  /* Modern action buttons */
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.15s ease;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 0.875rem;
    height: 36px;
  }

  .action-button.primary {
    background: #2563eb;
    color: white;
  }

  .action-button.primary:hover {
    background: #1d4ed8;
  }

  .action-button.ghost {
    background: transparent;
    color: #64748b;
  }

  .action-button.ghost:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  .action-button svg {
    width: 16px;
    height: 16px;
  }

  .editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .toolbar-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toolbar-button:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .toolbar-button.active {
    background: #e2e8f0;
    color: #0f172a;
  }

  .toolbar-select {
    height: 32px;
    padding: 0 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .toolbar-select:hover {
    background: #f1f5f9;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: #e5e7eb;
    margin: 0 4px;
  }

  .editor-content {
    padding: 16px;
    min-height: 500px;
    position: relative;
  }

  /* Fix cursor issue */
  .ProseMirror {
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    padding: 4px 8px 4px 14px;
    line-height: 1.2;
    outline: none;
  }

  .ProseMirror .is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  /* Improve list visibility with cursor */
  .ProseMirror ol {
    padding-left: 28px;
  }

  .ProseMirror ul {
    padding-left: 24px;
  }

  /* File info styles */
  .file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 6px 12px;
    background: #f8fafc;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.875rem;
  }

  .file-info svg {
    width: 16px;
    height: 16px;
  }

  /* Table styles remain the same */
  .ProseMirror table,
  .document-table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 0;
  }

  .ProseMirror td,
  .ProseMirror th,
  .document-table td,
  .document-table th {
    border: 1px solid #ced4da;
    box-sizing: border-box;
    padding: 3px 5px;
    position: relative;
    vertical-align: top;
  }

  .ProseMirror th,
  .document-table th,
  .table-header {
    background-color: #f3f4f6;
    font-weight: bold;
    text-align: center;
  }

  .document-table ul {
    list-style-type: disc;
    margin: 0;
    padding-left: 20px;
  }
  
  .document-table li {
    margin: 0;
  }

  .document-table colgroup col {
    width: 50%;
  }

  /* Modern upload button */
  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background: white;
    border-radius: 12px;
    border: 2px dashed #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-zone:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }

  .upload-zone.compact {
    padding: 16px;
    flex-direction: row;
    gap: 12px;
    margin-bottom: 16px;
  }

  .upload-zone.compact .upload-icon {
    width: 24px;
    height: 24px;
    margin: 0;
  }
`;

export default function Home() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [processedHtml, setProcessedHtml] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'text-xs font-400'
          }
        },
        heading: {
          HTMLAttributes: {
            class: 'text-xs font-bold'
          },
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            style: 'list-style:disc;margin:0'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: ''
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'text-xs font-400'
          }
        }
      }),
      CustomOrderedList,
      BeVariable,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'document-table',
          style: 'width: 100%; border-collapse: collapse;'
        },
        allowTableNodeSelection: true
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: ''
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'table-header',
          style: 'text-align:center; background-color: #f3f4f6; font-weight: bold;'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: '',
          style: 'vertical-align: top; padding: 3px 5px;'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: htmlContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
        .replace(/&amp;/g, '&')
        .replace(/%s/g, '<span class="be-variable">{BE Variable}</span>');
      setHtmlContent(html);
      const processed = html;
      setProcessedHtml(processed);
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
      handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          if (event.shiftKey) {
            if (editor) handleOutdent(editor);
          } else {
            if (editor) handleIndent(editor);
          }
          return true;
        }
        return false;
      }
    },
    parseOptions: {
      preserveWhitespace: true,
    },
  });

  const handleIndent = (editor: Editor) => {
    const currentLevel = editor.getAttributes('orderedList').level || 1;
    if (currentLevel < 3) {
      const newLevel = currentLevel + 1;
      editor.chain()
        .focus()
        .sinkListItem('listItem')
        .run();
      
      // Update the level after indentation
      setTimeout(() => {
        editor.chain()
          .focus()
          .updateAttributes('orderedList', {
            level: newLevel
          })
          .run();
      }, 10);
    }
  };

  const handleOutdent = (editor: Editor) => {
    const currentLevel = editor.getAttributes('orderedList').level || 1;
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      editor.chain()
        .focus()
        .liftListItem('listItem')
        .run();
      
      // Update the level after outdentation
      setTimeout(() => {
        editor.chain()
          .focus()
          .updateAttributes('orderedList', {
            level: newLevel
          })
          .run();
      }, 10);
    } else {
      editor.chain()
        .focus()
        .liftListItem('listItem')
        .run();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && htmlContent && !isEditing) {
      editor.commands.setContent(htmlContent);
    }
  }, [isEditing, htmlContent, editor]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string)
        .replace(/&amp;/g, '&')
        .replace(/%s/g, '<span class="be-variable">{BE Variable}</span>');
      
      setHtmlContent(content);
      setProcessedHtml(content);
      
      if (editor) {
        editor.commands.setContent(content);
      }
      
      // Set to edit mode when uploading
      setIsEditing(true);
    };
    reader.readAsText(file);
    
    // Clear the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    try {
      let exportContent = htmlContent
        .replace(/<span class="be-variable">\{BE Variable\}<\/span>/g, '%s')
        .replace(/&amp;/g, '&');
      
      const minified = minifyHtml(exportContent);

      const blob = new Blob([minified], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting HTML:', error);
    }
  };

  // Add the copy function
  const handleCopy = () => {
    try {
      let exportContent = htmlContent
        .replace(/<span class="be-variable">\{BE Variable\}<\/span>/g, '%s')
        .replace(/&amp;/g, '&');
      
      const minified = minifyHtml(exportContent);
      navigator.clipboard.writeText(minified);
    } catch (error) {
      console.error('Error copying HTML:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="app-container bg-slate-50">
      <style>{styles}</style>
      {/* Fixed Header */}
      <div className="header-container">
        <div>
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-helvetica text-xl font-semibold text-gray-800 flex items-center gap-3">
                  NFT Direct HTML Editor
                </h1>
              </div>
            </div>
            <div className="top-menu">
              <div className="top-menu-buttons">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="action-button primary"
                  title="Upload HTML file"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v12m0-12L8 7m4-4l4 4" />
                    <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                  </svg>
                  Upload HTML
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="action-button primary"
                  title={isEditing ? "Switch to preview mode" : "Switch to edit mode"}
                >
                  {isEditing ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Mode
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Mode
                    </>
                  )}
                </button>
                {htmlContent && (
                  <>
                    <button
                      onClick={handleExport}
                      className="action-button primary"
                      title="Export HTML file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                      </svg>
                      Export
                    </button>
                    <button
                      onClick={handleCopy}
                      className="action-button primary"
                      title="Copy minified HTML to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {currentFileName && (
              <div className="file-info mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                {currentFileName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Toolbar when in edit mode */}
      {isEditing && (
        <div className="toolbar-container">
          <div>
            <MenuBar editor={editor} />
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="content-container">
        <div>
          <div className="editor-container my-4">
            {isEditing ? (
              <div className="editor-content">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="editor-content">
                {parse(processedHtml)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
