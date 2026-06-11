import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FolderSearch, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Link2, 
  Palette, 
  Loader2,
  FolderOpen,
  Folder,
  Tag
} from 'lucide-react';

import { useResearchStore } from '../../store/researchStore';
import { useSceneStore } from '../../store/sceneStore';
import { useProjectStore } from '../../store/projectStore';
import ResearchItem from './ResearchItem';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function Research() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { loadProject } = useProjectStore();
  const { scenes, fetchScenes } = useSceneStore();
  
  const {
    items,
    boards,
    activeBoardId,
    fetchResearch,
    addResearchItem,
    deleteResearchItem,
    updateResearchItem,
    addBoard,
    deleteBoard,
    setActiveBoardId,
    scrapeUrl,
    isLoading
  } = useResearchStore();

  // Dialog modals states
  const [modalType, setModalType] = useState(null); // null | 'note' | 'link' | 'swatch' | 'image' | 'board'
  const [modalTitle, setModalTitle] = useState('');
  const [showBoards, setShowBoards] = useState(false);
  
  // Note inputs
  const [noteContent, setNoteContent] = useState('');
  
  // Link inputs
  const [urlLink, setUrlLink] = useState('');
  
  // Swatch inputs
  const [swatchColor, setSwatchColor] = useState('#E8C547');
  
  // Board inputs
  const [boardName, setBoardName] = useState('');
  
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProject(slug);
    fetchResearch(slug);
    fetchScenes(slug);
  }, [slug]);

  const handleCloseModal = () => {
    setModalType(null);
    setModalTitle('');
    setNoteContent('');
    setUrlLink('');
    setSwatchColor('#E8C547');
    setBoardName('');
    setError('');
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addResearchItem(slug, {
      type: 'note',
      title: modalTitle.trim() || 'Note',
      content: noteContent.trim()
    });
    handleCloseModal();
  };

  const handleCreateSwatch = async (e) => {
    e.preventDefault();
    await addResearchItem(slug, {
      type: 'color-swatch',
      title: modalTitle.trim() || 'Color Palette',
      content: swatchColor
    });
    handleCloseModal();
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!urlLink.trim()) return;
    setIsScraping(true);
    setError('');

    try {
      // Scrape link metadata via server Scraper API
      const meta = await scrapeUrl(slug, urlLink.trim());
      
      const payload = {
        type: 'link',
        title: meta.title,
        content: JSON.stringify({
          url: urlLink.trim(),
          title: meta.title,
          description: meta.description,
          image: meta.image,
          favicon: meta.favicon
        })
      };
      
      await addResearchItem(slug, payload);
      handleCloseModal();
    } catch (err) {
      setError('Failed to scraper link metadata: ' + err.toString());
    } finally {
      setIsScraping(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${slug}/assets`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      
      await addResearchItem(slug, {
        type: 'image',
        title: file.name.slice(0, file.name.lastIndexOf('.')),
        filePath: data.filename
      });
      handleCloseModal();
    } catch (err) {
      alert('Upload failed: ' + err.toString());
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    await addBoard(slug, boardName.trim());
    handleCloseModal();
  };

  const handleDeleteBoard = async () => {
    if (activeBoardId === 'all') return;
    const b = boards.find(board => board.id === activeBoardId);
    if (window.confirm(`Delete board "${b ? b.name : 'this board'}"? Research items won't be deleted.`)) {
      await deleteBoard(slug, activeBoardId);
    }
  };

  const handleLinkScene = async (itemId, sceneId) => {
    const item = items.find(it => it.id === itemId);
    if (!item) return;

    const list = item.linkedScenes || [];
    if (!list.includes(sceneId)) {
      await updateResearchItem(slug, itemId, {
        linkedScenes: [...list, sceneId]
      });
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Delete this research item?')) {
      await deleteResearchItem(slug, id);
    }
  };

  // Filter items matching active board
  const getFilteredItems = () => {
    if (activeBoardId === 'all') return items;
    const b = boards.find(board => board.id === activeBoardId);
    if (!b) return items;
    const ids = b.itemIds || [];
    return items.filter(it => ids.includes(it.id));
  };

  const filteredItems = getFilteredItems();
  const currentBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div className="h-screen flex text-text pt-12 pl-0 md:pl-[48px] bg-void overflow-hidden">
      
      {/* Mobile backdrop for boards drawer */}
      {showBoards && (
        <div
          onClick={() => setShowBoards(false)}
          className="fixed inset-0 bg-black/60 z-10 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 1. Left side Board selector sidebar */}
      <aside className={`fixed md:relative inset-y-12 md:inset-y-0 left-0 z-20 md:z-auto w-60 border-r border-border bg-surface flex flex-col h-[calc(100vh-48px)] md:h-full shrink-0 shadow-lg md:shadow-none transition-transform duration-300 ${showBoards ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between text-text-muted shrink-0 bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold tracking-wide uppercase">Research Boards</span>
          </div>
          
          <button
            onClick={() => setModalType('board')}
            className="text-text-muted hover:text-gold p-0.5"
            title="Create Board"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 select-none">
          <button
            onClick={() => {
              setActiveBoardId('all');
              setShowBoards(false);
            }}
            className={`
              text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2
              hover:bg-surface-raised hover:text-text
              ${activeBoardId === 'all' ? 'bg-surface-raised text-gold border-l-2 border-gold font-medium' : 'text-text-muted'}
            `}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span>All Reference Items</span>
          </button>

          <div className="w-full h-[1px] bg-border my-2 shrink-0" />

          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setActiveBoardId(b.id);
                setShowBoards(false);
              }}
              className={`
                text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between
                hover:bg-surface-raised hover:text-text group
                ${activeBoardId === b.id ? 'bg-surface-raised text-gold border-l-2 border-gold font-medium' : 'text-text-muted'}
              `}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#E8C547' }} />
                <span className="truncate">{b.name}</span>
              </div>
              <span className="text-[9px] font-mono opacity-50 shrink-0">
                {(b.itemIds || []).length}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* 2. Main Board masonry view */}
      <main className="flex-1 flex flex-col min-w-0 h-full p-4 md:p-6 relative">
        {/* Toolbar Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-surface-raised/80 backdrop-blur border border-border px-4 py-2.5 rounded-xl mb-6 shrink-0 shadow-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-gold">ACTIVE:</span>
            <h2 className="font-display font-semibold text-sm text-text capitalize">
              {activeBoardId === 'all' ? 'All Reference Items' : (currentBoard ? currentBoard.name : 'Board')}
            </h2>
            {activeBoardId !== 'all' && (
              <button
                onClick={handleDeleteBoard}
                className="text-text-muted hover:text-red p-1 rounded ml-2"
                title="Delete Board"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Mobile boards toggle button */}
            <button
              type="button"
              onClick={() => setShowBoards(!showBoards)}
              className="md:hidden text-[10px] text-gold border border-gold/30 bg-gold/10 px-2 py-0.5 rounded flex items-center gap-1.5 ml-2"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Boards</span>
            </button>
          </div>

          {/* Create items buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalType('note')}
              className="flex items-center gap-1 text-[11px] font-medium px-3.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </Button>
            
            <label className="flex items-center gap-1 text-[11px] font-medium px-3.5 bg-transparent border border-border text-text hover:bg-surface-raised hover:border-text-muted rounded-md cursor-pointer transition-colors select-none">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Add Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalType('link')}
              className="flex items-center gap-1 text-[11px] font-medium px-3.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalType('swatch')}
              className="flex items-center gap-1 text-[11px] font-medium px-3.5"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Add Swatch</span>
            </Button>
          </div>
        </div>

        {/* Pinterest Masonry Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <span className="text-sm font-mono">Loading research items...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            // Tailwind multi-columns for Masonry flow
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 pb-16">
              {filteredItems.map((item) => (
                <ResearchItem
                  key={item.id}
                  item={item}
                  slug={slug}
                  scenes={scenes}
                  onDelete={handleDeleteItem}
                  onLinkScene={handleLinkScene}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-border rounded-xl">
              <span className="text-text-muted mb-2 text-xs italic">This board is empty.</span>
              <span className="text-[10px] text-text-faint max-w-sm text-center">
                Use the toolbar buttons at the top right to add notes, paste links, color swatches, or upload photos.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}
      
      {/* 1. Add Note Modal */}
      <Modal isOpen={modalType === 'note'} onClose={handleCloseModal} title="Add Research Note">
        <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
          <Input
            label="Note Title"
            value={modalTitle}
            onChange={(e) => setModalTitle(e.target.value)}
            placeholder="e.g. Costume references"
            autoFocus
          />
          <Input
            label="Note Content"
            textarea
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write note text here..."
            required
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="primary">Create Note</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Swatch Modal */}
      <Modal isOpen={modalType === 'swatch'} onClose={handleCloseModal} title="Add Color Swatch">
        <form onSubmit={handleCreateSwatch} className="flex flex-col gap-4">
          <Input
            label="Swatch Title / Identifier"
            value={modalTitle}
            onChange={(e) => setModalTitle(e.target.value)}
            placeholder="e.g. Retro neon palette"
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-text-muted tracking-wide uppercase">Pick Color</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={swatchColor}
                onChange={(e) => setSwatchColor(e.target.value)}
                className="w-12 h-10 bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-sm font-bold text-gold uppercase">{swatchColor}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="primary">Create Swatch</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Add Link Scraped Modal */}
      <Modal isOpen={modalType === 'link'} onClose={handleCloseModal} title="Add URL Link">
        <form onSubmit={handleCreateLink} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red/10 border border-red/20 rounded text-red text-xs font-semibold">
              {error}
            </div>
          )}
          <Input
            label="Paste URL"
            value={urlLink}
            onChange={(e) => setUrlLink(e.target.value)}
            placeholder="e.g. https://wikipedia.org/wiki/film-noir"
            autoFocus
            required
          />
          <p className="text-[10px] text-text-faint leading-normal">
            Pasting the link will trigger the local scraper to query page titles, descriptions, and previews.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isScraping}
            >
              {isScraping ? 'Scraping Page...' : 'Add Link'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Add Board Modal */}
      <Modal isOpen={modalType === 'board'} onClose={handleCloseModal} title="Create Research Board">
        <form onSubmit={handleCreateBoard} className="flex flex-col gap-4">
          <Input
            label="Board Name"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="e.g. Costume References"
            autoFocus
            required
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="primary">Create Board</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
