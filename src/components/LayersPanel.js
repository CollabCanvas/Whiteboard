import React from 'react';

const LayersPanel = ({ layers, activeLayer, addLayer, toggleLayerVisibility, selectLayer }) => {
  return (
    <div className="layers-panel">
      <h3>Layers</h3>
      <button onClick={addLayer}>Add Layer</button>
      <ul>
        {layers.map(layer => (
          <li key={layer.id} className={layer.id === activeLayer ? 'active' : ''}>
            <span onClick={() => selectLayer(layer.id)}>{layer.name}</span>
            <button onClick={() => toggleLayerVisibility(layer.id)}>
              {layer.visible ? 'Hide' : 'Show'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LayersPanel;
