import React from 'react';
import '../styles/ShapeToolPanel.css';

const ShapeToolPanel = ({ selectedShape, setSelectedShape, setTool }) => {
  const shapes = ['circle', 'square', 'rectangle', 'star'];

  const handleShapeSelect = (shape) => {
    if (selectedShape === shape) {
      // Deselect if clicking the same shape
      setSelectedShape(null);
      setTool('pen');
    } else {
      // Select new shape
      setSelectedShape(shape);
      setTool('shape');
    }
  };

  return (
    <div className="shape-tool-panel">
      <h3>Shapes</h3>
      <div className="shape-buttons">
        {shapes.map(shape => (
          <button
            key={shape}
            className={`shape-button ${selectedShape === shape ? 'selected' : ''}`}
            onClick={() => handleShapeSelect(shape)}
          >
            {shape.charAt(0).toUpperCase() + shape.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShapeToolPanel;
