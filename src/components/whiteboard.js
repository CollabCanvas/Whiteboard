import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';
import CursorOverlay from './CursorOverlay';
import ToolPanel from './ToolPanel';
import StickyNote from './StickyNote';
import { useStickyNotes } from './useStickyNotes';
import ShapeToolPanel from './ShapeToolPanel';
import { useShapeDrawing } from '../hooks/useShapeDrawing';
import { drawShapeOnCanvas } from '../utils/drawShapes';
import TemplateSelector from './TemplateSelector';
import CanvasDrawingService from '../services/CanvasDrawingService';
import '../styles/Whiteboard.css';

const Whiteboard = ({ canvasWidth, canvasHeight }) => {
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
  const [shapes, setShapes] = useState([]);
  const [nextShapeId, setNextShapeId] = useState(1);
  const [drawingService, setDrawingService] = useState(null);
  const { stickyNotes, addStickyNote, updateStickyNote, moveStickyNote, deleteStickyNote, handleCanvasClick } = useStickyNotes(tool, canvasRef);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const service = new CanvasDrawingService(canvas);
    setDrawingService(service);
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = darkMode ? '#282c34' : 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToUndoStack();
  }, [darkMode, canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    shapes.forEach(shape => {
      drawShapeOnCanvas(context, shape);
    });
  }, [shapes]);

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

  const {
    selectedShape,
    setSelectedShape,
    isDrawingShape,
    handleShapeMouseDown,
    handleShapeMouseMove,
    handleShapeMouseUp
  } = useShapeDrawing(canvasRef, color, undoStack, setShapes, setNextShapeId, nextShapeId, saveToUndoStack);

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
    if (!isDrawing) return;
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
    if(isDrawing) {
      setIsDrawing(false);
      saveToUndoStack();
      if(socket) {
        socket.emit('drawing-end');
      }
    }
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

  const loadTemplate = (templateName) => {
    if (drawingService) {
      drawingService.loadTemplate(templateName).then(() => {
        saveToUndoStack();
      });
    }
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
    if (selectedShape) {
      setSelectedShape(null);
    }
  };

  return (
    <div className={`whiteboard-container ${darkMode ? 'dark' : ''}`}>
      <h2>Collab Canvas</h2>
      <div className="toolbar">
        <ToolPanel
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          opacity={opacity}
          setOpacity={setOpacity}
          tool={tool}
          setTool={handleToolChange}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          undo={undo}
          redo={redo}
          clearCanvas={clearCanvas}
          downloadCanvas={downloadCanvas}
          loadTemplate={loadTemplate}
        />
        <ShapeToolPanel
          selectedShape={selectedShape}
          setSelectedShape={(shape) => {
            setSelectedShape(shape);
            setTool('shape');
          }}
        />
      </div>
      
      <TemplateSelector loadTemplate={loadTemplate} />
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ 
            border: '1px solid #e0e0e0',
            backgroundColor: darkMode ? '#282c34' : 'white',
            borderRadius: '8px',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onClick={handleCanvasClick}
        />
        {stickyNotes.map(note => (
          <StickyNote
            key={note.id}
            id={note.id}
            text={note.text}
            authorName={note.authorName}
            x={note.x}
            y={note.y}
            onMove={moveStickyNote}
            onUpdate={updateStickyNote}
            onDelete={deleteStickyNote}
          />
        ))}
        <CursorOverlay cursors={cursors} />
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
