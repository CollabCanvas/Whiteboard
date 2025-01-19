import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [tool, setTool] = useState('pen'); // pen, highlighter, eraser
  const [darkMode, setDarkMode] = useState(false);
  const [socket, setSocket] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [texts, setTexts] = useState([]);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedTextIndex, setDraggedTextIndex] = useState(null);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialTextPos, setInitialTextPos] = useState({ x: 0, y: 0 });
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizingTextIndex, setResizingTextIndex] = useState(null);
  const [cursors, setCursors] = useState({});

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('cursors-update', (updatedCursors) => {
      setCursors(updatedCursors);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // For smoother drawing
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load saved state if available
    const savedState = localStorage.getItem('whiteboard-state');
    if (savedState) {
      const img = new Image();
      img.src = savedState;
      img.onload = () => context.drawImage(img, 0, 0);
    } else {
      saveToUndoStack();
    }
  }, [darkMode]);

  // Auto-save functionality
  const autoSave = debounce(() => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    localStorage.setItem('whiteboard-state', dataUrl);
  }, 1000);

  const saveToUndoStack = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setUndoStack(prev => [...prev, dataUrl]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 1) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const lastState = undoStack[undoStack.length - 2];
      
      const img = new Image();
      img.src = lastState;
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };

      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, undoStack[undoStack.length - 1]]);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      
      setUndoStack(prev => [...prev, nextState]);
      setRedoStack(prev => prev.slice(0, -1));
      
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
    }
  };

  const startDrawing = (e) => {
    if (isTextMode) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTextPosition({ x, y });
      setTextInput('');
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    if(socket) {
      socket.emit('drawing-start', { x, y, color, lineWidth, opacity, tool });
    }
  };

  const draw = (e) => {
    if (isTextMode || !isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');
    if(tool === 'highlighter') {
      context.globalAlpha = 0.05;
      context.lineWidth = lineWidth * 2.5;
    } else {
      context.globalAlpha = opacity;
      context.lineWidth = lineWidth;
    }
    context.strokeStyle = tool === 'eraser' ? (darkMode ? '#282c34' : 'white') : color;
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
    if(socket) {
      socket.emit('drawing', { x, y, color, lineWidth, opacity, tool });
    }
    autoSave();
  };

  const stopDrawing = () => {
    if (isTextMode) return;
    if(isDrawing) {
      setIsDrawing(false);
      saveToUndoStack();
      if(socket) {
        socket.emit('drawing-end');
      }
    }
  };

  const addTextToCanvas = () => {
    if (textInput.trim() === '') return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.font = `${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''} ${fontSize}px Arial`;
    context.fillStyle = color;
    context.fillText(textInput, textPosition.x, textPosition.y);
    setTexts([...texts, { text: textInput, x: textPosition.x, y: textPosition.y, fontSize, isBold, isItalic, color }]);
    setTextInput('');
    setIsTextMode(false);
    saveToUndoStack();
  };

  const toggleTextMode = () => {
    setIsTextMode(!isTextMode);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const clearCanvas = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setShowClearConfirm(false);
    saveToUndoStack();
  };

  const cancelClearCanvas = () => {
    setShowClearConfirm(false);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'canvas.png';
    link.click();
  };

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTextToCanvas();
    }
  };

  const handleTextMouseDown = (e, index) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const text = texts[index];
    const textWidth = text.fontSize * text.text.length * 0.6; // Approximate text width
    const textHeight = text.fontSize; // Approximate text height

    if (x > text.x && x < text.x + textWidth && y > text.y - textHeight && y < text.y) {
      setIsDraggingText(true);
      setDraggedTextIndex(index);
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialTextPos({ x: text.x, y: text.y });
    } else if (x > text.x + textWidth - 10 && x < text.x + textWidth + 10 && y > text.y - textHeight - 10 && y < text.y - textHeight + 10) {
      setIsResizingText(true);
      setResizingTextIndex(index);
      setInitialMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTextMouseMove = (e) => {
    if (isDraggingText) {
      const dx = e.clientX - initialMousePos.x;
      const dy = e.clientY - initialMousePos.y;
      setTexts((prevTexts) => {
        const newTexts = [...prevTexts];
        newTexts[draggedTextIndex] = {
          ...newTexts[draggedTextIndex],
          x: initialTextPos.x + dx,
          y: initialTextPos.y + dy,
        };
        redrawCanvas();
        return newTexts;
      });
    } else if (isResizingText) {
      const dx = e.clientX - initialMousePos.x;
      setTexts((prevTexts) => {
        const newTexts = [...prevTexts];
        newTexts[resizingTextIndex] = {
          ...newTexts[resizingTextIndex],
          fontSize: Math.max(8, newTexts[resizingTextIndex].fontSize + dx / 10),
        };
        redrawCanvas();
        return newTexts;
      });
    }
  };

  const handleTextMouseUp = () => {
    if (isDraggingText) {
      setIsDraggingText(false);
      setDraggedTextIndex(null);
      saveToUndoStack();
    } else if (isResizingText) {
      setIsResizingText(false);
      setResizingTextIndex(null);
      saveToUndoStack();
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    texts.forEach((text) => {
      context.font = `${text.isBold ? 'bold' : ''} ${text.isItalic ? 'italic' : ''} ${text.fontSize}px Arial`;
      context.fillStyle = text.color;
      context.fillText(text.text, text.x, text.y);
      drawTextBox(context, text);
    });
  };

  const drawTextBox = (context, text) => {
    const textWidth = context.measureText(text.text).width; // Accurate text width
    const textHeight = text.fontSize; // Approximate text height
    context.strokeStyle = 'blue';
    context.lineWidth = 1;
    context.strokeRect(text.x, text.y - textHeight, textWidth, textHeight);
    context.fillStyle = 'blue';
    context.fillRect(text.x + textWidth - 10, text.y - textHeight - 10, 10, 10);
  };

  return (
    <div className={`whiteboard-container ${darkMode ? 'dark' : ''}`}>
      <h2>Collab Canvas</h2>
      
      <ToolPanel
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        opacity={opacity}
        setOpacity={setOpacity}
        tool={tool}
        setTool={setTool}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        undo={undo}
        redo={redo}
        clearCanvas={clearCanvas}
        downloadCanvas={downloadCanvas}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isBold={isBold}
        setIsBold={setIsBold}
        isItalic={isItalic}
        setIsItalic={setIsItalic}
        isTextMode={isTextMode}
        toggleTextMode={toggleTextMode}
        addTextToCanvas={addTextToCanvas}
      />
      
      <div className="canvas-container" onMouseMove={handleTextMouseMove} onMouseUp={handleTextMouseUp}>
        <canvas
          ref={canvasRef}
          width={1500}
          height={800}
          style={{ 
            border: '1px solid #e0e0e0',
            backgroundColor: darkMode ? '#282c34' : 'white',
            borderRadius: '8px',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <CursorOverlay cursors={cursors} />
        {isTextMode && (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onBlur={addTextToCanvas}
            onKeyDown={handleTextInputKeyDown}
            placeholder="Enter text here..."
            style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y,
              transform: 'translate(-50%, -50%)',
              fontSize: `${fontSize}px`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              color: color,
              background: 'transparent',
              border: 'none',
              outline: 'none'
            }}
          />
        )}
      </div>

      {showClearConfirm && (
        <div className="clear-confirm">
          <p>Are you sure you want to clear the canvas?</p>
          <button onClick={confirmClearCanvas}>Yes</button>
          <button onClick={cancelClearCanvas}>No</button>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
