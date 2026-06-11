import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Globe, 
  FileText, 
  File, 
  Camera, 
  History, 
  Loader2, 
  Check, 
  Copy, 
  FolderOpen, 
  ArrowRight 
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useExportStore } from '../../store/exportStore';

export default function ExportStudio() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { activeProject, loadProject } = useProjectStore();
  
  const {
    exportsList,
    snapshotsList,
    isLoading,
    error,
    fetchExports,
    exportHtml,
    exportPdf,
    exportFountain,
    fetchSnapshots,
    createSnapshot
  } = useExportStore();

  // HTML Lookbook compilation state
  const [includeStory, setIncludeStory] = useState(true);
  const [includeScenes, setIncludeScenes] = useState(true);
  const [includeScreenplay, setIncludeScreenplay] = useState(true);
  const [includeGallery, setIncludeGallery] = useState(true);

  // Success notifications per task
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedFile, setCopiedFile] = useState('');

  useEffect(() => {
    async function init() {
      const project = await loadProject(slug);
      if (!project) {
        navigate('/');
        return;
      }
      fetchExports(slug);
      fetchSnapshots(slug);
    }
    init();
  }, [slug]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExportHtml = async () => {
    try {
      const result = await exportHtml(slug, {
        includeStory,
        includeScenes,
        includeScreenplay,
        includeGallery
      });
      showSuccess(`HTML Lookbook generated successfully: ${result.filename}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPdf = async () => {
    try {
      const result = await exportPdf(slug);
      showSuccess(`PDF Screenplay generated successfully: ${result.filename}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportFountain = async () => {
    try {
      const result = await exportFountain(slug);
      showSuccess(`Fountain script compiled successfully: ${result.filename}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const result = await createSnapshot(slug);
      showSuccess(`Manual version backup created: ${result.filename}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPath = (filePath, filename) => {
    navigator.clipboard.writeText(filePath);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(''), 2000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-void text-text pt-12 pl-0 md:pl-[48px] pr-4 md:pr-6 pb-16 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-8">
        
        {/* Header Title */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <div className="text-[10px] font-mono tracking-widest text-gold uppercase">Stage 5: Output Delivery</div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Export Studio</h1>
          <p className="text-sm text-text-muted">
            Compile and packaging lookbooks, PDF screenplays, standard Fountain plain text, or snapshot system backups.
          </p>
        </div>

        {/* Global Loading / Error Indicators */}
        {isLoading && (
          <div className="bg-surface border border-gold/10 px-4 py-3 rounded-lg flex items-center gap-3 text-xs text-gold">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Processing export task... Rerendering templates and compiling assets.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-500/20 px-4 py-3 rounded-lg text-xs text-red-400">
            <strong>Export Error:</strong> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-950/20 border border-green-500/30 px-4 py-3 rounded-lg text-xs text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Export Options */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* HTML Lookbook compiler */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-card">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Globe className="w-5 h-5 text-gold" />
                <h3 className="font-display font-semibold text-lg text-text">HTML Lookbook</h3>
              </div>
              <p className="text-xs text-text-muted">
                Produces a standalone interactive presentation lookbook containing a 3D-style scene corkboard, scripts, and sketches.
              </p>
              
              <div className="grid grid-cols-2 gap-3 py-2">
                <label className="flex items-center gap-3 bg-surface-raised border border-border p-3 rounded-lg cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeStory}
                    onChange={(e) => setIncludeStory(e.target.checked)}
                    className="w-4 h-4 text-gold bg-void border-border rounded focus:ring-gold/30 focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-xs font-medium">Include Story Treatment</span>
                </label>

                <label className="flex items-center gap-3 bg-surface-raised border border-border p-3 rounded-lg cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeScenes}
                    onChange={(e) => setIncludeScenes(e.target.checked)}
                    className="w-4 h-4 text-gold bg-void border-border rounded focus:ring-gold/30 focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-xs font-medium">Include Scene Flipbook</span>
                </label>

                <label className="flex items-center gap-3 bg-surface-raised border border-border p-3 rounded-lg cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeScreenplay}
                    onChange={(e) => setIncludeScreenplay(e.target.checked)}
                    className="w-4 h-4 text-gold bg-void border-border rounded focus:ring-gold/30 focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-xs font-medium">Include Full Screenplay</span>
                </label>

                <label className="flex items-center gap-3 bg-surface-raised border border-border p-3 rounded-lg cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeGallery}
                    onChange={(e) => setIncludeGallery(e.target.checked)}
                    className="w-4 h-4 text-gold bg-void border-border rounded focus:ring-gold/30 focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-xs font-medium">Include Sketches Gallery</span>
                </label>
              </div>

              <button
                onClick={handleExportHtml}
                disabled={isLoading}
                className="w-full mt-2 bg-gold hover:bg-gold-dim text-void text-xs font-semibold py-2.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Build Lookbook HTML</span>
              </button>
            </div>

            {/* Print Screenplay PDF & Fountain format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* PDF Print card */}
              <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between shadow-card">
                <div>
                  <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
                    <FileText className="w-5 h-5 text-red-400" />
                    <h3 className="font-display font-semibold text-base">PDF Screenplay</h3>
                  </div>
                  <p className="text-xs text-text-muted mb-4">
                    Renders the screenplay into standard WGA Courier 12pt format with proper printing margins.
                  </p>
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={isLoading}
                  className="w-full bg-surface-raised border border-border hover:border-red-400/30 hover:text-red-400 text-xs font-semibold py-2.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate PDF Script</span>
                </button>
              </div>

              {/* Fountain script card */}
              <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between shadow-card">
                <div>
                  <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
                    <File className="w-5 h-5 text-gold-dim" />
                    <h3 className="font-display font-semibold text-base">Fountain Format</h3>
                  </div>
                  <p className="text-xs text-text-muted mb-4">
                    Generates plain text screenplay markup (.fountain) compatible with Highland, Final Draft, and Fade In.
                  </p>
                </div>
                <button
                  onClick={handleExportFountain}
                  disabled={isLoading}
                  className="w-full bg-surface-raised border border-border hover:border-gold/30 hover:text-gold text-xs font-semibold py-2.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Compile .fountain File</span>
                </button>
              </div>

            </div>

            {/* Generated Exports List Grid */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-card">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <FolderOpen className="w-5 h-5 text-gold" />
                <h3 className="font-display font-semibold text-lg text-text">Outputs & Generated Files</h3>
              </div>
              
              {exportsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-faint italic border border-dashed border-border rounded-lg">
                  No exports created yet. Use the compilation buttons above to generate files.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {exportsList.map((file, idx) => {
                    const isHtml = file.name.endsWith('.html');
                    const isPdf = file.name.endsWith('.pdf');
                    
                    return (
                      <div 
                        key={idx} 
                        className="bg-surface-raised border border-border px-4 py-3 rounded-lg flex items-center justify-between text-xs hover:border-gold/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {isHtml ? (
                            <Globe className="w-4 h-4 text-gold shrink-0" />
                          ) : isPdf ? (
                            <FileText className="w-4 h-4 text-red-400 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-text-muted shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium font-mono text-text">{file.name}</span>
                            <span className="text-[10px] text-text-faint">{formatBytes(file.size)} &bull; {new Date(file.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isHtml && (
                            <a 
                              href={`/api/projects/${slug}/assets/../../exports/${file.name}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-surface hover:text-gold border border-border rounded text-[10px] tracking-wide font-mono uppercase"
                            >
                              Preview
                            </a>
                          )}
                          <button
                            onClick={() => handleCopyPath(file.path, file.name)}
                            className="p-1 hover:bg-surface text-text-muted hover:text-text rounded transition-colors"
                            title="Copy Absolute Filepath"
                          >
                            {copiedFile === file.name ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Snapshot Backups */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-card h-full justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
                  <History className="w-5 h-5 text-gold" />
                  <h3 className="font-display font-semibold text-lg text-text">Snapshots Backups</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">
                  Archive the current project parameters (Story, scene decks, script flow, reference cards) into an inspectable local backup.
                </p>

                <button
                  onClick={handleCreateSnapshot}
                  disabled={isLoading}
                  className="w-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/40 text-xs font-semibold py-2 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mb-6"
                >
                  <Camera className="w-4 h-4" />
                  <span>Create Snapshot</span>
                </button>

                <div className="text-[10px] font-mono tracking-wider text-text-muted uppercase mb-2">History Log</div>
                
                {snapshotsList.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-text-faint italic border border-dashed border-border rounded-lg">
                    No snapshots captured yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {snapshotsList.map((snap, idx) => (
                      <div 
                        key={idx}
                        className="bg-surface-raised border border-border p-2.5 rounded-lg flex flex-col gap-1 text-[11px]"
                      >
                        <div className="flex justify-between font-mono font-medium text-text-muted">
                          <span className="truncate max-w-[130px]" title={snap.name}>{snap.name}</span>
                          <span className="text-text-faint">{formatBytes(snap.size)}</span>
                        </div>
                        <div className="text-[9px] text-text-faint font-mono">
                          {new Date(snap.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-6">
                <div className="bg-surface-raised p-3 rounded-lg border border-border text-[11px] text-text-muted leading-relaxed">
                  <strong>Restore Snapshots:</strong> Files are stored locally in the project's <code>/snapshots/</code> folder. You can roll back project files by copying any snapshot file over the active files on disk.
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
