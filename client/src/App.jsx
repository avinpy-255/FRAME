import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './screens/Dashboard/Dashboard';
import StoryEditor from './screens/Story/StoryEditor';
import SceneBoard from './screens/SceneBoard/SceneBoard';
import ScreenplayEditor from './screens/Screenplay/ScreenplayEditor';
import Characters from './screens/Characters/Characters';
import Research from './screens/Research/Research';
import ExportStudio from './screens/Export/ExportStudio';
import AiPanel from './components/ai/AiPanel';
import Settings from './screens/Settings/Settings';

// Generic elegant placeholder for other phases
function PlaceholderScreen({ name, phase }) {
  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center pt-12 pl-0 md:pl-[48px] text-text-muted">
      <div className="border border-border bg-surface rounded-xl p-8 max-w-md text-center shadow-card">
        <h2 className="font-display font-bold text-xl text-gold mb-2">{name} Screen</h2>
        <p className="text-sm mb-4">
          This component is part of {phase}.
        </p>
        <span className="text-xs font-mono px-3 py-1 bg-surface-raised border border-border rounded text-text-faint">
          Under Construction
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-void text-text film-grain overflow-hidden flex">
        {/* Navigation Layer */}
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          
          <Routes>
            {/* Dashboard Home */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Project specific routes */}
            <Route path="/project/:slug/story" element={<StoryEditor />} />
            
            {/* Phase 2: Scenes */}
            <Route path="/project/:slug/scenes" element={<SceneBoard />} />
            
            {/* Phase 3: Screenplay */}
            <Route path="/project/:slug/screenplay" element={<ScreenplayEditor />} />
            
            {/* Phase 4: Characters */}
            <Route path="/project/:slug/characters" element={<Characters />} />
            
            {/* Phase 4: Research */}
            <Route path="/project/:slug/research" element={<Research />} />
            
            {/* Phase 5: Export */}
            <Route path="/project/:slug/export" element={<ExportStudio />} />
            
            {/* Phase 6: Settings */}
            <Route path="/project/:slug/settings" element={<Settings />} />
            <Route path="/settings" element={<Settings />} />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global AI Assistant slide-out panel */}
        <AiPanel />
      </div>
    </Router>
  );
}
