import React, { useState, useEffect } from 'react';
import { drawShapeOnCanvas } from '../utils/drawShapes';
import { HexColorPicker } from 'react-colorful'; // Add this import
import '../styles/QuickTools.css';
import { Type } from 'lucide-react';

const QuickTools = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  opacity, 
  setOpacity, 
  selectedShape, 
  setSelectedShape,
  canvasRef 
}) => {
  const [showShapes, setShowShapes] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [textInput, setTextInput] = useState(''); // State for text input
  const quickColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  const shapes = [
    { id: 'rectangle', icon: '⬛', label: 'Rectangle' },
    { id: 'circle', icon: '⭕', label: 'Circle' },
    { id: 'triangle', icon: '△', label: 'Triangle' },
    { id: 'line', icon: '➖', label: 'Line' },
    { id: 'arrow', icon: '➡️', label: 'Arrow' },
    { id: 'star', icon: '⭐', label: 'Star' }  // Add star shape
  ];

  const handleShapeSelect = (shapeId) => {
    if (setSelectedShape) {
      setSelectedShape(shapeId);
      setTool('shape');
      
      if (canvasRef?.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const centerX = canvas.width / 2 - 50;
        const centerY = canvas.height / 2 - 50;
        
        drawShapeOnCanvas(context, {
          shape: shapeId,
          x: centerX,
          y: centerY,
          width: 100,
          height: 100,
          radius: 50,
          color: color,
          preview: true
        });
      }
      
      setShowShapes(false);
    }
  };

  const handleTextTool = () => {
    if (tool !== 'text') return;
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    const handleCanvasClick = (e) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      // ✅ Create textarea and append it directly to the canvas, not the parent
      const input = document.createElement('textarea');
      input.placeholder = 'Type here...';
      input.style.resize = 'none';
      input.style.width = 'auto';
      input.style.height = 'auto';
      input.style.position = 'fixed';  // ✅ Prevent canvas movement
      input.style.left = `${e.clientX}px`;
      input.style.top = `${e.clientY}px`;
      input.style.border = 'none';
      input.style.outline = 'none';
      input.style.fontSize = '18px';
      input.style.lineHeight = '1.5';
      input.style.background = 'transparent';
      input.style.color = color;
      input.style.zIndex = '9999';
  
      document.body.appendChild(input);  // ✅ Append to body, not canvas.parentElement
      input.focus();
  
      const ctx = canvas.getContext('2d');
  
      const handleEnter = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (input.value.trim() !== '') {
            ctx.font = '18px Arial';
            ctx.fillStyle = color;
            ctx.fillText(input.value, x, y);
          }
          removeInput();
        }
      };
  
      const handleBlur = () => {
        if (input.value.trim() !== '') {
          ctx.font = '18px Arial';
          ctx.fillStyle = color;
          ctx.fillText(input.value, x, y);
        }
        removeInput();
      };
  
      const removeInput = () => {
        input.removeEventListener('keydown', handleEnter);
        input.removeEventListener('blur', handleBlur);
        document.body.removeChild(input);
        canvas.removeEventListener('click', handleCanvasClick);
      };
  
      input.addEventListener('keydown', handleEnter);
      input.addEventListener('blur', handleBlur);
    };
  
    canvas.addEventListener('click', handleCanvasClick);
  };
  
  
  useEffect(() => {
    const handleCanvasClick = (e) => {
      if (tool === 'text') {
        handleTextTool(e);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [tool]);

  return (
    <div className="quick-tools">
      <div className="quick-tools-section">
        <h4>Tools</h4>
        <div className="tools-grid">
          <button 
            className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button 
            className={`tool-button ${tool === 'highlighter' ? 'active' : ''}`}
            onClick={() => {
              setTool('highlighter');
              setOpacity(0.4);
            }}
            title="Highlighter"
          >
            🌈
          </button>
          <button 
            className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            🧽
          </button>
          <button 
            className={`tool-button ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
            title="Text Tool"
          >
            <Type size={20} />
          </button>
          <div className="shapes-dropdown">
            <button 
              className={`tool-button ${tool === 'shape' ? 'active' : ''}`}
              onClick={() => setShowShapes(!showShapes)}
              title="Shapes"
            >
              📐
            </button>
            {showShapes && (
              <div className="shapes-menu-expander">
                <div className="shapes-grid">
                  {shapes.map(shape => (
                    <button
                      key={shape.id}
                      className={`shape-button ${selectedShape === shape.id ? 'active' : ''}`}
                      onClick={() => handleShapeSelect(shape.id)}
                      title={shape.label}
                    >
                      <span className="shape-icon">{shape.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        
          <button 
            className={`tool-button ${tool === 'sticky' ? 'active' : ''}`}
            onClick={() => setTool('sticky')}
            title="Sticky Note"
          >
            📝
          </button>
        </div>
      </div>

      <div className="quick-tools-section">
        <h4>Width</h4>
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="width-slider"
        />
        <div className="width-preview" style={{ width: lineWidth, height: lineWidth, borderRadius: '50%' }} />
      </div>

      <div className="quick-tools-section">
        <h4>Opacity</h4>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="opacity-slider"
        />
      </div>

      <div className="quick-tools-section">
        <h4>Colors</h4>
        <div className="quick-colors">
          {quickColors.map((c) => (
            <button
              key={c}
              className={`color-button ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <button
            className="custom-color-button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            title="Custom Color"
          >
            🎨
          </button>
        </div>
        {showCustomPicker && (
          <div className="custom-color-picker">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
        )}
      </div>

      <div className={`quick-tools-section shapes-section ${showShapes ? 'active' : ''}`}>
        <div className="shapes-grid">
          {shapes.map(shape => (
            <button
              key={shape.id}
              className={`shape-button ${selectedShape === shape.id ? 'active' : ''}`}
              onClick={() => handleShapeSelect(shape.id)}
              title={shape.label}
            >
              <span className="shape-icon">{shape.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickTools;
