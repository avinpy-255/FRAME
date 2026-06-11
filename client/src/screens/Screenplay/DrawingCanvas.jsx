import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  Palette, 
  Trash2, 
  Undo, 
  Redo, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Hand, 
  Check, 
  X,
  Brush,
  Eraser
} from 'lucide-react';
import Button from '../../components/ui/Button';

export default function DrawingCanvas({ slug, filename, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [fCanvas, setFCanvas] = useState(null);
  
  // Drawing configurations
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'eraser' | 'rect' | 'circle' | 'text' | 'select'
  const [strokeColor, setStrokeColor] = useState('#E8C547');
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // History Undo/Redo Stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUpdatingStack = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Retrieve container width and height
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 400;
    const height = Math.max(320, rect.height - 80); // leave space for toolbars

    // Instantiate Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#0F0F11',
      isDrawingMode: true
    });

    // Configure default brush
    canvas.freeDrawingBrush.color = strokeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    // Track history states on objects modification
    const saveState = () => {
      if (isUpdatingStack.current) return;
      const json = JSON.stringify(canvas.toJSON());
      undoStack.current.push(json);
      redoStack.current = []; // clear redo on new action
    };

    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);
    canvas.on('object:removed', saveState);

    // Save initial blank state
    undoStack.current.push(JSON.stringify(canvas.toJSON()));

    setFCanvas(canvas);

    // Clean up
    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush settings on color/width tweaks
  useEffect(() => {
    if (!fCanvas) return;
    
    if (activeTool === 'pen') {
      fCanvas.isDrawingMode = true;
      fCanvas.freeDrawingBrush.color = strokeColor;
      fCanvas.freeDrawingBrush.width = strokeWidth;
    } else if (activeTool === 'eraser') {
      fCanvas.isDrawingMode = true;
      // Erase by drawing matching background color
      fCanvas.freeDrawingBrush.color = '#0F0F11';
      fCanvas.freeDrawingBrush.width = strokeWidth * 3;
    } else {
      fCanvas.isDrawingMode = false;
    }
  }, [activeTool, strokeColor, strokeWidth, fCanvas]);

  const handleToolChange = (tool) => {
    setActiveTool(tool);
    if (!fCanvas) return;

    if (tool === 'rect') {
      const rect = new fabric.Rect({
        left: fCanvas.width / 2 - 50,
        top: fCanvas.height / 2 - 40,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: 2,
        width: 100,
        height: 80
      });
      fCanvas.add(rect);
      fCanvas.setActiveObject(rect);
      setActiveTool('select');
    } else if (tool === 'circle') {
      const circle = new fabric.Circle({
        left: fCanvas.width / 2 - 40,
        top: fCanvas.height / 2 - 40,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: 2,
        radius: 40
      });
      fCanvas.add(circle);
      fCanvas.setActiveObject(circle);
      setActiveTool('select');
    } else if (tool === 'text') {
      const text = new fabric.IText('Text Label', {
        left: fCanvas.width / 2 - 40,
        top: fCanvas.height / 2 - 10,
        fontFamily: 'DM Sans',
        fill: strokeColor,
        fontSize: 20
      });
      fCanvas.add(text);
      fCanvas.setActiveObject(text);
      setActiveTool('select');
    }
  };

  const handleUndo = () => {
    if (!fCanvas || undoStack.current.length <= 1) return;
    
    isUpdatingStack.current = true;
    const current = undoStack.current.pop();
    redoStack.current.push(current);
    
    const previous = undoStack.current[undoStack.current.length - 1];
    fCanvas.loadFromJSON(previous, () => {
      fCanvas.renderAll();
      isUpdatingStack.current = false;
    });
  };

  const handleRedo = () => {
    if (!fCanvas || redoStack.current.length === 0) return;
    
    isUpdatingStack.current = true;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    
    fCanvas.loadFromJSON(next, () => {
      fCanvas.renderAll();
      isUpdatingStack.current = false;
    });
  };

  const handleClear = () => {
    if (!fCanvas) return;
    if (window.confirm('Clear the canvas?')) {
      fCanvas.clear();
      fCanvas.setBackgroundColor('#0F0F11', fCanvas.renderAll.bind(fCanvas));
      undoStack.current = [JSON.stringify(fCanvas.toJSON())];
      redoStack.current = [];
    }
  };

  // Convert canvas to blob and upload to assets folder
  const handleSave = async () => {
    if (!fCanvas) return;
    
    // Convert to blob
    const dataUrl = fCanvas.toDataURL({
      format: 'png',
      quality: 1.0
    });
    
    // Parse dataURI to blob
    const fetchRes = await fetch(dataUrl);
    const blob = await fetchRes.blob();

    const formData = new FormData();
    const file = new File([blob], filename, { type: 'image/png' });
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${slug}/assets`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload sketch asset');
      onSave(blob);
    } catch (err) {
      alert('Save failed: ' + err.toString());
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-surface justify-between">
      
      {/* 1. Drawing Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-surface-raised border-b border-border p-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          {/* Brushes */}
          <button
            onClick={() => handleToolChange('pen')}
            className={`p-2 rounded border transition-colors ${activeTool === 'pen' ? 'bg-gold/15 border-gold text-gold' : 'bg-surface border-border text-text-muted hover:text-text'}`}
            title="Pen Brush"
          >
            <Brush className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`p-2 rounded border transition-colors ${activeTool === 'eraser' ? 'bg-gold/15 border-gold text-gold' : 'bg-surface border-border text-text-muted hover:text-text'}`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolChange('select')}
            className={`p-2 rounded border transition-colors ${activeTool === 'select' ? 'bg-gold/15 border-gold text-gold' : 'bg-surface border-border text-text-muted hover:text-text'}`}
            title="Move Shapes"
          >
            <Hand className="w-4 h-4" />
          </button>
          
          <div className="w-[1px] h-6 bg-border self-center mx-1" />
          
          {/* Shapes */}
          <button
            onClick={() => handleToolChange('rect')}
            className="p-2 bg-surface border border-border text-text-muted hover:text-text hover:border-text-muted rounded"
            title="Draw Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolChange('circle')}
            className="p-2 bg-surface border border-border text-text-muted hover:text-text hover:border-text-muted rounded"
            title="Draw Ellipse"
          >
            <CircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToolChange('text')}
            className="p-2 bg-surface border border-border text-text-muted hover:text-text hover:border-text-muted rounded"
            title="Insert Text"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Undo Redo Trash */}
        <div className="flex gap-1.5">
          <button
            onClick={handleUndo}
            className="p-2 bg-surface border border-border text-text-muted hover:text-text rounded"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 bg-surface border border-border text-text-muted hover:text-text rounded"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 bg-surface border border-border text-text-muted hover:text-red rounded"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Color & Width controls */}
      <div className="flex justify-between items-center bg-surface border-b border-border px-4 py-2 shrink-0 text-xs">
        {/* Colors */}
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-text-muted" />
          <div className="flex gap-1.5">
            {['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#F2F0EB', '#070708'].map(c => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                className={`w-4 h-4 rounded-full border border-border transition-transform hover:scale-110 ${strokeColor === c ? 'scale-115 border-text ring-1 ring-gold' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Width */}
        <div className="flex items-center gap-2 text-text-muted">
          <span>Brush Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="accent-gold w-16 cursor-pointer"
          />
          <span className="font-mono text-[10px] w-4 text-right">{strokeWidth}px</span>
        </div>
      </div>

      {/* 3. The Canvas drawing frame */}
      <div className="flex-1 bg-surface-raised flex items-center justify-center p-4 min-h-0 relative">
        <div className="border border-border rounded shadow-card overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* 4. Action buttons footer */}
      <div className="flex justify-end gap-3 bg-surface border-t border-border p-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel} className="flex items-center gap-1">
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-1 font-semibold">
          <Check className="w-4 h-4" />
          <span>Export Sketch</span>
        </Button>
      </div>

    </div>
  );
}
