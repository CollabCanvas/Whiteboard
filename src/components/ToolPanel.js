import React from 'react';
import { 
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Moon,
  Sun,
  Upload,
  Type,
  Bold,
  Italic
} from 'lucide-react';

const ToolPanel = ({
  color,
  setColor,
  lineWidth,
  setLineWidth,
  opacity,
  setOpacity,
  tool,
  setTool,
  darkMode,
  toggleDarkMode,
  undo,
  redo,
  clearCanvas,
  downloadCanvas,
  loadCanvas,
  fontSize,
  setFontSize,
  isBold,
  setIsBold,
  isItalic,
  setIsItalic,
  isTextMode,
  toggleTextMode,
  addTextToCanvas,
  isEditTextMode,
  toggleEditTextMode
}) => {
  return (
    <div className="tools-row">
      <div className="tool-group">
        <button 
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
          title="Pen"
        >
          <Pencil size={20} />
        </button>
        <button 
          className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
          onClick={() => setTool('highlighter')}
          title="Highlighter"
        >
          <Highlighter size={20} />
        </button>
        <button 
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
        <button 
          className={`tool-btn ${isTextMode ? 'active' : ''}`}
          onClick={toggleTextMode}
          title="Text"
        >
          <Type size={20} />
        </button>
      </div>

      <div className="tool-group">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
          title="Color"
        />
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="slider"
          title="Line Width"
        />
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="slider"
          title="Opacity"
        />
        {isTextMode && (
          <>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="font-size-input"
              title="Font Size"
            />
            <button 
              className={`tool-btn ${isBold ? 'active' : ''}`}
              onClick={() => setIsBold(!isBold)}
              title="Bold"
            >
              <Bold size={20} />
            </button>
            <button 
              className={`tool-btn ${isItalic ? 'active' : ''}`}
              onClick={() => setIsItalic(!isItalic)}
              title="Italic"
            >
              <Italic size={20} />
            </button>
          </>
        )}
      </div>

      <div className="tool-group">
        <button onClick={undo} className="tool-btn" title="Undo">
          <Undo2 size={20} />
        </button>
        <button onClick={redo} className="tool-btn" title="Redo">
          <Redo2 size={20} />
        </button>
        <button onClick={clearCanvas} className="tool-btn" title="Clear">
          <Trash2 size={20} />
        </button>
        <button onClick={downloadCanvas} className="tool-btn" title="Download">
          <Download size={20} />
        </button>
        <button onClick={loadCanvas} className="tool-btn" title="Load">
          <Upload size={20} />
        </button>
        <button onClick={toggleDarkMode} className="tool-btn" title="Toggle Theme">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ToolPanel;