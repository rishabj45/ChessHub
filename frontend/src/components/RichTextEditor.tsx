import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your announcement...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Only set initial content once to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && !initialized && value) {
      editorRef.current.innerHTML = value;
      setInitialized(true);
    }
  }, [value, initialized]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    const range = saveSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    // Restore focus and selection after a small delay
    setTimeout(() => {
      editorRef.current?.focus();
      restoreSelection(range);
    }, 10);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const handleFocus = () => {
    setIsFocused(true);
    // If content is empty, set initialized to false so we can set content properly
    if (editorRef.current && editorRef.current.innerHTML.trim() === '') {
      setInitialized(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        
        <div className="w-px h-8 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        
        <div className="w-px h-8 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) executeCommand('createLink', url);
          }}
          className="p-2 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
          title="Insert Link"
        >
          <Link size={16} />
        </button>
        
        <div className="w-px h-8 bg-gray-300 mx-1" />
        
        <select
          onChange={(e) => executeCommand('formatBlock', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200 transition-colors"
          defaultValue="div"
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        className={`p-4 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none ${!value ? 'text-gray-400' : ''}`}
        style={{ wordBreak: 'break-word' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
