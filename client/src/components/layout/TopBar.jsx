import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Maximize2, Minimize2, Check, RefreshCw, AlertCircle, Menu } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';

export default function TopBar() {
  const location = useLocation();
  const { focusMode, toggleFocusMode, autosaveStatus, toggleMobileSidebar } = useUiStore();
  const { activeProject } = useProjectStore();

  // Parse path to find where we are
  const pathParts = location.pathname.split('/');
  const isProjectPage = pathParts[1] === 'project';
  const pageType = pathParts[3] || '';

  // Page title formatting
  const getPageTitle = () => {
    switch (pageType) {
      case 'story': return 'Story Editor';
      case 'scenes': return 'Scene Board';
      case 'screenplay': return 'Screenplay';
      case 'characters': return 'Characters';
      case 'research': return 'Research Board';
      case 'export': return 'Export Studio';
      case 'settings': return 'Project Settings';
      default: return '';
    }
  };

  const pageTitle = getPageTitle();

  // Render autosave indicator state
  const renderAutosave = () => {
    switch (autosaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-gold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Check className="w-3.5 h-3.5 text-green-500" />
            <span>Saved locally</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-red">
            <AlertCircle className="w-3.5 h-3.5 text-red" />
            <span>Save error</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (focusMode) {
    // Render minimal header in focus mode
    return (
      <header className="fixed top-0 right-0 left-0 h-10 px-4 bg-void/50 backdrop-blur-sm z-30 flex items-center justify-between pointer-events-auto">
        <div className="text-xs text-text-faint font-mono uppercase tracking-widest">
          Focus Mode
        </div>
        <div className="flex items-center gap-4">
          {isProjectPage && renderAutosave()}
          <button
            onClick={toggleFocusMode}
            className="text-text-muted hover:text-text p-1 rounded transition-colors hover:bg-surface-raised"
            title="Exit Focus Mode (F11)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 md:left-[48px] right-0 h-12 border-b border-border bg-surface/50 backdrop-blur-sm z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300">
      {/* Breadcrumb info */}
      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-medium truncate mr-2">
        {/* Hamburger menu button for mobile screens */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden text-text-muted hover:text-text p-1 rounded-md transition-colors hover:bg-surface-raised"
          aria-label="Toggle Navigation Drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link to="/" className="text-text-muted hover:text-text transition-colors shrink-0">
          Dashboard
        </Link>
        {isProjectPage && activeProject && (
          <>
            <span className="text-text-faint shrink-0">/</span>
            <span className="text-text-muted font-mono truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">{activeProject.title}</span>
            {pageTitle && (
              <>
                <span className="text-text-faint shrink-0">/</span>
                <span className="text-text font-semibold font-display tracking-wide truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{pageTitle}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Control panel and status */}
      <div className="flex items-center gap-4 md:gap-6 shrink-0">
        {isProjectPage && renderAutosave()}
        
        {/* Toggle focus mode (supports F11) */}
        {isProjectPage && (pageType === 'story' || pageType === 'screenplay') && (
          <button
            onClick={toggleFocusMode}
            className="text-text-muted hover:text-text p-1.5 rounded-md transition-colors hover:bg-surface-raised"
            title="Focus Mode (F11)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
