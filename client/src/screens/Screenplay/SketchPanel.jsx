import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Palette, 
  Upload, 
  Trash2, 
  FileImage,
  Loader2,
  RefreshCw,
  Compass
} from 'lucide-react';
import { useScreenplayStore } from '../../store/screenplayStore';
import DrawingCanvas from './DrawingCanvas';

export default function SketchPanel({ slug }) {
  const { activeSceneHeadingId } = useScreenplayStore();

  const [panelState, setPanelState] = useState('empty'); // 'empty' | 'display' | 'drawing'
  const [activeTab, setActiveTab] = useState('sketch'); // 'sketch' | 'reference'
  const [sketchUrl, setSketchUrl] = useState(null);
  const [refUrl, setRefUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const headingSlug = activeSceneHeadingId
    ? activeSceneHeadingId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : '';

  const sketchFilename = `scene-${headingSlug}-sketch.png`;
  
  // Resolve asset file extensions dynamically or fallback to .jpg
  const [refFilename, setRefFilename] = useState(`scene-${headingSlug}-ref.jpg`);

  // Reset states and check if files exist on activeSceneHeadingId change
  useEffect(() => {
    if (!activeSceneHeadingId) {
      setPanelState('empty');
      return;
    }
    
    setPanelState('empty');
    setSketchUrl(null);
    setRefUrl(null);
    
    // Check if files exist on local disk
    const checkAssets = async () => {
      try {
        const sketchPath = `/api/projects/${slug}/assets/${sketchFilename}`;
        const refPath = `/api/projects/${slug}/assets/${refFilename}`;
        
        const [sketchRes, refRes] = await Promise.all([
          fetch(sketchPath, { method: 'HEAD' }),
          fetch(refPath, { method: 'HEAD' })
        ]);
        
        let hasSketch = sketchRes.ok;
        let hasRef = refRes.ok;
        
        if (hasSketch) {
          // Append random query param to defeat browser image caching
          setSketchUrl(`${sketchPath}?t=${Date.now()}`);
        }
        
        if (hasRef) {
          setRefUrl(`${refPath}?t=${Date.now()}`);
        }
        
        if (hasSketch || hasRef) {
          setPanelState('display');
          setActiveTab(hasSketch ? 'sketch' : 'reference');
        } else {
          setPanelState('empty');
        }
      } catch (e) {
        console.error('Failed to probe assets:', e);
      }
    };

    if (headingSlug) {
      checkAssets();
    }
  }, [activeSceneHeadingId, slug, headingSlug, refFilename]);

  // Handle manual image files upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSceneHeadingId) return;

    setIsUploading(true);
    const ext = pathExtension(file.name);
    const targetFilename = `scene-${headingSlug}-ref.${ext}`;
    setRefFilename(targetFilename);

    const formData = new FormData();
    // Rename file to match target schema
    const renamedFile = new File([file], targetFilename, { type: file.type });
    formData.append('file', renamedFile);

    try {
      const res = await fetch(`/api/projects/${slug}/assets`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setRefUrl(`/api/projects/${slug}/assets/${data.filename}?t=${Date.now()}`);
      setPanelState('display');
      setActiveTab('reference');
    } catch (err) {
      alert('Upload failed: ' + err.toString());
    } finally {
      setIsUploading(false);
    }
  };

  const pathExtension = (fname) => {
    return fname.slice(((fname.lastIndexOf(".") - 1) >>> 0) + 2) || 'jpg';
  };

  const handleDeleteAsset = async () => {
    if (!activeSceneHeadingId) return;
    const target = activeTab === 'sketch' ? sketchFilename : refFilename;
    
    if (window.confirm(`Delete this ${activeTab}?`)) {
      try {
        await fetch(`/api/projects/${slug}/assets/${target}`, {
          method: 'DELETE'
        });
        
        if (activeTab === 'sketch') {
          setSketchUrl(null);
          if (refUrl) setActiveTab('reference');
          else setPanelState('empty');
        } else {
          setRefUrl(null);
          if (sketchUrl) setActiveTab('sketch');
          else setPanelState('empty');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDrawingSave = (blob) => {
    // Canvas finished, update local display
    setSketchUrl(`/api/projects/${slug}/assets/${sketchFilename}?t=${Date.now()}`);
    setPanelState('display');
    setActiveTab('sketch');
  };

  // Render view layout based on panel state
  const renderContent = () => {
    if (!activeSceneHeadingId) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-text-faint h-full">
          <Compass className="w-12 h-12 mb-3 opacity-30" />
          <span className="text-sm">Select or click inside a scene heading to unlock sketches.</span>
        </div>
      );
    }

    if (panelState === 'drawing') {
      return (
        <DrawingCanvas
          slug={slug}
          filename={sketchFilename}
          onSave={handleDrawingSave}
          onCancel={() => setPanelState(sketchUrl || refUrl ? 'display' : 'empty')}
        />
      );
    }

    if (panelState === 'empty') {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-5">
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <FileImage className="w-12 h-12 opacity-35" />
            <span className="text-xs font-mono uppercase tracking-widest text-gold font-semibold">Visual Frame Empty</span>
            <p className="text-xs text-text-faint max-w-[240px] leading-relaxed">
              Add story sketches or upload concept reference art for:
              <span className="block font-mono text-gold-dim mt-1.5 font-bold uppercase truncate max-w-[200px]">{activeSceneHeadingId}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setPanelState('drawing')}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border hover:border-gold hover:text-gold rounded text-xs transition-colors"
            >
              <Palette className="w-4 h-4" />
              <span>Draw Sketch</span>
            </button>

            <label className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border hover:border-gold hover:text-gold rounded text-xs transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Ref</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      );
    }

    // Display state
    const displayImg = activeTab === 'sketch' ? sketchUrl : refUrl;

    return (
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Tab Header Selector */}
        <div className="flex border-b border-border shrink-0 bg-surface-raised/40">
          <button
            onClick={() => setActiveTab('sketch')}
            disabled={!sketchUrl}
            className={`
              flex-1 py-2 text-xs font-mono border-b-2 font-medium tracking-wide uppercase transition-all
              ${activeTab === 'sketch' 
                ? 'border-gold text-gold font-semibold' 
                : 'border-transparent text-text-faint disabled:opacity-30 disabled:pointer-events-none'}
            `}
          >
            Sketch Frame
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            disabled={!refUrl}
            className={`
              flex-1 py-2 text-xs font-mono border-b-2 font-medium tracking-wide uppercase transition-all
              ${activeTab === 'reference' 
                ? 'border-gold text-gold font-semibold' 
                : 'border-transparent text-text-faint disabled:opacity-30 disabled:pointer-events-none'}
            `}
          >
            Reference Photo
          </button>
        </div>

        {/* Image Frame Container */}
        <div className="flex-1 bg-surface-raised flex items-center justify-center p-6 relative overflow-hidden group min-h-0">
          {displayImg ? (
            <img 
              src={displayImg} 
              alt={activeTab} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-card border border-border select-none"
            />
          ) : (
            <span className="text-xs text-text-faint italic">Empty frame.</span>
          )}

          {/* Quick Overlay Actions */}
          <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setPanelState('drawing')}
              className="p-2 bg-void/80 border border-border text-text-muted hover:text-gold rounded-full hover:bg-void transition-colors"
              title="Edit Sketch"
            >
              <Palette className="w-4 h-4" />
            </button>
            <label className="p-2 bg-void/80 border border-border text-text-muted hover:text-gold rounded-full hover:bg-void transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDeleteAsset}
              className="p-2 bg-void/80 border border-border text-text-muted hover:text-red rounded-full hover:bg-void transition-colors"
              title="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-full h-full border-l border-border bg-surface flex flex-col overflow-hidden relative min-h-0">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-raised shrink-0">
        <div className="flex items-center gap-2 text-text-muted">
          <Image className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold tracking-wide uppercase">Visual Frames Reference</span>
        </div>
        {isUploading && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-gold shrink-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>

    </aside>
  );
}
