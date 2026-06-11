import React, { useEffect, useState } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  Film, 
  BookOpen, 
  LayoutGrid, 
  FileText, 
  Users, 
  FolderSearch, 
  Download, 
  Sparkles, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';

export default function Sidebar() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { 
    sidebarExpanded, 
    setSidebarExpanded, 
    toggleAiPanel, 
    mobileSidebarOpen, 
    setMobileSidebarOpen 
  } = useUiStore();
  const { activeProject } = useProjectStore();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar drawer on route change on mobile
  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [slug]);

  const isExpanded = isMobile || sidebarExpanded;
  const isProjectLoaded = !!slug;

  const navItems = [
    { icon: BookOpen, label: 'Story', path: `/project/${slug}/story`, disabled: !isProjectLoaded },
    { icon: LayoutGrid, label: 'Scene Board', path: `/project/${slug}/scenes`, disabled: !isProjectLoaded },
    { icon: FileText, label: 'Screenplay', path: `/project/${slug}/screenplay`, disabled: !isProjectLoaded },
    { icon: Users, label: 'Characters', path: `/project/${slug}/characters`, disabled: !isProjectLoaded },
    { icon: FolderSearch, label: 'Research', path: `/project/${slug}/research`, disabled: !isProjectLoaded },
    { icon: Download, label: 'Export', path: `/project/${slug}/export`, disabled: !isProjectLoaded },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobile && mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      <aside
        onMouseEnter={() => !isMobile && setSidebarExpanded(true)}
        onMouseLeave={() => !isMobile && setSidebarExpanded(false)}
        className={`
          fixed left-0 top-0 h-full z-40 bg-surface border-r border-border
          transition-all duration-300 ease-in-out flex flex-col justify-between
          ${isMobile 
            ? `w-[240px] max-w-[80vw] ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `translate-x-0 ${sidebarExpanded ? 'w-[200px]' : 'w-[48px]'}`
          }
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1">
          {/* Logo / Home Button */}
          <div 
            onClick={() => navigate('/')}
            className="h-12 border-b border-border flex items-center px-3 gap-3 cursor-pointer hover:bg-surface-raised transition-colors text-gold"
          >
            <Film className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="font-display font-bold text-sm tracking-widest text-text">FRAME</span>
            )}
          </div>

          {/* Project Navigation Links */}
          <nav className="flex flex-col gap-1 py-4 px-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              
              if (item.disabled) {
                return (
                  <div
                    key={index}
                    className={`
                      h-10 flex items-center px-2 gap-3 rounded-md text-text-faint cursor-not-allowed
                      ${isExpanded ? 'justify-start' : 'justify-center'}
                    `}
                    title={`${item.label} (Select a project first)`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                );
              }

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => `
                    h-10 flex items-center px-2 gap-3 rounded-md transition-all duration-200
                    ${isExpanded ? 'justify-start' : 'justify-center'}
                    ${isActive 
                      ? 'bg-surface-raised text-gold border-l-2 border-gold font-medium' 
                      : 'text-text-muted hover:text-text hover:bg-surface-raised'}
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isExpanded && <span className="text-sm">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-1 p-1 border-t border-border">
          {/* AI Assistant (Toggle trigger) */}
          <button
            onClick={() => isProjectLoaded && toggleAiPanel()}
            disabled={!isProjectLoaded}
            className={`
              h-10 flex items-center px-2 gap-3 rounded-md transition-all duration-200
              ${isExpanded ? 'justify-start' : 'justify-center'}
              ${isProjectLoaded 
                ? 'text-gold hover:bg-gold/10 active:scale-[0.98]' 
                : 'text-text-faint cursor-not-allowed'}
            `}
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="text-sm font-medium">AI Assistant</span>}
          </button>

          {/* Settings Button */}
          <NavLink
            to={isProjectLoaded ? `/project/${slug}/settings` : '/settings'}
            className={({ isActive }) => `
              h-10 flex items-center px-2 gap-3 rounded-md transition-all duration-200
              ${isExpanded ? 'justify-start' : 'justify-center'}
              ${isActive 
                ? 'bg-surface-raised text-gold border-l-2 border-gold font-medium' 
                : 'text-text-muted hover:text-text hover:bg-surface-raised'}
            `}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {isExpanded && <span className="text-sm">Settings</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
}
